'use client';
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAppStore } from '@/shared/store';
import type { ActionElement } from '@/shared/types/store';

interface ActionRowProps {
  element: ActionElement;
  currentEdgeCount: number;
  pageId: string;
  pageInputElements: ActionElement[];
}

export default function ActionRow({ element, currentEdgeCount, pageId, pageInputElements }: ActionRowProps) {
  const [showPopup, setShowPopup] = useState(false);
  const pages = useAppStore((s) => s.pages);
  const setPendingEdgeUpdate = useAppStore((s) => s.setPendingEdgeUpdate);

  const actionColor =
    element.actionType === 'navigate' ? '#3b82f6' :
    element.actionType === 'api-call' ? '#f59e0b' : '#94a3b8';

  const maxConnections =
    element.actionType === 'api-call' ? 3 :
    element.actionType === 'navigate' ? 1 : 1;

  const isSaturated = currentEdgeCount >= maxConnections;
  const handleColor = isSaturated ? '#6b7280' :
    element.actionType === 'api-call' ? '#f59e0b' : '#10b981';
  const handleBorderColor = isSaturated ? '#9ca3af' : '#ffffff';

  const displayLabel = element.label && element.label !== element.id ? element.label :
    element.elementType === 'input' ? 'Input Field' :
    element.elementType === 'link' ? 'Link' : 'Button';

  return (
    <div style={{ position: 'relative', borderTop: '1px solid #f1f5f9' }}>
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
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: actionColor, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 12, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <span style={{ fontSize: 10, color: isSaturated ? '#6b7280' : '#94a3b8', flexShrink: 0 }}>
          {element.actionType === 'api-call' ? `api-call (${currentEdgeCount}/3)` :
           element.actionType === 'navigate' ? (currentEdgeCount > 0 ? 'connected' : 'navigate') : 'tap to configure'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Hide this element?')) {
              useAppStore.getState().hideActionElement(pageId, element.id);
            }
          }}
          title="Hide element"
          style={{
            flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {element.elementType !== 'input' && (
        element.actionType === 'secure_entry_routing' ? (
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
                  style={{ width: 10, height: 10, background: '#ec4899', border: '1.5px solid #ffffff', right: -5, top: topOffset, zIndex: 10 }}
                />
              );
            })}
          </div>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            id={element.id}
            title={isSaturated ? (element.actionType === 'api-call' ? 'Maximum 3 connections reached' : 'Already connected — delete the existing edge to reconnect') :
              element.actionType === 'api-call' ? `API call — drag to add outcome route (${currentEdgeCount}/3)` : 'Navigate — drag to connect to a target page'}
            style={{ width: 14, height: 14, background: handleColor, border: `2px solid ${handleBorderColor}`, right: -7, top: '50%', transform: 'translateY(-50%)', zIndex: 10, opacity: isSaturated ? 0.5 : 1, cursor: isSaturated ? 'not-allowed' : 'crosshair' }}
          />
        )
      )}

      {showPopup && (
        <ActionConfigPopup
          element={element}
          pageId={pageId}
          pages={pages}
          pageInputElements={pageInputElements}
          setPendingEdgeUpdate={setPendingEdgeUpdate as unknown as (edges: unknown[] | null) => void}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

function ActionConfigPopup({
  element,
  pageId,
  pages,
  pageInputElements,
  setPendingEdgeUpdate,
  onClose,
}: {
  element: ActionElement;
  pageId: string;
  pages: { id: string; name: string }[];
  pageInputElements: ActionElement[];
  setPendingEdgeUpdate: (edges: unknown[] | null) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(element.label);
  const [actionType, setActionType] = useState<string>(element.actionType);
  const [apiEndpoint, setApiEndpoint] = useState<string>(element.apiEndpoint ?? '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(element.method ?? 'POST');
  const [outcomes, setOutcomes] = useState<Array<{ outcomeKey: string; targetPageId: string }>>(element.outcomes ?? []);
  const [fallbackPageId, setFallbackPageId] = useState<string>(element.fallbackPageId || '');
  const [minLength, setMinLength] = useState<number | ''>(element.validations?.minLength ?? '');
  const [maxLength, setMaxLength] = useState<number | ''>(element.validations?.maxLength ?? '');
  const [dataType, setDataType] = useState<'any' | 'numbers' | 'letters' | 'alphanumeric'>(element.validations?.dataType ?? 'any');
  const [fieldMatchConditions, setFieldMatchConditions] = useState<Array<{ field1Id: string; field2Id: string; errorMessage: string }>>(
    (element.fieldMatchConditions ?? []).map((c) => ({
      field1Id: c.field1Id,
      field2Id: c.field2Id,
      errorMessage: c.errorMessage,
    }))
  );
  const [customConditions, setCustomConditions] = useState<Array<{ ruleDescription: string; errorMessage: string }>>(
    element.customConditions ?? []
  );

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

  const addOutcome = () => { if (outcomes.length < 3) setOutcomes((prev) => [...prev, { outcomeKey: '', targetPageId: '' }]); };
  const removeOutcome = (index: number) => setOutcomes((prev) => prev.filter((_, i) => i !== index));
  const updateOutcome = (index: number, field: 'outcomeKey' | 'targetPageId', value: string) => {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };

  const handleSave = () => {
    if (element.elementType === 'input') {
      const validations: ActionElement['validations'] = {};
      if (minLength !== '') validations.minLength = Number(minLength);
      if (maxLength !== '') validations.maxLength = Number(maxLength);
      if (dataType !== 'any') validations.dataType = dataType;

      useAppStore.getState().updateActionElement(pageId, element.id, {
        label,
        actionType: 'none',
        validations: Object.keys(validations).length > 0 ? validations : undefined,
        fieldMatchConditions: undefined,
      });
      onClose();
      return;
    }

    const enrichedConditions = fieldMatchConditions
      .filter((c) => c.field1Id && c.field2Id && c.field1Id !== c.field2Id)
      .map((c) => {
        const f1 = pageInputElements.find((el) => el.id === c.field1Id);
        const f2 = pageInputElements.find((el) => el.id === c.field2Id);
        return {
          field1Id: c.field1Id,
          field1Label: f1?.label ?? c.field1Id,
          field1Uuid: f1?.uuid,
          field2Id: c.field2Id,
          field2Label: f2?.label ?? c.field2Id,
          field2Uuid: f2?.uuid,
          errorMessage: c.errorMessage,
        };
      });

    const isAdvanced = actionType === 'api-call' || actionType === 'secure_entry_routing';
    
    const validCustomConditions = customConditions.filter(
      (c) => c.ruleDescription.trim() !== ''
    );

    const updates: Partial<ActionElement> = {
      label,
      actionType: actionType as ActionElement['actionType'],
      apiEndpoint: isAdvanced ? apiEndpoint || null : null,
      method: isAdvanced ? method : 'POST',
      outcomes: isAdvanced ? outcomes : [],
      fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined,
      navigateTo: null,
      validations: undefined,
      fieldMatchConditions: enrichedConditions,
      customConditions: validCustomConditions.length > 0 ? validCustomConditions : undefined,
    };

    useAppStore.getState().updateActionElement(pageId, element.id, updates);

    if (actionType === 'api-call' || actionType === 'secure_entry_routing') {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const edgesWithoutThisHandle = currentFlowEdges.filter(
        (e) => e.source !== pageId || (
          actionType === 'secure_entry_routing' ? !e.sourceHandle?.startsWith(element.id) : e.sourceHandle !== element.id
        )
      );
      const validOutcomes = outcomes.filter((o) => o.outcomeKey && o.targetPageId);
      const isRouteColored = actionType === 'secure_entry_routing';
      const routeColor = '#ec4899';
      const newEdges = validOutcomes.map((outcome) => ({
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
        data: { actionType, apiEndpoint: apiEndpoint || null, method, outcomes: validOutcomes, fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined },
      }));
      setPendingEdgeUpdate([...edgesWithoutThisHandle, ...newEdges]);
    } else {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const updatedEdges = currentFlowEdges.filter((e) => !(e.source === pageId && e.sourceHandle === element.id));
      setPendingEdgeUpdate(updatedEdges);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4, marginTop: 10 };

  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 16, width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', fontFamily: 'system-ui, sans-serif', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
        Configure: {element.label !== element.id ? element.label : element.elementType === 'input' ? 'Input Field' : 'Button'}
      </div>

      <label style={labelStyle}>Element Label</label>
      <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Submit Button" style={inputStyle} />

      {element.elementType === 'input' ? (
        <>
          <label style={labelStyle}>Min Length</label>
          <input type="number" value={minLength} onChange={(e) => setMinLength(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 10" style={inputStyle} />

          <label style={labelStyle}>Max Length</label>
          <input type="number" value={maxLength} onChange={(e) => setMaxLength(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 16" style={inputStyle} />

          <label style={labelStyle}>Data Type</label>
          <select value={dataType} onChange={(e) => setDataType(e.target.value as typeof dataType)} style={inputStyle}>
            <option value="any">Any</option>
            <option value="numbers">Numbers only</option>
            <option value="letters">Letters only</option>
            <option value="alphanumeric">Alphanumeric</option>
          </select>
        </>
      ) : (
        <>
          <label style={labelStyle}>Action type</label>
          <select value={actionType} onChange={handleActionTypeChange} style={inputStyle}>
            <option value="none">None</option>
            <option value="navigate">Navigate to page</option>
            <option value="api-call">API call</option>
            <option value="secure_entry_routing">Secure Entry Routing</option>
          </select>

          {(actionType === 'api-call' || actionType === 'secure_entry_routing') && (
            <>
              {actionType === 'api-call' && (
                <>
                  <label style={labelStyle}>HTTP method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')} style={inputStyle}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <label style={labelStyle}>API endpoint URL</label>
                  <input type="text" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="/api/mock-payment" style={inputStyle} />
                </>
              )}

              <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Outcome routes ({outcomes.length}/3)</span>
                  {outcomes.length < 3 && actionType === 'api-call' && (
                    <button onClick={addOutcome} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}>+ Add</button>
                  )}
                </div>
                {outcomes.map((outcome, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Outcome {i + 1}</span>
                      {actionType === 'api-call' && <button onClick={() => removeOutcome(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, padding: 0 }}>Remove</button>}
                    </div>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Outcome Key =</label>
                    <input type="text" value={outcome.outcomeKey} onChange={(e) => updateOutcome(i, 'outcomeKey', e.target.value)} placeholder='e.g. "success"' style={inputStyle} disabled={actionType === 'secure_entry_routing'} />
                    <label style={labelStyle}>Navigate to page</label>
                    <select value={outcome.targetPageId} onChange={(e) => updateOutcome(i, 'targetPageId', e.target.value)} style={inputStyle}>
                      <option value="">— select page —</option>
                      {pages.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                ))}

                {actionType === 'secure_entry_routing' && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, padding: 10, marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#be123c', marginBottom: 6 }}>Unrecognized Card Fallback Page</div>
                    <div style={{ fontSize: 10, color: '#9f1239', marginBottom: 8 }}>If a 16-digit card number is entered but not recognized, route here.</div>
                    <select value={fallbackPageId} onChange={(e) => setFallbackPageId(e.target.value)} style={inputStyle}>
                      <option value="">— select a fallback page —</option>
                      {pages.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                Field Match Conditions ({fieldMatchConditions.length})
              </span>
              <button
                onClick={() =>
                  setFieldMatchConditions((prev) => [
                    ...prev,
                    { field1Id: '', field2Id: '', errorMessage: '' },
                  ])
                }
                style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}
              >
                + Add
              </button>
            </div>

            {pageInputElements.length < 2 && (
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 8px' }}>
                Need at least 2 input fields on this page to add a match condition.
              </p>
            )}

            {fieldMatchConditions.map((cond, i) => (
              <div
                key={i}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Condition {i + 1}</span>
                  <button
                    onClick={() => setFieldMatchConditions((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, padding: 0 }}
                  >
                    Remove
                  </button>
                </div>

                <label style={labelStyle}>Field 1</label>
                <select
                  value={cond.field1Id}
                  onChange={(e) =>
                    setFieldMatchConditions((prev) =>
                      prev.map((c, idx) => idx === i ? { ...c, field1Id: e.target.value } : c)
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">— select input field —</option>
                  {pageInputElements.map((el) => (
                    <option key={el.id} value={el.id}>{el.label || el.id}</option>
                  ))}
                </select>

                <label style={labelStyle}>must equal Field 2</label>
                <select
                  value={cond.field2Id}
                  onChange={(e) =>
                    setFieldMatchConditions((prev) =>
                      prev.map((c, idx) => idx === i ? { ...c, field2Id: e.target.value } : c)
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">— select input field —</option>
                  {pageInputElements.map((el) => (
                    <option key={el.id} value={el.id}>{el.label || el.id}</option>
                  ))}
                </select>

                <label style={labelStyle}>Error message if they don't match</label>
                <input
                  type="text"
                  value={cond.errorMessage}
                  onChange={(e) =>
                    setFieldMatchConditions((prev) =>
                      prev.map((c, idx) => idx === i ? { ...c, errorMessage: e.target.value } : c)
                    )
                  }
                  placeholder="e.g. Los números no coinciden"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                Custom Conditions ({customConditions.length})
              </span>
              <button
                onClick={() => setCustomConditions((prev) => [...prev, { ruleDescription: '', errorMessage: '' }])}
                style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}
              >
                + Add
              </button>
            </div>
            
            {customConditions.length === 0 && (
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 8px' }}>
                Add custom developer rules (e.g., &quot;User is logged in&quot;, &quot;Cart total &gt; 0&quot;).
              </p>
            )}

            {customConditions.map((cond, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Custom Rule {i + 1}</span>
                  <button
                    onClick={() => setCustomConditions((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, padding: 0 }}
                  >
                    Remove
                  </button>
                </div>
                
                <label style={labelStyle}>Condition Description</label>
                <input
                  type="text"
                  value={cond.ruleDescription}
                  onChange={(e) => setCustomConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, ruleDescription: e.target.value } : c))}
                  placeholder="e.g. User account status must be active"
                  style={inputStyle}
                />
                
                <label style={labelStyle}>Error message if rule fails</label>
                <input
                  type="text"
                  value={cond.errorMessage}
                  onChange={(e) => setCustomConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, errorMessage: e.target.value } : c))}
                  placeholder="e.g. Account is inactive."
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={onClose} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#334155' }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: 'none', background: '#3b82f6', color: '#ffffff', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}