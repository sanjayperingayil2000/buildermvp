import type { Node, Edge } from '@xyflow/react';
import type { FlowNode, FlowEdge } from '../../types/flow';

export interface FlowState {
  flowNodes: Node[];
  flowEdges: Edge[];
}

export const initialFlowState: FlowState = {
  flowNodes: [],
  flowEdges: [],
};

export function setFlowNodes(state: FlowState, nodes: Node[]): FlowState {
  return { ...state, flowNodes: nodes };
}

export function setFlowEdges(state: FlowState, edges: Edge[]): FlowState {
  return { ...state, flowEdges: edges };
}

export function purgeFlowNodes(state: FlowState, validPageIds: Set<string>): FlowState {
  return {
    ...state,
    flowNodes: state.flowNodes.filter((node) => validPageIds.has(node.id)),
  };
}

export function purgeFlowEdges(state: FlowState, validPageIds: Set<string>): FlowState {
  return {
    ...state,
    flowEdges: state.flowEdges.filter(
      (edge) => validPageIds.has(edge.source) && validPageIds.has(edge.target)
    ),
  };
}