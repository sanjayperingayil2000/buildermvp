import type { Project } from '@/shared/store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/* ------------------------------------------------------------------ */
/*  Types matching backend responses                                    */
/* ------------------------------------------------------------------ */

export interface ServiceListResponse {
  services: string[];
}

export interface DesignFilesResponse {
  serviceName: string;
  pageCount: number;
  pages: unknown[];
  // array of ManifestPage objects — passed to parseManifestToFlow
  rawFiles: Record<string, unknown>;
}

export interface OutputFlowMeta {
  id: string;
  key: string;
  savedAt: string;
  size: number;
}

export interface OutputFlowsListResponse {
  flows: OutputFlowMeta[];
}

export interface SaveFlowResponse {
  success: boolean;
  flowId: string;
  savedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Design Files — read from S3, used for import                       */
/* ------------------------------------------------------------------ */

/** Fetches the list of available service names (e.g. ["didi", "corresponsalias"]) */
export async function fetchServices(): Promise<ServiceListResponse> {
  const res = await fetch(`${API_BASE}/api/design-files`);
  if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
  return res.json();
}

/** Fetches all page files for a service, merged into a single structure */
export async function fetchDesignFiles(serviceName: string): Promise<DesignFilesResponse> {
  const res = await fetch(`${API_BASE}/api/design-files/${serviceName}`);
  if (!res.ok) throw new Error(`Failed to fetch files for ${serviceName}: ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Output Flows — user-generated projects saved to S3                 */
/* ------------------------------------------------------------------ */

/** Lists all saved output flows (metadata only — id, savedAt, size) */
export async function fetchOutputFlows(): Promise<OutputFlowsListResponse> {
  const res = await fetch(`${API_BASE}/api/output-flows`);
  if (!res.ok) throw new Error(`Failed to fetch output flows: ${res.status}`);
  return res.json();
}

/** Fetches a single saved output flow by its project ID */
export async function fetchOutputFlow(flowId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/output-flows/${flowId}`);
  if (!res.ok) throw new Error(`Flow not found: ${flowId} (${res.status})`);
  return res.json();
}

/** Saves (or overwrites) a project to S3 — call after every save */
export async function saveOutputFlow(flowId: string, project: Project): Promise<SaveFlowResponse> {
  const res = await fetch(`${API_BASE}/api/output-flows/${flowId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error(`Failed to save flow ${flowId}: ${res.status}`);
  return res.json();
}

/** Deletes a saved output flow from S3 */
export async function deleteOutputFlow(flowId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/output-flows/${flowId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete flow ${flowId}: ${res.status}`);
}
