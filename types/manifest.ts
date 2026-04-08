/**
 * Manifest types — defines the schema for importing and exporting
 * screen/navigation JSON into and out of the React Flow canvas.
 */

// ────────────────────────────────────────────
// INPUT — what the user uploads as manifest.json
// ────────────────────────────────────────────

export interface ManifestElement {
  id: string;
  type: 'button' | 'link' | 'input';
  name: string; // e.g., "Submit Button" or "Email Field"
}

export interface ManifestPage {
  id: string;
  name: string;
  elements: ManifestElement[];
}

export interface Manifest {
  pages: ManifestPage[];
}

// ────────────────────────────────────────────
// OUTPUT — what the export produces
// ────────────────────────────────────────────

export interface ValidationRule {
  maxLength?: number;
  numberOnly?: boolean;
  errorMessage?: string;
}

export interface OutputElement extends ManifestElement {
  validations?: ValidationRule;
}

export interface OutputPage {
  id: string;
  name: string;
  elements: OutputElement[];
}

export interface OutputNavigation {
  fromElementId: string; // The ID of the specific button/link/input triggering the route
  toPageId: string;
  condition: string | null;
}

export interface OutputJson {
  generatedAt: string;
  pages: OutputPage[];
  navigations: OutputNavigation[];
}
