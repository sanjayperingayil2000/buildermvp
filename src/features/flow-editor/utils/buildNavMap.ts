import type { PageDescriptor, NavMapEntry, EdgeAction } from '@/shared/types/store';

export function buildNavMap(
  edges: { source: string; sourceHandle: string | null | undefined; target: string; data?: unknown }[], 
  pages: PageDescriptor[]
): NavMapEntry[] {
  const entryMap = new Map<string, NavMapEntry>();

  edges.forEach((edge) => {
    const key = `${edge.source}::${edge.sourceHandle ?? ''}`;
    if (entryMap.has(key)) return;

    const sourcePage = pages.find((p) => p.id === edge.source);
    const actionElement = sourcePage?.actionElements.find((el) => el.id === edge.sourceHandle);
    const edgeData = edge.data as EdgeAction | undefined;

    const actionType = (actionElement?.actionType ?? edgeData?.actionType ?? 'navigate') as EdgeAction['actionType'];
    const apiEndpoint = actionElement?.apiEndpoint ?? edgeData?.apiEndpoint ?? null;
    const method = actionElement?.method ?? edgeData?.method ?? 'POST';
    const outcomes = actionElement?.outcomes ?? edgeData?.outcomes ?? [];
    const fallbackPageId = actionElement?.fallbackPageId ?? edgeData?.fallbackPageId;

    entryMap.set(key, {
      sourcePageId: edge.source,
      sourceHandleId: edge.sourceHandle ?? '',
      targetPageId: edge.target,
      action: { actionType, apiEndpoint, method, outcomes, fallbackPageId },
    });
  });

  return Array.from(entryMap.values());
}