import type { Manifest, ManifestPage } from '@/shared/types/manifest';

const SKIP_TYPES = new Set([
  'toolbar', 'header', 'appbar', 'navigationbar', 'divider',
  'spacer', 'image', 'icon', 'label'
]);

interface RawWidget {
  id?: string;
  uuid?: string;
  type?: string;
  props?: Record<string, unknown>;
  state_variants?: Record<string, unknown>;
  widgets?: RawWidget[];
}

interface RawWidgetPage {
  id?: string;
  uuid?: string;
  name?: string;
  widgets?: RawWidget[];
}

interface RawWidgetManifest {
  pages?: RawWidgetPage[];
}

function resolveElementType(type: string): 'input' | 'button' | 'link' | 'qr' | null {
  const t = type.toLowerCase();
  if (t.includes('input') || t.includes('textfield') || t.includes('field')) return 'input';
  if (t.includes('link')) return 'link';
  if (t.includes('qr') || t.includes('qrcode') || t.includes('qr_code') || t.includes('scanner')) return 'qr';
  if (
    t.includes('button') ||
    t.includes('btn') ||
    t.includes('primarybutton') ||
    t.includes('secondarybutton')
  ) return 'button';
  return null;
}

function resolveLabel(widget: RawWidget): string {
  const props = widget.props ?? {};
  return (
    (props.label as string) ||
    (props.buttonLabel as string) ||
    (props.placeholder as string) ||
    widget.id ||
    'Unknown'
  );
}

export function normalizeWidgetManifest(rawJson: unknown): Manifest {
  const raw = rawJson as RawWidgetManifest;
  const rawPages = raw.pages ?? [];

  const pages: ManifestPage[] = rawPages.map((page) => {
    const widgets = page.widgets ?? [];
    const elements = widgets
      .filter((w) => {
        const t = (w.type ?? '').toLowerCase();
        return ![...SKIP_TYPES].some((skip) => t.includes(skip));
      })
      .flatMap((w) => {
        const type = w.type ?? '';
        const elType = resolveElementType(type);
        if (!elType) return [];
        return [{
          id: w.id ?? w.uuid ?? `el-${Math.random().toString(36).slice(2, 6)}`,
          uuid: w.uuid,
          type: elType,
          name: resolveLabel(w),
        }];
      });

    return {
      id: page.id ?? `page-${Math.random().toString(36).slice(2, 6)}`,
      uuid: page.uuid,
      name: page.name ?? page.id ?? 'Unnamed Page',
      elements,
    };
  });

  return { pages };
}
