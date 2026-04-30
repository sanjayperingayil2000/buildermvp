'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/shared/store';
import AppHeader from '@/shared/components/AppHeader';
import { flowToOutputJson } from '@/features/export/utils/flowToOutputJson';
import { downloadOutputJson } from '@/features/export/utils/downloadOutputJson';
import { fetchOutputFlows, fetchOutputFlow, deleteOutputFlow } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const getProjectById = useAppStore((s) => s.getProjectById);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const setActiveProject = useAppStore((s) => s.setActiveProject);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // On mount: fetch S3 flow list and add any projects not yet in local Zustand state
  useEffect(() => {
    let cancelled = false;
    async function syncFromS3() {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const { flows } = await fetchOutputFlows();
        const knownIds = new Set(projects.map((p) => p.id));
        const missingIds = flows.map((f) => f.id).filter((id) => !knownIds.has(id));
        for (const id of missingIds) {
          if (cancelled) break;
          try {
            const project = await fetchOutputFlow(id);
            // addProject will deduplicate based on pages, but we need to inject
            // with the original id. Use the store directly to avoid generating a new id.
            useAppStore.getState().injectProject(project);
          } catch {
            // If one project fails to load, continue with the rest
          }
        }
      } catch {
        if (!cancelled) setSyncError('Could not reach backend. Showing local projects only.');
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }
    syncFromS3();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = useCallback((projectId: string) => {
    setActiveProject(projectId);
    router.push(`/project/${projectId}`);
  }, [setActiveProject, router]);

  const handleDelete = useCallback((projectId: string) => {
    setDeleteConfirmId(projectId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteConfirmId) {
      deleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
      try {
        await deleteOutputFlow(deleteConfirmId);
      } catch {
        // Local delete already succeeded; S3 delete failure is non-fatal
        // The project will be re-synced from S3 on next load if still present there
      }
    }
  }, [deleteConfirmId, deleteProject]);

  const handleDownload = useCallback((projectId: string) => {
    const project = getProjectById(projectId);
    if (project) {
      const output = flowToOutputJson(project.flowNodes, project.flowEdges, project.startingPageId);
      downloadOutputJson(output, project.name);
    }
  }, [getProjectById]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />

      <div
        style={{
          flex: 1,
          background: '#0f0f1a',
          padding: '40px 20px',
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Projects
              {isSyncing && (
                <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 12 }}>
                  syncing…
                </span>
              )}
            </h1>
            <Link
              href="/import"
              style={{
                padding: '10px 20px',
                backgroundColor: '#35d7bb',
                color: '#0f0f1a',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              + Add New Project
            </Link>
          </div>

          {syncError && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 16, padding: '8px 14px', background: 'rgba(127,29,29,0.2)', borderRadius: 8, border: '1px solid #7f1d1d' }}>
              ⚠ {syncError}
            </div>
          )}

          {projects.length === 0 ? (
            <div
              style={{
                background: 'rgba(30, 30, 46, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '60px 40px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 8px 0' }}>
                No projects yet
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0', maxWidth: 320, marginInline: 'auto' }}>
                Create your first project by importing a manifest JSON file
              </p>
              <Link
                href="/import"
                style={{
                  display: 'inline-flex',
                  padding: '12px 24px',
                  backgroundColor: '#35d7bb',
                  color: '#0f0f1a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Add First Project
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    background: 'rgba(30, 30, 46, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: '#64748b' }}>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Pages</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>{project.pages.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Created</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{formatDate(project.createdAt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Updated</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{formatDate(project.updatedAt)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(project.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#35d7bb',
                        color: '#0f0f1a',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownload(project.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        color: '#f87171',
                        border: '1px solid #7f1d1d',
                        borderRadius: 6,
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 12px 0' }}>
              Delete Project?
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px 0' }}>
              This action cannot be undone. All pages, nodes, and configuration will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}