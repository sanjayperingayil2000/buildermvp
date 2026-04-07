'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from '@xyflow/react';

export interface PageDescriptor {
  id: string;
  name: string;
  code: string; // ✨ Replsaced html and css with code
  actionElements: ActionElement[];
}

export interface ActionElement {
  id: string;
  label: string;
  tagName: string;
  actionType: string;
  navigateTo: string | null;
  apiEndpoint: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
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
  // Phase 2 outputs — set by GrapeJS builder
  rawJson: Record<string, unknown> | null;
  pages: PageDescriptor[];

  // Phase 3 outputs — set by Logic Builder
  flowNodes: Node[];
  flowEdges: Edge[];
  navMap: NavMapEntry[];

  // Phase 2 setters
  setRawJson: (json: Record<string, unknown>) => void;
  setPages: (pages: PageDescriptor[]) => void;

  // Phase 3 setters
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setNavMap: (map: NavMapEntry[]) => void;

  // Signal from popup to update local canvas edges
  pendingEdgeUpdate: Edge[] | null;
  setPendingEdgeUpdate: (edges: Edge[] | null) => void;

  // Runtime Context Passing
  activeContext: Record<string, any> | null;
  setActiveContext: (context: Record<string, any> | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      rawJson: null,
      pages: [],
      flowNodes: [],
      flowEdges: [],
      navMap: [],
      pendingEdgeUpdate: null,

      setRawJson: (json) => set({ rawJson: json }),
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
      setPendingEdgeUpdate: (edges) => set({ pendingEdgeUpdate: edges }),
      activeContext: null,
      setActiveContext: (context) => set({ activeContext: context }),
    }),
    {
      name: 'kiosk-builder-store',
      partialize: (state) => ({
        rawJson: state.rawJson,
        pages: state.pages,
        flowNodes: state.flowNodes,
        flowEdges: state.flowEdges,
        navMap: state.navMap,
      }),
    }
  )
);
