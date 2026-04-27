export interface ManifestElement {
  id: string;
  uuid?: string;
  type: 'button' | 'link' | 'input' | 'qr';
  name: string;
}

export interface ManifestPage {
  id: string;
  uuid?: string;
  name: string;
  elements?: ManifestElement[];
}

export interface Manifest {
  pages: ManifestPage[];
}

export interface OutputElement extends ManifestElement {
  uuid?: string;
  actionType?: string;
  apiEndpoint?: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  outcomes?: Array<{ outcomeKey: string; targetPageId: string }>;
  fallbackPageId?: string;
}

export interface OutputPage {
  id: string;
  uuid?: string;
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