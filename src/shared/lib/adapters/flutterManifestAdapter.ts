import type { Manifest, ManifestPage, ManifestElement } from '@/shared/types/manifest';

export function normalizeFlutterManifest(rawJson: unknown): Manifest {
  const json = rawJson as Record<string, unknown>;
  if (!json || !Array.isArray(json.pages)) {
    return { pages: [] };
  }
  const pages: ManifestPage[] = json.pages.map((page: unknown) => {
    const pageObj = page as Record<string, unknown>;
    const elements = extractElementsFromArray([pageObj]);
    return {
      id: (pageObj.id as string) || `page-${Math.random().toString(36).slice(2, 6)}`,
      name: (pageObj.name as string) || (pageObj.id as string) || 'Unnamed Page',
      elements,
    };
  });
  return { pages };
}

function extractElementsFromArray(nodes: unknown[]): ManifestElement[] {
  let results: ManifestElement[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as Record<string, unknown> | null;
    if (!node || typeof node !== 'object') continue;

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
      const props = node.props as Record<string, unknown> | null;
      let name = (props?.label as string) || (props?.content as string);

      if (isInput && !name && i > 0) {
        const prevNode = nodes[i - 1] as Record<string, unknown>;
        if (prevNode && prevNode.type === 'Text') {
          const prevProps = prevNode.props as Record<string, unknown>;
          if (prevProps?.data) {
            name = prevProps.data as string;
          }
        }
      }

      const nameFallback = node.id
        ? (node.id as string).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Unnamed Input';

      results.push({
        id: (node.id as string) || `node-${Math.random().toString(36).slice(2, 6)}`,
        type,
        name: name || nameFallback,
      });
    }

    if (Array.isArray(node.children)) {
      results.push(...extractElementsFromArray(node.children));
    }
    if (Array.isArray(node.widgets)) {
      results.push(...extractElementsFromArray(node.widgets));
    }
    if (node.child && typeof node.child === 'object') {
      results.push(...extractElementsFromArray([node.child]));
    }
  }
  return results;
}