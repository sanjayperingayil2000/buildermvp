/**
 * TO ADD MORE ENDPOINTS LATER:
 * Just add a new entry to this array following the same shape.
 * The parser in `parseEndpointSchema.ts` will automatically handle
 * nested objects and arrays (using the first array element as sample).
 */

/*
 * Minimal OpenAPI 3.0 Schema Object.
 */
export type OpenApiSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

export interface OpenApiSchemaObject {
  type: OpenApiSchemaType;
  properties?: Record<string, OpenApiSchemaObject>;
  items?: OpenApiSchemaObject;
  enum?: (string | number | boolean)[];
  example?: string | number | boolean | null;
  nullable?: boolean;
  description?: string;
  required?: string[];
}

export interface ApiEndpointDefinition {
  id: string;
  label: string;
  defaultMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  responseSchema: OpenApiSchemaObject;
}

export const API_ENDPOINT_CATALOG: ApiEndpointDefinition[] = [
  {
    id: 'mock_payment_verify',
    label: 'Payment Verification',
    defaultMethod: 'GET',
    url: '/api/mock-payment',
    responseSchema: {
      type: 'object',
      required: ['outcome', 'message', 'timestamp'],
      properties: {
        outcome: {
          type: 'string',
          enum: ['success', 'insufficient_funds', 'error'],
          example: 'success',
          description: 'The result of the payment attempt',
        },
        message: {
          type: 'string',
          example: 'Payment processed successfully.',
          description: 'Human-readable result message',
        },
        timestamp: {
          type: 'string',
          example: '2026-04-28T10:00:00.000Z',
          description: 'ISO 8601 timestamp of when the response was generated',
        },
      },
    },
  },
  // ─── Add more endpoints below this line ───────────────────────────────────
  // {
  //   id: 'mock_card_lookup',
  //   label: 'Card Lookup',
  //   defaultMethod: 'POST',
  //   url: '/api/mock/card/lookup',
  //   responseSchema: {
  //     found: true,
  //     card: {
  //       type: 'debit',
  //       last4: '1234',
  //       expired: false,
  //     },
  //   },
  // },
];
