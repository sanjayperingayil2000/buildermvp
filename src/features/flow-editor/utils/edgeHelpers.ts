import type { Edge, Connection } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { MAX_CONNECTIONS } from '@/config/constants';

export function createConnectionEdge(connection: Connection): Edge {
  return {
    id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${Date.now()}`,
    type: 'deletable',
    source: connection.source!,
    sourceHandle: connection.sourceHandle ?? null,
    target: connection.target!,
    targetHandle: connection.targetHandle ?? null,
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    data: {
      actionType: 'navigate',
      apiEndpoint: null,
      method: 'POST',
    } as Record<string, unknown>,
  };
}

export function isValidConnection(
  connection: { source: string; sourceHandle: string | null; target: string },
  edges: Edge[],
  pages: { id: string; actionElements: { id: string; actionType: string }[] }[]
): { valid: boolean; message?: string } {
  const { source, sourceHandle, target } = connection;

  if (source === target) {
    return { valid: false, message: 'Cannot connect a page to itself.' };
  }

  const sourcePage = pages.find((p) => p.id === source);
  const actionElement = sourcePage?.actionElements.find(
    (el) => sourceHandle && (sourceHandle === el.id || sourceHandle.startsWith(el.id + '__'))
  );
  const actionType = actionElement?.actionType ?? 'none';

  const existingEdgesFromHandle = edges.filter(
    (e) => e.source === source && e.sourceHandle === sourceHandle
  );
  const existingCount = existingEdgesFromHandle.length;

  if (actionType === 'navigate_back' || actionType === 'navigate_close') {
    return { valid: false, message: `This button uses "${actionType === 'navigate_back' ? 'Navigate — Back' : 'Navigate — Close'}" which does not connect to a specific page.` };
  }

  if (actionType === 'navigate' || actionType === 'none') {
    if (existingCount >= MAX_CONNECTIONS.navigate) {
      return { valid: false, message: 'This handle already has a connection. Delete the existing edge to reconnect.' };
    }
    return { valid: true };
  }

  if (actionType === 'api-call') {
    if (existingCount >= MAX_CONNECTIONS.apiCall) {
      return { valid: false, message: `This button already has ${MAX_CONNECTIONS.apiCall} connections. API call buttons support a maximum of ${MAX_CONNECTIONS.apiCall} outcome routes.` };
    }
    return { valid: true };
  }

  return { valid: true };
}