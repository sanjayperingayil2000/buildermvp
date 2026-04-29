'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const activeProject = useAppStore((s) => s.getActiveProject());
  const pages = activeProject?.pages ?? [];

  const actionColor =
    element.actionType === 'navigate' ? '#3b82f6' :
    element.actionType === 'api-call' ? '#f59e0b' :
    element.actionType === 'navigate_back' ? '#8b5cf6' :
    element.actionType === 'navigate_close' ? '#64748b' : '#94a3b8';

  const maxConnections =
    element.actionType === 'api-call' ? 10 :
    element.actionType === 'navigate' ? 1 : 1;

  const isSaturated = currentEdgeCount >= maxConnections;
  const handleColor = isSaturated ? '#6b7280' :
    element.actionType === 'api-call' ? '#f59e0b' : '#10b981';
  const handleBorderColor = isSaturated ? '#9ca3af' : '#ffffff';

  const displayLabel = element.label && element.label !== element.id ? element.label :
    element.elementType === 'link' ? 'Link' :
    element.elementType === 'qr' ? 'QR Scanner' :
    element.elementType === 'action' ? 'Action' : 'Button';

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
           element.actionType === 'navigate' ? (currentEdgeCount > 0 ? 'connected' : 'navigate') :
           element.actionType === 'navigate_back' ? '← back' :
           element.actionType === 'navigate_close' ? '✕ close' : 'tap to configure'}
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

      {element.elementType !== 'link' 
        && element.actionType !== 'navigate_back' 
        && element.actionType !== 'navigate_close' && (
        <Handle
          type="source"
          position={Position.Right}
          id={element.id}
          title={isSaturated
            ? (element.actionType === 'api-call' ? 'Maximum connections reached' : 'Already connected — delete the existing edge to reconnect')
            : element.actionType === 'api-call'
              ? `API call — drag to add outcome route (${currentEdgeCount} route${currentEdgeCount !== 1 ? 's' : ''})`
              : 'Navigate — drag to connect to a target page'}
          style={{
            width: 14, height: 14, background: handleColor,
            border: `2px solid ${handleBorderColor}`,
            right: -7, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, opacity: isSaturated ? 0.5 : 1,
            cursor: isSaturated ? 'not-allowed' : 'crosshair',
          }}
        />
      )}

      {showPopup && (
        <ActionConfigPopup
          element={element}
          pageId={pageId}
          pages={pages}
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
  onClose,
}: {
  element: ActionElement;
  pageId: string;
  pages: { id: string; name: string }[];
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);

  const scrollUp = useCallback(() => {
    scrollRef.current?.scrollBy({ top: -120, behavior: 'smooth' });
  }, []);

  const scrollDown = useCallback(() => {
    scrollRef.current?.scrollBy({ top: 120, behavior: 'smooth' });
  }, []);

  const [label, setLabel] = useState(element.label);
  const [actionType, setActionType] = useState<string>(element.actionType);
  const [apiEndpoint, setApiEndpoint] = useState<string>(element.apiEndpoint ?? '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(element.method ?? 'POST');

  
  const activeProject = useAppStore((s) => s.getActiveProject());
  const setFlowEdges = useAppStore((s) => s.setFlowEdges);
  const allPages = activeProject?.pages ?? [];

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

  useEffect(() => {
    setJsonConditions(element.jsonConditions ?? []);
  }, [element.jsonConditions]);

  useEffect(() => {
    // Small delay to let content render before measuring scroll height
    const timer = setTimeout(updateScrollButtons, 50);
    return () => clearTimeout(timer);
  }, [jsonConditions, actionType, updateScrollButtons]);

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
    setActionType(e.target.value);
  };

  const handleSave = () => {

    const isAdvanced = actionType === 'api-call';
    
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
      apiEndpoint: actionType === 'api-call' ? selectedEndpointId : null,
      method: actionType === 'api-call' ? method : 'POST',
      outcomes: [],
      fallbackPageId: undefined,
      navigateTo: null,
      jsonConditions: actionType === 'api-call' ? (validJsonConditions.length > 0 ? validJsonConditions : undefined) : undefined,
    };

    useAppStore.getState().updateActionElement(pageId, element.id, updates);

    const currentFlowEdges = activeProject?.flowEdges ?? [];
    
    if (actionType === 'api-call') {
      const edgesWithoutThis = currentFlowEdges.filter(
        (e: any) => !(e.source === pageId && e.sourceHandle === element.id)
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
      } as any));
      setFlowEdges([...edgesWithoutThis, ...conditionEdges]);
    } else if (actionType === 'navigate' && validJsonConditions.length > 0) {
      const edgesWithoutThisHandle = currentFlowEdges.filter(
        (e: any) => !(e.source === pageId && e.sourceHandle === element.id)
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
      } as any));
      setFlowEdges([...edgesWithoutThisHandle, ...conditionEdges]);
    } else {
      const updatedEdges = currentFlowEdges.filter(
        (e: any) => !(e.source === pageId && e.sourceHandle === element.id)
      );
      setFlowEdges(updatedEdges);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4, marginTop: 10 };

  return (
    // Outer wrapper: positions the popup, handles wheel stopPropagation, no overflow
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
        width: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        fontFamily: 'system-ui, sans-serif',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Scroll Up button — only visible when there's content above */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={scrollUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '5px 0',
          background: canScrollUp ? '#f8fafc' : 'transparent',
          border: 'none',
          borderBottom: canScrollUp ? '1px solid #e2e8f0' : '1px solid transparent',
          cursor: canScrollUp ? 'pointer' : 'default',
          color: canScrollUp ? '#64748b' : 'transparent',
          fontSize: 12,
          flexShrink: 0,
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        ▲
      </button>

      {/* Scrollable content area */}
      <div
        ref={scrollRef}
        className="action-config-popup-scroll"
        onScroll={updateScrollButtons}
        style={{
          flex: 1,
          overflowY: 'scroll',
          padding: 16,
          minHeight: 0,
        }}
      >
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
            <option value="navigate_back">Navigate — Back</option>
            <option value="navigate_close">Navigate — Close</option>
          </select>

          {(actionType === 'navigate_back' || actionType === 'navigate_close') && (
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 6,
              fontSize: 11,
              color: '#166534',
              lineHeight: 1.5,
            }}>
              {actionType === 'navigate_back'
                ? '← This button will navigate to the previous page in the user\'s navigation history. No edge needed.'
                : '✕ This button will minimize/close the app flow. No edge needed.'}
            </div>
          )}

          {/* JSON Expression Conditions section */}
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
  </>
)}

        </>
      }

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={onClose} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#334155' }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: 11, borderRadius: 6, border: 'none', background: '#3b82f6', color: '#ffffff', cursor: 'pointer' }}>Save</button>
      </div>
      </div>

      {/* Scroll Down button — only visible when there's content below */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={scrollDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '5px 0',
          background: canScrollDown ? '#f8fafc' : 'transparent',
          border: 'none',
          borderTop: canScrollDown ? '1px solid #e2e8f0' : '1px solid transparent',
          cursor: canScrollDown ? 'pointer' : 'default',
          color: canScrollDown ? '#64748b' : 'transparent',
          fontSize: 12,
          flexShrink: 0,
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        ▼
      </button>
    </div>
  );
}