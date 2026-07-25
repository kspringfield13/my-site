import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PLAYGROUND_HEIGHT_THRESHOLDS } from "@/components/playground/config";
import {
  getTopTowerScores,
  insertTowerScore,
  isLeaderboardReadable,
  isScoreSubmissionEnabled,
  LeaderboardThrottledError
} from "@/lib/playground/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scoreSchema = z.object({
  initials: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3}$/, "Enter exactly three letters or numbers"),
  height: z.number().finite().min(0.1).max(100)
});

const unavailableResponse = () =>
  NextResponse.json(
    {
      mode: "unavailable",
      submissionEnabled: false,
      entries: [],
      thresholds: [...PLAYGROUND_HEIGHT_THRESHOLDS]
    },
    { headers: { "cache-control": "no-store" } }
  );

export async function GET() {
  if (!isLeaderboardReadable()) return unavailableResponse();

  try {
    const entries = await getTopTowerScores();
    return NextResponse.json(
      {
        mode: "global",
        submissionEnabled: isScoreSubmissionEnabled(),
        entries,
        thresholds: [...PLAYGROUND_HEIGHT_THRESHOLDS]
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    console.error("Playground leaderboard read failed", error);
    return unavailableResponse();
  }
}

export async function POST(request: NextRequest) {
  if (!isScoreSubmissionEnabled()) {
    return NextResponse.json({ error: "Global score submission is unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid score" },
      { status: 400 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const requestHash = createHmac("sha256", process.env.PLAYGROUND_RATE_LIMIT_SECRET!)
    .update(`${address}\u0000${userAgent}`)
    .digest("hex");

  try {
    const entries = await insertTowerScore({
      initials: parsed.data.initials,
      height: Number(parsed.data.height.toFixed(1)),
      requestHash
    });
    return NextResponse.json(
      {
        mode: "global",
        submissionEnabled: true,
        entries,
        thresholds: [...PLAYGROUND_HEIGHT_THRESHOLDS]
      },
      { status: 201, headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof LeaderboardThrottledError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Playground score submission failed", error);
    return NextResponse.json({ error: "Score submission failed" }, { status: 500 });
  }
}
