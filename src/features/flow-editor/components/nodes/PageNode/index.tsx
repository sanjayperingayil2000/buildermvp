'use client';
import React, { useState } from 'react';
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
  const flowEdges = useAppStore((s) => s.flowEdges);
  const activeElements = page.actionElements.filter((el: ActionElement) => !el.isHidden);
  const hiddenElements = page.actionElements.filter((el: ActionElement) => el.isHidden);
  const inputElements = page.actionElements.filter((el: ActionElement) => el.elementType === 'input');

  return (
    <div
      style={{
        width: 260,
        background: '#ffffff',
        border: selected ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: selected
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
          background: '#1e293b',
          color: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '8px 8px 0 0',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#64748b',
            display: 'inline-block',
          }}
        />
        {page.name}
      </div>
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
              pageInputElements={inputElements}
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