/**
 * parseManifestToFlow — Pure function that converts a manifest JSON
 * into React Flow nodes and edges, plus PageDescriptors for the store.
 *
 * @module lib/parseManifestToFlow
 */

import { type Node, type Edge, MarkerType } from '@xyflow/react';
import type { Manifest, ManifestPage, ManifestElement } from '@/types/manifest';
import type { PageDescriptor } from '@/shared/store/useAppStore';

// ── Layout constants (match the existing flow page grid) ──────────────
const ITEMS_PER_ROW = 3;
const NODE_WIDTH = 280;
const H_GAP = 80;
const V_GAP = 100;

/**
 * Compute the default grid position for a screen based on its index.
 * @param index - The screen's ordinal position in the array
 * @returns {{ x: number, y: number }} grid position
 */
function gridPosition(index: number): { x: number; y: number } {
  const col = index % ITEMS_PER_ROW;
  const row = Math.floor(index / ITEMS_PER_ROW);
  return {
    x: col * (NODE_WIDTH + H_GAP) + 60,
    y: row * (200 + V_GAP) + 60,
  };
}

/**
 * Validate that the manifest has the minimum required structure.
 * Returns an array of error strings (empty = valid).
 *
 * @param manifest - The parsed JSON to validate
 * @returns {string[]} validation errors, empty if valid
 */
export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be a JSON object.');
    return errors;
  }

  const m = manifest as Record<string, unknown>;

  if (!Array.isArray(m.pages)) {
    errors.push('"pages" must be an array.');
  } else {
    m.pages.forEach((p: unknown, i: number) => {
      if (!p || typeof p !== 'object') {
        errors.push(`pages[${i}] is not an object.`);
        return;
      }
      const page = p as Record<string, unknown>;
      if (typeof page.id !== 'string' || !page.id) {
        errors.push(`pages[${i}].id is missing or not a string.`);
      }
      if (typeof page.name !== 'string' || !page.name) {
        errors.push(`pages[${i}].name is missing or not a string.`);
      }
      if (page.elements !== undefined && !Array.isArray(page.elements)) {
        errors.push(`pages[${i}].elements must be an array.`);
      } else if (Array.isArray(page.elements)) {
        page.elements.forEach((el: unknown, j: number) => {
          if (!el || typeof el !== 'object') {
            errors.push(`pages[${i}].elements[${j}] is not an object.`);
            return;
          }
          const element = el as Record<string, unknown>;
          if (typeof element.id !== 'string' || !element.id) {
            errors.push(`pages[${i}].elements[${j}].id is missing or not a string.`);
          }
          if (typeof element.type !== 'string' || !element.type) {
            errors.push(`pages[${i}].elements[${j}].type is missing or not a string.`);
          }
          if (typeof element.name !== 'string' || !element.name) {
            errors.push(`pages[${i}].elements[${j}].name is missing or not a string.`);
          }
        });
      }
    });
  }

  return errors;
}

/**
 * Parse a validated manifest into React Flow nodes, edges, and PageDescriptors.
 *
 * @param manifest - A valid manifest object (run validateManifest first)
 * @returns {{ nodes: Node[], edges: Edge[], pages: PageDescriptor[] }}
 *
 * @example
 * ```ts
 * const { nodes, edges, pages } = parseManifestToFlow(manifest);
 * useAppStore.getState().setPages(pages);
 * ```
 */
export function parseManifestToFlow(manifest: Manifest): {
  nodes: Node[];
  edges: Edge[];
  pages: PageDescriptor[];
} {
  // ── Map pages → nodes & PageDescriptors ────────────────────────
  const pages: PageDescriptor[] = manifest.pages.map((page) => {
    // Collect elements for this page
    const elements = page.elements || [];
    
    // Create an action element for each manifest element to provide a source handle
    const actionElements = elements.map((element) => ({
      id: element.id,
      label: element.name,
      tagName: element.type,
      elementType: element.type as 'button' | 'link' | 'input',
      actionType: 'none',
      navigateTo: null,
      apiEndpoint: null
    }));

    return {
      id: page.id,
      name: page.name,
      actionElements,
    };
  });

  const nodes: Node[] = manifest.pages.map((page, index) => ({
    id: page.id,
    type: 'pageNode' as const,
    position: gridPosition(index),
    data: {
      page: pages[index],
    },
    dragHandle: '.node-drag-handle',
  }));

  // No predefined edges
  const edges: Edge[] = [];

  return { nodes, edges, pages };
}
