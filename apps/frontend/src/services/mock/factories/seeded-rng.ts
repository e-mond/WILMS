export type SeededRng = () => number;

/** Deterministic PRNG (mulberry32) for reproducible demo factories. */
export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pickFrom<T>(rng: SeededRng, items: readonly T[]): T {
  const index = Math.floor(rng() * items.length);
  return items[index] as T;
}

export function randomInt(rng: SeededRng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
