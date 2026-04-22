/**
 * API Endpoint Catalog
 * 
 * Each entry defines a known API endpoint available in the kiosk app.
 * The `responseSchema` is a representative sample of the JSON response
 * that this endpoint returns. The field parser will walk this object
 * and extract all leaf paths (e.g. "status", "user.account.balance")
 * to populate the conditional route field selectors.
 * 
 * TO ADD MORE ENDPOINTS LATER:
 * Just add a new entry to this array following the same shape.
 * The parser in `parseEndpointSchema.ts` will automatically handle
 * nested objects and arrays (using the first array element as sample).
 */

export interface ApiEndpointDefinition {
  /** Unique key used as the value stored in ActionElement.apiEndpoint */
  id: string;
  /** Human-readable label shown in the dropdown */
  label: string;
  /** HTTP method this endpoint expects */
  defaultMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** URL path */
  url: string;
  /**
   * A representative JSON response object from this endpoint.
   * All leaf fields in this object will be extracted as available
   * fields for conditional route expressions.
   */
  responseSchema: Record<string, unknown>;
}

export const API_ENDPOINT_CATALOG: ApiEndpointDefinition[] = [
  {
    id: 'mock_payment_verify',
    label: 'Payment Verification',
    defaultMethod: 'POST',
    url: '/api/mock/payment/verify',
    responseSchema: {
      status: 'success',           // string: "success" | "failure" | "pending"
      code: 200,                   // number: HTTP-level result code
      transaction: {
        id: 'txn_abc123',
        amount: 150.00,
        currency: 'USD',
        approved: true,
      },
      customer: {
        id: 'cust_001',
        tier: 'gold',              // string: "standard" | "silver" | "gold"
        balance: 500.00,
      },
      error: {
        code: '',                  // string: e.g. "INSUFFICIENT_FUNDS"
        message: '',
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
