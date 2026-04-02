import type { Editor } from 'grapesjs';
import type { PageDescriptor, ActionElement, InputFieldDescriptor } from '@/shared/store/useAppStore';

export function extractPagesForFlow(editor: Editor): PageDescriptor[] {
  const allPages = editor.Pages.getAll();
  const originalPageId = editor.Pages.getSelected()?.getId();
  const result: PageDescriptor[] = [];

  for (const page of allPages) {
    const pageId = page.getId();
    const pageName = page.get('name') || 'Untitled';

    // Temporarily select this page to extract its HTML/CSS
    editor.Pages.select(pageId);

    const html = editor.getHtml() || '';
    const css = editor.getCss() || '';

    // Collect action elements
    const actionComponents = editor.getWrapper()?.find('[data-action-id]') || [];
    const actionElements: ActionElement[] = actionComponents.map((component) => {
      const attrs = component.getAttributes();
      return {
        id: attrs['data-action-id'] || '',
        label: component.get('content') as string || attrs['data-action-id'] || '',
        tagName: component.get('tagName') as string || '',
        actionType: attrs['data-action-type'] || 'none',
        navigateTo: attrs['data-navigate-to'] || null,
        apiEndpoint: attrs['data-api-endpoint'] || null,
      };
    });

    result.push({
      id: pageId,
      name: pageName,
      html,
      css,
      actionElements,
    });
  }

  // Restore originally selected page
  if (originalPageId) {
    editor.Pages.select(originalPageId);
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractInputFields(editor: any): Record<string, InputFieldDescriptor[]> {
  const result: Record<string, InputFieldDescriptor[]> = {};
  const pages = editor.Pages.getAll();

  pages.forEach((page: any) => {
    editor.Pages.select(page.getId());
    const wrapper = editor.getWrapper();
    const inputs = wrapper.find('input');
    const pageId = page.getId();
    const fields: InputFieldDescriptor[] = [];

    inputs.forEach((inputComp: any) => {
      const attrs = inputComp.getAttributes();
      const id = attrs.id || attrs['data-niw-id'] || '';
      if (!id) return;

      // Detect which widget this input belongs to
      // Walk up the component tree looking for data-widget attribute
      let parentComp = inputComp.parent();
      let widgetId = '';
      while (parentComp) {
        const parentAttrs = parentComp.getAttributes?.() ?? {};
        if (parentAttrs['data-widget']) {
          widgetId = parentAttrs['data-widget'];
          break;
        }
        parentComp = parentComp.parent?.();
      }

      // Determine semantic role from known patterns
      let role: InputFieldDescriptor['role'] = 'generic';
      if (attrs['data-niw-primary'] === 'true' || id.includes('primary')) role = 'primary';
      else if (attrs['data-niw-confirm'] === 'true' || id.includes('confirm')) role = 'confirm';

      // Human-readable label
      let label = attrs.placeholder || id;
      if (role === 'primary') label = 'Primary number input';
      else if (role === 'confirm') label = 'Confirmation input';

      fields.push({
        id,
        widgetId,
        label,
        inputType: attrs.type || 'text',
        placeholder: attrs.placeholder || '',
        role,
      });
    });

    if (fields.length > 0) {
      result[pageId] = fields;
    }
  });

  return result;
}
