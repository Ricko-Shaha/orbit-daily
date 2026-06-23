/**
 * Deterministic RNG + daily seed. The whole point of ORBIT's "hook": every player
 * in the subreddit faces the *exact same* board on a given day, derived from the
 * UTC date — so scores are directly comparable and there's a fresh board tomorrow.
 */

/** Fast, well-distributed seeded PRNG (mulberry32). Same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash → 32-bit unsigned. */
export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seed for a given UTC date string, e.g. "2026-06-22". */
export function dailySeed(dateUTC: string): number {
  return hashStr("orbit:v1:" + dateUTC);
}

/** Today's date in UTC as YYYY-MM-DD (the daily-board key). */
export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
