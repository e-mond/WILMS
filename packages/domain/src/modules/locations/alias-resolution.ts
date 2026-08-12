/**
 * Location alias normalisation and fuzzy scoring (reusable offline + online).
 * British English spellings in comments and docs.
 */

export function normaliseLocationQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice coefficient on character bigrams — typo-tolerant without requiring Postgres. */
export function scoreSimilarity(a: string, b: string): number {
  const left = normaliseLocationQuery(a);
  const right = normaliseLocationQuery(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (left.startsWith(right) || right.startsWith(left)) {
    return 0.92;
  }
  if (left.includes(right) || right.includes(left)) {
    return 0.85;
  }

  const bigrams = (value: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < value.length - 1; i += 1) {
      const gram = value.slice(i, i + 2);
      map.set(gram, (map.get(gram) ?? 0) + 1);
    }
    return map;
  };

  const aGrams = bigrams(left);
  const bGrams = bigrams(right);
  let overlap = 0;
  for (const [gram, count] of aGrams) {
    overlap += Math.min(count, bGrams.get(gram) ?? 0);
  }
  const total = [...aGrams.values()].reduce((sum, n) => sum + n, 0)
    + [...bGrams.values()].reduce((sum, n) => sum + n, 0);
  return total === 0 ? 0 : (2 * overlap) / total;
}

export type LocationEntityType =
  | 'region'
  | 'district'
  | 'sub_district_unit'
  | 'electoral_area'
  | 'community';

export interface LocationNameCandidate {
  entityType: LocationEntityType;
  entityId: string;
  name: string;
  aliases?: string[];
  regionId?: string | null;
  districtId?: string | null;
}

export interface LocationResolutionMatch extends LocationNameCandidate {
  score: number;
  matchKind: 'exact' | 'alias' | 'normalised' | 'fuzzy';
}

export function resolveAgainstCandidates(
  query: string,
  candidates: LocationNameCandidate[],
  options?: { fuzzyThreshold?: number; limit?: number },
): LocationResolutionMatch[] {
  const normalisedQuery = normaliseLocationQuery(query);
  if (!normalisedQuery) {
    return [];
  }
  const fuzzyThreshold = options?.fuzzyThreshold ?? 0.72;
  const limit = options?.limit ?? 10;
  const matches: LocationResolutionMatch[] = [];

  for (const candidate of candidates) {
    const nameKey = normaliseLocationQuery(candidate.name);
    if (candidate.name.trim().toLowerCase() === query.trim().toLowerCase()) {
      matches.push({ ...candidate, score: 1, matchKind: 'exact' });
      continue;
    }
    if (nameKey === normalisedQuery) {
      matches.push({ ...candidate, score: 0.99, matchKind: 'normalised' });
      continue;
    }

    let aliasHit = false;
    for (const alias of candidate.aliases ?? []) {
      if (alias.trim().toLowerCase() === query.trim().toLowerCase()) {
        matches.push({ ...candidate, score: 0.98, matchKind: 'alias' });
        aliasHit = true;
        break;
      }
      if (normaliseLocationQuery(alias) === normalisedQuery) {
        matches.push({ ...candidate, score: 0.97, matchKind: 'alias' });
        aliasHit = true;
        break;
      }
    }
    if (aliasHit) {
      continue;
    }

    let best = scoreSimilarity(normalisedQuery, nameKey);
    for (const alias of candidate.aliases ?? []) {
      best = Math.max(best, scoreSimilarity(normalisedQuery, alias));
    }
    if (best >= fuzzyThreshold) {
      matches.push({ ...candidate, score: best, matchKind: 'fuzzy' });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
