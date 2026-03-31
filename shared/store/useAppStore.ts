'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from '@xyflow/react';

export interface PageDescriptor {
  id: string;
  name: string;
  html: string;
  css: string;
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
}

export interface NavMapOutcome {
  outcomeKey: string;      // the string the API returns, e.g. "success", "error", "pending"
  targetPageId: string;    // the page to navigate to when this outcome is received
}

export interface EdgeAction {
  actionType: 'navigate' | 'api-call' | 'none';
  apiEndpoint: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes: NavMapOutcome[];
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
      setPages: (pages) => set({ pages }),
      setFlowNodes: (nodes) => set({ flowNodes: nodes }),
      setFlowEdges: (edges) => set({ flowEdges: edges }),
      setNavMap: (map) => set({ navMap: map }),
      setPendingEdgeUpdate: (edges) => set({ pendingEdgeUpdate: edges }),
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
