'use client';
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAppStore } from '@/shared/store';
import type { ActionElement } from '@/shared/types/store';
import { API_ENDPOINT_CATALOG } from '@/config/apiEndpoints';
import { parseEndpointSchema, type ResponseField } from '@/features/flow-editor/utils/parseEndpointSchema';
import ExpressionBuilder from './ExpressionBuilder';
import type { JsonCondition, ExpressionClause } from '@/shared/types/store';

interface ActionRowProps {
  element: ActionElement;
  currentEdgeCount: number;
  pageId: string;
}

export default function ActionRow({ element, currentEdgeCount, pageId }: ActionRowProps) {
  const [showPopup, setShowPopup] = useState(false);
  const pages = useAppStore((s) => s.pages);
  const setPendingEdgeUpdate = useAppStore((s) => s.setPendingEdgeUpdate);

  const actionColor =
    element.actionType === 'navigate' ? '#3b82f6' :
    element.actionType === 'api-call' ? '#f59e0b' : '#94a3b8';

  const maxConnections =
    element.actionType === 'api-call' ? 10 :
    element.actionType === 'navigate' ? 1 : 1;

  const isSaturated = currentEdgeCount >= maxConnections;
  const handleColor = isSaturated ? '#6b7280' :
    element.actionType === 'api-call' ? '#f59e0b' : '#10b981';
  const handleBorderColor = isSaturated ? '#9ca3af' : '#ffffff';

  const displayLabel = element.label && element.label !== element.id ? element.label :
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
          {element.actionType === 'api-call' ? `api-call (${currentEdgeCount} route${currentEdgeCount !== 1 ? 's' : ''})` :
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

      {element.elementType !== 'link' && (
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
            title={isSaturated ? (element.actionType === 'api-call' ? 'Maximum connections reached' : 'Already connected — delete the existing edge to reconnect') :
              element.actionType === 'api-call' ? `API call — drag to add outcome route (${currentEdgeCount} route${currentEdgeCount !== 1 ? 's' : ''})` : 'Navigate — drag to connect to a target page'}
            style={{ width: 14, height: 14, background: handleColor, border: `2px solid ${handleBorderColor}`, right: -7, top: '50%', transform: 'translateY(-50%)', zIndex: 10, opacity: isSaturated ? 0.5 : 1, cursor: isSaturated ? 'not-allowed' : 'crosshair' }}
          />
        )
      )}

      {showPopup && (
        <ActionConfigPopup
          element={element}
          pageId={pageId}
          pages={pages}
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
  setPendingEdgeUpdate,
  onClose,
}: {
  element: ActionElement;
  pageId: string;
  pages: { id: string; name: string }[];
  setPendingEdgeUpdate: (edges: unknown[] | null) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(element.label);
  const [actionType, setActionType] = useState<string>(element.actionType);
  const [apiEndpoint, setApiEndpoint] = useState<string>(element.apiEndpoint ?? '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(element.method ?? 'POST');
  const [outcomes, setOutcomes] = useState<Array<{ outcomeKey: string; targetPageId: string }>>(element.outcomes ?? []);
  const [fallbackPageId, setFallbackPageId] = useState<string>(element.fallbackPageId || '');
  
  const allPages = useAppStore((s) => s.pages);

  const initialEndpoint = element.apiEndpoint
    ? API_ENDPOINT_CATALOG.find(e => e.id === element.apiEndpoint) ?? null
    : null;

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(element.apiEndpoint ?? '');
  const [endpointFields, setEndpointFields] = useState<ResponseField[]>(
    initialEndpoint ? parseEndpointSchema(initialEndpoint) : []
  );

  const handleEndpointChange = (endpointId: string) => {
    setSelectedEndpointId(endpointId);
    if (!endpointId) {
      setEndpointFields([]);
      return;
    }
    const endpoint = API_ENDPOINT_CATALOG.find(e => e.id === endpointId);
    if (endpoint) {
      setEndpointFields(parseEndpointSchema(endpoint));
      setMethod(endpoint.defaultMethod);
    }
  };

  const [jsonConditions, setJsonConditions] = useState<JsonCondition[]>(
    element.jsonConditions ?? []
  );

  const addJsonCondition = () => {
    const defaultClause: ExpressionClause = {
      leftField: endpointFields[0]?.path ?? '',
      operator: '==',
      rightType: 'value',
      rightField: '',
      rightValue: '',
    };
    const newCondition: JsonCondition = {
      outcomeKey: `condition_${jsonConditions.length + 1}`,
      targetPageId: '',
      errorMessage: '',
      clauseOperator: 'AND',
      clauses: [defaultClause],
    };
    setJsonConditions(prev => [...prev, newCondition]);
  };

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

    const isAdvanced = actionType === 'api-call' || actionType === 'secure_entry_routing';
    
    // Validate: condition needs outcomeKey, targetPageId, and at least one complete clause
    const validJsonConditions = jsonConditions.filter(c =>
      c.outcomeKey.trim() !== '' &&
      c.targetPageId !== '' &&
      c.clauses.length > 0 &&
      c.clauses.every(cl => cl.leftField !== '' && (cl.rightType === 'value' ? cl.rightValue !== '' : cl.rightField !== ''))
    );

    const updates: Partial<ActionElement> = {
      label,
      actionType: actionType as ActionElement['actionType'],
      apiEndpoint: actionType === 'api-call' ? selectedEndpointId : (actionType === 'secure_entry_routing' ? apiEndpoint : null),
      method: (actionType === 'api-call' || actionType === 'secure_entry_routing') ? method : 'POST',
      outcomes: actionType === 'secure_entry_routing' ? outcomes : [],
      fallbackPageId: actionType === 'secure_entry_routing' ? fallbackPageId : undefined,
      navigateTo: null,
      jsonConditions: validJsonConditions.length > 0 ? validJsonConditions : undefined,
    };

    useAppStore.getState().updateActionElement(pageId, element.id, updates);

    if (actionType === 'secure_entry_routing') {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const edgesWithoutThisHandle = currentFlowEdges.filter(
        (e) => e.source !== pageId || !e.sourceHandle?.startsWith(element.id)
      );
      const validOutcomes = outcomes.filter((o) => o.outcomeKey && o.targetPageId);
      const strokeColor = '#ec4899';
      const newEdges = validOutcomes.map((outcome) => ({
        id: `edge-${pageId}-${element.id}-${outcome.outcomeKey}-${outcome.targetPageId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'deletable',
        source: pageId,
        sourceHandle: `${element.id}__${outcome.outcomeKey}`,
        target: outcome.targetPageId,
        targetHandle: 'entry',
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: strokeColor },
        label: outcome.outcomeKey,
        data: { actionType, apiEndpoint: apiEndpoint || null, method, outcomes: validOutcomes, fallbackPageId },
      }));
      setPendingEdgeUpdate([...edgesWithoutThisHandle, ...newEdges]);
    } else if (actionType === 'api-call') {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const edgesWithoutThis = currentFlowEdges.filter(
        e => !(e.source === pageId && e.sourceHandle === element.id)
      );
      const conditionEdges = validJsonConditions.map(cond => ({
        id: `edge-${pageId}-${element.id}-${cond.outcomeKey}-${cond.targetPageId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'deletable',
        source: pageId,
        sourceHandle: element.id,
        target: cond.targetPageId,
        targetHandle: 'entry',
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: '#f59e0b' },
        label: cond.outcomeKey,
        data: { actionType: 'api-call', outcomeKey: cond.outcomeKey, endpointId: selectedEndpointId },
      }));
      setPendingEdgeUpdate([...edgesWithoutThis, ...conditionEdges]);
    } else if (actionType === 'navigate' && validJsonConditions.length > 0) {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const edgesWithoutThisHandle = currentFlowEdges.filter(
        (e) => !(e.source === pageId && e.sourceHandle === element.id)
      );
      const conditionEdges = validJsonConditions.map((cond) => ({
        id: `edge-${pageId}-${element.id}-${cond.outcomeKey}-${cond.targetPageId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'deletable',
        source: pageId,
        sourceHandle: element.id,
        target: cond.targetPageId,
        targetHandle: 'entry',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
        label: cond.outcomeKey,
        data: { actionType: 'navigate', outcomeKey: cond.outcomeKey },
      }));
      setPendingEdgeUpdate([...edgesWithoutThisHandle, ...conditionEdges]);
    } else {
      const currentFlowEdges = useAppStore.getState().flowEdges;
      const updatedEdges = currentFlowEdges.filter(
        (e) => !(e.source === pageId && e.sourceHandle === element.id)
      );
      setPendingEdgeUpdate(updatedEdges);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4, marginTop: 10 };

  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 16, width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', fontFamily: 'system-ui, sans-serif', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
        Configure: {element.label !== element.id ? element.label : element.elementType === 'link' ? 'Link' : 'Button'}
      </div>

      <label style={labelStyle}>Element Label</label>
      <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Submit Button" style={inputStyle} />

      {
        <>
          <label style={labelStyle}>Action type</label>
          <select value={actionType} onChange={handleActionTypeChange} style={inputStyle}>
            <option value="none">None</option>
            <option value="navigate">Navigate to page</option>
            <option value="api-call">API call</option>
            <option value="secure_entry_routing">Secure Entry Routing</option>
          </select>

          {/* JSON Expression Conditions section */}
         {(actionType === 'api-call' || actionType === 'secure_entry_routing') && (
  <>
    {actionType === 'api-call' && (
      <>
        <label style={labelStyle}>Select API endpoint</label>
        <select
          value={selectedEndpointId}
          onChange={(e) => handleEndpointChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">— select endpoint —</option>
          {API_ENDPOINT_CATALOG.map(ep => (
            <option key={ep.id} value={ep.id}>
              {ep.label} ({ep.defaultMethod} {ep.url})
            </option>
          ))}
        </select>

        {selectedEndpointId && (
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
            Method: <strong>{method}</strong> · URL: <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
              {API_ENDPOINT_CATALOG.find(e => e.id === selectedEndpointId)?.url}
            </code>
          </div>
        )}
      </>
    )}

    {actionType === 'secure_entry_routing' && (
      <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Outcome routes ({outcomes.length}/3)</span>
        </div>
        {outcomes.map((outcome, i) => (
          <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Outcome {i + 1}</span>
            </div>
            <label style={{ ...labelStyle, marginTop: 0 }}>Outcome Key =</label>
            <input type="text" value={outcome.outcomeKey} onChange={(e) => updateOutcome(i, 'outcomeKey', e.target.value)} placeholder='e.g. "success"' style={inputStyle} disabled={true} />
            <label style={labelStyle}>Navigate to page</label>
            <select value={outcome.targetPageId} onChange={(e) => updateOutcome(i, 'targetPageId', e.target.value)} style={inputStyle}>
              <option value="">— select page —</option>
              {pages.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
        ))}

        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, padding: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#be123c', marginBottom: 6 }}>Unrecognized Card Fallback Page</div>
          <div style={{ fontSize: 10, color: '#9f1239', marginBottom: 8 }}>If a 16-digit card number is entered but not recognized, route here.</div>
          <select value={fallbackPageId} onChange={(e) => setFallbackPageId(e.target.value)} style={inputStyle}>
            <option value="">— select a fallback page —</option>
            {pages.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
      </div>
    )}

    {/* ✅ Conditional Routes — shown only for api-call */}
    {actionType === 'api-call' && (
      <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
            Conditional Routes ({jsonConditions.length})
          </span>
          <button
            onClick={addJsonCondition}
            style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}
          >
            + Add route
          </button>
        </div>

        {endpointFields.length === 0 && jsonConditions.length === 0 && (
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 8px' }}>
            Select an endpoint above to load available response fields for conditions.
          </p>
        )}

        {endpointFields.length > 0 && jsonConditions.length === 0 && (
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 8px' }}>
            Add conditional routes to navigate to different pages based on field values.
            Each route evaluates one or more clauses joined by AND / OR.
          </p>
        )}

        {jsonConditions.map((condition, i) => (
          <ExpressionBuilder
            key={i}
            condition={condition}
            conditionIndex={i}
            availableFields={endpointFields}
            pages={pages}
            onChange={(updated) =>
              setJsonConditions(prev => prev.map((c, idx) => idx === i ? updated : c))
            }
            onRemove={() =>
              setJsonConditions(prev => prev.filter((_, idx) => idx !== i))
            }
          />
        ))}
      </div>
    )}
  </>
)}

        </>
      }

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={onClose} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#334155' }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: 'none', background: '#3b82f6', color: '#ffffff', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}