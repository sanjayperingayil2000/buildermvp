import type { NavMapEntry } from '../../types/store';

export interface NavMapState {
  navMap: NavMapEntry[];
  pendingEdgeUpdate: Edge[] | null;
}

export const initialNavMapState: NavMapState = {
  navMap: [],
  pendingEdgeUpdate: null,
};

export function setNavMap(state: NavMapState, navMap: NavMapEntry[]): NavMapState {
  return { ...state, navMap };
}

export function setPendingEdgeUpdate(state: NavMapState, edges: Edge[] | null): NavMapState {
  return { ...state, pendingEdgeUpdate: edges };
}

export function purgeNavMap(state: NavMapState, validPageIds: Set<string>): NavMapState {
  return {
    ...state,
    navMap: state.navMap.filter(
      (entry) =>
        validPageIds.has(entry.sourcePageId) && validPageIds.has(entry.targetPageId)
    ),
  };
}

export function cleanEdgesOnHide(
  edges: Edge[],
  pageId: string,
  elementId: string
): Edge[] {
  return edges.filter(
    (e) =>
      !(
        e.source === pageId &&
        (e.sourceHandle === elementId || e.sourceHandle?.startsWith(`${elementId}__`))
      )
  );
}

export function cleanNavMapOnHide(
  navMap: NavMapEntry[],
  pageId: string,
  elementId: string
): NavMapEntry[] {
  return navMap.filter(
    (entry) =>
      !(
        entry.sourcePageId === pageId &&
        (entry.sourceHandleId === elementId ||
          entry.sourceHandleId?.startsWith(`${elementId}__`))
      )
  );
}

type Edge = { source: string; sourceHandle?: string | null };