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

  // Initialise local state from the element's current values
  const [actionType, setActionType] = useState<string>(element.actionType);
  const [apiEndpoint, setApiEndpoint] = useState<string>(element.apiEndpoint ?? '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(
    (element as ActionElement & { method?: string }).method as 'POST' ?? 'POST'
  );
  const [outcomes, setOutcomes] = useState<Array<{ outcomeKey: string; targetPageId: string }>>(
    (element as ActionElement & { outcomes?: Array<{ outcomeKey: string; targetPageId: string }> })
      .outcomes ?? []
  );

  const addOutcome = () => {
    if (outcomes.length >= 3) return;
    setOutcomes((prev) => [...prev, { outcomeKey: '', targetPageId: '' }]);
  };

  const removeOutcome = (index: number) => {
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOutcome = (
    index: number,
    field: 'outcomeKey' | 'targetPageId',
    value: string
  ) => {
    setOutcomes((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  };

  const handleSave = () => {
    const updatedPages = pages.map((page) => ({
      ...page,
      actionElements: page.actionElements.map((el) =>
        el.id === element.id
          ? {
              ...el,
              actionType,
              apiEndpoint: actionType === 'api-call' ? apiEndpoint || null : null,
              method: actionType === 'api-call' ? method : 'POST',
              outcomes: actionType === 'api-call' ? outcomes.filter((o) => o.outcomeKey && o.targetPageId) : [],
              navigateTo: actionType === 'navigate' ? el.navigateTo : null,
            }
          : el
      ),
    }));
    setPages(updatedPages);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: 11,
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    boxSizing: 'border-box',
    color: '#1e293b',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#64748b',
    display: 'block',
    marginBottom: 4,
    marginTop: 10,
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
        borderRadius: 10,
        padding: 16,
        width: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
        Configure: {element.label !== element.id ? element.label : 'Button'}
      </div>

      {/* Action type */}
      <label style={labelStyle}>Action type</label>
      <select value={actionType} onChange={(e) => setActionType(e.target.value)} style={inputStyle}>
        <option value="none">None</option>
        <option value="navigate">Navigate to page</option>
        <option value="api-call">API call</option>
      </select>

      {/* Navigate hint */}
      {actionType === 'navigate' && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          color: '#64748b',
          background: '#eff6ff',
          borderRadius: 6,
          padding: '8px 10px',
          lineHeight: 1.5,
        }}>
          Draw a connection from this button&apos;s handle (●) to the target page node on the canvas.
        </div>
      )}

      {/* API call fields */}
      {actionType === 'api-call' && (
        <>
          {/* Method + Endpoint */}
          <label style={labelStyle}>HTTP method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
            style={inputStyle}
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <label style={labelStyle}>API endpoint URL</label>
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="/api/mock-payment or {{station.paymentApi}}"
            style={inputStyle}
          />

          {/* Outcomes */}
          <div style={{
            marginTop: 12,
            borderTop: '1px solid #f1f5f9',
            paddingTop: 10,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                Outcome routes ({outcomes.length}/3)
              </span>
              {outcomes.length < 3 && (
                <button
                  onClick={addOutcome}
                  style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid #3b82f6',
                    background: 'transparent',
                    color: '#3b82f6',
                    cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
              )}
            </div>

            <div style={{
              fontSize: 10,
              color: '#94a3b8',
              marginBottom: 8,
              lineHeight: 1.5,
            }}>
              The API must return JSON with an <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>outcome</code> field.
              Each rule below maps one outcome value to a page.
            </div>

            {outcomes.length === 0 && (
              <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                No outcomes yet. Click &quot;+ Add&quot; to define what happens after the API responds.
              </div>
            )}

            {outcomes.map((outcome, i) => (
              <div
                key={i}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>
                    Outcome {i + 1}
                  </span>
                  <button
                    onClick={() => removeOutcome(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: 11,
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>

                <label style={{ ...labelStyle, marginTop: 0 }}>When API returns outcome =</label>
                <input
                  type="text"
                  value={outcome.outcomeKey}
                  onChange={(e) => updateOutcome(i, 'outcomeKey', e.target.value)}
                  placeholder='e.g. "success" or "insufficient_funds"'
                  style={inputStyle}
                />

                <label style={labelStyle}>Navigate to page</label>
                <select
                  value={outcome.targetPageId}
                  onChange={(e) => updateOutcome(i, 'targetPageId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— select page —</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button
          onClick={onClose}
          style={{
            padding: '5px 14px',
            fontSize: 11,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            cursor: 'pointer',
            color: '#334155',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '5px 14px',
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
