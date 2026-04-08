/**
 * parseManifestToFlow — Pure function that converts a manifest JSON
 * into React Flow nodes and edges, plus PageDescriptors for the store.
 *
 * @module lib/parseManifestToFlow
 */

import { type Node, type Edge, MarkerType } from '@xyflow/react';
import type { Manifest, ManifestScreen } from '@/types/manifest';
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

  if (!Array.isArray(m.screens)) {
    errors.push('"screens" must be an array.');
  } else {
    m.screens.forEach((s: unknown, i: number) => {
      if (!s || typeof s !== 'object') {
        errors.push(`screens[${i}] is not an object.`);
        return;
      }
      const screen = s as Record<string, unknown>;
      if (typeof screen.id !== 'string' || !screen.id) {
        errors.push(`screens[${i}].id is missing or not a string.`);
      }
      if (typeof screen.name !== 'string' || !screen.name) {
        errors.push(`screens[${i}].name is missing or not a string.`);
      }
    });
  }

  if (!Array.isArray(m.links)) {
    errors.push('"links" must be an array.');
  } else {
    const screenIds = new Set(
      Array.isArray(m.screens)
        ? (m.screens as ManifestScreen[]).map((s) => s.id)
        : []
    );
    m.links.forEach((l: unknown, i: number) => {
      if (!l || typeof l !== 'object') {
        errors.push(`links[${i}] is not an object.`);
        return;
      }
      const link = l as Record<string, unknown>;
      if (typeof link.from !== 'string') {
        errors.push(`links[${i}].from is missing or not a string.`);
      } else if (screenIds.size > 0 && !screenIds.has(link.from as string)) {
        errors.push(`links[${i}].from references unknown screen "${link.from}".`);
      }
      if (typeof link.to !== 'string') {
        errors.push(`links[${i}].to is missing or not a string.`);
      } else if (screenIds.size > 0 && !screenIds.has(link.to as string)) {
        errors.push(`links[${i}].to references unknown screen "${link.to}".`);
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
  // ── Map screens → nodes & PageDescriptors ────────────────────────
  const pages: PageDescriptor[] = manifest.screens.map((screen) => {
    // Collect outgoing links for this screen
    const outgoingLinks = manifest.links.filter(l => l.from === screen.id);
    
    // Create an action element for each outgoing link to provide a source handle
    const actionElements = outgoingLinks.map((link, idx) => ({
      id: `action-${screen.id}-${idx}`,
      label: link.condition ?? `Action ${idx + 1}`,
      tagName: 'button',
      actionType: 'navigate',
      navigateTo: null,
      apiEndpoint: null
    }));

    return {
      id: screen.id,
      name: screen.name,
      actionElements,
    };
  });

  const nodes: Node[] = manifest.screens.map((screen, index) => ({
    id: screen.id,
    type: 'pageNode' as const,
    position: gridPosition(index),
    data: {
      page: pages[index],
    },
    dragHandle: '.node-drag-handle',
  }));

  // ── Map links → edges ────────────────────────────────────────────
  const edges: Edge[] = manifest.links.map((link, index) => {
    // Find the corresponding action element
    const outgoingFromScreen = manifest.links.filter(l => l.from === link.from);
    const localIdx = outgoingFromScreen.indexOf(link);
    const sourceHandleId = `action-${link.from}-${localIdx}`;

    return {
      id: `edge-manifest-${link.from}-${link.to}-${index}`,
      type: 'deletable',
      source: link.from,
      sourceHandle: sourceHandleId,
      target: link.to,
      targetHandle: 'entry',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
      ...(link.condition
        ? {
            label: link.condition,
            labelStyle: { fontSize: 11, fill: '#3b82f6', fontWeight: 600 },
            labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
            data: { condition: link.condition, actionType: 'navigate', method: 'POST', outcomes: [], apiEndpoint: null },
          }
        : { data: { condition: null, actionType: 'navigate', method: 'POST', outcomes: [], apiEndpoint: null } }),
    };
  });

  return { nodes, edges, pages };
}
