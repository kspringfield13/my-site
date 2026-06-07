import type { NowCategory, NowFeed } from "@/lib/types";

const categoryOrder: NowCategory[] = ["ventures", "tools", "ideas", "models"];

export function getNowEntryAgeDays(date: string) {
  const ms = Date.now() - Date.parse(date);
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function formatNowEntryDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC"
  });
}

export function partitionNowEntries(now: NowFeed) {
  const seenIds = new Set<string>();
  const entries = now.entries.filter((entry) => {
    if (seenIds.has(entry.id)) {
      return false;
    }

    seenIds.add(entry.id);
    return true;
  });
  const eligibleEntries = entries.filter(
    (entry) => getNowEntryAgeDays(entry.date) <= now.expireDays
  );
  const currentEntries = categoryOrder.flatMap((category) => {
    const latestEntry = eligibleEntries
      .filter((entry) => entry.category === category)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];

    return latestEntry ? [latestEntry] : [];
  });
  const currentIds = new Set(currentEntries.map((entry) => entry.id));
  const previousEntries = entries
    .filter((entry) => !currentIds.has(entry.id))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const previousDate = previousEntries[0]?.date;
  const archivedEntries = previousEntries.filter((entry) => entry.date === previousDate);

  return { currentEntries, archivedEntries };
}
