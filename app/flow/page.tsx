'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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
  return edges.map((edge) => {
    return {
      sourcePageId: edge.source,
      sourceHandleId: edge.sourceHandle ?? '',
      targetPageId: edge.target,
      action: {
        actionType: (edge.data?.actionType as EdgeAction['actionType']) ?? 'navigate',
        apiEndpoint: (edge.data?.apiEndpoint as string) ?? null,
        onSuccess: (edge.data?.onSuccess as string) ?? null,
        onError: (edge.data?.onError as string) ?? null,
      },
    };
  });
}

export default function FlowPage() {
  const storedNodes = useAppStore((s) => s.flowNodes);
  const storedEdges = useAppStore((s) => s.flowEdges);
  const pages = useAppStore((s) => s.pages);

  const nodeTypes = useMemo(() => ({ pageNode: PageNode }), []);

  const initialNodes = useMemo<Node[]>(() => {
    // If we have previously saved node positions, restore them
    if (storedNodes.length > 0) {
      // Merge stored positions with current page data in case pages changed
      return pages.map((page) => {
        const existing = storedNodes.find((n) => n.id === page.id);
        return {
          id: page.id,
          type: 'pageNode',
          position: existing?.position ?? computeDefaultPosition(page, pages),
          data: { page },
          dragHandle: '.node-drag-handle',
        };
      });
    }
    // No saved state — compute default grid layout
    return pages.map((page) => ({
      id: page.id,
      type: 'pageNode',
      position: computeDefaultPosition(page, pages),
      data: { page },
      dragHandle: '.node-drag-handle',
    }));
  }, [pages, storedNodes]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(storedEdges);

  // Update node data when pages change in the store (e.g. after re-saving in builder)
  useEffect(() => {
    if (pages.length === 0) return;
    setNodes((prev) => {
      // Keep existing positions but update page data
      const updated = pages.map((page) => {
        const existing = prev.find((n) => n.id === page.id);
        return {
          id: page.id,
          type: 'pageNode' as const,
          position: existing?.position ?? computeDefaultPosition(page, pages),
          data: { page },
          dragHandle: '.node-drag-handle',
        };
      });
      useAppStore.getState().setFlowNodes(updated);
      return updated;
    });
  }, [pages]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => {
      const updated = applyNodeChanges(changes, prev);
      useAppStore.getState().setFlowNodes(updated);
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prev) => {
        const updated = applyEdgeChanges(changes, prev);
        useAppStore.getState().setFlowEdges(updated);
        useAppStore.getState().setNavMap(buildNavMap(updated, pages));
        return updated;
      });
    },
    [pages]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${Date.now()}`,
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
          onSuccess: null,
          onError: null,
        },
      };

      setEdges((prev) => {
        const updated = [...prev, newEdge];
        // sync to store immediately
        useAppStore.getState().setFlowEdges(updated);
        useAppStore.getState().setNavMap(buildNavMap(updated, pages));
        return updated;
      });
    },
    [pages]
  );

  const handleSaveLogic = useCallback(() => {
    const { setFlowNodes, setFlowEdges, setNavMap } = useAppStore.getState();

    setFlowNodes(nodes);
    setFlowEdges(edges);

    const navMap = buildNavMap(edges, pages);
    setNavMap(navMap);

    console.log('=== SAVED LOGIC ===');
    console.log('Flow nodes:', nodes);
    console.log('Flow edges:', edges);
    console.log('Nav map:', navMap);

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
            Go to Template Builder
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
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            minZoom={0.3}
            maxZoom={1.5}
            style={{ background: '#0f172a' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.05)" />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
