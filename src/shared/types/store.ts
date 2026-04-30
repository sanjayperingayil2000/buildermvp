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
  rightValueType?: 'string' | 'number' | 'boolean';
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
  elementType?: 'button' | 'link' | 'input' | 'qr' | 'action';
  actionType: 'navigate' | 'api-call' | 'navigate_back' | 'navigate_close' | 'none';
  navigateTo: string | null;

  /**
   * For api-call: stores the endpoint `id` from API_ENDPOINT_CATALOG
   * (e.g. "mock_payment_verify"). The actual URL is resolved at export time.
   */
  apiEndpoint: string | null;

  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  isHidden?: boolean;
  jsonConditions?: JsonCondition[];
}