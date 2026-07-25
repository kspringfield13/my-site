import "server-only";

import { neon } from "@neondatabase/serverless";
import type { LeaderboardEntry } from "@/components/playground/config";

const TOP_LIMIT = 3;

export class LeaderboardUnavailableError extends Error {}
export class LeaderboardThrottledError extends Error {}

type ScoreRow = {
  id: string;
  name: string;
  height: number;
  achieved_at: string | Date;
};

const connectionString = () => process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

export function isLeaderboardReadable() {
  return Boolean(connectionString());
}

export function isScoreSubmissionEnabled() {
  return (
    isLeaderboardReadable() &&
    process.env.PLAYGROUND_LEADERBOARD_ENABLED !== "false" &&
    Boolean(process.env.PLAYGROUND_RATE_LIMIT_SECRET)
  );
}

function database() {
  const url = connectionString();
  if (!url) throw new LeaderboardUnavailableError("Neon database is not configured");
  return neon(url);
}

const mapRow = (row: ScoreRow): LeaderboardEntry => ({
  id: String(row.id),
  name: row.name,
  height: Number(row.height),
  achievedAt:
    row.achieved_at instanceof Date ? row.achieved_at.toISOString() : String(row.achieved_at)
});

export async function getTopTowerScores(): Promise<LeaderboardEntry[]> {
  const sql = database();
  const rows = await sql.query(
    `SELECT
       id::text AS id,
       initials AS name,
       height_m::float8 AS height,
       created_at AS achieved_at
     FROM playground_tower_scores
     ORDER BY height_m DESC, created_at ASC
     LIMIT $1`,
    [TOP_LIMIT]
  );
  return (rows as ScoreRow[]).map(mapRow);
}

export async function insertTowerScore(input: {
  initials: string;
  height: number;
  requestHash: string;
}) {
  if (!isScoreSubmissionEnabled()) {
    throw new LeaderboardUnavailableError("Global score submission is not enabled");
  }

  const sql = database();
  const inserted = await sql.query(
    `INSERT INTO playground_tower_scores (initials, height_m, request_hash)
     SELECT $1, $2, $3
     WHERE NOT EXISTS (
       SELECT 1
       FROM playground_tower_scores
       WHERE request_hash = $3
         AND created_at > NOW() - INTERVAL '12 seconds'
     )
     RETURNING id::text AS id`,
    [input.initials, input.height, input.requestHash]
  );

  if (inserted.length === 0) {
    throw new LeaderboardThrottledError("Please wait before submitting another score");
  }

  return getTopTowerScores();
}
