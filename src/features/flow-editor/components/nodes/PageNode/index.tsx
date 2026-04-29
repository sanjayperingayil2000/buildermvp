'use client';
import { useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useAppStore } from '@/shared/store';
import type { PageDescriptor, ActionElement } from '@/shared/types/store';
import ActionRow from './ActionRow';

interface PageNodeData {
  page: PageDescriptor;
  [key: string]: unknown;
}

export default function PageNode({ data, selected }: NodeProps) {
  const { page } = data as PageNodeData;
  const activeProject = useAppStore((s) => s.getActiveProject());
  const setStartingPage = useAppStore((s) => s.setStartingPage);
  const setPages = useAppStore((s) => s.setPages);
const pages = activeProject?.pages ?? [];

  const handleRemovePage = useCallback(() => {
    const confirmed = window.confirm(`Remove page "${page.name}" from the canvas? All connections to and from this page will also be removed.`);
    if (!confirmed) return;
    setPages(pages.filter(p => p.id !== page.id));
  }, [page, pages, setPages]);
  const flowEdges = activeProject?.flowEdges ?? [];
  const startingPageId = activeProject?.startingPageId ?? null;
  const isStartingPage = startingPageId === page.id;
  const activeElements = page.actionElements.filter((el: ActionElement) => !el.isHidden && el.elementType !== 'input');
  const hiddenElements = page.actionElements.filter((el: ActionElement) => el.isHidden);

  return (
    <div
      style={{
        width: 260,
        background: '#ffffff',
        border: isStartingPage
          ? '2px solid #f59e0b'
          : selected
            ? '2px solid #3b82f6'
            : '1.5px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: isStartingPage
          ? '0 0 0 3px rgba(245,158,11,0.2)'
          : selected
            ? '0 0 0 3px rgba(59,130,246,0.15)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="entry"
        style={{
          width: 14,
          height: 14,
          background: '#10b981',
          border: '2px solid #ffffff',
          left: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      />
      <div
        className="node-drag-handle"
        style={{
          background: isStartingPage ? '#78350f' : '#1e293b',
          color: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '8px 8px 0 0',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isStartingPage ? '#f59e0b' : '#64748b',
              display: 'inline-block',
            }}
          />
          {page.name}
          {isStartingPage && (
            <span style={{ fontSize: 14, lineHeight: 1 }} title="Starting Page">⭐</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent drag or node selection
            handleRemovePage();
          }}
          title="Remove this page from canvas"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: '2px 6px',
            borderRadius: 4,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
        >
          ×
        </button>
      </div>
      {/* Starting Page checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          cursor: 'pointer',
          userSelect: 'none',
          background: isStartingPage ? '#fffbeb' : '#f8fafc',
          borderBottom: '1px solid #f1f5f9',
          transition: 'background 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isStartingPage}
          onChange={() => setStartingPage(isStartingPage ? null : page.id)}
          style={{
            width: 14,
            height: 14,
            accentColor: '#f59e0b',
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: isStartingPage ? 600 : 400,
            color: isStartingPage ? '#92400e' : '#64748b',
          }}
        >
          Starting Page
        </span>
      </label>
      {activeElements.length === 0 ? (
        <div
          style={{
            padding: '10px 14px',
            fontSize: 12,
            color: '#94a3b8',
            fontStyle: 'italic',
          }}
        >
          No interactive elements
        </div>
      ) : (
        activeElements.map((el: ActionElement) => {
          const edgeCount = flowEdges.filter(
            (e) => e.source === page.id && e.sourceHandle === el.id
          ).length;
          return (
            <ActionRow
              key={el.id}
              element={el}
              currentEdgeCount={edgeCount}
              pageId={page.id}
            />
          );
        })
      )}
      {hiddenElements.length > 0 && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                useAppStore.getState().restoreActionElement(page.id, e.target.value);
              }
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 11,
              color: '#64748b',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="" disabled>— Restore an element —</option>
            {hiddenElements.map((el: ActionElement) => (
              <option key={el.id} value={el.id}>
                {el.label !== el.id ? el.label : 'Unnamed Element'}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}