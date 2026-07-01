import { describe, expect, it } from 'vitest';
import { resolveCollectorDisplayId } from '@/utils/entity-display-id';

describe('resolveCollectorDisplayId', () => {
  it('prefers displayId when present', () => {
    expect(
      resolveCollectorDisplayId({
        id: '01930000-0001-7000-8000-000000000002',
        displayId: 'COL-011',
      }),
    ).toBe('COL-011');
  });

  it('uses readable collector id when displayId is missing', () => {
    expect(resolveCollectorDisplayId({ id: 'COL-011' })).toBe('COL-011');
  });

  it('falls back to formatted sequence for opaque ids', () => {
    expect(
      resolveCollectorDisplayId(
        { id: '01930000-0001-7000-8000-000000000002' },
        11,
      ),
    ).toBe('COL-011');
  });

  it('defaults to COL-000 when no display hints exist', () => {
    expect(resolveCollectorDisplayId({ id: '01930000-0001-7000-8000-000000000002' })).toBe(
      'COL-000',
    );
  });
});
