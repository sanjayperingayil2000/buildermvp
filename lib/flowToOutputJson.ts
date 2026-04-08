/**
 * flowToOutputJson — Pure function that serializes the current React Flow
 * canvas state into the output JSON format for download.
 *
 * @module lib/flowToOutputJson
 */

import { type Node, type Edge } from '@xyflow/react';
import type { OutputJson, OutputNavigation, ManifestScreen } from '@/types/manifest';

/**
 * Convert React Flow nodes and edges into the output JSON schema.
 *
 * @param nodes - Current React Flow nodes
 * @param edges - Current React Flow edges
 * @returns {OutputJson} Serializable output object ready for JSON.stringify
 *
 * @example
 * ```ts
 * const output = flowToOutputJson(nodes, edges);
 * const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
 * ```
 */
export function flowToOutputJson(nodes: Node[], edges: Edge[]): OutputJson {
  // ── Map nodes → screens ──────────────────────────────────────────
  const screens: ManifestScreen[] = nodes.map((node) => {
    const page = node.data?.page as
      | { id: string; name: string; type?: string; meta?: Record<string, unknown> }
      | undefined;

    return {
      id: page?.id ?? node.id,
      name: page?.name ?? node.id,
      type: page?.type ?? 'screen',
      meta: page?.meta ?? {},
    };
  });

  // ── Map edges → navigations ──────────────────────────────────────
  const navigations: OutputNavigation[] = edges.map((edge) => ({
    from: edge.source,
    to: edge.target,
    condition: (edge.data as Record<string, unknown>)?.condition as string | null ?? null,
    edgeType: edge.type ?? 'default',
  }));

  return {
    generatedAt: new Date().toISOString(),
    screens,
    navigations,
  };
}

/**
 * Trigger a browser file download for the output JSON.
 *
 * @param output - The OutputJson object to download
 */
export function downloadOutputJson(output: OutputJson): void {
  const jsonStr = JSON.stringify(output, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  const a = document.createElement('a');
  a.href = url;
  a.download = `output_navigation_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
