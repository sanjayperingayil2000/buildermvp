/**
 * flowToOutputJson — Pure function that serializes the current React Flow
 * canvas state into the output JSON format for download.
 *
 * @module lib/flowToOutputJson
 */

import { type Node, type Edge } from '@xyflow/react';
import type { OutputJson, OutputNavigation, OutputPage, OutputElement } from '@/types/manifest';
import type { PageDescriptor } from '@/shared/store/useAppStore';

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
  // ── Map nodes → pages & elements ───────────────────────────────
  const pages: OutputPage[] = nodes.map((node) => {
    const page = node.data?.page as PageDescriptor | undefined;

    const elements: OutputElement[] = (page?.actionElements || []).map((el) => {
      const isInput = el.elementType === 'input';
      return {
        id: el.id,
        name: el.label || el.id,
        type: (el.elementType || 'button') as 'button' | 'link' | 'input',
        ...(isInput && el.validations ? { validations: el.validations } : {})
      };
    });

    return {
      id: page?.id ?? node.id,
      name: page?.name ?? node.id,
      elements,
    };
  });

  // ── Map edges → navigations ──────────────────────────────────────
  const navigations: OutputNavigation[] = edges.map((edge) => ({
    fromElementId: edge.sourceHandle ?? edge.source,
    toPageId: edge.target,
    condition: (edge.data as Record<string, unknown>)?.condition as string | null ?? null,
  }));

  return {
    generatedAt: new Date().toISOString(),
    pages,
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
