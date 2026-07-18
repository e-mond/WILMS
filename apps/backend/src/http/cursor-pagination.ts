/**
 * Opaque cursor (keyset) pagination helpers — v1.4 Phase 25.
 * Stable ordering: (sortValue, id) with id as tie-breaker.
 */
import { Buffer } from 'node:buffer';

export const DEFAULT_CURSOR_PAGE_SIZE = 50;
export const MAX_CURSOR_PAGE_SIZE = 200;

export interface CursorPayload {
  /** ISO timestamp or comparable sort key */
  v: string;
  /** Primary key / uuid tie-breaker */
  id: string;
}

export interface CursorListParams {
  limit: number;
  cursor: CursorPayload | null;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  limit: number;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(raw: string | undefined | null): CursorPayload | null {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return null;
  }
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as CursorPayload;
    if (typeof parsed?.v !== 'string' || typeof parsed?.id !== 'string') {
      return null;
    }
    if (parsed.v.length > 128 || parsed.id.length > 128) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCursorListQuery(query: Record<string, unknown>): CursorListParams | null {
  if (query.cursor === undefined && query.limit === undefined && query.pageSize === undefined) {
    // Only activate when client opts into cursor mode via `cursor` or explicit `pagination=cursor`
    if (query.pagination !== 'cursor') {
      return null;
    }
  }
  if (query.cursor === undefined && query.pagination !== 'cursor') {
    return null;
  }

  const limit = Math.min(
    MAX_CURSOR_PAGE_SIZE,
    parsePositiveInt(query.limit ?? query.pageSize, DEFAULT_CURSOR_PAGE_SIZE),
  );
  const cursor =
    typeof query.cursor === 'string' ? decodeCursor(query.cursor) : null;

  return { limit, cursor };
}

export function buildCursorPage<T extends { id: string }>(
  rows: T[],
  limit: number,
  sortValueOf: (row: T) => string,
  previousCursorEncoded: string | null = null,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ v: sortValueOf(last), id: last.id })
      : null;

  return {
    items,
    nextCursor,
    prevCursor: previousCursorEncoded,
    limit,
  };
}
