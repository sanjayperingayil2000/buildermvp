import type { NavMapEntry } from '@/shared/store/useAppStore';

export interface PageDescriptor {
  id: string;
  name: string;
  html: string;
  css: string;
}

export function buildPageRuntime(
  page: PageDescriptor,
  navMap: NavMapEntry[]
): string {
  // Build a lookup of actionId -> targetPageId for this page only
  const routes: Record<string, { actionType: string; targetPageId: string | null; apiEndpoint: string | null; onSuccess: string | null; onError: string | null }> = {};

  navMap.forEach((entry) => {
    if (entry.sourcePageId === page.id) {
      routes[entry.sourceHandleId] = {
        actionType: entry.action.actionType,
        targetPageId: entry.targetPageId,
        apiEndpoint: entry.action.apiEndpoint ?? null,
        onSuccess: entry.action.onSuccess ?? null,
        onError: entry.action.onError ?? null,
      };
    }
  });

  const routesJson = JSON.stringify(routes);

  // Strip any existing html/head/body wrapper tags from page.html
  // because we are building a full document ourselves
  const bodyContent = page.html
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .trim();

  const runtimeScript = `
<script>
(function () {
  var routes = ${routesJson};

  function handleAction(actionId) {
    var route = routes[actionId];
    if (!route) return;

    if (route.actionType === 'navigate' && route.targetPageId) {
      window.parent.postMessage(
        { type: 'preview:navigate', to: route.targetPageId },
        '*'
      );
    } else if (route.actionType === 'api-call' && route.apiEndpoint) {
      window.parent.postMessage({ type: 'preview:api-start' }, '*');
      fetch(route.apiEndpoint, { method: 'POST' })
        .then(function (res) {
          var target = res.ok ? route.onSuccess : route.onError;
          if (target) {
            window.parent.postMessage(
              { type: 'preview:navigate', to: target },
              '*'
            );
          } else {
            window.parent.postMessage(
              { type: 'preview:api-done', success: res.ok },
              '*'
            );
          }
        })
        .catch(function () {
          var target = route.onError;
          if (target) {
            window.parent.postMessage(
              { type: 'preview:navigate', to: target },
              '*'
            );
          } else {
            window.parent.postMessage(
              { type: 'preview:api-done', success: false },
              '*'
            );
          }
        });
    }
  }

  function attachListeners() {
    document.querySelectorAll('[data-action-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.getAttribute('data-action-id');
        if (id) handleAction(id);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }
})();
</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    ${page.css}
  </style>
</head>
<body>
${bodyContent}
${runtimeScript}
</body>
</html>`;
}
