export interface PageDescriptor {
  id: string;
  name: string;
  actionElements: ActionElement[];
}

export interface ActionElement {
  id: string;
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
    maxLength?: number;
    numberOnly?: boolean;
    errorMessage?: string;
  };
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