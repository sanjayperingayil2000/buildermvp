'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/shared/components/AppHeader';
import { useAppStore } from '@/shared/store';
import { parseManifestToFlow } from '@/shared/lib/parseManifestToFlow';
import { fetchServices, fetchDesignFiles, saveOutputFlow } from '@/lib/api';
import type { Manifest } from '@/shared/types/manifest';

type LoadState = 'idle' | 'loading-services' | 'services-loaded' | 'loading-files' | 'files-loaded' | 'creating' | 'error';

export default function ImportPageShell() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [fetchedManifest, setFetchedManifest] = useState<Manifest | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch service list on mount
  useEffect(() => {
    setLoadState('loading-services');
    fetchServices()
      .then((res) => {
        setServices(res.services);
        setLoadState('services-loaded');
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Could not reach the backend. Is Docker running?');
        setLoadState('error');
      });
  }, []);

  const handleSelectService = useCallback(async (serviceName: string) => {
    setSelectedService(serviceName);
    setLoadState('loading-files');
    setErrorMessage('');
    try {
      const res = await fetchDesignFiles(serviceName);
      // Backend returns { serviceName, pageCount, pages: ManifestPage[], rawFiles }
      // pages is already in the internal manifest format
      const manifest: Manifest = { pages: res.pages as Manifest['pages'] };
      setFetchedManifest(manifest);
      setPageCount(res.pageCount);
      setProjectName(serviceName.charAt(0).toUpperCase() + serviceName.slice(1));
      setLoadState('files-loaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load service files.';
      setErrorMessage(msg);
      setLoadState('error');
    }
  }, []);

  const handleCreateProject = useCallback(async () => {
    if (!fetchedManifest || !projectName.trim()) return;
    setLoadState('creating');
    try {
      const { nodes, edges, pages } = parseManifestToFlow(fetchedManifest);
      const projectId = addProject({
        name: projectName.trim(),
        pages,
        flowNodes: nodes,
        flowEdges: edges,
        startingPageId: null,
        config: { initialRoute: null, baseUrl: 'https://api.example.com' },
      });
      // Persist immediately to S3
      const fullProject = useAppStore.getState().getProjectById(projectId);
      if (fullProject) {
        await saveOutputFlow(projectId, fullProject);
      }
      router.push(`/project/${projectId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project.';
      setErrorMessage(msg);
      setLoadState('files-loaded'); // allow retry
    }
  }, [fetchedManifest, projectName, addProject, router]);

  const handleBack = useCallback(() => {
    setSelectedService(null);
    setFetchedManifest(null);
    setPageCount(0);
    setProjectName('');
    setErrorMessage('');
    setLoadState('services-loaded');
  }, []);

  /* ── Styles ── */
  const cardBase: React.CSSProperties = {
    background: 'rgba(30, 30, 46, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '20px 24px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />
      <div style={{ flex: 1, background: '#0f0f1a', overflowY: 'auto', padding: '40px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            Add New Project
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
            Select a service to import its screens into the flow editor.
          </p>

          {/* Error banner */}
          {loadState === 'error' && (
            <div style={{ ...cardBase, border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.3)', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#fca5a5' }}>⚠ {errorMessage}</div>
            </div>
          )}

          {/* Loading services */}
          {loadState === 'loading-services' && (
            <div style={{ ...cardBase, textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 14, color: '#64748b' }}>Loading services…</div>
            </div>
          )}

          {/* Service list */}
          {(loadState === 'services-loaded' || loadState === 'loading-files') && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Available Services
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {services.map((service) => (
                  <div
                   key={service}
                    style={{
                      ...cardBase,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: selectedService === service
                       ? '1px solid #35d7bb'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>
                        {service}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Design files from S3
                      </div>
                    </div>
                    <button
                     onClick={() => handleSelectService(service)}
                      disabled={loadState === 'loading-files'}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: selectedService === service ? '#35d7bb' : 'transparent',
                        color: selectedService === service ? '#0f0f1a' : '#35d7bb',
                        border: '1px solid #35d7bb',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: loadState === 'loading-files' ? 'not-allowed' : 'pointer',
                        opacity: loadState === 'loading-files' && selectedService !== service ? 0.4 : 1,
                      }}
                    >
                      {loadState === 'loading-files' && selectedService === service ? 'Loading…' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files loaded — confirmation & project name */}
          {(loadState === 'files-loaded' || loadState === 'creating') && selectedService && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <button
               onClick={handleBack}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, width: 'fit-content' }}
              >
                ← Back to services
             </button>

              <div style={cardBase}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#f8fafc', fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedService}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>·</span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{pageCount} screen{pageCount !== 1 ? 's' : ''} found</span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
                    Project name
                 </label>
                  <input
                   type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Didi"
                    style={inputStyle}
                  />
                </div>

                <button
                 onClick={handleCreateProject}
                  disabled={loadState === 'creating' || !projectName.trim()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: loadState === 'creating' || !projectName.trim() ? '#1e4d44' : '#35d7bb',
                    color: '#0f0f1a',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: loadState === 'creating' || !projectName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadState === 'creating' ? 'Creating…' : `Create Project (${pageCount} screens)`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}