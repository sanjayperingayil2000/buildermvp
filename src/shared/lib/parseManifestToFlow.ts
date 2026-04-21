import { type Node, type Edge } from '@xyflow/react';
import type { Manifest } from '@/shared/types/manifest';
import type { PageDescriptor, ActionElement } from '@/shared/types/store';
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

    const actionElements: ActionElement[] = elements.map((element) => {
      const elementType: ActionElement['elementType'] =
        element.type === 'input' ? 'input'
          : element.type === 'link' ? 'link'
            : 'button';

      return {
        id: element.id,
        uuid: element.uuid,
        label: element.name,
        elementType,
        actionType: 'none' as const,
        navigateTo: null,
        apiEndpoint: null,
        fieldMatchConditions: [],
      };
    });

    return {
      id: page.id,
      uuid: page.uuid,
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