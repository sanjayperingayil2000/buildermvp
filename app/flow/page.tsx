'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  type Node,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AppHeader from '@/shared/components/AppHeader';
import PageNode from '@/shared/components/flow/PageNode';
import { DeletableEdge } from '@/shared/components/flow/DeletableEdge';
import {
  useAppStore,
  type PageDescriptor,
  type NavMapEntry,
  type EdgeAction,
} from '@/shared/store/useAppStore';

function computeDefaultPosition(page: PageDescriptor, allPages: PageDescriptor[]) {
  const ITEMS_PER_ROW = 3;
  const NODE_WIDTH = 280;
  const H_GAP = 80;
  const V_GAP = 100;
  const index = allPages.findIndex((p) => p.id === page.id);
  const col = index % ITEMS_PER_ROW;
  const row = Math.floor(index / ITEMS_PER_ROW);
  return {
    x: col * (NODE_WIDTH + H_GAP) + 60,
    y: row * (200 + V_GAP) + 60,
  };
}

function buildNavMap(edges: Edge[], pages: PageDescriptor[]): NavMapEntry[] {
  const entryMap = new Map<string, NavMapEntry>();

  edges.forEach((edge) => {
    const key = `${edge.source}::${edge.sourceHandle}`;
    if (entryMap.has(key)) return;

    const sourcePage = pages.find((p) => p.id === edge.source);
    const actionElement = sourcePage?.actionElements.find(
      (el) => el.id === edge.sourceHandle
    );
    const edgeData = edge.data as EdgeAction | undefined;

    const actionType =
      (actionElement?.actionType as EdgeAction['actionType']) ??
      edgeData?.actionType ??
      'navigate';
    const apiEndpoint =
      actionElement?.apiEndpoint ?? edgeData?.apiEndpoint ?? null;
    const method =
      (actionElement?.method as EdgeAction['method']) ??
      edgeData?.method ??
      'POST';
    const outcomes =
      actionElement?.outcomes ?? edgeData?.outcomes ?? [];
    const fallbackPageId =
      actionElement?.fallbackPageId ?? edgeData?.fallbackPageId;

    entryMap.set(key, {
      sourcePageId: edge.source,
      sourceHandleId: edge.sourceHandle ?? '',
      targetPageId: edge.target,
      action: { actionType, apiEndpoint, method, outcomes, fallbackPageId },
    });
  });

  return Array.from(entryMap.values());
}

function computeNodes(
  pageList: PageDescriptor[],
  saved: Node[]
): Node[] {
  if (saved.length > 0) {
    return pageList.map((page) => {
      const existing = saved.find((n) => n.id === page.id);
      return {
        id: page.id,
        type: 'pageNode' as const,
        position: existing?.position ?? computeDefaultPosition(page, pageList),
        data: { page },
        dragHandle: '.node-drag-handle',
      };
    });
  }
  return pageList.map((page) => ({
    id: page.id,
    type: 'pageNode' as const,
    position: computeDefaultPosition(page, pageList),
    data: { page },
    dragHandle: '.node-drag-handle',
  }));
}

export default function FlowPage() {
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

  // Effect 1: Update node data when pages change after initial mount
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
          position: existing?.position ?? computeDefaultPosition(page, pages),
          data: { page },
          dragHandle: '.node-drag-handle',
        };
      })
    );
  }, [pages]);

  // Effect 2: Apply pending edge updates from ActionConfigPopup
  useEffect(() => {
    if (pendingEdgeUpdate === null) return;
    setEdges(pendingEdgeUpdate.map((e) => ({ ...e, type: e.type ?? 'deletable' })));
    setPendingEdgeUpdate(null);
  }, [pendingEdgeUpdate, setPendingEdgeUpdate]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
    // No store write here
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
    // No store write here
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    const newEdge: Edge = {
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
        outcomes: [],
      } satisfies EdgeAction,
    };
    setEdges((prev) => [...prev, newEdge]);
    // No store write here
  }, []);

  const rejectConnection = useCallback((msg: string): false => {
    setConnectionRejection(msg);
    setTimeout(() => setConnectionRejection(null), 3000);
    return false;
  }, []);

  const isValidConnection = useCallback(
    (connection: Edge | Connection): boolean => {
      const { source, sourceHandle, target } = connection;

      // Prevent self-connections
      if (source === target) return false;

      // Find the action element for this source handle
      const sourcePage = pages.find((p) => p.id === source);
      const actionElement = sourcePage?.actionElements.find(
        (el) => sourceHandle && (sourceHandle === el.id || sourceHandle.startsWith(el.id + '__'))
      );
      const actionType = actionElement?.actionType ?? 'none';

      // Count how many edges already leave this specific handle
      const existingEdgesFromHandle = edges.filter(
        (e) => e.source === source && e.sourceHandle === sourceHandle
      );
      const existingCount = existingEdgesFromHandle.length;

      if (actionType === 'navigate' || actionType === 'none' || actionType === 'secure_entry_routing') {
        if (existingCount >= 1) {
          return rejectConnection(
            'This handle already has a connection. Each outcome can only conditionally route to one page.'
          );
        }
        return true;
      }

      if (actionType === 'api-call') {
        if (existingCount >= 3) {
          return rejectConnection(
            'This button already has 3 connections. API call buttons support a maximum of 3 outcome routes.'
          );
        }
        return true;
      }

      // Default: allow
      return true;
    },
    [edges, pages, rejectConnection]
  );

  const handleSaveLogic = useCallback(() => {
    // Write current canvas state to the store
    useAppStore.getState().setFlowNodes(nodes);
    useAppStore.getState().setFlowEdges(edges);
    useAppStore.getState().setNavMap(buildNavMap(edges, pages));

    console.log('=== SAVED LOGIC ===');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
    console.log('NavMap:', buildNavMap(edges, pages));

    window.alert('Logic saved!');
  }, [nodes, edges, pages]);

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
            No pages found. Go to Template Builder, design your pages, and click Save.
          </p>
          <Link
            href="/builder"
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
            Go to Template Buildera
          </Link>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Save Logic toolbar */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 5,
            }}
          >
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

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            edgesFocusable={true}
            minZoom={0.3}
            maxZoom={1.5}
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
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  {connectionRejection}
                </div>
              </Panel>
            )}

            {/* Handle legend */}
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
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>
                  Handle types
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#10b981', border: '2px solid #fff',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span>Navigate — 1 connection max</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#f59e0b', border: '2px solid #fff',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span>API call — 3 connections max</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#6b7280', border: '2px solid #9ca3af',
                    display: 'inline-block', flexShrink: 0, opacity: 0.5,
                  }} />
                  <span>Saturated — limit reached</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#10b981', border: '2px solid #fff',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ color: '#64748b' }}>Entry — any page can receive connections</span>
                </div>
              </div>
            </Panel>

            <Panel position="bottom-right">
              <InputConditionsSummary />
            </Panel>
          </ReactFlow>
        </div>
      )}
    </div>
  );
}

function InputConditionsSummary() {
  const inputConditions = useAppStore((s) => s.inputConditions);
  const pages = useAppStore((s) => s.pages);
  const inputFieldsByPage = useAppStore((s) => s.inputFieldsByPage);

  const totalRules = inputConditions.reduce(
    (sum, pc) => sum + pc.conditions.filter((c) => c.enabled).length, 0
  );

  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      fontSize: 11,
      color: '#94a3b8',
      minWidth: 180,
      maxWidth: 260,
    }}>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>{totalRules}</span>
          {' '}input rule{totalRules !== 1 ? 's' : ''} configured
        </span>
        <span style={{ color: '#475569' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #334155', padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
          {inputConditions.length === 0 && (
            <div style={{ color: '#475569', fontStyle: 'italic' }}>
              No conditions set. Click ⚙ on an input field row in a page node.
            </div>
          )}
          {inputConditions.map((pc) => {
            const page = pages.find((p) => p.id === pc.pageId);
            const fields = inputFieldsByPage[pc.pageId] ?? [];
            const activeConditions = pc.conditions.filter((c) => c.enabled);
            
            if (activeConditions.length === 0) return null;
            
            return (
              <div key={pc.pageId} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                  {page?.name ?? pc.pageId}
                </div>
                {activeConditions.map((c) => {
                  const field = fields.find((f) => f.id === c.fieldId);
                  return (
                    <div key={c.id} style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'flex-start',
                      marginBottom: 3,
                      paddingLeft: 8,
                    }}>
                      <span style={{ color: '#a78bfa', flexShrink: 0 }}>·</span>
                      <span>
                        <span style={{ color: '#cbd5e1' }}>{field?.label ?? c.fieldId}</span>
                        {' — '}
                        <span style={{ color: '#94a3b8' }}>{c.conditionType}</span>
                        {c.value !== null && (
                          <span style={{ color: '#7c3aed' }}> = {String(c.value)}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

