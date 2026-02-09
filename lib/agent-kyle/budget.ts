import type { BudgetStatus } from "@/lib/agent-kyle/types";

interface BudgetLedger {
  dayKey: string;
  usedTokens: number;
}

const DEFAULT_DAILY_BUDGET = Number(process.env.AGENT_KYLE_DAILY_TOKEN_BUDGET || 120000);

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextUtcMidnightIso(date: Date): string {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return next.toISOString();
}

function getLedger(now = new Date()): BudgetLedger {
  const globalKey = "__KS_AGENT_KYLE_BUDGET_LEDGER__";
  const holder = globalThis as typeof globalThis & {
    [key: string]: BudgetLedger | undefined;
  };

  const dayKey = toDayKey(now);
  const existing = holder[globalKey];

  if (!existing || existing.dayKey !== dayKey) {
    holder[globalKey] = {
      dayKey,
      usedTokens: 0
    };
  }

  return holder[globalKey]!;
}

export function inspectBudget(): BudgetStatus {
  const now = new Date();
  const ledger = getLedger(now);
  const tokenBudget = Math.max(1, DEFAULT_DAILY_BUDGET);
  const remainingTokens = Math.max(0, tokenBudget - ledger.usedTokens);

  return {
    available: remainingTokens > 0,
    usedTokens: ledger.usedTokens,
    tokenBudget,
    remainingTokens,
    resetAt: nextUtcMidnightIso(now)
  };
}

export function consumeBudget(tokens: number): BudgetStatus {
  const now = new Date();
  const ledger = getLedger(now);
  const safeTokens = Math.max(0, Math.floor(tokens));
  ledger.usedTokens += safeTokens;
  return inspectBudget();
}
