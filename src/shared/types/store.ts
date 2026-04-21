export interface PageDescriptor {
  id: string;
  uuid?: string;
  name: string;
  actionElements: ActionElement[];
}

export interface ExpressionClause {
  leftField: string;           // e.g. "account_page.input_card_number"
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  rightType: 'field' | 'value';
  rightField: string;          // used when rightType = 'field'
  rightValue: string;          // used when rightType = 'value'
}

export interface JsonCondition {
  outcomeKey: string;          // unique key, e.g. "match", "above_50"
  targetPageId: string;        // page to navigate to if condition passes
  errorMessage: string;        // shown to user if condition fails
  clauseOperator: 'AND' | 'OR'; // how clauses are joined
  clauses: ExpressionClause[]; // one or more clauses
}

export interface ActionElement {
  id: string;
  uuid?: string;
  label: string;
  elementType?: 'button' | 'link';
  actionType: string;
  navigateTo: string | null;
  apiEndpoint: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
  isHidden?: boolean;
  jsonConditions?: JsonCondition[];
}

export interface NavMapOutcome {
  outcomeKey: string;
  targetPageId: string;
}

export interface EdgeAction {
  actionType: 'navigate' | 'api-call' | 'secure_entry_routing' | 'none';
  apiEndpoint: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes: NavMapOutcome[];
  fallbackPageId?: string;
}

export interface NavMapEntry {
  sourcePageId: string;
  sourceHandleId: string;
  targetPageId: string;
  action: EdgeAction;
}