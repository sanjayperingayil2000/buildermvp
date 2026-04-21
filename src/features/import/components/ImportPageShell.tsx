'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/shared/components/AppHeader';
import DropZone from './DropZone';
import FileStatusCard from './FileStatusCard';
import { readAndValidateFile, mergeManifests } from '../utils/mergeManifests';
import { parseManifestToFlow } from '@/shared/lib/parseManifestToFlow';
import { useAppStore } from '@/shared/store';
import type { RawManifestPage, BuildConfig } from '@/shared/store';
import type { Manifest } from '@/shared/types/manifest';

interface FileValidation {
  fileName: string;
  status: 'success' | 'error';
  errorMessage?: string;
  manifest?: Manifest;
  screenCount: number;
}

export default function ImportPageShell() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileValidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rawPages, setRawPages] = useState<RawManifestPage[]>([]);
  const [detectedBuildConfig, setDetectedBuildConfig] = useState<BuildConfig | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    const results = await Promise.all(files.map(readAndValidateFile));
    setUploadedFiles((prev) => [...prev, ...results]);

    // Extract raw manifest pages and detect build configs via structural checks
    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Detect build config: has theme_light + theme_dark + typography at top level
        if (parsed.theme_light && parsed.theme_dark && parsed.typography) {
          setDetectedBuildConfig(parsed as BuildConfig);
          continue;
        }

        // Structural check: pages with 'widgets' arrays → raw manifest pages
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          const firstPage = parsed.pages[0] as Record<string, unknown>;
          if ('widgets' in firstPage) {
            const pages = parsed.pages as RawManifestPage[];
            setRawPages((prev) => [...prev, ...pages.filter((p) => p.widgets && p.widgets.length > 0)]);
          }
        }
      } catch {
        // Ignore parse errors — readAndValidateFile already handles these
      }
    }

    setIsLoading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) processFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFiles]
  );

  const handleLoadIntoEditor = useCallback(() => {
    const validManifests = uploadedFiles
      .filter((file) => file.status === 'success' && file.manifest)
      .map((file) => file.manifest as Manifest);

    if (validManifests.length === 0) return;
    setIsLoading(true);

    const mergedManifest = mergeManifests(validManifests);
    const { nodes, edges, pages } = parseManifestToFlow(mergedManifest);

    useAppStore.getState().setPages(pages);
    useAppStore.getState().setFlowNodes(nodes);
    useAppStore.getState().setFlowEdges(edges);

    // Persist raw manifest pages (full widget + props data) for Next.js export
    if (rawPages.length > 0) {
      useAppStore.getState().setRawManifestPages(rawPages);
    }

    // Persist build config if one was detected
    if (detectedBuildConfig) {
      useAppStore.getState().setBuildConfig(detectedBuildConfig);
    }

    router.push('/flow-editor');
  }, [uploadedFiles, router, rawPages, detectedBuildConfig]);

  const handleReset = useCallback(() => {
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            background: 'rgba(30, 30, 46, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '40px 36px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Import Manifest
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Upload a JSON manifest to define your app screens and navigation links.
          </p>

          <DropZone
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="manifest-file-input"
          />

          {uploadedFiles.length > 0 && (
            <div style={{ marginTop: 24, padding: '16px 18px', borderRadius: 10, background: 'rgba(30, 30, 46, 0.4)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>Uploaded Files ({uploadedFiles.length})</span>
                <button onClick={handleReset} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>Clear All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {uploadedFiles.map((file, i) => (
                  <FileStatusCard key={i} fileName={file.fileName} status={file.status} screenCount={file.screenCount} errorMessage={file.errorMessage} />
                ))}
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                id="load-into-editor-btn"
                onClick={handleLoadIntoEditor}
                disabled={isLoading || !uploadedFiles.some(f => f.status === 'success')}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: isLoading || !uploadedFiles.some(f => f.status === 'success') ? '#1e4d44' : '#35d7bb',
                  color: '#0f0f1a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isLoading || !uploadedFiles.some(f => f.status === 'success') ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Loading...' : `Load ${uploadedFiles.filter(f => f.status === 'success').reduce((acc, f) => acc + f.screenCount, 0)} screens into Flow Editor →`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}