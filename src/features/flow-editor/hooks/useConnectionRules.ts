import { useCallback } from 'react';
import type { Edge, Connection } from '@xyflow/react';
import { useAppStore } from '@/shared/store';
import { isValidConnection } from '../utils/edgeHelpers';

export function useConnectionRules() {
  const activeProject = useAppStore((s) => s.getActiveProject());
  const edges = activeProject?.flowEdges ?? [];
  const pages = activeProject?.pages ?? [];

  const checkConnection = useCallback(
    (connection: Connection): boolean => {
      const result = isValidConnection(
        { source: connection.source!, sourceHandle: connection.sourceHandle, target: connection.target! },
        edges,
        pages
      );
      return result.valid;
    },
    [edges, pages]
  );

  const getRejectionMessage = useCallback(
    (connection: Connection): string | undefined => {
      const result = isValidConnection(
        { source: connection.source!, sourceHandle: connection.sourceHandle, target: connection.target! },
        edges,
        pages
      );
      return result.message;
    },
    [edges, pages]
  );

  return { checkConnection, getRejectionMessage };
}