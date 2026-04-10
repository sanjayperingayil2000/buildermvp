import { NextRequest, NextResponse } from 'next/server';

const VALID_OUTCOMES = ['success', 'insufficient_funds', 'error'] as const;
type Outcome = typeof VALID_OUTCOMES[number];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const scenario = request.nextUrl.searchParams.get('scenario') as Outcome | null;

  await new Promise((resolve) => setTimeout(resolve, 800));

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