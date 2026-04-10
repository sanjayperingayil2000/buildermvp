import { useCallback, useRef } from 'react';
import { useAppStore } from '@/shared/store';
import type { Node, Edge } from '@xyflow/react';
import { computeNodes } from '../utils/computeNodes';

export function useFlowSync() {
  const hasInitialised = useRef(false);
  const pages = useAppStore((s) => s.pages);
  const pendingEdgeUpdate = useAppStore((s) => s.pendingEdgeUpdate);
  const setPendingEdgeUpdate = useAppStore((s) => s.setPendingEdgeUpdate);
  const storedNodes = useAppStore.getState().flowNodes;
  const storedEdges = useAppStore.getState().flowEdges;

  const initNodes = useCallback((): Node[] => {
    const nodes = computeNodes(pages, storedNodes);
    return nodes;
  }, [pages, storedNodes]);

  const initEdges = useCallback((): Edge[] => {
    return storedEdges.map((e) => ({ ...e, type: e.type ?? 'deletable' }));
  }, [storedEdges]);

  const syncNodesToStore = useCallback((nodes: Node[]) => {
    useAppStore.getState().setFlowNodes(nodes);
  }, []);

  const syncEdgesToStore = useCallback((edges: Edge[]) => {
    useAppStore.getState().setFlowEdges(edges);
  }, []);

  const applyPendingEdgeUpdate = useCallback((setEdges: (edges: Edge[]) => void) => {
    if (pendingEdgeUpdate === null) return;
    setEdges(pendingEdgeUpdate.map((e) => ({ ...e, type: e.type ?? 'deletable' })));
    setPendingEdgeUpdate(null);
  }, [pendingEdgeUpdate, setPendingEdgeUpdate]);

  return {
    hasInitialised,
    initNodes,
    initEdges,
    syncNodesToStore,
    syncEdgesToStore,
    applyPendingEdgeUpdate,
  };
}