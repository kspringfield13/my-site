# Repository Guidance

## Now feed history

- Treat `content/now/entries.json` as an append-only history. When publishing a new set of "Now" entries, add them without deleting or overwriting older entries.
- Give every entry a unique, date-prefixed `id` and retain its original `date`, `category`, `details`, and links so it remains visible at `/archive/now`.
- The homepage `Now` section should show only entries within `expireDays`; expired entries belong in the archive and must remain available there.
- After changing the feed, run `npm run build:index` and commit the resulting `public/search-index.json` so both current and archived entries remain searchable.
- Verify both `/#now` and `/archive/now` whenever the feed or its rendering logic changes.
