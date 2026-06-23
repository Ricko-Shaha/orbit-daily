import { dailySeed, todayUTC } from "../shared/rng.ts";

/** Client → Devvit server calls, with a local fallback so the game still runs
 *  standalone (offline) using a locally-derived daily seed and no leaderboard. */
export interface Daily { date: string; seed: number; }
export interface LB { date: string; top: { member: string; score: number }[]; }
export interface SubmitResult { date: string; best: number; rank: number; improved: boolean; }

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  daily: () => getJson<Daily>("/api/daily", { date: todayUTC(), seed: dailySeed(todayUTC()) }),
  leaderboard: () => getJson<LB>("/api/leaderboard", { date: todayUTC(), top: [] }),
  submit: (score: number): Promise<SubmitResult> =>
    fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score }) })
      .then((r) => r.json())
      .catch(() => ({ date: todayUTC(), best: score, rank: 0, improved: true })),
};
