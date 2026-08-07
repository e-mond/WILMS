export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const seen = new Map<string, number>();

  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const level = match[1].length;
    const text = match[2].replace(/[#*`]/g, '').trim();
    if (!text) continue;
    let id = slugifyHeading(text);
    const count = (seen.get(id) ?? 0) + 1;
    seen.set(id, count);
    if (count > 1) id = `${id}-${count}`;
    headings.push({ id, text, level });
  }

  return headings;
}

export function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function searchMarkdown(
  markdown: string,
  bookId: string,
  bookTitle: string,
  query: string,
): Array<{ bookId: string; bookTitle: string; heading: string; snippet: string; score: number }> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const results: Array<{
    bookId: string;
    bookTitle: string;
    heading: string;
    snippet: string;
    score: number;
  }> = [];

  const lines = markdown.split(/\r?\n/);
  let currentHeading = bookTitle;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      currentHeading = headingMatch[2].replace(/[#*`]/g, '').trim();
    }

    const lower = line.toLowerCase();
    if (!lower.includes(q)) continue;

    const idx = lower.indexOf(q);
    const start = Math.max(0, idx - 40);
    const end = Math.min(line.length, idx + q.length + 60);
    const snippet = `${start > 0 ? '…' : ''}${line.slice(start, end).trim()}${end < line.length ? '…' : ''}`;
    const score =
      (currentHeading.toLowerCase().includes(q) ? 8 : 0) +
      (bookTitle.toLowerCase().includes(q) ? 5 : 0) +
      (lower.startsWith('#') ? 3 : 1);

    results.push({ bookId, bookTitle, heading: currentHeading, snippet, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
