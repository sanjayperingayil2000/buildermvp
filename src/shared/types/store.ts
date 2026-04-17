export interface PageDescriptor {
  id: string;
  uuid?: string;
  name: string;
  actionElements: ActionElement[];
}

export interface ActionElement {
  id: string;
  uuid?: string;
  label: string;
  tagName: string;
  elementType?: 'button' | 'link' | 'input';
  actionType: string;
  navigateTo: string | null;
  apiEndpoint: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
  isHidden?: boolean;
  validations?: {
    minLength?: number;
    maxLength?: number;
    dataType?: 'any' | 'numbers' | 'letters' | 'alphanumeric';
  };
  fieldMatchConditions?: Array<{
    field1Id: string;
    field1Label: string;
    field2Id: string;
    field2Label: string;
    field1Uuid?: string;
    field2Uuid?: string;
    errorMessage: string;
  }>;
  customConditions?: Array<{
    ruleDescription: string;
    errorMessage: string;
  }>;
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