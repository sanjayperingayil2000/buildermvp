'use client';

import React, { useState } from 'react';
import { Handle, Position, type NodeProps, MarkerType, type Edge } from '@xyflow/react';
import { useAppStore, type PageDescriptor, type ActionElement, type InputFieldDescriptor, type InputCondition, type InputConditionType } from '@/shared/store/useAppStore';

interface PageNodeData {
  page: PageDescriptor;
  [key: string]: unknown;
}

export default function PageNode({ data, selected }: NodeProps) {
  const { page } = data as PageNodeData;
  const flowEdges = useAppStore((s) => s.flowEdges);
  const inputFieldsByPage = useAppStore((s) => s.inputFieldsByPage);
  const inputConditions = useAppStore((s) => s.inputConditions);

  const inputFields = inputFieldsByPage[page.id] ?? [];
  const pageConditions = inputConditions.find((c) => c.pageId === page.id);

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

      {/* Action elements and input fields */}
      {page.actionElements.length === 0 && inputFields.length === 0 ? (
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
        <>
          {page.actionElements.map((el) => {
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
          })}

          {/* Input fields section */}
          {inputFields.length > 0 && (
            <>
              <div style={{
                borderTop: '1px dashed #e2e8f0',
                padding: '6px 14px 4px',
                fontSize: 10,
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                background: '#fafafa',
              }}>
                Input fields
              </div>
              {inputFields.map((field) => {
                const fieldConditions = pageConditions?.conditions.filter(
                  (c) => c.fieldId === field.id
                ) ?? [];
                return (
                  <InputFieldRow
                    key={field.id}
                    field={field}
                    conditions={fieldConditions}
                    pageId={page.id}
                  />
                );
              })}
            </>
          )}
        </>
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
  const { pages, setPages, setPendingEdgeUpdate } = useAppStore();

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
    const updatedPages = pages.map((page) => ({
      ...page,
      actionElements: page.actionElements.map((el) => {
        const isAdvanced = actionType === 'api-call' || actionType === 'secure_entry_routing';
        return el.id === element.id
          ? {
              ...el,
              actionType,
              apiEndpoint: isAdvanced ? apiEndpoint || null : null,
              method: isAdvanced ? method : 'POST',
              outcomes: isAdvanced ? outcomes : [],
              fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined,
              navigateTo: null,
            }
          : el;
      }),
    }));
    setPages(updatedPages);

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
        Configure: {element.label !== element.id ? element.label : 'Button'}
      </div>

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

function InputFieldRow({
  field,
  conditions,
  pageId,
}: {
  field: InputFieldDescriptor;
  conditions: InputCondition[];
  pageId: string;
}) {
  const [showPopup, setShowPopup] = useState(false);

  const conditionCount = conditions.filter((c) => c.enabled).length;

  const roleColor =
    field.role === 'primary' ? '#8b5cf6'
    : field.role === 'confirm' ? '#06b6d4'
    : '#64748b';

  return (
    <div style={{ position: 'relative', borderTop: '1px solid #f1f5f9' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '7px 14px',
          gap: 8,
          cursor: 'pointer',
          background: showPopup ? '#faf5ff' : 'transparent',
        }}
        onClick={() => setShowPopup((v) => !v)}
        title="Click to configure conditions for this input"
      >
        {/* Role indicator */}
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: roleColor,
          flexShrink: 0,
          display: 'inline-block',
        }} />

        {/* Field label */}
        <span style={{
          fontSize: 12,
          color: '#334155',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {field.label}
        </span>

        {/* Condition count badge */}
        {conditionCount > 0 ? (
          <span style={{
            fontSize: 10,
            background: '#ede9fe',
            color: '#7c3aed',
            padding: '1px 7px',
            borderRadius: 10,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {conditionCount} rule{conditionCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: '#cbd5e1', flexShrink: 0 }}>
            no rules
          </span>
        )}

        {/* Settings icon */}
        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>⚙</span>
      </div>

      {showPopup && (
        <InputConditionPopup
          field={field}
          pageId={pageId}
          existingConditions={conditions}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

/** Sensible default conditions based on the field's semantic role */
function getDefaultConditions(
  field: InputFieldDescriptor,
  pageId: string
): InputCondition[] {
  const base = { fieldId: field.id, pageId, enabled: true };

  if (field.role === 'primary') {
    return [
      {
        ...base,
        id: `cond-default-${field.id}-1`,
        conditionType: 'exact_length' as InputConditionType,
        value: '12,16',
        errorMessage: 'Number must be 12 digits (phone) or 16 digits (card)',
      },
      {
        ...base,
        id: `cond-default-${field.id}-2`,
        conditionType: 'allowed_chars' as InputConditionType,
        value: '[0-9]',
        errorMessage: 'Only digits are allowed',
      },
      {
        ...base,
        id: `cond-default-${field.id}-3`,
        conditionType: 'mask_after_n_chars' as InputConditionType,
        value: 6,
        errorMessage: '',
      },
      {
        ...base,
        id: `cond-default-${field.id}-4`,
        conditionType: 'require_bin_match' as InputConditionType,
        value: null,
        errorMessage: 'Card provider not recognised',
      },
    ];
  }

  if (field.role === 'confirm') {
    return [
      {
        ...base,
        id: `cond-default-${field.id}-1`,
        conditionType: 'require_confirmation' as InputConditionType,
        value: null,
        errorMessage: 'Numbers do not match',
      },
    ];
  }

  return [];
}

function InputConditionPopup({
  field,
  pageId,
  existingConditions,
  onClose,
}: {
  field: InputFieldDescriptor;
  pageId: string;
  existingConditions: InputCondition[];
  onClose: () => void;
}) {
  const { upsertPageInputConfig, inputConditions } = useAppStore();

  // Local state — copy of conditions for this field
  const [conditions, setConditions] = useState<InputCondition[]>(
    existingConditions.length > 0
      ? existingConditions
      : getDefaultConditions(field, pageId)
  );

  const addCondition = () => {
    const newCondition: InputCondition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fieldId: field.id,
      pageId,
      conditionType: 'min_length',
      value: 12,
      errorMessage: 'Input is too short',
      enabled: true,
    };
    setConditions((prev) => [...prev, newCondition]);
  };

  const updateCondition = (id: string, patch: Partial<InputCondition>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    // Merge updated conditions for this field with all other conditions on this page
    const allPageConditions = inputConditions.find((c) => c.pageId === pageId);
    const otherFieldConditions = (allPageConditions?.conditions ?? []).filter(
      (c) => c.fieldId !== field.id
    );
    upsertPageInputConfig({
      pageId,
      conditions: [...otherFieldConditions, ...conditions],
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    fontSize: 11,
    borderRadius: 5,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#1e293b',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: '#64748b',
    display: 'block',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 2000,
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
        padding: 16,
        width: 320,
        boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
        fontFamily: 'system-ui, sans-serif',
        maxHeight: 480,
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
          Conditions — {field.label}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {field.role === 'primary' && 'Primary input field'}
          {field.role === 'confirm' && 'Confirmation field'}
          {field.role === 'generic' && 'Input field'}
          {field.widgetId && ` · ${field.widgetId}`}
        </div>
      </div>

      {/* Condition list */}
      {conditions.length === 0 && (
        <div style={{
          padding: '10px',
          background: '#f8fafc',
          borderRadius: 6,
          fontSize: 11,
          color: '#94a3b8',
          textAlign: 'center' as const,
          marginBottom: 10,
        }}>
          No conditions set. Click &quot;+ Add condition&quot; to add rules.
        </div>
      )}

      {conditions.map((cond, index) => (
        <ConditionEditor
          key={cond.id}
          condition={cond}
          index={index}
          pageId={pageId}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          onChange={(patch) => updateCondition(cond.id, patch)}
          onRemove={() => removeCondition(cond.id)}
        />
      ))}

      {/* Add button */}
      <button
        onClick={addCondition}
        style={{
          width: '100%',
          padding: '7px',
          background: 'transparent',
          border: '1px dashed #8b5cf6',
          color: '#7c3aed',
          borderRadius: 6,
          fontSize: 11,
          cursor: 'pointer',
          marginTop: 8,
          fontWeight: 600,
        }}
      >
        + Add condition
      </button>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button
          onClick={onClose}
          style={{
            padding: '5px 14px', fontSize: 11, borderRadius: 6,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            cursor: 'pointer', color: '#334155',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '5px 14px', fontSize: 11, borderRadius: 6,
            border: 'none', background: '#7c3aed',
            color: '#fff', cursor: 'pointer',
          }}
        >
          Save rules
        </button>
      </div>
    </div>
  );
}

const CONDITION_TYPE_OPTIONS: { value: InputConditionType; label: string; hasValue: boolean; valueLabel: string; valuePlaceholder: string }[] = [
  { value: 'min_length',          label: 'Minimum length',             hasValue: true,  valueLabel: 'Min digits',            valuePlaceholder: 'e.g. 12' },
  { value: 'max_length',          label: 'Maximum length',             hasValue: true,  valueLabel: 'Max digits',            valuePlaceholder: 'e.g. 16' },
  { value: 'exact_length',        label: 'Exact length(s)',            hasValue: true,  valueLabel: 'Digits (12 or 12,16)',  valuePlaceholder: 'e.g. 12,16' },
  { value: 'allowed_chars',       label: 'Allowed characters',         hasValue: true,  valueLabel: 'Regex pattern',         valuePlaceholder: '[0-9]' },
  { value: 'input_type',          label: 'Input type',                 hasValue: true,  valueLabel: 'Type',                  valuePlaceholder: 'phone | card | any' },
  { value: 'require_bin_match',   label: 'Require BIN match',          hasValue: false, valueLabel: '',                      valuePlaceholder: '' },
  { value: 'require_confirmation',label: 'Require confirmation match', hasValue: false, valueLabel: '',                      valuePlaceholder: '' },
  { value: 'mask_after_n_chars',  label: 'Mask after N chars',         hasValue: true,  valueLabel: 'Show N chars',          valuePlaceholder: 'e.g. 6' },
];

function ConditionEditor({
  condition,
  index,
  pageId,
  inputStyle,
  labelStyle,
  onChange,
  onRemove,
}: {
  condition: InputCondition;
  index: number;
  pageId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onChange: (patch: Partial<InputCondition>) => void;
  onRemove: () => void;
}) {
  const meta = CONDITION_TYPE_OPTIONS.find((o) => o.value === condition.conditionType);

  return (
    <div style={{
      background: condition.enabled ? '#faf5ff' : '#f8fafc',
      border: `1px solid ${condition.enabled ? '#ddd6fe' : '#e2e8f0'}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
    }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: condition.enabled ? '#7c3aed' : '#94a3b8',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        }}>
          Rule {index + 1}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Enable toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 10, color: '#64748b' }}>
            <input
              type="checkbox"
              checked={condition.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            Active
          </label>
          {/* Remove */}
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ef4444', fontSize: 14, padding: '0 2px', lineHeight: 1,
            }}
            title="Remove this rule"
          >
            ×
          </button>
        </div>
      </div>

      {/* Condition type selector */}
      <label style={labelStyle}>Condition type</label>
      <select
        value={condition.conditionType}
        onChange={(e) => onChange({ conditionType: e.target.value as InputConditionType })}
        style={{ ...inputStyle, marginBottom: 8 }}
      >
        {CONDITION_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Value input — only shown when the condition type has a value */}
      {meta?.hasValue && (
        <>
          <label style={labelStyle}>{meta.valueLabel}</label>
          {condition.conditionType === 'input_type' ? (
            <select
              value={String(condition.value ?? 'any')}
              onChange={(e) => onChange({ value: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            >
              <option value="any">Any (phone or card)</option>
              <option value="phone">Phone only (12 digits)</option>
              <option value="card">Card only (16 digits)</option>
            </select>
          ) : (
            <input
              type={['min_length', 'max_length', 'mask_after_n_chars'].includes(condition.conditionType) ? 'number' : 'text'}
              value={String(condition.value ?? '')}
              onChange={(e) => onChange({
                value: ['min_length', 'max_length', 'mask_after_n_chars'].includes(condition.conditionType)
                  ? Number(e.target.value)
                  : e.target.value
              })}
              placeholder={meta.valuePlaceholder}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
          )}
        </>
      )}

      {/* Error message */}
      <label style={labelStyle}>Error message shown to user</label>
      <input
        type="text"
        value={condition.errorMessage}
        onChange={(e) => onChange({ errorMessage: e.target.value })}
        placeholder="e.g. Please enter a valid card number"
        style={inputStyle}
      />
    </div>
  );
}

