import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { hashIp } from "@/lib/agent-kyle/rate-limit";

export const AGENT_SESSION_COOKIE = "ks_agent_sid";

export interface AgentRequestIdentity {
  sessionId: string;
  ipHash: string;
  shouldSetCookie: boolean;
}

function extractIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function getRequestIdentity(request: NextRequest): AgentRequestIdentity {
  const existingSession = request.cookies.get(AGENT_SESSION_COOKIE)?.value;
  const sessionId = existingSession || randomUUID();
  const ip = extractIp(request);

  return {
    sessionId,
    ipHash: hashIp(ip),
    shouldSetCookie: !existingSession
  };
}

export function applySessionCookie(response: NextResponse, identity: AgentRequestIdentity) {
  if (!identity.shouldSetCookie) return;
  response.cookies.set(AGENT_SESSION_COOKIE, identity.sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
}
