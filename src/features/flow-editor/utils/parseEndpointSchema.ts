import type { ApiEndpointDefinition } from '@/config/apiEndpoints';

export interface ResponseField {
  /**
   * Dot-notation path into the response JSON.
   * e.g. "status", "transaction.amount", "customer.tier"
   * This is what gets stored in ExpressionClause.leftField / rightField.
   */
  path: string;
  /** Human-readable label shown in the dropdown, same as path but prettier */
  label: string;
  /**
   * Inferred value type from the sample schema value.
   * Useful for future enhancements (e.g. showing numeric operators only for numbers).
   */
  valueType: 'string' | 'number' | 'boolean' | 'unknown';
  /** The sample value from the schema (for display/hint purposes) */
  sampleValue: string;
}

/**
 * Infers the value type from a sample schema value.
 */
function inferType(value: unknown): ResponseField['valueType'] {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

/**
 * Recursively walks a response schema object and collects all
 * leaf-node field paths in dot notation.
 *
 * Rules:
 * - Primitives (string, number, boolean) → emit as a field
 * - Objects → recurse into with path prefix
 * - Arrays → use first element if it's an object, recurse into it;
 *             if first element is primitive, emit the array path itself
 * - null / undefined → skip
 *
 * @param schema  The object to walk (or a sub-object during recursion)
 * @param prefix  Current dot-notation prefix (empty string at root)
 * @param fields  Accumulator array mutated during recursion
 */
function walkSchema(
  schema: Record<string, unknown>,
  prefix: string,
  fields: ResponseField[],
): void {
  for (const [key, value] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      // Skip null/undefined — no useful type info
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        const first = value[0];
        if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
          // Array of objects — recurse using first element
          walkSchema(first as Record<string, unknown>, path, fields);
        } else {
          // Array of primitives — emit the path itself
          fields.push({
            path,
            label: path,
            valueType: inferType(first),
            sampleValue: String(first),
          });
        }
      }
      continue;
    }

    if (typeof value === 'object') {
      // Nested object — recurse
      walkSchema(value as Record<string, unknown>, path, fields);
      continue;
    }

    // Leaf primitive — emit
    fields.push({
      path,
      label: path,
      valueType: inferType(value),
      sampleValue: String(value),
    });
  }
}

/**
 * Parses the responseSchema of an API endpoint definition and returns
 * a flat list of all available response fields for use in expression builders.
 *
 * @param endpoint  An entry from API_ENDPOINT_CATALOG
 * @returns         Flat array of ResponseField, one per leaf node in the schema
 *
 * @example
 * const fields = parseEndpointSchema(API_ENDPOINT_CATALOG[0]);
 * // → [
 * //   { path: 'status', label: 'status', valueType: 'string', sampleValue: 'success' },
 * //   { path: 'transaction.amount', label: 'transaction.amount', valueType: 'number', sampleValue: '150' },
 * //   ...
 * // ]
 */
export function parseEndpointSchema(endpoint: ApiEndpointDefinition): ResponseField[] {
  const fields: ResponseField[] = [];
  walkSchema(endpoint.responseSchema, '', fields);
  return fields;
}
