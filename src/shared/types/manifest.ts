export interface ManifestElement {
  id: string;
  type: 'button' | 'link' | 'input';
  name: string;
}

export interface ManifestPage {
  id: string;
  name: string;
  elements: ManifestElement[];
}

export interface Manifest {
  pages: ManifestPage[];
}

export interface ValidationRule {
  maxLength?: number;
  numberOnly?: boolean;
  errorMessage?: string;
}

export interface OutputElement extends ManifestElement {
  validations?: ValidationRule;
  actionType?: string;
  apiEndpoint?: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
}

export interface OutputPage {
  id: string;
  name: string;
  elements: OutputElement[];
}

export interface OutputNavigation {
  fromElementId: string;
  toPageId: string;
  condition: string | null;
  actionType?: string;
  apiEndpoint?: string | null;
  method?: string;
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
}

export interface OutputJson {
  generatedAt: string;
  pages: OutputPage[];
  navigations: OutputNavigation[];
}