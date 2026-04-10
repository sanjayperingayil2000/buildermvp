'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { validateManifest, parseManifestToFlow } from '@/lib/parseManifestToFlow';
import { normalizeFlutterManifest } from '@/lib/adapters/flutterManifestAdapter';
import { useAppStore } from '@/shared/store/useAppStore';
import type { Manifest } from '@/types/manifest';
import AppHeader from '@/shared/components/AppHeader';

interface FileValidation {
  fileName: string;
  status: 'success' | 'error';
  errorMessage?: string;
  manifest?: Manifest;
  screenCount: number;
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileValidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const readFileAsJSON = (file: File): Promise<FileValidation> => {
    return new Promise((resolve) => {
      if (!file.name.endsWith('.json')) {
        resolve({ fileName: file.name, status: 'error', errorMessage: 'Not a .json file', screenCount: 0 });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let parsed = JSON.parse(text);
          
          const rawJson = parsed as any;
          if (rawJson.targetPlatform === 'flutter' || rawJson.flutterNotes || (rawJson.pages && typeof rawJson.pages[0] === 'object' && ('widgets' in rawJson.pages[0] || 'children' in rawJson.pages[0] || 'child' in rawJson.pages[0]))) {
            parsed = normalizeFlutterManifest(rawJson);
          }
          
          const errors = validateManifest(parsed);
          if (errors.length > 0) {
             resolve({ fileName: file.name, status: 'error', errorMessage: errors.join(', '), screenCount: 0 });
          } else {
             const manifest = parsed as Manifest;
             resolve({ fileName: file.name, status: 'success', manifest, screenCount: Array.isArray(manifest.pages) ? manifest.pages.length : 0 });
          }
        } catch {
          resolve({ fileName: file.name, status: 'error', errorMessage: 'Invalid JSON parsing', screenCount: 0 });
        }
      };
      reader.onerror = () => resolve({ fileName: file.name, status: 'error', errorMessage: 'File read error', screenCount: 0 });
      reader.readAsText(file);
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    const results = await Promise.all(files.map(readFileAsJSON));
    setUploadedFiles((prev) => [...prev, ...results]);
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
      
      // Reset the file input so you can select multiple files successively
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

    // Merge pages from all valid manifests
    const mergedPages = validManifests.flatMap((m) => m.pages);
    const mergedManifest: Manifest = { pages: mergedPages };

    const { nodes, edges, pages } = parseManifestToFlow(mergedManifest);

    // Push to store
    useAppStore.getState().setPages(pages);
    useAppStore.getState().setFlowNodes(nodes);
    useAppStore.getState().setFlowEdges(edges);

    router.push('/flow-editor');
  }, [uploadedFiles, router]);

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
          {/* Title */}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Import Manifest
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#64748b',
              margin: '0 0 28px 0',
              lineHeight: 1.5,
            }}
          >
            Upload a JSON manifest to define your app screens and navigation links.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#35d7bb' : '#334155'}`,
              borderRadius: 12,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging
                ? 'rgba(53, 215, 187, 0.06)'
                : 'rgba(15, 23, 42, 0.5)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* File icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'rgba(53, 215, 187, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#35d7bb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
            </div>

            <p
              style={{
                fontSize: 14,
                color: '#94a3b8',
                margin: '0 0 8px 0',
              }}
            >
              {isDragging
                ? 'Drop your file here...'
                : 'Drag & drop your manifest.json here'}
            </p>
            <span
              style={{
                fontSize: 12,
                color: '#475569',
              }}
            >
              or click to browse — accepts .json files only
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="manifest-file-input"
            />
          </div>

          {/* Validation summary */}
          {uploadedFiles.length > 0 && (
            <div
              style={{
                marginTop: 24,
                padding: '16px 18px',
                borderRadius: 10,
                background: 'rgba(30, 30, 46, 0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f8fafc',
                  }}
                >
                  Uploaded Files ({uploadedFiles.length})
                </span>
                <button
                  onClick={handleReset}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(15, 15, 26, 0.5)',
                      borderLeft: `3px solid ${file.status === 'success' ? '#35d7bb' : '#ef4444'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{file.fileName}</span>
                      {file.status === 'success' ? (
                        <span style={{ fontSize: 12, color: '#35d7bb' }}>{file.screenCount} screen(s)</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ef4444' }}>Error</span>
                      )}
                    </div>
                    {file.status === 'error' && (
                      <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>
                        {file.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
            }}
          >
            {uploadedFiles.length > 0 && (
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
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.01em',
                }}
              >
                {isLoading ? 'Loading...' : `Load ${uploadedFiles.filter(f => f.status === 'success').reduce((acc, f) => acc + f.screenCount, 0)} screens into Flow Editor →`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
