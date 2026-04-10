import { type Node, type Edge } from '@xyflow/react';
import type { Manifest } from '@/shared/types/manifest';
import type { PageDescriptor } from '@/shared/types/store';
import { ITEMS_PER_ROW, NODE_WIDTH, H_GAP, V_GAP } from '@/config/constants';

function gridPosition(index: number): { x: number; y: number } {
  const col = index % ITEMS_PER_ROW;
  const row = Math.floor(index / ITEMS_PER_ROW);
  return {
    x: col * (NODE_WIDTH + H_GAP) + 60,
    y: row * (200 + V_GAP) + 60,
  };
}

export function parseManifestToFlow(manifest: Manifest): {
  nodes: Node[];
  edges: Edge[];
  pages: PageDescriptor[];
} {
  const pages: PageDescriptor[] = manifest.pages.map((page) => {
    const elements = page.elements || [];

    const actionElements = elements.map((element) => ({
      id: element.id,
      label: element.name,
      tagName: element.type,
      elementType: (element.type === 'input' ? 'input' : element.type === 'link' ? 'link' : 'button') as 'button' | 'link' | 'input',
      actionType: 'none',
      navigateTo: null,
      apiEndpoint: null,
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

  const edges: Edge[] = [];

  return { nodes, edges, pages };
}