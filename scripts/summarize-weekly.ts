#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

interface NowEntry {
  id: string;
  date: string;
  category: string;
  title: string;
  tried: string;
  outcome: string;
  nextStep: string;
}

function mondayOf(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = (day + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

async function main() {
  const base = process.cwd();
  const inputPath = path.join(base, "content", "now", "entries.json");
  const outputPath = path.join(base, "content", "now", "weekly-summary.json");
  const nowRaw = await fs.readFile(inputPath, "utf8");
  const nowData = JSON.parse(nowRaw) as { entries: NowEntry[] };

  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEntries = nowData.entries.filter((entry) => {
    const date = new Date(entry.date);
    return date >= weekStart;
  });

  const summary = {
    weekOf: weekStart.toISOString().slice(0, 10),
    summary:
      weekEntries.length === 0
        ? "No new experiments logged this week."
        : `This week focused on ${weekEntries[0].category} work, with emphasis on measurable outcomes and the next iteration step.`,
    bullets: weekEntries.slice(0, 3).map((entry) => `${entry.title}: ${entry.outcome}`)
  };

  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
