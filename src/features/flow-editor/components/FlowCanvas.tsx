'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AppHeader from '@/shared/components/AppHeader';
import PageNode from '@/features/flow-editor/components/nodes/PageNode';
import { DeletableEdge } from '@/features/flow-editor/components/nodes/DeletableEdge';
import { useAppStore } from '@/shared/store';
import { computeNodes } from '@/features/flow-editor/utils/computeNodes';
import { createConnectionEdge, isValidConnection } from '@/features/flow-editor/utils/edgeHelpers';
import { buildNavMap } from '@/features/flow-editor/utils/buildNavMap';
import { flowToOutputJson } from '@/features/export/utils/flowToOutputJson';
import { downloadOutputJson } from '@/features/export/utils/downloadOutputJson';
import { GRID_CONSTANTS } from '@/config/constants';

export default function FlowCanvas() {
  const pages = useAppStore((s) => s.pages);
  const pendingEdgeUpdate = useAppStore((s) => s.pendingEdgeUpdate);
  const setPendingEdgeUpdate = useAppStore((s) => s.setPendingEdgeUpdate);

  const nodeTypes = useMemo(() => ({ pageNode: PageNode }), []);
  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

  const hasInitialised = useRef(false);

  const [nodes, setNodes] = useState<Node[]>(() => {
    const storedNodes = useAppStore.getState().flowNodes;
    const currentPages = useAppStore.getState().pages;
    return computeNodes(currentPages, storedNodes);
  });

  const [edges, setEdges] = useState<Edge[]>(() => {
    const storedEdges = useAppStore.getState().flowEdges;
    return storedEdges.map((e) => ({ ...e, type: e.type ?? 'deletable' }));
  });

  const [connectionRejection, setConnectionRejection] = useState<string | null>(null);

  useEffect(() => {
    if (pages.length === 0) return;
    if (!hasInitialised.current) {
      hasInitialised.current = true;
      return;
    }
    setNodes((prev) =>
      pages.map((page) => {
        const existing = prev.find((n) => n.id === page.id);
        return {
          id: page.id,
          type: 'pageNode' as const,
          position: existing?.position ?? computeNodes([page], [])[0].position,
          data: { page },
          dragHandle: '.node-drag-handle',
        };
      })
    );
  }, [pages]);

  useEffect(() => {
    if (pendingEdgeUpdate === null) return;
    setEdges(pendingEdgeUpdate.map((e) => ({ ...e, type: e.type ?? 'deletable' })));
    setPendingEdgeUpdate(null);
  }, [pendingEdgeUpdate, setPendingEdgeUpdate]);

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    const newEdge = createConnectionEdge(connection);
    setEdges((prev) => [...prev, newEdge]);
  }, []);

  const rejectConnection = useCallback((msg: string): false => {
    setConnectionRejection(msg);
    setTimeout(() => setConnectionRejection(null), 3000);
    return false;
  }, []);

  const isValidConnectionCheck: IsValidConnection = useCallback(
    (connection) => {
      const result = isValidConnection(
        { 
          source: connection.source!, 
          sourceHandle: connection.sourceHandle ?? null, 
          target: connection.target! 
        },
        edges,
        pages
      );
      if (!result.valid && result.message) {
        rejectConnection(result.message);
        return false;
      }
      return true;
    },
    [edges, pages, rejectConnection]
  );

  const handleSaveLogic = useCallback(() => {
    useAppStore.getState().setFlowNodes(nodes);
    useAppStore.getState().setFlowEdges(edges);
    useAppStore.getState().setNavMap(buildNavMap(edges as unknown as { source: string; sourceHandle: string | null | undefined; target: string; data?: unknown }[], pages));
    window.alert('Logic saved!');
  }, [nodes, edges, pages]);

  const handleDownloadJson = useCallback(() => {
    const { flowNodes, flowEdges } = useAppStore.getState();
    const output = flowToOutputJson(flowNodes, flowEdges);
    downloadOutputJson(output);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />

      {pages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: '#1a1a2e',
            color: '#9ca3af',
            fontSize: '16px',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <p style={{ margin: 0, maxWidth: '420px', lineHeight: 1.6 }}>
            No screens loaded. Import a manifest JSON to get started.
          </p>
          <Link
            href="/import"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 24px',
              backgroundColor: '#35d7bb',
              color: '#1e1e2e',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Go to Import
          </Link>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 5,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <button
              id="download-json-btn"
              onClick={handleDownloadJson}
              style={{
                padding: '8px 20px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              ↓ Download JSON
            </button>
            <div>
              <button
                onClick={handleSaveLogic}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#35d7bb',
                  color: '#1e1e2e',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                Save Logic
              </button>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 6, textAlign: 'right' }}>
                Click an edge to select it, then press Delete — or hover the edge to reveal the × button
              </span>
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnectionCheck}
            fitView
            fitViewOptions={{ padding: GRID_CONSTANTS.FIT_VIEW_PADDING }}
            deleteKeyCode="Delete"
            edgesFocusable={true}
            minZoom={GRID_CONSTANTS.MIN_ZOOM}
            maxZoom={GRID_CONSTANTS.MAX_ZOOM}
            style={{ background: '#0f172a' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.05)" />
            {connectionRejection && (
              <Panel position="top-center">
                <div
                  style={{
                    background: '#450a0a',
                    border: '1px solid #991b1b',
                    color: '#fca5a5',
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    maxWidth: 420,
                    textAlign: 'center',
                  }}
                >
                  {connectionRejection}
                </div>
              </Panel>
            )}
            <Panel position="bottom-left">
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>Handle types</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', border: '2px solid #fff', display: 'inline-block' }} />
                  <span>Navigate — 1 connection max</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#8b5cf6', border: '2px solid #fff', display: 'inline-block' }} />
                  <span>Conditional navigate — JSON expression</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', border: '2px solid #fff', display: 'inline-block' }} />
                  <span>API call — 3 connections max</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#6b7280', border: '2px solid #9ca3af', display: 'inline-block', opacity: 0.5 }} />
                  <span>Saturated — limit reached</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}
    </div>
  );
}