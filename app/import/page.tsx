'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { validateManifest, parseManifestToFlow } from '@/lib/parseManifestToFlow';
import { normalizeFlutterManifest } from '@/lib/adapters/flutterManifestAdapter';
import { useAppStore } from '@/shared/store/useAppStore';
import type { Manifest } from '@/types/manifest';
import AppHeader from '@/shared/components/AppHeader';

interface ValidationResult {
  fileName: string;
  screenCount: number;
  linkCount: number;
  errors: string[];
  manifest: Manifest | null;
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      setValidation({
        fileName: file.name,
        screenCount: 0,
        linkCount: 0,
        errors: ['File must be a .json file.'],
        manifest: null,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
        
        const rawJson = parsed as any;
        // Basic heuristic for Flutter manifest structure: deeply nested objects with widgets or standard root nodes
        // Or if user specifically provided platform hints under targetPlatform or flutterNotes
        if (rawJson.targetPlatform === 'flutter' || rawJson.flutterNotes || (rawJson.pages && typeof rawJson.pages[0] === 'object' && ('widgets' in rawJson.pages[0] || 'children' in rawJson.pages[0] || 'child' in rawJson.pages[0]))) {
          parsed = normalizeFlutterManifest(rawJson);
        }
      } catch {
        setValidation({
          fileName: file.name,
          screenCount: 0,
          linkCount: 0,
          errors: ['Invalid JSON: could not parse file contents.'],
          manifest: null,
        });
        return;
      }

      const errors = validateManifest(parsed);
      const manifest = parsed as Manifest;

      setValidation({
        fileName: file.name,
        screenCount: Array.isArray(manifest.pages) ? manifest.pages.length : 0,
        linkCount: 0,
        errors,
        manifest: errors.length === 0 ? manifest : null,
      });
    };

    reader.onerror = () => {
      setValidation({
        fileName: file.name,
        screenCount: 0,
        linkCount: 0,
        errors: ['Failed to read the file.'],
        manifest: null,
      });
    };

    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleLoadIntoEditor = useCallback(() => {
    if (!validation?.manifest) return;
    setIsLoading(true);

    const { nodes, edges, pages } = parseManifestToFlow(validation.manifest);

    // Push to store
    useAppStore.getState().setPages(pages);
    useAppStore.getState().setFlowNodes(nodes);
    useAppStore.getState().setFlowEdges(edges);

    router.push('/flow-editor');
  }, [validation, router]);

  const handleReset = useCallback(() => {
    setValidation(null);
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
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="manifest-file-input"
            />
          </div>

          {/* Validation summary */}
          {validation && (
            <div
              style={{
                marginTop: 24,
                padding: '16px 18px',
                borderRadius: 10,
                background:
                  validation.errors.length > 0
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(53, 215, 187, 0.08)',
                border: `1px solid ${
                  validation.errors.length > 0
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(53, 215, 187, 0.2)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f8fafc',
                  }}
                >
                  {validation.fileName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
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
                  Clear
                </button>
              </div>

              {validation.errors.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 20,
                    fontSize: 13,
                    color: '#94a3b8',
                  }}
                >
                  <span>
                    <strong style={{ color: '#35d7bb' }}>
                      {validation.screenCount}
                    </strong>{' '}
                    screen{validation.screenCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.7 }}>
                  {validation.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
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
            {validation?.manifest && (
              <button
                id="load-into-editor-btn"
                onClick={handleLoadIntoEditor}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: isLoading ? '#1e4d44' : '#35d7bb',
                  color: '#0f0f1a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.01em',
                }}
              >
                {isLoading ? 'Loading...' : 'Load into Flow Editor →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
