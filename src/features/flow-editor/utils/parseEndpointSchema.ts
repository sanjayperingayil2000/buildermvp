import type { ApiEndpointDefinition, OpenApiSchemaObject } from '@/config/apiEndpoints';

export interface ResponseField {
  path: string;
  label: string;
  valueType: 'string' | 'number' | 'integer' | 'boolean' | 'unknown';
  sampleValue: string;
  enumValues?: (string | number | boolean)[];
}

function mapType(type: OpenApiSchemaObject['type']): ResponseField['valueType'] {
  switch (type) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'integer': return 'integer';
    case 'boolean': return 'boolean';
    default: return 'unknown';
  }
}

/**
 * Rules:
 * - type 'object' with properties → recurse into each property
 * - type 'array' with items → recurse into items schema using path[]  
 * - type 'string' | 'number' | 'integer' | 'boolean' → emit as leaf field
 * - No properties and no items → skip (unresolvable node)
 */
function walkOpenApiSchema(
  schema: OpenApiSchemaObject,
  prefix: string,
  fields: ResponseField[],
): void {
  if (schema.type === 'object' && schema.properties) {
    for (const [key, childSchema] of Object.entries(schema.properties)) {
      const path = prefix ? `${prefix}.${key}` : key;
      walkOpenApiSchema(childSchema, path, fields);
    }
    return;
  }

  if (schema.type === 'array' && schema.items) {
    const arrayPath = prefix ? `${prefix}[]` : '[]';
    walkOpenApiSchema(schema.items, arrayPath, fields);
    return;
  }

  // Leaf node — emit a ResponseField
  if (!prefix) return; // root with no type we can use — skip

  fields.push({
    path: prefix,
    label: prefix,
    valueType: mapType(schema.type),
    sampleValue: schema.example !== undefined && schema.example !== null
      ? String(schema.example)
      : schema.enum?.[0] !== undefined
        ? String(schema.enum[0])
        : '',
    enumValues: schema.enum,
  });
}

/**
 * Parses the OpenAPI responseSchema of a catalog entry and returns
 * a flat list of all leaf fields available for expression building.
 */
export function parseEndpointSchema(endpoint: ApiEndpointDefinition): ResponseField[] {
  const fields: ResponseField[] = [];
  walkOpenApiSchema(endpoint.responseSchema, '', fields);
  return fields;
}
