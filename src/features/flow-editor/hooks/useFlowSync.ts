import { useCallback, useRef } from 'react';
import { useAppStore } from '@/shared/store';
import type { Node, Edge } from '@xyflow/react';
import { computeNodes } from '../utils/computeNodes';

export function useFlowSync() {
  const hasInitialised = useRef(false);
  const activeProject = useAppStore((s) => s.getActiveProject());
  const setFlowNodes = useAppStore((s) => s.setFlowNodes);
  const setFlowEdges = useAppStore((s) => s.setFlowEdges);
  
  const pages = activeProject?.pages ?? [];
  const storedNodes = activeProject?.flowNodes ?? [];
  const storedEdges = activeProject?.flowEdges ?? [];

  const initNodes = useCallback((): Node[] => {
    const nodes = computeNodes(pages, storedNodes);
    return nodes;
  }, [pages, storedNodes]);

  const initEdges = useCallback((): Edge[] => {
    return storedEdges.map((e: Edge) => ({ ...e, type: e.type ?? 'deletable' }));
  }, [storedEdges]);

  const syncNodesToStore = useCallback((nodes: Node[]) => {
    setFlowNodes(nodes);
  }, [setFlowNodes]);

  const syncEdgesToStore = useCallback((edges: Edge[]) => {
    setFlowEdges(edges);
  }, [setFlowEdges]);

  const applyPendingEdgeUpdate = useCallback((_setEdges: (edges: Edge[]) => void) => {
    // no-op - edge updates are handled locally
  }, []);

  return {
    hasInitialised,
    initNodes,
    initEdges,
    syncNodesToStore,
    syncEdgesToStore,
    applyPendingEdgeUpdate,
  };
}