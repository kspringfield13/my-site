import { createHash } from "node:crypto";
import type { RateLimitStatus } from "@/lib/agent-kyle/types";

const WINDOW_MS = 10 * 60 * 1000;
const WINDOW_LIMIT = 8;
const SESSION_LIMIT = 20;
const COOLDOWN_MS = 60 * 1000;

interface IpBucket {
  timestamps: number[];
  cooldownUntil: number;
}

interface SessionBucket {
  count: number;
  resetAt: number;
}

interface AgentLimiterStore {
  ipBuckets: Map<string, IpBucket>;
  sessionBuckets: Map<string, SessionBucket>;
}

function getStore(): AgentLimiterStore {
  const globalKey = "__KS_AGENT_KYLE_LIMITER_STORE__";
  const value = globalThis as typeof globalThis & {
    [key: string]: AgentLimiterStore | undefined;
  };

  if (!value[globalKey]) {
    value[globalKey] = {
      ipBuckets: new Map<string, IpBucket>(),
      sessionBuckets: new Map<string, SessionBucket>()
    };
  }

  return value[globalKey]!;
}

function sanitizeIp(ip: string): string {
  return ip.trim() || "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.AGENT_KYLE_RATE_LIMIT_SALT || "agent-kyle";
  return createHash("sha256").update(`${salt}:${sanitizeIp(ip)}`).digest("hex").slice(0, 24);
}

function getSessionBucket(sessionId: string, now: number): SessionBucket {
  const store = getStore();
  const existing = store.sessionBuckets.get(sessionId);
  if (existing && existing.resetAt > now) {
    return existing;
  }

  const next: SessionBucket = {
    count: 0,
    resetAt: now + 24 * 60 * 60 * 1000
  };
  store.sessionBuckets.set(sessionId, next);
  return next;
}

function getIpBucket(ipHash: string, now: number): IpBucket {
  const store = getStore();
  const existing = store.ipBuckets.get(ipHash);
  if (existing) {
    existing.timestamps = existing.timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (existing.cooldownUntil < now) {
      existing.cooldownUntil = 0;
    }
    return existing;
  }

  const next: IpBucket = {
    timestamps: [],
    cooldownUntil: 0
  };
  store.ipBuckets.set(ipHash, next);
  return next;
}

function makeStatus(input: {
  allowed: boolean;
  reason?: RateLimitStatus["reason"];
  retryAfterSec?: number;
  remainingInWindow: number;
  sessionRemaining: number;
}): RateLimitStatus {
  return {
    allowed: input.allowed,
    reason: input.reason,
    retryAfterSec: input.retryAfterSec,
    remainingInWindow: Math.max(0, input.remainingInWindow),
    sessionRemaining: Math.max(0, input.sessionRemaining)
  };
}

export function inspectRateLimit(input: {
  ipHash: string;
  sessionId: string;
  now?: number;
}): RateLimitStatus {
  const now = input.now ?? Date.now();
  const ipBucket = getIpBucket(input.ipHash, now);
  const sessionBucket = getSessionBucket(input.sessionId, now);

  if (ipBucket.cooldownUntil > now) {
    return makeStatus({
      allowed: false,
      reason: "cooldown",
      retryAfterSec: Math.ceil((ipBucket.cooldownUntil - now) / 1000),
      remainingInWindow: Math.max(0, WINDOW_LIMIT - ipBucket.timestamps.length),
      sessionRemaining: Math.max(0, SESSION_LIMIT - sessionBucket.count)
    });
  }

  if (sessionBucket.count >= SESSION_LIMIT) {
    return makeStatus({
      allowed: false,
      reason: "session_limit",
      retryAfterSec: Math.ceil((sessionBucket.resetAt - now) / 1000),
      remainingInWindow: Math.max(0, WINDOW_LIMIT - ipBucket.timestamps.length),
      sessionRemaining: 0
    });
  }

  if (ipBucket.timestamps.length >= WINDOW_LIMIT) {
    return makeStatus({
      allowed: false,
      reason: "window_limit",
      retryAfterSec: Math.ceil(WINDOW_MS / 1000),
      remainingInWindow: 0,
      sessionRemaining: Math.max(0, SESSION_LIMIT - sessionBucket.count)
    });
  }

  return makeStatus({
    allowed: true,
    remainingInWindow: WINDOW_LIMIT - ipBucket.timestamps.length,
    sessionRemaining: SESSION_LIMIT - sessionBucket.count
  });
}

export function consumeRateLimit(input: {
  ipHash: string;
  sessionId: string;
  now?: number;
}): RateLimitStatus {
  const now = input.now ?? Date.now();
  const ipBucket = getIpBucket(input.ipHash, now);
  const sessionBucket = getSessionBucket(input.sessionId, now);

  if (ipBucket.cooldownUntil > now) {
    return makeStatus({
      allowed: false,
      reason: "cooldown",
      retryAfterSec: Math.ceil((ipBucket.cooldownUntil - now) / 1000),
      remainingInWindow: Math.max(0, WINDOW_LIMIT - ipBucket.timestamps.length),
      sessionRemaining: Math.max(0, SESSION_LIMIT - sessionBucket.count)
    });
  }

  if (sessionBucket.count >= SESSION_LIMIT) {
    return makeStatus({
      allowed: false,
      reason: "session_limit",
      retryAfterSec: Math.ceil((sessionBucket.resetAt - now) / 1000),
      remainingInWindow: Math.max(0, WINDOW_LIMIT - ipBucket.timestamps.length),
      sessionRemaining: 0
    });
  }

  if (ipBucket.timestamps.length >= WINDOW_LIMIT) {
    ipBucket.cooldownUntil = now + COOLDOWN_MS;
    return makeStatus({
      allowed: false,
      reason: "cooldown",
      retryAfterSec: Math.ceil(COOLDOWN_MS / 1000),
      remainingInWindow: 0,
      sessionRemaining: Math.max(0, SESSION_LIMIT - sessionBucket.count)
    });
  }

  ipBucket.timestamps.push(now);
  sessionBucket.count += 1;

  return makeStatus({
    allowed: true,
    remainingInWindow: WINDOW_LIMIT - ipBucket.timestamps.length,
    sessionRemaining: SESSION_LIMIT - sessionBucket.count
  });
}
