# Repository Guidance

## Now feed history

- Treat `content/now/entries.json` as an append-only history. Before publishing a new set of "Now" entries, inspect the file's full Git history and preserve every previously published entry; add new records without deleting or overwriting older ones.
- Give every entry a unique, date-prefixed `id` and retain its original `date`, `category`, `details`, and links so it remains visible at `/archive/now`.
- The homepage `Now` section should show only entries within `expireDays`; expired entries belong in the archive and must remain available there.
- After changing the feed, run `npm run build:index` and commit the resulting `public/search-index.json` so both current and archived entries remain searchable.
- Verify both `/#now` and `/archive/now` whenever the feed or its rendering logic changes.
