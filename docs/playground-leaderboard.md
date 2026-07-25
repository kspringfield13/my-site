# Playground leaderboard deployment

The tower leaderboard uses the Neon serverless HTTP driver and runs only on the server. Browser code never receives a database credential.

## Required Vercel configuration

1. Link the Neon database to the Vercel project. The integration supplies a pooled `DATABASE_URL`.
2. Run `migrations/001_playground_tower_scores.sql` once against the intended Neon branch. The migration is idempotent.
3. Optionally add a strong random `PLAYGROUND_RATE_LIMIT_SECRET` to Production, Preview, and Development. When it is absent, the server uses its already-secret database connection string to keep the short-lived submission throttle stable.
4. Leave `PLAYGROUND_LEADERBOARD_ENABLED` unset or set it to `true`. Set it to `false` for an emergency submission kill switch.
5. Redeploy after environment changes.

When `DATABASE_URL` is absent or the schema cannot be queried, the API returns an honest unavailable mode and the browser shows scores from this device only.

## Validation and throttling

- Initials are normalized and must be exactly three ASCII letters or digits.
- Heights are rounded to one decimal place and constrained to 0.1–100.0 m in both the API and database.
- The request IP and user agent are HMAC-hashed with `PLAYGROUND_RATE_LIMIT_SECRET`, or the server-only database connection string when that optional secret is absent; raw network identifiers are not stored.
- The database rejects more than one score from the same request hash within 12 seconds. This is basic abuse resistance, not authoritative anti-cheat: a public browser game cannot prove client-reported physics. Stronger competition integrity would require replay/event verification or an authenticated server simulation.
