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
  // Build route lookup for this page only
  const routes: Record<string, {
    actionType: string;
    targetPageId: string;
    apiEndpoint: string | null;
    method: string;
    outcomes: Array<{ outcomeKey: string; targetPageId: string }>;
  }> = {};

  navMap.forEach((entry) => {
    if (entry.sourcePageId === page.id) {
      routes[entry.sourceHandleId] = {
        actionType: entry.action.actionType,
        targetPageId: entry.targetPageId,
        apiEndpoint: entry.action.apiEndpoint ?? null,
        method: entry.action.method ?? 'POST',
        outcomes: entry.action.outcomes ?? [],
      };
    }
  });

  const routesJson = JSON.stringify(routes);

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

  function navigate(targetPageId) {
    window.parent.postMessage({ type: 'preview:navigate', to: targetPageId }, '*');
  }

  function handleAction(actionId) {
    var route = routes[actionId];
    if (!route) return;

    if (route.actionType === 'navigate' && route.targetPageId) {
      navigate(route.targetPageId);

    } else if (route.actionType === 'api-call' && route.apiEndpoint) {
      window.parent.postMessage({ type: 'preview:api-start' }, '*');

      fetch(route.apiEndpoint, {
        method: route.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          // data must have an "outcome" string field
          var outcomeKey = data && data.outcome ? String(data.outcome) : '';
          var matched = null;
          for (var i = 0; i < route.outcomes.length; i++) {
            if (route.outcomes[i].outcomeKey === outcomeKey) {
              matched = route.outcomes[i].targetPageId;
              break;
            }
          }
          window.parent.postMessage({ type: 'preview:api-done', outcome: outcomeKey }, '*');
          if (matched) {
            navigate(matched);
          } else {
            window.parent.postMessage({
              type: 'preview:api-unmatched',
              outcome: outcomeKey,
              available: route.outcomes.map(function(o) { return o.outcomeKey; })
            }, '*');
          }
        })
        .catch(function (err) {
          window.parent.postMessage({ type: 'preview:api-error', message: String(err) }, '*');
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

