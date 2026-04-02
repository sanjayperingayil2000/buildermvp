'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from '@xyflow/react';

// Describes one input field found on a page
export interface InputFieldDescriptor {
  id: string;                  // matches the HTML id of the input, e.g. "niw-primary"
  widgetId: string;            // the data-widget attribute of the parent widget, e.g. "number-input-widget"
  label: string;               // human-readable name, e.g. "Primary number input"
  inputType: string;           // HTML input type found in the DOM: "text" | "password" | "number" | "tel"
  placeholder: string;         // current placeholder text
  role: 'primary' | 'confirm' | 'generic';  // semantic role detected from element attributes
}

// One condition rule that applies to an input field
export interface InputCondition {
  id: string;                  // unique id for this condition rule, generated on creation
  fieldId: string;             // matches InputFieldDescriptor.id
  pageId: string;              // the page this condition belongs to
  conditionType: InputConditionType;
  value: string | number | null;   // the threshold or allowed value
  errorMessage: string;        // shown to the user when the condition fails
  enabled: boolean;
}

export type InputConditionType =
  | 'min_length'           // input must have at least N digits
  | 'max_length'           // input must have at most N digits
  | 'exact_length'         // input must be exactly N digits (supports comma-separated: "12,16")
  | 'allowed_chars'        // regex pattern of allowed characters, e.g. "[0-9]"
  | 'input_type'           // what the semantic type is: "phone" | "card" | "any"
  | 'require_bin_match'    // boolean — whether a BIN lookup is required for card numbers
  | 'require_confirmation' // boolean — whether the confirm field must match the primary
  | 'mask_after_n_chars';  // mask the input after N visible characters

// The full set of conditions for one page
export interface PageInputConfig {
  pageId: string;
  conditions: InputCondition[];
}

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

  // Input field configuration
  inputFieldsByPage: Record<string, InputFieldDescriptor[]>;  // keyed by pageId
  inputConditions: PageInputConfig[];

  // Phase 2 setters
  setRawJson: (json: Record<string, unknown>) => void;
  setPages: (pages: PageDescriptor[]) => void;

  // Phase 3 setters
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setNavMap: (map: NavMapEntry[]) => void;

  // Input field setters
  setInputFieldsByPage: (map: Record<string, InputFieldDescriptor[]>) => void;
  setInputConditions: (conditions: PageInputConfig[]) => void;
  upsertPageInputConfig: (config: PageInputConfig) => void;

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
      inputFieldsByPage: {},
      inputConditions: [],
      pendingEdgeUpdate: null,

      setRawJson: (json) => set({ rawJson: json }),
      setPages: (pages) => set({ pages }),
      setFlowNodes: (nodes) => set({ flowNodes: nodes }),
      setFlowEdges: (edges) => set({ flowEdges: edges }),
      setNavMap: (map) => set({ navMap: map }),
      setInputFieldsByPage: (map) => set({ inputFieldsByPage: map }),
      setInputConditions: (conditions) => set({ inputConditions: conditions }),
      upsertPageInputConfig: (config) =>
        set((state) => {
          const existing = state.inputConditions.filter(
            (c) => c.pageId !== config.pageId
          );
          return { inputConditions: [...existing, config] };
        }),
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
        inputFieldsByPage: state.inputFieldsByPage,
        inputConditions: state.inputConditions,
      }),
    }
  )
);
