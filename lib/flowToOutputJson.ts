/**
 * flowToOutputJson — Pure function that serializes the current React Flow
 * canvas state into the output JSON format for download.
 *
 * @module lib/flowToOutputJson
 */
import { type Node, type Edge } from '@xyflow/react';
import type { OutputJson, OutputNavigation, OutputPage, OutputElement } from '@/types/manifest';
import type { PageDescriptor, NavMapEntry } from '@/shared/store/useAppStore';
/**
 * Convert React Flow nodes and edges into the output JSON schema.
 *
 * @param nodes - Current React Flow nodes
 * @param edges - Current React Flow edges
 * @param navMap - Current mapped edge logic from store
 * @returns {OutputJson} Serializable output object ready for JSON.stringify
 *
 * @example
 * ```ts
 * const output = flowToOutputJson(nodes, edges, navMap);
 * const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
 * ```
 */
export function flowToOutputJson(nodes: Node[], edges: Edge[], navMap: NavMapEntry[]): OutputJson {
  // ── Map nodes → pages & elements ───────────────────────────────
  const pages: OutputPage[] = nodes.map((node) => {
    const page = node.data?.page as PageDescriptor | undefined;
    const activeElements = (page?.actionElements || []).filter(el => !el.isHidden);
    const elements: OutputElement[] = activeElements.map((el) => {
      const isInput = el.elementType === 'input';

      const elementOutput: OutputElement = {
        id: el.id,
        name: el.label || el.id,
        type: (el.elementType || 'button') as 'button' | 'link' | 'input',
      };
      if (isInput && el.validations) elementOutput.validations = el.validations;
      if (el.actionType !== undefined) elementOutput.actionType = el.actionType;
      if (el.apiEndpoint !== undefined) elementOutput.apiEndpoint = el.apiEndpoint;
      if (el.method !== undefined) elementOutput.method = el.method;
      if (el.outcomes !== undefined) elementOutput.outcomes = el.outcomes;
      if (el.fallbackPageId !== undefined) elementOutput.fallbackPageId = el.fallbackPageId;
      return elementOutput;
    });
    return {
      id: page?.id ?? node.id,
      name: page?.name ?? node.id,
      elements,
    };
  });
  // ── Map edges → navigations ──────────────────────────────────────
  const navigations: OutputNavigation[] = edges.map((edge) => {
    const navLogic = navMap.find(n =>
      n.sourceHandleId === (edge.sourceHandle ?? edge.source) &&
      n.targetPageId === edge.target
    );
    const navigationOutput: OutputNavigation = {
      fromElementId: edge.sourceHandle ?? edge.source,
      toPageId: edge.target,
      condition: (edge.data as Record<string, unknown>)?.condition as string | null ?? null,
    };
    if (navLogic?.action) {
      if (navLogic.action.actionType !== undefined) navigationOutput.actionType = navLogic.action.actionType;
      if (navLogic.action.apiEndpoint !== undefined) navigationOutput.apiEndpoint = navLogic.action.apiEndpoint;
      if (navLogic.action.method !== undefined) navigationOutput.method = navLogic.action.method;
      if (navLogic.action.outcomes !== undefined) navigationOutput.outcomes = navLogic.action.outcomes;
      if (navLogic.action.fallbackPageId !== undefined) navigationOutput.fallbackPageId = navLogic.action.fallbackPageId;
    }
    return navigationOutput;
  });
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