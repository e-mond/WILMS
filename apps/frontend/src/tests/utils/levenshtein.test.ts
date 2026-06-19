import { describe, expect, it } from 'vitest';
import { levenshteinDistance } from '@/utils/levenshtein';

describe('levenshteinDistance', () => {
  it('returns zero for identical strings', () => {
    expect(levenshteinDistance('Ama Mensah', 'Ama Mensah')).toBe(0);
  });

  it('returns the length when one string is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('counts single-character substitutions', () => {
    expect(levenshteinDistance('Ama Mensah', 'Ama Mensan')).toBe(1);
  });

  it('counts insertions and deletions', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});
