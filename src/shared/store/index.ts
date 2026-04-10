'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageDescriptor, ActionElement, NavMapEntry } from '../types/store';
import type { Node, Edge } from '@xyflow/react';

interface AppState {
  pages: PageDescriptor[];
  flowNodes: Node[];
  flowEdges: Edge[];
  navMap: NavMapEntry[];
  pendingEdgeUpdate: Edge[] | null;
  isLoading: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';

  setPages: (pages: PageDescriptor[]) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setNavMap: (map: NavMapEntry[]) => void;
  setPendingEdgeUpdate: (edges: Edge[] | null) => void;
  setLoading: (isLoading: boolean) => void;
  setToast: (message: string | null, type?: 'success' | 'error' | 'info') => void;

  hideActionElement: (pageId: string, elementId: string) => void;
  restoreActionElement: (pageId: string, elementId: string) => void;
  updateActionElement: (pageId: string, elementId: string, updates: Partial<ActionElement>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pages: [],
      flowNodes: [],
      flowEdges: [],
      navMap: [],
      pendingEdgeUpdate: null,
      isLoading: false,
      toastMessage: null,
      toastType: 'info',

      setPages: (newPages) => set((state) => {
        const validPageIds = new Set(newPages.map((p) => p.id));
        const nextNodes = state.flowNodes.filter((node) => validPageIds.has(node.id));
        const nextEdges = state.flowEdges.filter(
          (edge) => validPageIds.has(edge.source) && validPageIds.has(edge.target)
        );
        const nextNavMap = state.navMap.filter(
          (entry) => validPageIds.has(entry.sourcePageId) && validPageIds.has(entry.targetPageId)
        );
        return {
          pages: newPages,
          flowNodes: nextNodes,
          flowEdges: nextEdges,
          navMap: nextNavMap,
        };
      }),

      setFlowNodes: (nodes) => set({ flowNodes: nodes }),
      setFlowEdges: (edges) => set({ flowEdges: edges }),
      setNavMap: (map) => set({ navMap: map }),
      setPendingEdgeUpdate: (edges) => set({ pendingEdgeUpdate: edges }),
      setLoading: (isLoading) => set({ isLoading }),
      setToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),

      hideActionElement: (pageId, elementId) => set((state) => {
        const cleanedEdges = state.flowEdges.filter(
          (e) => !(
            e.source === pageId &&
            (e.sourceHandle === elementId || e.sourceHandle?.startsWith(`${elementId}__`))
          )
        );
        return {
          pages: state.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  actionElements: p.actionElements.map((el) =>
                    el.id === elementId ? { ...el, isHidden: true } : el
                  ),
                }
              : p
          ),
          flowEdges: cleanedEdges,
          pendingEdgeUpdate: cleanedEdges,
          navMap: state.navMap.filter(
            (entry) => !(
              entry.sourcePageId === pageId &&
              (entry.sourceHandleId === elementId || entry.sourceHandleId?.startsWith(`${elementId}__`))
            )
          ),
        };
      }),

      restoreActionElement: (pageId, elementId) => set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                actionElements: p.actionElements.map((el) =>
                  el.id === elementId ? { ...el, isHidden: false } : el
                ),
              }
            : p
        ),
      })),

      updateActionElement: (pageId, elementId, updates) => set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                actionElements: p.actionElements.map((el) =>
                  el.id === elementId ? { ...el, ...updates } : el
                ),
              }
            : p
        ),
      })),
    }),
    {
      name: 'kiosk-builder-store',
      partialize: (state) => ({
        pages: state.pages,
        flowNodes: state.flowNodes,
        flowEdges: state.flowEdges,
        navMap: state.navMap,
      }),
    }
  )
);