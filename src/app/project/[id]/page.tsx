'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import type { PageDescriptor } from '@/shared/types/store';
import AddPageModal from '@/features/flow-editor/components/AddPageModal';
import { computeNodes } from '@/features/flow-editor/utils/computeNodes';
import { createConnectionEdge, isValidConnection } from '@/features/flow-editor/utils/edgeHelpers';
import { flowToOutputJson } from '@/features/export/utils/flowToOutputJson';
import { downloadOutputJson } from '@/features/export/utils/downloadOutputJson';
import { saveOutputFlow, fetchOutputFlow, publishOutputFlow } from '@/lib/api';
import { GRID_CONSTANTS } from '@/config/constants';

export default function ProjectCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const activeProject = useAppStore((s) => s.getActiveProject());
  const updateProjectName = useAppStore((s) => s.updateProjectName);
  const setFlowNodes = useAppStore((s) => s.setFlowNodes);
  const setFlowEdges = useAppStore((s) => s.setFlowEdges);
  const addPagesToProject = useAppStore((s) => s.addPagesToProject);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function initProject() {
      let project = useAppStore.getState().getProjectById(projectId);
      if (!project) {
        // Not in local store — try fetching from S3
        try {
          const fetched = await fetchOutputFlow(projectId);
          useAppStore.getState().injectProject(fetched);
          project = fetched;
        } catch {
          // Not in S3 either — redirect home
          router.push('/');
          return;
        }
      }
      setActiveProject(projectId);
      setEditName(project.name);
    }
    initProject();
  }, [projectId, setActiveProject, router]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartEdit = useCallback(() => {
    if (activeProject) {
      setEditName(activeProject.name);
      setIsEditingName(true);
    }
  }, [activeProject]);

  const handleSaveName = useCallback(() => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== activeProject?.name) {
      updateProjectName(projectId, trimmedName);
    }
    setIsEditingName(false);
  }, [editName, projectId, activeProject, updateProjectName]);

  const handleCancelEdit = useCallback(() => {
    setEditName(activeProject?.name || '');
    setIsEditingName(false);
  }, [activeProject]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveName, handleCancelEdit]);

  const pages = activeProject?.pages ?? [];
  const storedNodes = activeProject?.flowNodes ?? [];
  const storedEdges = activeProject?.flowEdges ?? [];
  const startingPageId = activeProject?.startingPageId ?? null;

  const hasInitialised = useRef(false);

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
    if (!hasInitialised.current) return;
    setEdges(storedEdges.map((e) => ({ ...e, type: e.type ?? 'deletable' })));
  }, [storedEdges]);

  const nodeTypes = useMemo(() => ({ pageNode: PageNode }), []);
  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

  const [nodes, setNodes] = useState<Node[]>(() => {
    return computeNodes(pages, storedNodes);
  });

  const [edges, setEdges] = useState<Edge[]>(() => {
    return storedEdges.map((e) => ({ ...e, type: e.type ?? 'deletable' }));
  });

  const [connectionRejection, setConnectionRejection] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');

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

  const handleSaveLogic = useCallback(async () => {
    setSaveStatus('saving');
    setFlowNodes(nodes);
    setFlowEdges(edges);
    // Read the updated project from store state after Zustand has processed the updates
    // Small tick to allow Zustand to commit the new nodes/edges before we read back
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const updatedProject = useAppStore.getState().getProjectById(projectId);
    if (updatedProject) {
      try {
        await saveOutputFlow(projectId, updatedProject);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('saved');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, [nodes, edges, projectId, setFlowNodes, setFlowEdges]);

  const handleDownloadJson = useCallback(() => {
    if (activeProject) {
      const output = flowToOutputJson(nodes, edges, startingPageId);
      downloadOutputJson(output, activeProject.name);
    }
  }, [activeProject, nodes, edges, startingPageId]);

  const handlePublish = useCallback(async () => {
    if (!activeProject) return;
    setPublishStatus('publishing');
    try {
      // Derive the service name from the project name (uppercase to match S3 folder convention)
      const serviceName = activeProject.name.toUpperCase();
      const outputJson = flowToOutputJson(nodes, edges, startingPageId);
      await publishOutputFlow(projectId, serviceName, outputJson as unknown as Record<string, unknown>);
      setPublishStatus('published');
    } catch {
      setPublishStatus('error');
    }
    setTimeout(() => setPublishStatus('idle'), 3000);
  }, [activeProject, nodes, edges, startingPageId, projectId]);

  const handleAddPages = useCallback((newPages: PageDescriptor[], newNodes: Node[]) => {
    addPagesToProject(newPages, newNodes);
    setShowAddPageModal(false);
  }, [addPagesToProject]);

  if (!activeProject) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            ← Back
          </Link>
          <span style={{ color: '#334155' }}>|</span>
          {isEditingName ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              style={{
                background: 'transparent',
                border: '1px solid #35d7bb',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 14,
                fontWeight: 600,
                color: '#f8fafc',
                outline: 'none',
                width: 200,
              }}
            />
          ) : (
            <div
              onClick={handleStartEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                {activeProject.name}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          )}
        </div>
      </AppHeader>

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
            No screens in this project. Import a manifest to get started.
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
          {/* Top-left: Add Page button */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 5,
            }}
          >
            <button
              onClick={() => setShowAddPageModal(true)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#1e293b',
                color: '#35d7bb',
                border: '1px solid #35d7bb',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              + Add Page
            </button>
          </div>
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
                disabled={saveStatus === 'saving'}
                style={{
                  padding: '8px 20px',
                  backgroundColor:
                    saveStatus === 'saved' ? '#10b981' :
                    saveStatus === 'error' ? '#dc2626' :
                    saveStatus === 'saving' ? '#1e4d44' : '#35d7bb',
                  color: '#1e1e2e',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {saveStatus === 'saving' ? '…Saving' :
                  saveStatus === 'saved' ? '✓ Saved' :
                  saveStatus === 'error' ? '✕ Save failed' : 'Save Logic'}
              </button>
              <span style={{ fontSize: 11, color: saveStatus === 'saved' ? '#10b981' : saveStatus === 'error' ? '#f87171' : '#64748b', display: 'block', marginTop: 6, textAlign: 'right', transition: 'color 0.2s ease' }}>
                {saveStatus === 'saved' ? 'Saved to cloud' :
                  saveStatus === 'error' ? 'Could not reach backend' :
                  'Click an edge to select it, then press Delete'}
              </span>
            </div>
            <div>
              <button
                id="publish-s3-btn"
                onClick={handlePublish}
                disabled={publishStatus === 'publishing'}
                style={{
                  padding: '8px 20px',
                  backgroundColor:
                    publishStatus === 'published' ? '#10b981' :
                    publishStatus === 'error' ? '#dc2626' :
                    publishStatus === 'publishing' ? '#4a2d7a' : '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {publishStatus === 'publishing' ? '…Publishing' :
                  publishStatus === 'published' ? '✓ Published' :
                  publishStatus === 'error' ? '✕ Publish failed' : '🚀 Publish to S3'}
              </button>
              <span style={{ fontSize: 11, color: publishStatus === 'published' ? '#10b981' : publishStatus === 'error' ? '#f87171' : '#64748b', display: 'block', marginTop: 6, textAlign: 'right', transition: 'color 0.2s ease' }}>
                {publishStatus === 'published' ? 'Published to output-flows' :
                  publishStatus === 'error' ? 'Publish failed' :
                  'Publish output to S3'}
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
                  <span>Conditional navigate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', border: '2px solid #fff', display: 'inline-block' }} />
                  <span>API call</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}

      {showAddPageModal && (
        <AddPageModal
          onConfirm={handleAddPages}
          onClose={() => setShowAddPageModal(false)}
          existingPageCount={pages.length}
        />
      )}
    </div>
  );
}