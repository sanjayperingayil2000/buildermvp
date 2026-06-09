import type { Manifest, ManifestPage, ManifestElement } from '@/shared/types/manifest';

interface ComponentDef {
  component_id: string;
  defaults: Record<string, any>;
}

interface RawPageChild {
  use: string;
  id?: string;
  name?: string;
  children?: RawPageChild[];
  [key: string]: any;
}

interface RawComponentPage {
  base_view?: string;
  frame_name?: string;
  layout?: Record<string, any>;
  children?: RawPageChild[];
}

interface RawComponentManifest {
  schema_version?: string;
  service?: string;
  components?: Record<string, ComponentDef>;
  pages?: Record<string, RawComponentPage>;
}

export function normalizeComponentManifest(rawJson: unknown): Manifest {
  const raw = rawJson as RawComponentManifest;
  const components = raw.components ?? {};
  const rawPages = raw.pages ?? {};

  const pages: ManifestPage[] = Object.entries(rawPages).map(([pageId, rawPage]) => {
    const elements: ManifestElement[] = [];
    const addedIds = new Set<string>();

    const addElement = (el: ManifestElement) => {
      if (!addedIds.has(el.id)) {
        addedIds.add(el.id);
        elements.push(el);
      }
    };

    let extractedTitle: string | null = null;

    // Helper to find modalHeader in children list recursively
    function findModalHeaderTitle(childrenList: RawPageChild[]): string | null {
      for (const child of childrenList) {
        if (!child || typeof child !== 'object') continue;
        if (child.use === 'modalHeader') {
          const componentDef = components['modalHeader'];
          const resolvedProps = {
            ...(componentDef?.defaults ?? {}),
            ...child,
          };
          return resolvedProps['Text'] || resolvedProps['text'] || null;
        }
        if (Array.isArray(child.children)) {
          const nestedTitle = findModalHeaderTitle(child.children);
          if (nestedTitle) return nestedTitle;
        }
      }
      return null;
    }

    // 1. Scan page children recursively to check for layout and specific instantiations
    function processChildren(childrenList: RawPageChild[]) {
      for (const child of childrenList) {
        if (!child || typeof child !== 'object') continue;

        const use = child.use;
        if (!use) continue;

        const componentDef = components[use];
        const resolvedProps = {
          ...(componentDef?.defaults ?? {}),
          ...child,
        };

        // Extract Title from modalHeader if present in children
        if (use === 'modalHeader') {
          const title = resolvedProps['Text'] || resolvedProps['text'];
          if (title && typeof title === 'string') {
            extractedTitle = title;
          }
          
          // Check modalHeader visibility properties for cancel/help
          const hasCancel = resolvedProps['showCancel'] === true || resolvedProps['Show cancel'] === true;
          const hasHelp = resolvedProps['showQuestion'] === true || resolvedProps['Show Question'] === true || 
                          resolvedProps['showHelp'] === true || resolvedProps['Show help'] === true;
          
          if (hasCancel) {
            addElement({
              id: 'cancel',
              type: 'button',
              name: 'Cancel',
            });
          }
          if (hasHelp) {
            addElement({
              id: 'help',
              type: 'button',
              name: 'Help',
            });
          }
        }

        // Detect Ilustrations_Icons QR Code
        if (use === 'Ilustrations_Icons') {
          const typeProp = resolvedProps['Type'] || resolvedProps['type'];
          if (typeProp === 'QR') {
            addElement({
              id: 'qr',
              type: 'qr',
              name: 'QR Code',
            });
          }
        }

        // Standard Button components used directly in layout
        if (use === 'Button' || use.startsWith('Button_') || use === 'cancel' || use === 'help') {
          const label = resolvedProps['Label text'] || resolvedProps['label'] || 
                        (use === 'cancel' ? 'Cancel' : use === 'help' ? 'Help' : 'Button');
          addElement({
            id: child.id || use,
            type: 'button',
            name: label,
          });
        }

        // Handle nested children recursively
        if (Array.isArray(child.children)) {
          processChildren(child.children);
        }
      }
    }

    if (Array.isArray(rawPage.children)) {
      processChildren(rawPage.children);
    }

    // 2. Scan the global components map to find defined buttons, cancel, and help components
    // (since in these layouts, elements like cancel/help/buttons are declared in components but
    // might not be directly listed in the page children, instead managed implicitly).
    Object.entries(components).forEach(([compKey, compDef]) => {
      const defaults = compDef.defaults ?? {};
      
      if (compKey === 'cancel') {
        addElement({
          id: 'cancel',
          type: 'button',
          name: defaults['Label text'] || defaults['label'] || 'Cancel',
        });
      } else if (compKey === 'help') {
        addElement({
          id: 'help',
          type: 'button',
          name: defaults['Label text'] || defaults['label'] || 'Help',
        });
      } else if (compKey === 'Button' || compKey.startsWith('Button_')) {
        const label = defaults['Label text'] || defaults['label'] || 'Button';
        addElement({
          id: compKey,
          type: 'button',
          name: label,
        });
      }
    });

    // Determine page name:
    // First priority: modalHeader's title text
    // Second priority: page components' modalHeader title defaults
    // Third priority: frame_name or pageId
    const finalPageTitle = extractedTitle || 
                           (rawPage.children && findModalHeaderTitle(rawPage.children)) ||
                           components['modalHeader']?.defaults?.['Text'] || 
                           components['modalHeader']?.defaults?.['text'] || 
                           rawPage.frame_name || 
                           pageId;

    return {
      id: pageId,
      name: finalPageTitle,
      elements,
    };
  });

  return { pages };
}
