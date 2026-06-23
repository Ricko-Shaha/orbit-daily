/** Pure angle + collision + scoring math, shared by the game and the tests. */

export const TAU = Math.PI * 2;

/** Normalize an angle to [0, 2π). */
export function normAngle(a: number): number {
  a %= TAU;
  return a < 0 ? a + TAU : a;
}

/** Smallest absolute angular distance between two angles, in [0, π]. */
export function angularGap(a: number, b: number): number {
  const d = Math.abs(normAngle(a) - normAngle(b));
  return Math.min(d, TAU - d);
}

/** True if the player (at playerAngle) is within hitArc of an incoming hazard. */
export function isHit(playerAngle: number, hazardAngle: number, hitArc: number): boolean {
  return angularGap(playerAngle, hazardAngle) < hitArc;
}

/** Score for a run: reward survival time and each hazard dodged. */
export function scoreFor(survivedS: number, dodged: number): number {
  return Math.max(0, Math.round(survivedS * 10) + dodged * 5);
}
