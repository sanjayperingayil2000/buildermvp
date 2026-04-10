import type { Node, Edge } from '@xyflow/react';
import type { NavMapEntry } from './store';

export type FlowNode = Node;
export type FlowEdge = Edge;

export interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowWithNavMap extends FlowState {
  navMap: NavMapEntry[];
}