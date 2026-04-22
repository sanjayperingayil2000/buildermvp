import { useEffect } from 'react';
import { useAppStore } from '@/shared/store';
import type { Edge } from '@xyflow/react';

export function useEdgePopulation() {
  // This hook is no longer needed - edge updates are handled locally in FlowCanvas
  const applyPendingUpdate = (_setEdges: (edges: Edge[]) => void) => {
    // no-op
  };

  return { applyPendingUpdate };
}