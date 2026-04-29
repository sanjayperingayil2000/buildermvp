export interface ManifestElement {
  id: string;
  uuid?: string;
  type: 'button' | 'link' | 'input' | 'qr' | 'action';
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