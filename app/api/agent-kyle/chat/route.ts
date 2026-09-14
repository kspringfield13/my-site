import { NextRequest, NextResponse } from "next/server";
import { consumeBudget, inspectBudget } from "@/lib/agent-kyle/budget";
import { generateAgentChat } from "@/lib/agent-kyle/chat";
import { GroqRequestError } from "@/lib/agent-kyle/groq";
import { applySessionCookie, getRequestIdentity } from "@/lib/agent-kyle/http";
import { consumeRateLimit } from "@/lib/agent-kyle/rate-limit";
import { inspectAgentAvailability } from "@/lib/agent-kyle/status";
import { agentChatInputSchema } from "@/lib/agent-kyle/types";

function unavailableStatusCode(reason?: string): number {
  return reason === "cooldown" || reason === "rate_limited" ? 429 : 503;
}

export async function POST(request: NextRequest) {
  const identity = getRequestIdentity(request);
  const availability = inspectAgentAvailability({
    ipHash: identity.ipHash,
    sessionId: identity.sessionId
  });

  if (!availability.available) {
    const response = NextResponse.json(availability, { status: unavailableStatusCode(availability.reason) });
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
          windowLimit: rate.windowLimit,
          sessionLimit: rate.sessionLimit,
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

  const parsed = agentChatInputSchema.safeParse(payload);
  if (!parsed.success) {
    const response = NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });
    applySessionCookie(response, identity);
    return response;
  }

  try {
    const result = await generateAgentChat(parsed.data);
    consumeBudget(result.usage.totalTokens);
    const response = NextResponse.json(result.payload);
    applySessionCookie(response, identity);
    return response;
  } catch (error) {
    const providerRateLimited = error instanceof GroqRequestError && error.status === 429;
    console.error("Agent Kyle chat failed", error instanceof GroqRequestError
      ? { status: error.status, model: error.model }
      : { type: error instanceof Error ? error.name : "UnknownError" });
    const response = NextResponse.json(
      {
        ...inspectAgentAvailability({ ipHash: identity.ipHash, sessionId: identity.sessionId }),
        available: false,
        reason: providerRateLimited ? "rate_limited" : "provider_unavailable",
        error: "Agent Kyle is temporarily unavailable."
      },
      { status: providerRateLimited ? 429 : 503 }
    );
    applySessionCookie(response, identity);
    return response;
  }
}
