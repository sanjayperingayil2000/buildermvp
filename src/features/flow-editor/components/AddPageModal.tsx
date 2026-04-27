'use client';

import { useState, useRef, useCallback } from 'react';
import DropZone from '@/features/import/components/DropZone';
import FileStatusCard from '@/features/import/components/FileStatusCard';
import { readAndValidateFile, mergeManifests } from '@/features/import/utils/mergeManifests';
import { parseManifestToFlow } from '@/shared/lib/parseManifestToFlow';
import type { Manifest } from '@/shared/types/manifest';
import type { PageDescriptor } from '@/shared/types/store';
import type { Node } from '@xyflow/react';
import { ITEMS_PER_ROW, NODE_WIDTH, H_GAP, V_GAP } from '@/config/constants';

interface FileValidation {
  fileName: string;
  status: 'success' | 'error';
  errorMessage?: string;
  manifest?: Manifest;
  screenCount: number;
}

interface AddPageModalProps {
  onConfirm: (newPages: PageDescriptor[], newNodes: Node[]) => void;
  onClose: () => void;
  existingPageCount: number;
}

export default function AddPageModal({ onConfirm, onClose, existingPageCount }: AddPageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileValidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    const results = await Promise.all(files.map(readAndValidateFile));
    setUploadedFiles((prev) => [...prev, ...results]);
    setIsLoading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  const handleConfirm = useCallback(() => {
    const validManifests = uploadedFiles
      .filter(f => f.status === 'success' && f.manifest)
      .map(f => f.manifest as Manifest);

    if (validManifests.length === 0) return;

    const mergedManifest = mergeManifests(validManifests);

    // parseManifestToFlow always starts grid positions from index 0.
    // We offset the returned nodes so new pages appear after existing ones
    // rather than overlapping them.
    const { pages: newPages, nodes: rawNodes } = parseManifestToFlow(mergedManifest);

    // ITEMS_PER_ROW, NODE_WIDTH, H_GAP, V_GAP match what parseManifestToFlow uses internally.
    // We shift each new node's position by existingPageCount columns in the grid.
    // The simplest safe offset: push them all below the existing grid rows entirely.
    // Calculate how many rows the existing nodes occupy, then start new nodes one row below.
    const existingRows = Math.ceil(existingPageCount / ITEMS_PER_ROW);
    const yOffset = existingRows * (200 + V_GAP) + 60;

    const offsetNodes: Node[] = rawNodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y + yOffset,
      },
    }));

    onConfirm(newPages, offsetNodes);
  }, [uploadedFiles, existingPageCount, onConfirm]);

  const totalValidScreens = uploadedFiles.filter(f => f.status === 'success').reduce((acc, f) => acc + f.screenCount, 0);
  const hasValidFiles = uploadedFiles.some(f => f.status === 'success');

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'rgba(30, 30, 46, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Close × button top-right of modal */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 20, cursor: 'pointer', lineHeight: 1,
            padding: '4px 8px', borderRadius: 4,
          }}
        >
          ×
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
          Add Pages
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Upload a manifest JSON to add more pages to this project.
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
        />

        {uploadedFiles.length > 0 && (
          <div style={{
            marginTop: 20, padding: '14px 16px',
            borderRadius: 10, background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            maxHeight: 180, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>
                Files ({uploadedFiles.length})
              </span>
              <button
                onClick={() => setUploadedFiles([])}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}
              >
                Clear
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploadedFiles.map((f, i) => (
                <FileStatusCard key={i} fileName={f.fileName} status={f.status} screenCount={f.screenCount} errorMessage={f.errorMessage} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: '0 0 auto', padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#94a3b8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !hasValidFiles}
            style={{
              flex: 1, padding: '10px 20px',
              backgroundColor: isLoading || !hasValidFiles ? '#1e4d44' : '#35d7bb',
              color: '#0f0f1a', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: isLoading || !hasValidFiles ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Parsing...' : `Add ${totalValidScreens} screen${totalValidScreens !== 1 ? 's' : ''} to canvas`}
          </button>
        </div>
      </div>
    </div>
  );
}
