import { inspectBudget } from "@/lib/agent-kyle/budget";
import { isGroqConfigured } from "@/lib/agent-kyle/groq";
import { inspectRateLimit } from "@/lib/agent-kyle/rate-limit";
import type { AgentStatusResponse } from "@/lib/agent-kyle/types";

function isAgentEnabled(): boolean {
  const raw = process.env.AGENT_KYLE_ENABLED;
  if (!raw) return true;
  return raw !== "0" && raw.toLowerCase() !== "false";
}

export function inspectAgentAvailability(input: {
  ipHash: string;
  sessionId: string;
}): AgentStatusResponse {
  const rate = inspectRateLimit({ ipHash: input.ipHash, sessionId: input.sessionId });
  const budget = inspectBudget();

  if (!isAgentEnabled()) {
    return {
      available: false,
      reason: "disabled",
      usageWindow: {
        remainingInWindow: rate.remainingInWindow,
        sessionRemaining: rate.sessionRemaining,
        remainingTokens: budget.remainingTokens,
        resetAt: budget.resetAt
      }
    };
  }

  if (!isGroqConfigured()) {
    return {
      available: false,
      reason: "missing_api_key",
      usageWindow: {
        remainingInWindow: rate.remainingInWindow,
        sessionRemaining: rate.sessionRemaining,
        remainingTokens: budget.remainingTokens,
        resetAt: budget.resetAt
      }
    };
  }

  if (!budget.available) {
    return {
      available: false,
      reason: "daily_budget_exceeded",
      retryAfterSec: Math.max(0, Math.ceil((Date.parse(budget.resetAt) - Date.now()) / 1000)),
      usageWindow: {
        remainingInWindow: rate.remainingInWindow,
        sessionRemaining: rate.sessionRemaining,
        remainingTokens: budget.remainingTokens,
        resetAt: budget.resetAt
      }
    };
  }

  if (!rate.allowed) {
    return {
      available: false,
      reason: rate.reason === "cooldown" ? "cooldown" : "rate_limited",
      retryAfterSec: rate.retryAfterSec,
      usageWindow: {
        remainingInWindow: rate.remainingInWindow,
        sessionRemaining: rate.sessionRemaining,
        remainingTokens: budget.remainingTokens,
        resetAt: budget.resetAt
      }
    };
  }

  return {
    available: true,
    reason: "ok",
    usageWindow: {
      remainingInWindow: rate.remainingInWindow,
      sessionRemaining: rate.sessionRemaining,
      remainingTokens: budget.remainingTokens,
      resetAt: budget.resetAt
    }
  };
}
