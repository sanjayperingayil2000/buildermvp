import { NextRequest, NextResponse } from 'next/server';

const VALID_OUTCOMES = ['success', 'insufficient_funds', 'error'] as const;
type Outcome = typeof VALID_OUTCOMES[number];

const MESSAGES: Record<Outcome, string> = {
  success: 'Payment processed successfully.',
  insufficient_funds: 'Card declined due to insufficient funds.',
  error: 'An unexpected error occurred.',
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function resolveOutcome(raw: string | null): Outcome {
  return raw && (VALID_OUTCOMES as readonly string[]).includes(raw)
    ? (raw as Outcome)
    : 'success';
}

/** Builds the response body — must match the OpenAPI schema declared in apiEndpoints.ts */
function buildResponse(outcome: Outcome) {
  return {
    outcome,
    message: MESSAGES[outcome],
    timestamp: new Date().toISOString(),
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  await new Promise((r) => setTimeout(r, 800));
  const outcome = resolveOutcome(request.nextUrl.searchParams.get('scenario'));
  return NextResponse.json(buildResponse(outcome), { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  await new Promise((r) => setTimeout(r, 800));
  let scenario: string | null = null;
  try {
    const body = await request.json();
    scenario = body?.scenario ?? null;
  } catch {
    // no body or invalid JSON — default to success
  }
  const outcome = resolveOutcome(scenario);
  return NextResponse.json(buildResponse(outcome), { status: 200, headers: corsHeaders() });
}