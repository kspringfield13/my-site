export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeFreeText(value: string, maxLength: number): string {
  const trimmed = normalizeWhitespace(value);
  const withoutControl = trimmed.replace(/[\u0000-\u001F\u007F]/g, "");
  return withoutControl.slice(0, maxLength);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function toTitleCase(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return normalized;
  return normalized
    .split(" ")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function stripMarkdownCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```")) {
    return trimmed;
  }

  const firstLineEnd = trimmed.indexOf("\n");
  if (firstLineEnd === -1) {
    return trimmed.replace(/```/g, "").trim();
  }

  return trimmed.slice(firstLineEnd + 1, -3).trim();
}
