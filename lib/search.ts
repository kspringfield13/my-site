import type { SearchDoc } from "@/lib/types";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function fuzzyContains(text: string, query: string) {
  let q = 0;
  for (let i = 0; i < text.length && q < query.length; i += 1) {
    if (text[i] === query[q]) {
      q += 1;
    }
  }
  return q === query.length;
}

export function scoreDoc(doc: SearchDoc, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const title = normalize(doc.title);
  const body = normalize(doc.body);
  const tags = normalize(doc.tags.join(" "));

  let score = 0;

  if (title === query) score += 140;
  if (title.includes(query)) score += 100;
  if (tags.includes(query)) score += 65;
  if (body.includes(query)) score += 35;
  if (fuzzyContains(title, query)) score += 20;
  if (fuzzyContains(tags, query)) score += 12;
  if (fuzzyContains(body, query)) score += 8;

  if (doc.type === "Project") score += 2;

  return score;
}

export function rankSearchResults(docs: SearchDoc[], query: string) {
  const normalized = normalize(query);
  if (!normalized) return [];

  return docs
    .map((doc) => ({ doc, score: scoreDoc(doc, normalized) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map((item) => item.doc);
}
