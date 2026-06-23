import { mulberry32 } from "./rng.ts";

/**
 * A hazard is an asteroid that flies inward from off-screen toward the orbit ring,
 * aimed at a fixed angle. The player (orbiting the centre) must not be at that angle
 * when it arrives. The schedule is fully determined by the seed — identical for every
 * player on the same day — and ramps in difficulty over time (faster, tighter gaps).
 */
export interface Hazard {
  /** spawn time in seconds from game start */
  t: number;
  /** target angle on the ring, radians [0, 2π) */
  angle: number;
  /** inward speed, px/s */
  speed: number;
}

export interface LevelParams {
  durationS?: number;
  baseSpeed?: number;
}

/** Build the deterministic hazard schedule for a seed. Pure: same seed → same level. */
export function buildLevel(seed: number, params: LevelParams = {}): Hazard[] {
  const durationS = params.durationS ?? 120;
  const baseSpeed = params.baseSpeed ?? 150;
  const rnd = mulberry32(seed);
  const hazards: Hazard[] = [];
  let t = 1.5;
  while (t < durationS) {
    const angle = rnd() * Math.PI * 2;
    const speed = baseSpeed + rnd() * 70 + t * 1.4; // ramps up over time
    hazards.push({ t: round(t, 3), angle: round(angle, 4), speed: round(speed, 1) });
    // Gaps shrink as the run goes on → escalating difficulty, with seeded jitter.
    const gap = Math.max(0.4, 1.6 - t * 0.013 - rnd() * 0.35);
    t += gap;
  }
  return hazards;
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
