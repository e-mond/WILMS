import { describe, expect, it } from 'vitest';
import {
  buildCursorPage,
  decodeCursor,
  encodeCursor,
  parseCursorListQuery,
} from '../../http/cursor-pagination.js';

describe('cursor pagination', () => {
  it('round-trips opaque cursors', () => {
    const encoded = encodeCursor({ v: '2026-07-18T00:00:00.000Z', id: 'abc' });
    expect(decodeCursor(encoded)).toEqual({ v: '2026-07-18T00:00:00.000Z', id: 'abc' });
  });

  it('builds next cursor when more rows exist', () => {
    const rows = [
      { id: '1', registeredAt: '2026-07-18T02:00:00.000Z' },
      { id: '2', registeredAt: '2026-07-18T01:00:00.000Z' },
      { id: '3', registeredAt: '2026-07-18T00:00:00.000Z' },
    ];
    const page = buildCursorPage(rows, 2, (row) => row.registeredAt);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeTruthy();
    expect(decodeCursor(page.nextCursor)).toEqual({
      v: '2026-07-18T01:00:00.000Z',
      id: '2',
    });
  });

  it('activates when pagination=cursor', () => {
    const parsed = parseCursorListQuery({ pagination: 'cursor', limit: '10' });
    expect(parsed?.limit).toBe(10);
    expect(parsed?.cursor).toBeNull();
  });
});
