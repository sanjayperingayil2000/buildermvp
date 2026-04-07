// Define interfaces based on your expected React Flow node structure
export interface ActionElement {
  id: string;
  label: string;
  tagName: string;      // Will map to the Flutter widget type (e.g., 'ElevatedButton')
  actionType: string;
  navigateTo: string | null;
  apiEndpoint: string | null;
}

export interface PageDescriptor {
  id: string;
  name: string;
  code: string;         // Replaces the old 'html' and 'css' fields
  actionElements: ActionElement[];
}

/**
 * Extracts pages and their actionable widgets from a Flutter-based JSON schema
 * to be rendered as nodes in React Flow.
 */
export function extractPagesForFlow(flutterJson: any): PageDescriptor[] {
  const result: PageDescriptor[] = [];

  // Safeguard against invalid JSON shapes
  if (!flutterJson || !Array.isArray(flutterJson.pages)) {
    console.warn("Invalid JSON provided to extractPagesForFlow");
    return result;
  }

  for (const page of flutterJson.pages) {
    const pageId = page.pageId || 'unknown_id';
    const pageName = page.pageTitle || 'Untitled';
    const widgetCode = page.widgetCode || '';

    const actionElements: ActionElement[] = [];

    // Extract actionable elements from the page's widgets array
    if (Array.isArray(page.widgets)) {
      for (const widget of page.widgets) {

        // Define what makes a widget "actionable" in your new schema.
        // Here, we check if it has a navigation target or is a button/touchable type.
        const isActionable =
          widget.navigationTarget != null ||
          (widget.type && widget.type.toLowerCase().includes('button')) ||
          (widget.type && widget.type.toLowerCase().includes('inkwell')) ||
          (widget.type && widget.type.toLowerCase().includes('gesturedetector'));

        if (isActionable) {
          // Attempt to find the most readable label (e.g., the button's text)
          const textProp = widget.properties?.text;
          const label = textProp || widget.label || widget.widgetId || 'Unnamed Action';

          actionElements.push({
            id: widget.widgetId || '',
            label: label,
            tagName: widget.type || 'UnknownWidget',
            actionType: widget.navigationTarget ? 'navigate' : 'none',
            navigateTo: widget.navigationTarget || null,
            // If your extended JSON adds API endpoints later, map them here:
            apiEndpoint: widget.properties?.apiEndpoint || null,
          });
        }
      }
    }

    result.push({
      id: pageId,
      name: pageName,
      code: widgetCode, // Passing the Dart code instead of HTML/CSS
      actionElements,
    });
  }

  return result;
}