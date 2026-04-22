'use client';
import React from 'react';
import type { ExpressionClause, JsonCondition } from '@/shared/types/store';
import type { ResponseField } from '@/features/flow-editor/utils/parseEndpointSchema';

interface ExpressionBuilderProps {
  condition: JsonCondition;
  conditionIndex: number;
  availableFields: ResponseField[];
  pages: { id: string; name: string }[];
  onChange: (updated: JsonCondition) => void;
  onRemove: () => void;
}

const OPERATORS = ['==', '!=', '>', '<', '>=', '<='] as const;

const inputStyle: React.CSSProperties = {
  padding: '5px 7px',
  fontSize: 11,
  borderRadius: 5,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#1e293b',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  display: 'block',
  marginBottom: 3,
  marginTop: 8,
};

export default function ExpressionBuilder({
  condition,
  conditionIndex,
  availableFields,
  pages,
  onChange,
  onRemove,
}: ExpressionBuilderProps) {

  const updateClause = (clauseIdx: number, updates: Partial<ExpressionClause>) => {
    const updatedClauses = condition.clauses.map((c, i) =>
      i === clauseIdx ? { ...c, ...updates } : c
    );
    onChange({ ...condition, clauses: updatedClauses });
  };

  const addClause = () => {
    const newClause: ExpressionClause = {
      leftField: availableFields[0]?.path ?? '',
      operator: '==',
      rightType: 'value',
      rightField: '',
      rightValue: '',
    };
    onChange({ ...condition, clauses: [...condition.clauses, newClause] });
  };

  const removeClause = (clauseIdx: number) => {
    onChange({ ...condition, clauses: condition.clauses.filter((_, i) => i !== clauseIdx) });
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
      
      {/* Condition header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
          Route {conditionIndex + 1}
        </span>
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, padding: 0 }}
        >
          Remove route
        </button>
      </div>

      {/* Outcome key */}
      <label style={labelStyle}>Outcome key (unique identifier)</label>
      <input
        type="text"
        value={condition.outcomeKey}
        onChange={e => onChange({ ...condition, outcomeKey: e.target.value })}
        placeholder="e.g. match, above_50, valid_amount"
        style={{ ...inputStyle, width: '100%' }}
      />

      {/* Target page */}
      <label style={labelStyle}>Navigate to page if condition passes</label>
      <select
        value={condition.targetPageId}
        onChange={e => onChange({ ...condition, targetPageId: e.target.value })}
        style={{ ...inputStyle, width: '100%' }}
      >
        <option value="">— select page —</option>
        {pages.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Error message */}
      <label style={labelStyle}>Error message if condition fails</label>
      <input
        type="text"
        value={condition.errorMessage}
        onChange={e => onChange({ ...condition, errorMessage: e.target.value })}
        placeholder="e.g. Los números no coinciden"
        style={{ ...inputStyle, width: '100%' }}
      />

      {/* Clause join operator — only shown when 2+ clauses */}
      {condition.clauses.length >= 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>Join clauses with:</span>
          {(['AND', 'OR'] as const).map(op => (
            <button
              key={op}
              onClick={() => onChange({ ...condition, clauseOperator: op })}
              style={{
                padding: '2px 10px',
                fontSize: 11,
                borderRadius: 4,
                border: `1px solid ${condition.clauseOperator === op ? '#3b82f6' : '#e2e8f0'}`,
                background: condition.clauseOperator === op ? '#eff6ff' : 'transparent',
                color: condition.clauseOperator === op ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                fontWeight: condition.clauseOperator === op ? 700 : 400,
              }}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {/* Clauses */}
      <div style={{ marginTop: 8 }}>
        {condition.clauses.map((clause, clauseIdx) => (
          <div key={clauseIdx}>
            {/* AND/OR label between clauses */}
            {clauseIdx > 0 && (
              <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#3b82f6', margin: '4px 0' }}>
                {condition.clauseOperator}
              </div>
            )}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Clause {clauseIdx + 1}</span>
                {condition.clauses.length > 1 && (
                  <button
                    onClick={() => removeClause(clauseIdx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 10, padding: 0 }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Left field */}
              <label style={labelStyle}>Left field</label>
              <select
                value={clause.leftField}
                onChange={e => updateClause(clauseIdx, { leftField: e.target.value })}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="">— select endpoint first —</option>
                {availableFields.map(f => (
                  <option key={f.path} value={f.path}>
                    {f.label} ({f.valueType}) · e.g. {f.sampleValue}
                  </option>
                ))}
              </select>

              {/* Operator */}
              <label style={labelStyle}>Operator</label>
              <select
                value={clause.operator}
                onChange={e => updateClause(clauseIdx, { operator: e.target.value as ExpressionClause['operator'] })}
                style={{ ...inputStyle, width: '100%' }}
              >
                {OPERATORS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>

              {/* Right side toggle */}
              <label style={labelStyle}>Compare against</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {(['value', 'field'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateClause(clauseIdx, { rightType: mode })}
                    style={{
                      padding: '2px 10px',
                      fontSize: 10,
                      borderRadius: 4,
                      border: `1px solid ${clause.rightType === mode ? '#3b82f6' : '#e2e8f0'}`,
                      background: clause.rightType === mode ? '#eff6ff' : 'transparent',
                      color: clause.rightType === mode ? '#3b82f6' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: clause.rightType === mode ? 700 : 400,
                    }}
                  >
                    {mode === 'value' ? 'A value' : 'Another field'}
                  </button>
                ))}
              </div>

              {clause.rightType === 'value' ? (
                <>
                  <label style={labelStyle}>Value</label>
                  <input
                    type="text"
                    value={clause.rightValue}
                    onChange={e => updateClause(clauseIdx, { rightValue: e.target.value })}
                    placeholder='e.g. 50, "active", true'
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </>
              ) : (
                <>
                  <label style={labelStyle}>Right field</label>
                  <select
                    value={clause.rightField}
                    onChange={e => updateClause(clauseIdx, { rightField: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }}
                  >
                    <option value="">— select endpoint first —</option>
                    {availableFields.map(f => (
                      <option key={f.path} value={f.path}>
                        {f.label} ({f.valueType}) · e.g. {f.sampleValue}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add clause button */}
      <button
        onClick={addClause}
        style={{
          marginTop: 6,
          width: '100%',
          padding: '5px 0',
          fontSize: 10,
          borderRadius: 5,
          border: '1px dashed #94a3b8',
          background: 'transparent',
          color: '#64748b',
          cursor: 'pointer',
        }}
      >
        + Add clause ({condition.clauseOperator})
      </button>

      {/* Live expression preview */}
      {condition.clauses.length > 0 && condition.clauses[0].leftField && (
        <div style={{ marginTop: 8, background: '#1e293b', borderRadius: 5, padding: '6px 10px' }}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>Expression preview:</div>
          <div style={{ fontSize: 10, color: '#7dd3fc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {condition.clauses
              .filter(c => c.leftField)
              .map((c, i) => {
                const right = c.rightType === 'field' ? c.rightField : c.rightValue;
                const clause = `${c.leftField} ${c.operator} ${right}`;
                return i === 0 ? clause : ` ${condition.clauseOperator} ${clause}`;
              })
              .join('')}
          </div>
        </div>
      )}
    </div>
  );
}
