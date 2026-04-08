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
    const elements = extractElements(page);

    return {
      id: page.id || `page-${Math.random().toString(36).slice(2, 6)}`,
      name: page.name || page.id || 'Unnamed Page',
      elements,
    };
  });

  return { pages };
}

/**
 * Recursively extracts ManifestElement instances from a nested Flutter JSON structure.
 */
function extractElements(node: any): ManifestElement[] {
  if (!node || typeof node !== 'object') return [];

  let results: ManifestElement[] = [];

  // Check if current node is an actionable element
  const hasActions = node.actions && typeof node.actions === 'object' && Object.keys(node.actions).length > 0;
  const nodeType = typeof node.type === 'string' ? node.type.toLowerCase() : '';
  const isActionableType = nodeType.includes('button') || nodeType.includes('link') || nodeType.includes('input');

  if (hasActions || isActionableType) {
    let type: ManifestElement['type'] = 'button';
    if (nodeType.includes('input') || nodeType.includes('field') || nodeType.includes('textfield')) {
      type = 'input';
    } else if (nodeType.includes('link')) {
      type = 'link';
    }

    const nameFallback = node.id
      ? node.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Unnamed Element';
      
    const name = node.props?.label || node.props?.content || nameFallback;

    results.push({
      id: node.id || `node-${Math.random().toString(36).slice(2, 6)}`,
      type,
      name,
    });
  }

  // Recursively search children arrays
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(...extractElements(child));
    }
  }

  // Recursively search widgets arrays
  if (Array.isArray(node.widgets)) {
    for (const widget of node.widgets) {
      results.push(...extractElements(widget));
    }
  }
  
  // Recursively search layout or specific wrapper objects if standard flutter structure has it
  // Commonly flutter manifests wrap things in a single `child` property as well
  if (node.child && typeof node.child === 'object') {
     results.push(...extractElements(node.child));
  }

  return results;
}
