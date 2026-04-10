import { useCallback } from 'react';
import type { Edge, Connection } from '@xyflow/react';
import { useAppStore } from '@/shared/store';
import { isValidConnection } from '../utils/edgeHelpers';

export function useConnectionRules() {
  const edges = useAppStore((s) => s.flowEdges);
  const pages = useAppStore((s) => s.pages);

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