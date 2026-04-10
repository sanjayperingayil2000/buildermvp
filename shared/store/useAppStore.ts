'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from '@xyflow/react';
export interface PageDescriptor {
  id: string;
  name: string;
  actionElements: ActionElement[];
}
export interface ActionElement {
  id: string;
  label: string;
  tagName: string;
  elementType?: 'button' | 'link' | 'input';
  actionType: string;
  navigateTo: string | null;
  apiEndpoint: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
  isHidden?: boolean;
  validations?: {
    maxLength?: number;
    numberOnly?: boolean;
    errorMessage?: string;
  };
}
export interface NavMapOutcome {
  outcomeKey: string;      // the string the API returns, e.g. "success", "error", "pending"
  targetPageId: string;    // the page to navigate to when this outcome is received
}
export interface EdgeAction {
  actionType: 'navigate' | 'api-call' | 'secure_entry_routing' | 'none';
  apiEndpoint: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes: NavMapOutcome[];
  fallbackPageId?: string;
}
export interface NavMapEntry {
  sourcePageId: string;
  sourceHandleId: string;
  targetPageId: string;
  action: EdgeAction;
}
interface AppState {
  // Set by manifest import
  pages: PageDescriptor[];
  // Set by Logic Builder (React Flow canvas)
  flowNodes: Node[];
  flowEdges: Edge[];
  navMap: NavMapEntry[];
  // Setters
  setPages: (pages: PageDescriptor[]) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setNavMap: (map: NavMapEntry[]) => void;
  // ActionElement mutations
  hideActionElement: (pageId: string, elementId: string) => void;
  restoreActionElement: (pageId: string, elementId: string) => void;
  updateActionElement: (pageId: string, elementId: string, updates: Partial<ActionElement>) => void;
  // Signal from popup to update local canvas edges
  pendingEdgeUpdate: Edge[] | null;
  setPendingEdgeUpdate: (edges: Edge[] | null) => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pages: [],
      flowNodes: [],
      flowEdges: [],
      navMap: [],
      pendingEdgeUpdate: null,
      // ✨ THE PURGE LOGIC ✨
      setPages: (newPages) => set((state) => {
        // 1. Create a quick lookup Set of all valid page IDs that still exist
        const validPageIds = new Set(newPages.map((p) => p.id));
        // 2. Purge flowNodes: Keep only nodes whose ID is in the valid pages
        const nextNodes = state.flowNodes.filter((node) => validPageIds.has(node.id));
        // 3. Purge flowEdges: Keep only edges where BOTH source and target still exist
        const nextEdges = state.flowEdges.filter((edge) =>
          validPageIds.has(edge.source) && validPageIds.has(edge.target)
        );
        // 4. Purge navMap: Keep only routes where BOTH source and target still exist
        const nextNavMap = state.navMap.filter((entry) =>
          validPageIds.has(entry.sourcePageId) && validPageIds.has(entry.targetPageId)
        );
        // Return the scrubbed state
        return {
          pages: newPages,
          flowNodes: nextNodes,
          flowEdges: nextEdges,
          navMap: nextNavMap
        };
      }),
      setFlowNodes: (nodes) => set({ flowNodes: nodes }),
      setFlowEdges: (edges) => set({ flowEdges: edges }),
      setNavMap: (map) => set({ navMap: map }),
      hideActionElement: (pageId, elementId) => set((state) => {
        const cleanedEdges = state.flowEdges.filter(
          (e) => !(e.source === pageId && (
            e.sourceHandle === elementId || e.sourceHandle?.startsWith(`${elementId}__`)
          ))
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
          // Signal canvas to redraw with cleaned edges
          pendingEdgeUpdate: cleanedEdges,
          // Clean up navMap entries for the deleted element
          navMap: state.navMap.filter(
            (entry) => !(entry.sourcePageId === pageId && (
              entry.sourceHandleId === elementId || entry.sourceHandleId?.startsWith(`${elementId}__`)
            ))
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
      setPendingEdgeUpdate: (edges) => set({ pendingEdgeUpdate: edges }),
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
