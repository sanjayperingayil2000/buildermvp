'use client';
import React, { useState } from 'react';
import { Handle, Position, type NodeProps, MarkerType, type Edge } from '@xyflow/react';
import { useAppStore, type PageDescriptor, type ActionElement } from '@/shared/store/useAppStore';
interface PageNodeData {
  page: PageDescriptor;
  [key: string]: unknown;
}
export default function PageNode({ data, selected }: NodeProps) {
  const { page } = data as PageNodeData;
  const flowEdges = useAppStore((s) => s.flowEdges);
  const activeElements = page.actionElements.filter((el) => !el.isHidden);
  const hiddenElements = page.actionElements.filter((el) => el.isHidden);
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
        activeElements.map((el) => {
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
      {/* Restore Element Dropdown */}
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
            <option value="" disabled>
              — Restore an element —
            </option>
            {hiddenElements.map((el) => (
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
function ActionRow({
  element,
  currentEdgeCount,
  pageId,
}: {
  element: ActionElement;
  currentEdgeCount: number;
  pageId: string;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const actionColor =
    element.actionType === 'navigate'
      ? '#3b82f6'
      : element.actionType === 'api-call'
      ? '#f59e0b'
      : '#94a3b8';
  const maxConnections =
    element.actionType === 'api-call' ? 3
    : element.actionType === 'navigate' ? 1
    : 1;
  const isSaturated = currentEdgeCount >= maxConnections;
  // Colour scheme:
  // navigate or none → green (#10b981) when available, grey (#6b7280) when saturated
  // api-call → amber (#f59e0b) when available, grey (#6b7280) when saturated
  const handleColor =
    isSaturated
      ? '#6b7280'
      : element.actionType === 'api-call'
      ? '#f59e0b'
      : '#10b981';
  const handleBorderColor = isSaturated ? '#9ca3af' : '#ffffff';
  const displayLabel =
    element.label && element.label !== element.id
      ? element.label
      : element.elementType === 'input'
      ? 'Input Field'
      : element.elementType === 'link'
      ? 'Link'
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
            color: isSaturated ? '#6b7280' : '#94a3b8',
            flexShrink: 0,
          }}
        >
          {element.actionType === 'api-call'
            ? `api-call (${currentEdgeCount}/3)`
            : element.actionType === 'navigate'
            ? currentEdgeCount > 0 ? 'connected' : 'navigate'
            : 'tap to configure'}
        </span>
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Hide this element?')) {
              useAppStore.getState().hideActionElement(pageId, element.id);
            }
          }}
          title="Hide element"
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ×
        </button>
      </div>
      {/* Source handle(s) — on the right edge of this row */}
      {element.actionType === 'secure_entry_routing' ? (
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 20 }}>
          {(element.outcomes || []).map((outcome, idx) => {
            if (!outcome.outcomeKey) return null;
            const topOffset = 20 + idx * 16; 
            return (
              <Handle
                key={outcome.outcomeKey}
                type="source"
                position={Position.Right}
                id={`${element.id}__${outcome.outcomeKey}`}
                title={`Secure Route: ${outcome.outcomeKey}`}
                style={{
                  width: 10,
                  height: 10,
                  background: '#ec4899',
                  border: '1.5px solid #ffffff',
                  right: -5,
                  top: topOffset,
                  zIndex: 10,
                }}
              />
            );
          })}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id={element.id}
          title={
            isSaturated
              ? element.actionType === 'api-call'
                ? 'Maximum 3 connections reached'
                : 'Already connected — delete the existing edge to reconnect'
              : element.actionType === 'api-call'
              ? `API call — drag to add outcome route (${currentEdgeCount}/3)`
              : 'Navigate — drag to connect to a target page'
          }
          style={{
            width: 14,
            height: 14,
            background: handleColor,
            border: `2px solid ${handleBorderColor}`,
            right: -7,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            opacity: isSaturated ? 0.5 : 1,
            cursor: isSaturated ? 'not-allowed' : 'crosshair',
            transition: 'background 0.2s, opacity 0.2s',
          }}
        />
      )}
      {/* Configuration popup */}
      {showPopup && (
        <ActionConfigPopup
          element={element}
          pageId={pageId}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
function ActionConfigPopup({
  element,
  pageId,
  onClose,
}: {
  element: ActionElement;
  pageId: string;
  onClose: () => void;
}) {
  const { pages, setPendingEdgeUpdate } = useAppStore();
  // Editable label
  const [label, setLabel] = useState(element.label);
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
  const [fallbackPageId, setFallbackPageId] = useState<string>(element.fallbackPageId || '');
  // Validation states specifically for input fields
  const [maxLength, setMaxLength] = useState<number | ''>(element.validations?.maxLength ?? '');
  const [numberOnly, setNumberOnly] = useState<boolean>(element.validations?.numberOnly ?? false);
  const [errorMessage, setErrorMessage] = useState<string>(element.validations?.errorMessage ?? '');
  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setActionType(newVal);
    if (newVal === 'secure_entry_routing') {
      setOutcomes([
        { outcomeKey: 'phone_12', targetPageId: '' },
        { outcomeKey: 'card_16', targetPageId: '' },
      ]);
      setFallbackPageId('');
    }
  };
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
    const isAdvanced = actionType === 'api-call' || actionType === 'secure_entry_routing';
    const resolvedActionType = element.elementType === 'input' ? 'navigate' : actionType;
    const updates: Partial<ActionElement> = {
      label,
      actionType: resolvedActionType,
      apiEndpoint: isAdvanced ? apiEndpoint || null : null,
      method: isAdvanced ? method : 'POST',
      outcomes: isAdvanced ? outcomes : [],
      fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined,
      navigateTo: null,
    };
    // Attach validations only for input elements, strip for non-inputs
    if (element.elementType === 'input') {
      const validations: ActionElement['validations'] = {};
      if (maxLength !== '') validations.maxLength = Number(maxLength);
      if (numberOnly) validations.numberOnly = true;
      if (errorMessage) validations.errorMessage = errorMessage;
      updates.validations = Object.keys(validations).length > 0 ? validations : undefined;
    } else {
      updates.validations = undefined;
    }
    useAppStore.getState().updateActionElement(pageId, element.id, updates);
    if (actionType === 'api-call' || actionType === 'secure_entry_routing') {
      // Read the current flowEdges directly without a reactive subscription
      const currentFlowEdges = useAppStore.getState().flowEdges;
      // Ensure we clean up any edges from this source handle
      const edgesWithoutThisHandle = currentFlowEdges.filter(
        (e) => e.source !== pageId || (
          actionType === 'secure_entry_routing'
            ? !e.sourceHandle?.startsWith(element.id) 
            : e.sourceHandle !== element.id
        )
      );
      const validOutcomes = outcomes.filter((o) => o.outcomeKey && o.targetPageId);
      const isRouteColored = actionType === 'secure_entry_routing';
      const routeColor = '#ec4899';
      
      const newEdges: Edge[] = validOutcomes.map((outcome) => ({
        id: `edge-${pageId}-${element.id}-${outcome.outcomeKey}-${outcome.targetPageId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'deletable',
        source: pageId,
        sourceHandle: actionType === 'secure_entry_routing' ? `${element.id}__${outcome.outcomeKey}` : element.id,
        target: outcome.targetPageId,
        targetHandle: 'entry',
        animated: true,
        style: { stroke: isRouteColored ? routeColor : '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: isRouteColored ? routeColor : '#f59e0b' },
        label: outcome.outcomeKey,
        labelStyle: { fontSize: 11, fill: isRouteColored ? routeColor : '#f59e0b', fontWeight: 600 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
        data: {
          actionType: actionType,
          apiEndpoint: apiEndpoint || null,
          method,
          outcomes: validOutcomes,
          fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined,
        },
      }));
      // Signal FlowPage to update its local edges state
      setPendingEdgeUpdate([...edgesWithoutThisHandle, ...newEdges]);
    } else {
      // navigate or none — remove all edges from this handle
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const updatedEdges = currentFlowEdges.filter(
        (e) => !(e.source === pageId && e.sourceHandle === element.id)
      );
      // Signal FlowPage to update its local edges state
      setPendingEdgeUpdate(updatedEdges);
    }
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
        maxHeight: '80vh',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
        Configure: {element.label !== element.id ? element.label : element.elementType === 'input' ? 'Input Field' : 'Button'}
      </div>
      {/* Editable label */}
      <label style={labelStyle}>Element Label</label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Submit Button"
        style={inputStyle}
      />
      {element.elementType === 'input' ? (
        <>
          <label style={labelStyle}>Max Length</label>
          <input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 10"
            style={inputStyle}
          />
          
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={numberOnly}
              onChange={(e) => setNumberOnly(e.target.checked)}
            />
            Number Only
          </label>
          <label style={labelStyle}>Error Message</label>
          <input
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g. Invalid input"
            style={inputStyle}
          />
          
          <div style={{
            marginTop: 10,
            fontSize: 11,
            color: '#64748b',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 6,
            padding: '8px 10px',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#1e40af', display: 'block', marginBottom: 4 }}>
              Input Routing
            </strong>
            Drag from the green handle (●) to navigate when validation passes/fails.
          </div>
        </>
      ) : (
        <>
          {/* Action type */}
          <label style={labelStyle}>Action type</label>
          <select value={actionType} onChange={handleActionTypeChange} style={inputStyle}>
            <option value="none">None</option>
            <option value="navigate">Navigate to page</option>
            <option value="api-call">API call</option>
            <option value="secure_entry_routing">Secure Entry Routing</option>
          </select>
          {/* Navigate hint */}
          {actionType === 'navigate' && (
            <div style={{
              marginTop: 10,
              fontSize: 11,
              color: '#64748b',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '8px 10px',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: '#1e40af', display: 'block', marginBottom: 4 }}>
                How to set navigation:
              </strong>
              Close this panel, then drag from the green handle (●) on the right side of this button
              to the target page node. Only one connection is allowed for navigate actions.
            </div>
          )}
          {/* API call fields and Secure Routing */}
          {(actionType === 'api-call' || actionType === 'secure_entry_routing') && (
            <>
              {/* Method + Endpoint - only shown for api-call */}
              {actionType === 'api-call' && (
                <>
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
                </>
              )}
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
                    Outcome routes {actionType === 'api-call' ? `(${outcomes.length}/3)` : `(${outcomes.length})`}
                  </span>
                  {outcomes.length < 3 && actionType === 'api-call' && (
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
                      {actionType === 'api-call' && (
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
                      )}
                    </div>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Outcome Key =</label>
                    <input
                      type="text"
                      value={outcome.outcomeKey}
                      onChange={(e) => updateOutcome(i, 'outcomeKey', e.target.value)}
                      placeholder='e.g. "success" or "insufficient_funds"'
                      style={inputStyle}
                      disabled={actionType === 'secure_entry_routing'}
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
                
                {/* Fallback Page input exclusively for Secure Entry Routing */}
                {actionType === 'secure_entry_routing' && (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 6,
                      padding: '10px',
                      marginTop: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#be123c', marginBottom: 6 }}>
                      Unrecognized Card Fallback Page
                    </div>
                    <div style={{ fontSize: 10, color: '#9f1239', marginBottom: 8, lineHeight: 1.4 }}>
                      If a 16-digit card number is entered but the Mexican BIN is not recognized in the system, the user will be routed here.
                    </div>
                    <select
                      value={fallbackPageId}
                      onChange={(e) => setFallbackPageId(e.target.value)}
                      style={{...inputStyle, borderColor: '#fecdd3'}}
                    >
                      <option value="">— select a fallback page —</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}
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
