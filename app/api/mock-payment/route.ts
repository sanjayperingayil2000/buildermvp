import { NextRequest, NextResponse } from 'next/server';

// Mock payment API — returns one of three outcomes
// Usage:
//   POST /api/mock-payment                → returns { outcome: "success" }
//   POST /api/mock-payment?scenario=insufficient_funds  → returns that outcome
//   POST /api/mock-payment?scenario=error  → returns that outcome
//
// The outcome field value must exactly match what is configured
// in the ActionConfigPopup outcome rules.

const VALID_OUTCOMES = ['success', 'insufficient_funds', 'error'] as const;
type Outcome = typeof VALID_OUTCOMES[number];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // or restrict later
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// 👇 Handle preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const scenario = request.nextUrl.searchParams.get('scenario') as Outcome | null;

  // Simulate a short network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Determine which outcome to return
  const outcome: Outcome =
    scenario && VALID_OUTCOMES.includes(scenario) ? scenario : 'success';

  return NextResponse.json(
    {
      outcome,
      message:
        outcome === 'success'
          ? 'Payment processed successfully.'
          : outcome === 'insufficient_funds'
            ? 'Card declined due to insufficient funds.'
            : 'An unexpected error occurred.',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: corsHeaders(),
    }
  );
}
