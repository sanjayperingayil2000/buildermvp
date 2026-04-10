import { useCallback } from 'react';
import { useAppStore } from '@/shared/store';
import { buildNavMap } from '../utils/buildNavMap';
import type { Node, Edge } from '@xyflow/react';

export function useSaveLogic() {
  const pages = useAppStore((s) => s.pages);

  const saveLogic = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      useAppStore.getState().setFlowNodes(nodes);
      useAppStore.getState().setFlowEdges(edges);
      useAppStore.getState().setNavMap(buildNavMap(edges as unknown as { source: string; sourceHandle: string | null | undefined; target: string; data?: unknown }[], pages));
      window.alert('Logic saved!');
    },
    [pages]
  );

  return { saveLogic };
}