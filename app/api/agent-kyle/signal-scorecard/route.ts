import { NextRequest, NextResponse } from "next/server";
import { consumeBudget, inspectBudget } from "@/lib/agent-kyle/budget";
import { generateSignalScorecard } from "@/lib/agent-kyle/engine";
import { applySessionCookie, getRequestIdentity } from "@/lib/agent-kyle/http";
import { consumeRateLimit } from "@/lib/agent-kyle/rate-limit";
import { inspectAgentAvailability } from "@/lib/agent-kyle/status";
import { signalScorecardInputSchema } from "@/lib/agent-kyle/types";

function toUnavailableStatusCode(reason?: string): number {
  if (reason === "cooldown" || reason === "rate_limited") return 429;
  if (reason === "daily_budget_exceeded") return 503;
  if (reason === "disabled" || reason === "missing_api_key") return 503;
  return 503;
}

export async function POST(request: NextRequest) {
  const identity = getRequestIdentity(request);
  const availability = inspectAgentAvailability({
    ipHash: identity.ipHash,
    sessionId: identity.sessionId
  });

  if (!availability.available) {
    const response = NextResponse.json(availability, { status: toUnavailableStatusCode(availability.reason) });
    applySessionCookie(response, identity);
    return response;
  }

  const rate = consumeRateLimit({
    ipHash: identity.ipHash,
    sessionId: identity.sessionId
  });

  if (!rate.allowed) {
    const budget = inspectBudget();
    const response = NextResponse.json(
      {
        available: false,
        reason: rate.reason === "cooldown" ? "cooldown" : "rate_limited",
        retryAfterSec: rate.retryAfterSec,
        usageWindow: {
          remainingInWindow: rate.remainingInWindow,
          sessionRemaining: rate.sessionRemaining,
          remainingTokens: budget.remainingTokens,
          resetAt: budget.resetAt
        }
      },
      { status: 429 }
    );
    applySessionCookie(response, identity);
    return response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    applySessionCookie(response, identity);
    return response;
  }

  const parsed = signalScorecardInputSchema.safeParse(payload);
  if (!parsed.success) {
    const response = NextResponse.json(
      {
        error: "Invalid signal scorecard payload.",
        issues: parsed.error.issues.map((issue: { message: string }) => issue.message)
      },
      { status: 400 }
    );
    applySessionCookie(response, identity);
    return response;
  }

  try {
    const result = await generateSignalScorecard(parsed.data);
    consumeBudget(result.usage.totalTokens);

    const response = NextResponse.json(result.payload);
    applySessionCookie(response, identity);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent Kyle request failed.";
    const lowered = message.toLowerCase();
    const isQuota = lowered.includes("quota") || lowered.includes("rate") || lowered.includes("limit");

    const response = NextResponse.json(
      {
        available: false,
        reason: isQuota ? "daily_budget_exceeded" : "rate_limited",
        error: "Agent Kyle is temporarily out of service."
      },
      { status: isQuota ? 503 : 500 }
    );
    applySessionCookie(response, identity);
    return response;
  }
}
