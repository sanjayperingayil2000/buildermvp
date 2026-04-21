import type { JsonCondition, ExpressionClause } from '@/shared/types/store';

function serializeClause(clause: ExpressionClause): string {
  const right = clause.rightType === 'field'
    ? clause.rightField
    : clause.rightValue;
  return `${clause.leftField} ${clause.operator} ${right}`;
}

/**
 * Converts a JsonCondition into a flat expression string.
 * Example: "account_page.input_card_number == account_page.input_card_confirm AND account_page.input_card_number != """
 */
export function serializeConditionToExpression(condition: JsonCondition): string {
  if (!condition.clauses || condition.clauses.length === 0) return '';
  return condition.clauses
    .map(serializeClause)
    .join(` ${condition.clauseOperator} `);
}
