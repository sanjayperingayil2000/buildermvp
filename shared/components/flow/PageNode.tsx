'use client';

import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useAppStore, type PageDescriptor, type ActionElement } from '@/shared/store/useAppStore';

interface PageNodeData {
  page: PageDescriptor;
  [key: string]: unknown;
}

export default function PageNode({ data, selected }: NodeProps) {
  const { page } = data as PageNodeData;

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
      {/* Target handle — entry point on the left */}
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

      {/* Header / drag handle */}
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

      {/* Action elements */}
      {page.actionElements.length === 0 ? (
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
        page.actionElements.map((el) => (
          <ActionRow key={el.id} element={el} />
        ))
      )}
    </div>
  );
}

function ActionRow({ element }: { element: ActionElement }) {
  const [showPopup, setShowPopup] = useState(false);

  const actionColor =
    element.actionType === 'navigate'
      ? '#3b82f6'
      : element.actionType === 'api-call'
      ? '#f59e0b'
      : '#94a3b8';

  const displayLabel =
    element.label && element.label !== element.id
      ? element.label
      : 'Button';

  return (
    <div
      style={{
        position: 'relative',
        borderTop: '1px solid #f1f5f9',
      }}
    >
      {/* Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 40px 8px 14px',
          gap: 8,
          cursor: 'pointer',
          background: showPopup ? '#f8fafc' : 'transparent',
        }}
        onClick={() => setShowPopup((v) => !v)}
        title="Click to configure this action"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: actionColor,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: '#334155',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel}
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          {element.actionType === 'none' ? 'tap to configure' : element.actionType}
        </span>
      </div>

      {/* Source handle — on the right edge of this row */}
      <Handle
        type="source"
        position={Position.Right}
        id={element.id}
        style={{
          width: 14,
          height: 14,
          background: '#3b82f6',
          border: '2px solid #ffffff',
          right: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      />

      {/* Configuration popup */}
      {showPopup && (
        <ActionConfigPopup
          element={element}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

function ActionConfigPopup({
  element,
  onClose,
}: {
  element: ActionElement;
  onClose: () => void;
}) {
  const { pages, setPages } = useAppStore();
  const [actionType, setActionType] = useState(element.actionType);
  const [apiEndpoint, setApiEndpoint] = useState(element.apiEndpoint ?? '');

  const handleSave = () => {
    const updatedPages = pages.map((page) => ({
      ...page,
      actionElements: page.actionElements.map((el) =>
        el.id === element.id
          ? {
              ...el,
              actionType,
              apiEndpoint: actionType === 'api-call' ? apiEndpoint : null,
            }
          : el
      ),
    }));
    setPages(updatedPages);
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 8,
        padding: 14,
        width: 240,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 10,
        }}
      >
        Configure action
      </div>

      {/* Action type selector */}
      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
        Action type
      </label>
      <select
        value={actionType}
        onChange={(e) => setActionType(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 12,
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          marginBottom: 10,
          background: '#f8fafc',
        }}
      >
        <option value="none">None</option>
        <option value="navigate">Navigate to page</option>
        <option value="api-call">API call</option>
      </select>

      {/* Navigate info */}
      {actionType === 'navigate' && (
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            background: '#eff6ff',
            borderRadius: 6,
            padding: '6px 8px',
            marginBottom: 10,
          }}
        >
          Draw a connection from this element&apos;s handle to the target page node on the canvas to set navigation.
        </div>
      )}

      {/* API endpoint input */}
      {actionType === 'api-call' && (
        <>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
            API endpoint
          </label>
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://... or {{station.paymentApi}}"
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              marginBottom: 10,
              background: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />
        </>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '5px 12px',
            fontSize: 11,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '5px 12px',
            fontSize: 11,
            borderRadius: 6,
            border: 'none',
            background: '#3b82f6',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
