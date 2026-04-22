import { useCallback } from 'react';
import { useAppStore } from '@/shared/store';
import { buildNavMap } from '../utils/buildNavMap';
import type { Node, Edge } from '@xyflow/react';

export function useSaveLogic() {
  const setFlowNodes = useAppStore((s) => s.setFlowNodes);
  const setFlowEdges = useAppStore((s) => s.setFlowEdges);
  const setNavMap = useAppStore((s) => s.setNavMap);
  const activeProject = useAppStore((s) => s.getActiveProject());
  const pages = activeProject?.pages ?? [];

  const saveLogic = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      setFlowNodes(nodes);
      setFlowEdges(edges);
      setNavMap(buildNavMap(edges as unknown as { source: string; sourceHandle: string | null | undefined; target: string; data?: unknown }[], pages));
      window.alert('Logic saved!');
    },
    [pages, setFlowNodes, setFlowEdges, setNavMap]
  );

  return { saveLogic };
}