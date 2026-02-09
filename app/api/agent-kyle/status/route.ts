import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, getRequestIdentity } from "@/lib/agent-kyle/http";
import { inspectAgentAvailability } from "@/lib/agent-kyle/status";

export async function GET(request: NextRequest) {
  const identity = getRequestIdentity(request);
  const status = inspectAgentAvailability({
    ipHash: identity.ipHash,
    sessionId: identity.sessionId
  });

  const response = NextResponse.json(status);
  applySessionCookie(response, identity);
  return response;
}
