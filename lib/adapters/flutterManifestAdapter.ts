import type { Manifest, ManifestPage, ManifestElement } from '@/types/manifest';
/**
 * Normalizes a deeply nested Flutter JSON manifest into the standard Manifest format.
 *
 * It recursively extracts actionable elements (buttons, inputs, links) from 
 * nested widgets and children arrays. Elements are identified by the presence 
 * of an `actions` object or by matching keywords in their `type` string.
 */
export function normalizeFlutterManifest(rawJson: any): Manifest {
  if (!rawJson || !Array.isArray(rawJson.pages)) {
    return { pages: [] };
  }
  const pages: ManifestPage[] = rawJson.pages.map((page: any) => {
    // Top level page structure might have its own top-level widgets array
    // We'll wrap the page to kickstart the recursive extraction on its widgets
    const elements = extractElementsFromArray([page]);
    return {
      id: page.id || `page-${Math.random().toString(36).slice(2, 6)}`,
      name: page.name || page.id || 'Unnamed Page',
      elements,
    };
  });
  return { pages };
}
/**
 * Recursively extracts ManifestElement instances from a nested Flutter JSON array structure.
 */

function extractElementsFromArray(nodes: any[]): ManifestElement[] {
  let results: ManifestElement[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node || typeof node !== 'object') continue;
    // Check if current node is an actionable element
    const hasActions = node.actions && typeof node.actions === 'object' && Object.keys(node.actions).length > 0;
    const nodeType = typeof node.type === 'string' ? node.type.toLowerCase() : '';
    const isInput = nodeType.includes('input') || nodeType.includes('textfield') || nodeType.includes('field');
    const isActionableType = nodeType.includes('button') || nodeType.includes('link') || isInput;

    if (hasActions || isActionableType) {
      let type: ManifestElement['type'] = 'button';
      if (isInput) {
        type = 'input';
      } else if (nodeType.includes('link')) {
        type = 'link';
      }
      let name = node.props?.label || node.props?.content;

      // Look-behind logic for input labels (e.g. CustomTextField preceded by Text widget)
      if (isInput && !name && i > 0) {
        const prevNode = nodes[i - 1];
        if (prevNode && prevNode.type === 'Text' && prevNode.props?.data) {
          name = prevNode.props.data;
        }
      }

      const nameFallback = node.id
        ? node.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Unnamed Input';

      results.push({
        id: node.id || `node-${Math.random().toString(36).slice(2, 6)}`,
        type,
        name: name || nameFallback,
      });
    }


    // Recursively search children arrays
    if (Array.isArray(node.children)) {
      results.push(...extractElementsFromArray(node.children));
    }
    // Recursively search widgets arrays
    if (Array.isArray(node.widgets)) {
      results.push(...extractElementsFromArray(node.widgets));
    }

    // Recursively search layout or specific wrapper objects if standard flutter structure has it
    if (node.child && typeof node.child === 'object') {
      results.push(...extractElementsFromArray([node.child]));
    }
  }


  return results;
}
