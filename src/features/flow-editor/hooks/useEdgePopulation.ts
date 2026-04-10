import { useEffect } from 'react';
import { useAppStore } from '@/shared/store';
import type { Edge } from '@xyflow/react';

export function useEdgePopulation() {
  const pendingEdgeUpdate = useAppStore((s) => s.pendingEdgeUpdate);
  const setPendingEdgeUpdate = useAppStore((s) => s.setPendingEdgeUpdate);

  const applyPendingUpdate = (setEdges: (edges: Edge[]) => void) => {
    if (pendingEdgeUpdate === null) return;
    setEdges(pendingEdgeUpdate.map((e) => ({ ...e, type: e.type ?? 'deletable' })));
    setPendingEdgeUpdate(null);
  };

  return { applyPendingUpdate };
}