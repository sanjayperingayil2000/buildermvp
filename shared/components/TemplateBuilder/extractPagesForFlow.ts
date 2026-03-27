import type { Editor } from 'grapesjs';
import type { PageDescriptor, ActionElement } from '@/shared/store/useAppStore';

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
