/**
 * Devvit server — daily board seed + community leaderboard (Redis-backed).
 *
 * The leaderboard logic is written against a tiny `KV` interface so it's pure and
 * testable; the Devvit adapter at the bottom wires it to Devvit's Redis + HTTP
 * router. NOTE: import names/shape for the Devvit server runtime change between CLI
 * versions — this targets Devvit Web (~0.13). After `npm create devvit@latest`,
 * align the imports with your installed `@devvit/web/server` and mount `handle*`.
 */
import { dailySeed, todayUTC } from "../shared/rng.ts";

export interface ScoreEntry {
  member: string; // username
  score: number;
}

/** Minimal sorted-set KV surface (matches Devvit Redis: zAdd / zRange / zScore). */
export interface KV {
  zAdd(key: string, member: string, score: number): Promise<void>;
  zRangeTop(key: string, n: number): Promise<ScoreEntry[]>;
  zScore(key: string, member: string): Promise<number | undefined>;
}

const boardKey = (date: string) => `orbit:board:${date}`;

/** Today's deterministic board seed — identical for every player in the subreddit. */
export function handleDaily(now = new Date()) {
  const date = todayUTC(now);
  return { date, seed: dailySeed(date) };
}

/** Submit a score; only keeps a player's best for the day. Returns their rank+best. */
export async function handleSubmit(kv: KV, username: string, score: number, now = new Date()) {
  const date = todayUTC(now);
  const key = boardKey(date);
  const prev = (await kv.zScore(key, username)) ?? 0;
  if (score > prev) await kv.zAdd(key, username, score);
  const best = Math.max(prev, score);
  const top = await kv.zRangeTop(key, 100);
  const rank = top.findIndex((e) => e.member === username) + 1 || top.length + 1;
  return { date, best, rank, improved: score > prev };
}

/** Top N scores for today's board. */
export async function handleLeaderboard(kv: KV, n = 10, now = new Date()) {
  const date = todayUTC(now);
  return { date, top: await kv.zRangeTop(boardKey(date), n) };
}

/* --------------------------------------------------------------------------
 * Devvit adapter (uncomment after scaffolding with the Devvit CLI). Example
 * shape for Devvit Web's Node server + Redis:
 *
 * import { createServer, redis, reddit } from "@devvit/web/server";
 * const kv: KV = {
 *   zAdd: (k, m, s) => redis.zAdd(k, { member: m, score: s }),
 *   zScore: (k, m) => redis.zScore(k, m),
 *   zRangeTop: async (k, n) => (await redis.zRange(k, 0, n - 1, { reverse: true, by: "rank" }))
 *       .map((x) => ({ member: x.member, score: x.score })),
 * };
 * const app = createServer();
 * app.get("/api/daily", (_req, res) => res.json(handleDaily()));
 * app.get("/api/leaderboard", async (_req, res) => res.json(await handleLeaderboard(kv)));
 * app.post("/api/submit", async (req, res) => {
 *   const user = (await reddit.getCurrentUsername()) ?? "anon";
 *   res.json(await handleSubmit(kv, user, Number(req.body?.score) || 0));
 * });
 * export default app;
 * -------------------------------------------------------------------------- */
