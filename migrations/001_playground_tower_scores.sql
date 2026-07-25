BEGIN;

CREATE TABLE IF NOT EXISTS playground_tower_scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  initials VARCHAR(3) NOT NULL CHECK (initials ~ '^[A-Z0-9]{3}$'),
  height_m NUMERIC(5, 1) NOT NULL CHECK (height_m >= 0.1 AND height_m <= 100.0),
  request_hash CHAR(64) NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS playground_tower_scores_top_idx
  ON playground_tower_scores (height_m DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS playground_tower_scores_throttle_idx
  ON playground_tower_scores (request_hash, created_at DESC);

COMMIT;

-- Top 3 query used by the server adapter:
-- SELECT initials, height_m, created_at
-- FROM playground_tower_scores
-- ORDER BY height_m DESC, created_at ASC
-- LIMIT 3;
