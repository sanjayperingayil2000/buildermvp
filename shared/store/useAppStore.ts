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
}

export interface EdgeAction {
  actionType: 'navigate' | 'api-call' | 'none';
  apiEndpoint?: string | null;
  onSuccess?: string | null;
  onError?: string | null;
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      rawJson: null,
      pages: [],
      flowNodes: [],
      flowEdges: [],
      navMap: [],

      setRawJson: (json) => set({ rawJson: json }),
      setPages: (pages) => set({ pages }),
      setFlowNodes: (nodes) => set({ flowNodes: nodes }),
      setFlowEdges: (edges) => set({ flowEdges: edges }),
      setNavMap: (map) => set({ navMap: map }),
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
