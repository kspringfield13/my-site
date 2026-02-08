import { NextResponse } from "next/server";
import { getNowEntries, getWritingIndex } from "@/lib/content";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kylespringfield.dev";
  const now = await getNowEntries();
  const writing = await getWritingIndex();

  const items = [
    ...now.entries.map((entry) => ({
      title: `[Now] ${entry.title}`,
      link: `${site}/#now`,
      pubDate: new Date(entry.date).toUTCString(),
      description: entry.outcome
    })),
    ...writing.map((post) => ({
      title: post.title,
      link: `${site}/writing/${post.slug}`,
      pubDate: new Date(post.date).toUTCString(),
      description: post.summary
    }))
  ].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Kyle Springfield — Now + Writing</title>
  <link>${site}</link>
  <description>Experiments, notes, and project updates.</description>
  ${items
    .map(
      (item) => `<item>
    <title>${escapeXml(item.title)}</title>
    <link>${item.link}</link>
    <pubDate>${item.pubDate}</pubDate>
    <description>${escapeXml(item.description)}</description>
  </item>`
    )
    .join("\n")}
</channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
