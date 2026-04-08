/**
 * Manifest types — defines the schema for importing and exporting
 * screen/navigation JSON into and out of the React Flow canvas.
 */

// ────────────────────────────────────────────
// INPUT — what the user uploads as manifest.json
// ────────────────────────────────────────────

/** A single screen entry in the manifest file */
export interface ManifestScreen {
  id: string;
  name: string;
  type: string;
  meta: Record<string, unknown>;
}

/** A navigation link between two screens */
export interface ManifestLink {
  from: string;   // source screenId
  to: string;     // target screenId
  condition: string | null;
}

/** Top-level manifest schema */
export interface Manifest {
  screens: ManifestScreen[];
  links: ManifestLink[];
}

// ────────────────────────────────────────────
// OUTPUT — what the export produces
// ────────────────────────────────────────────

/** A single navigation entry in the output file */
export interface OutputNavigation {
  from: string;
  to: string;
  condition: string | null;
  edgeType: string;
}

/** Top-level output JSON schema */
export interface OutputJson {
  generatedAt: string;
  screens: ManifestScreen[];
  navigations: OutputNavigation[];
}
