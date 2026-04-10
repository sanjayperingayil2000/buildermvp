import type { PageDescriptor } from '@/shared/types/store';
import { ITEMS_PER_ROW, NODE_WIDTH, H_GAP, V_GAP } from '@/config/constants';

export function computeDefaultPosition(page: PageDescriptor, allPages: PageDescriptor[]): { x: number; y: number } {
  const index = allPages.findIndex((p) => p.id === page.id);
  const col = index % ITEMS_PER_ROW;
  const row = Math.floor(index / ITEMS_PER_ROW);
  return {
    x: col * (NODE_WIDTH + H_GAP) + 60,
    y: row * (200 + V_GAP) + 60,
  };
}

export function computeNodes(
  pageList: PageDescriptor[],
  saved: { id: string; position: { x: number; y: number } }[]
): { id: string; type: 'pageNode'; position: { x: number; y: number }; data: { page: PageDescriptor }; dragHandle: string }[] {
  if (saved.length > 0) {
    return pageList.map((page) => {
      const existing = saved.find((n) => n.id === page.id);
      return {
        id: page.id,
        type: 'pageNode' as const,
        position: existing?.position ?? computeDefaultPosition(page, pageList),
        data: { page },
        dragHandle: '.node-drag-handle',
      };
    });
  }
  return pageList.map((page) => ({
    id: page.id,
    type: 'pageNode' as const,
    position: computeDefaultPosition(page, pageList),
    data: { page },
    dragHandle: '.node-drag-handle',
  }));
}