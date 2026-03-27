'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PageDescriptor } from '@/shared/store/useAppStore';

interface PageNodeData {
  page: PageDescriptor;
  [key: string]: unknown;
}

export default function PageNode({ data }: NodeProps) {
  const page = (data as PageNodeData).page;
  const previewSrc = `<!DOCTYPE html><html><head><style>${page.css}</style></head><body>${page.html}</body></html>`;

  return (
    <div
      style={{
        width: 280,
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Target handle — entry point on the left */}
      <Handle
        type="target"
        position={Position.Left}
        id="entry"
        style={{
          width: 12,
          height: 12,
          background: '#10b981',
          border: '2px solid white',
          left: -6,
          top: '50%',
        }}
      />

      {/* Drag handle bar */}
      <div
        className="node-drag-handle"
        style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '8px 12px',
          borderRadius: '10px 10px 0 0',
          cursor: 'grab',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ opacity: 0.5 }}>≡</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.name || 'Untitled'}
        </span>
      </div>

      {/* Page preview iframe */}
      <div style={{ overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
        <iframe
          srcDoc={previewSrc}
          title={`Preview of ${page.name}`}
          style={{
            width: '100%',
            height: 120,
            border: 'none',
            pointerEvents: 'none',
            transform: 'scale(0.9)',
            transformOrigin: 'top left',
          }}
        />
      </div>

      {/* Action element rows */}
      {page.actionElements.map((el) => {
        const label = el.label === el.id ? 'Button' : el.label;

        return (
          <div
            key={el.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderTop: '1px solid #f1f5f9',
              fontSize: 12,
              color: '#334155',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  marginRight: 8,
                  flexShrink: 0,
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {label}
              </span>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              id={el.id}
              style={{
                width: 12,
                height: 12,
                background: '#3b82f6',
                border: '2px solid white',
                right: -6,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
