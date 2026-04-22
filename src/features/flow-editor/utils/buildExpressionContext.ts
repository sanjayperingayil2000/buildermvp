/**
 * @deprecated No longer used for api-call conditional routes.
 * api-call now uses parseEndpointSchema.ts to source fields from
 * the selected API endpoint's response schema.
 * Kept in case navigate conditional routes are re-introduced.
 */
import type { PageDescriptor } from '@/shared/types/store';

export interface ExpressionField {
  path: string;        // e.g. "account_page.input_field_ingrese..."
  pageId: string;
  pageName: string;
  elementId: string;
  elementLabel: string;
}

/**
 * Builds a flat list of all input field paths available for JSON expressions.
 * Format: {pageId}.{elementId}
 * Only input elements are included — buttons/links have no runtime value to reference.
 */
export function buildExpressionContext(pages: PageDescriptor[]): ExpressionField[] {
  const fields: ExpressionField[] = [];
  for (const page of pages) {
    for (const el of page.actionElements) {
      if ((el.elementType as string) === 'input') {
        fields.push({
          path: `${page.id}.${el.id}`,
          pageId: page.id,
          pageName: page.name,
          elementId: el.id,
          elementLabel: el.label,
        });
      }
    }
  }
  return fields;
}
