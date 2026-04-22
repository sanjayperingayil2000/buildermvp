import type { Node, Edge } from '@xyflow/react';
import type { PageDescriptor, ActionElement } from '@/shared/types/store';
import { serializeConditionToExpression } from '@/features/flow-editor/utils/serializeExpression';

/* ------------------------------------------------------------------ */
/*  Target-schema type definitions                                     */
/* ------------------------------------------------------------------ */

interface TransitionWhen {
  statusCode?: number | number[];
  body?: { path: string; equals: string };
}

interface NavigationTransition {
  when?: TransitionWhen;
  to: string;
}

interface NavigationEntry {
  trigger: string;
  type: 'navigate' | 'apiCall' | 'conditionalNavigate';
  to?: string;
  http?: { endpoint: string; method: string };
  transitions?: NavigationTransition[];
  conditions?: Array<{
    expression: string;
    outcomeKey: string;
    targetPageId: string;
  }>;
}

interface OutputPageEntry {
  id: string;
  navigation: NavigationEntry[];
}

export interface OutputJson {
  schema: { version: '1.0' };
  config: {
    initialRoute: string;
    baseUrl: string;
  };
  pages: OutputPageEntry[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL = 'https://api.example.com';

/** Map an outcomeKey to the correct `when` condition. */
function outcomeKeyToWhen(key: string): TransitionWhen {
  const k = key.toLowerCase();
  if (k === 'success') {
    return { statusCode: 200 };
  }
  if (k === 'failure' || k === 'error') {
    return { statusCode: [400, 422, 500] };
  }
  if (k === 'pending') {
    return { statusCode: 200, body: { path: 'status', equals: 'pending' } };
  }
  // Unknown outcome key — use body-path discrimination so it stays specific
  return { statusCode: 200, body: { path: 'result', equals: key } };
}

/** Sort transitions: most-specific first, fallback (no `when`) last. */
function sortTransitions(ts: NavigationTransition[]): NavigationTransition[] {
  return [...ts].sort((a, b) => {
    if (!a.when && !b.when) return 0;
    if (!a.when) return 1;   // a is fallback → goes last
    if (!b.when) return -1;  // b is fallback → goes last
    // Body-qualified conditions are more specific
    const aSpec = a.when.body ? 2 : 1;
    const bSpec = b.when.body ? 2 : 1;
    return bSpec - aSpec;
  });
}

/* ------------------------------------------------------------------ */
/*  Build navigation entries for a single page                        */
/* ------------------------------------------------------------------ */

function buildPageNavigation(
  page: PageDescriptor,
  edges: Edge[],
): NavigationEntry[] {
  const navigation: NavigationEntry[] = [];

  for (const el of page.actionElements) {
    if (el.isHidden) continue;

    const actionType = el.actionType;

    // --- Conditional navigate (JSON expressions) ---
    if (actionType === 'navigate' && (el.jsonConditions ?? []).length > 0) {
      const validConditions = (el.jsonConditions ?? []).filter(
        (c) => c.clauses && c.clauses.length > 0 && c.targetPageId,
      );
      if (validConditions.length > 0) {
        navigation.push({
          trigger: el.id,
          type: 'conditionalNavigate',
          conditions: validConditions.map((c) => ({
            expression: serializeConditionToExpression(c),
            outcomeKey: c.outcomeKey,
            targetPageId: c.targetPageId,
          })),
        });
        continue;
      }
    }

    // --- API call with outcomes ---
    if (actionType === 'api-call') {
      const validOutcomes = (el.outcomes ?? []).filter(
        (o) => o.outcomeKey && o.targetPageId,
      );
      const transitions: NavigationTransition[] = validOutcomes.map((o) => ({
        when: outcomeKeyToWhen(o.outcomeKey),
        to: o.targetPageId,
      }));

      // Resolve a fallback target: explicit fallbackPageId, or the first
      // connected edge target, or the source page itself.
      const fallbackTarget =
        el.fallbackPageId ??
        validOutcomes[validOutcomes.length - 1]?.targetPageId ??
        page.id;
      transitions.push({ to: fallbackTarget });

      navigation.push({
        trigger: el.id,
        type: 'apiCall',
        http: {
          endpoint: el.apiEndpoint ?? '/api/unknown',
          method: el.method ?? 'POST',
        },
        transitions: sortTransitions(transitions),
      });
      continue;
    }

    // --- Simple navigate ---
    if (actionType === 'navigate' || actionType === 'secure_entry_routing') {
      // Resolve target from the canvas edge
      const connectedEdge = edges.find(
        (e) => e.source === page.id && e.sourceHandle === el.id,
      );
      const targetPageId = el.navigateTo ?? connectedEdge?.target ?? null;
      if (targetPageId) {
        navigation.push({
          trigger: el.id,
          type: 'navigate',
          to: targetPageId,
        });
      }
      continue;
    }

    // actionType is 'none' or unrecognised — check if there's still an
    // edge wired up on the canvas that we should honour.
    const connectedEdge = edges.find(
      (e) => e.source === page.id && e.sourceHandle === el.id,
    );
    if (connectedEdge) {
      navigation.push({
        trigger: el.id,
        type: 'navigate',
        to: connectedEdge.target,
      });
    }
  }

  return navigation;
}

/* ------------------------------------------------------------------ */
/*  Public entry point                                                 */
/* ------------------------------------------------------------------ */

export function flowToOutputJson(
  nodes: Node[],
  edges: Edge[],
  startingPageId: string | null = null,
): OutputJson {
  const pages: OutputPageEntry[] = [];

  for (const node of nodes) {
    const page = (node.data as { page: PageDescriptor }).page;
    if (!page) continue;

    pages.push({
      id: page.id,
      navigation: buildPageNavigation(page, edges),
    });
  }

  // Determine initialRoute: explicit starting page, or first page
  const initialRoute =
    startingPageId ??
    (pages.length > 0 ? pages[0].id : '');

  return {
    schema: { version: '1.0' },
    config: {
      initialRoute,
      baseUrl: DEFAULT_BASE_URL,
    },
    pages,
  };
}
