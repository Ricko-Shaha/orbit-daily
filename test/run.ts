import assert from "node:assert/strict";
import process from "node:process";
import { dailySeed, mulberry32, todayUTC } from "../src/shared/rng.ts";
import { buildLevel } from "../src/shared/level.ts";
import { angularGap, isHit, normAngle, scoreFor, TAU } from "../src/shared/score.ts";
import { handleDaily, handleLeaderboard, handleSubmit, type KV, type ScoreEntry } from "../src/server/index.ts";

/** In-memory sorted-set KV for testing the server logic without Devvit/Redis. */
function memKV(): KV {
  const m = new Map<string, Map<string, number>>();
  const set = (k: string) => m.get(k) ?? (m.set(k, new Map()), m.get(k)!);
  return {
    async zAdd(k, member, score) { set(k).set(member, score); },
    async zScore(k, member) { return set(k).get(member); },
    async zRangeTop(k, n) {
      return [...set(k).entries()].map(([member, score]): ScoreEntry => ({ member, score }))
        .sort((a, b) => b.score - a.score).slice(0, n);
    },
  };
}

let passed = 0, failed = 0;
const queue: { name: string; fn: () => void | Promise<void> }[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  queue.push({ name, fn });
}
function avgGap(hz: { t: number }[]): number {
  if (hz.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < hz.length; i++) sum += hz[i].t - hz[i - 1].t;
  return sum / (hz.length - 1);
}

console.log("ORBIT shared-logic tests\n");

test("daily seed is deterministic per date and varies across dates", () => {
  assert.equal(dailySeed("2026-06-22"), dailySeed("2026-06-22"));
  assert.notEqual(dailySeed("2026-06-22"), dailySeed("2026-06-23"));
});

test("todayUTC returns a YYYY-MM-DD string", () => {
  assert.match(todayUTC(new Date("2026-06-22T09:00:00Z")), /^2026-06-22$/);
});

test("mulberry32 is reproducible and in [0,1)", () => {
  const a = mulberry32(123), b = mulberry32(123);
  for (let i = 0; i < 5; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test("buildLevel is deterministic for a seed (same board for everyone)", () => {
  const s = dailySeed("2026-06-22");
  assert.deepEqual(buildLevel(s), buildLevel(s));
});

test("level hazards are time-ordered and difficulty escalates (gaps shrink)", () => {
  const hz = buildLevel(dailySeed("2026-06-22"), { durationS: 60 });
  assert.ok(hz.length > 10, "should produce many hazards");
  for (let i = 1; i < hz.length; i++) assert.ok(hz[i].t >= hz[i - 1].t, "times ascending");
  const firstGaps = avgGap(hz.slice(0, 6));
  const lateGaps = avgGap(hz.slice(-6));
  assert.ok(lateGaps < firstGaps, `late gaps (${lateGaps.toFixed(2)}) should be tighter than early (${firstGaps.toFixed(2)})`);
});

test("angular math: normAngle wraps, gap is symmetric and wraps around TAU", () => {
  assert.ok(Math.abs(normAngle(-0.1) - (TAU - 0.1)) < 1e-9);
  assert.ok(Math.abs(angularGap(0.1, TAU - 0.1) - 0.2) < 1e-9, "should take the short way round");
  assert.equal(angularGap(0, Math.PI), Math.PI);
});

test("isHit: true when aligned, false when on the opposite side", () => {
  assert.equal(isHit(1.0, 1.05, 0.25), true);
  assert.equal(isHit(0, Math.PI, 0.25), false);
});

test("scoreFor rewards survival and dodges, never negative", () => {
  assert.equal(scoreFor(10, 4), 120);
  assert.ok(scoreFor(30, 12) > scoreFor(10, 4));
  assert.equal(scoreFor(-5, 0), 0);
});

test("server: daily board seed matches shared dailySeed", () => {
  const d = handleDaily(new Date("2026-06-22T10:00:00Z"));
  assert.equal(d.date, "2026-06-22");
  assert.equal(d.seed, dailySeed("2026-06-22"));
});

test("server: submit keeps a player's best and ranks the leaderboard", async () => {
  const kv = memKV();
  const now = new Date("2026-06-22T10:00:00Z");
  await handleSubmit(kv, "alice", 100, now);
  const lower = await handleSubmit(kv, "alice", 60, now); // should NOT replace best
  assert.equal(lower.best, 100, "keeps the higher score");
  assert.equal(lower.improved, false);
  await handleSubmit(kv, "bob", 150, now);
  const lb = await handleLeaderboard(kv, 10, now);
  assert.deepEqual(lb.top.map((e) => e.member), ["bob", "alice"], "ranked high→low");
  assert.equal(lb.top[0].score, 150);
});

for (const { name, fn } of queue) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}\n     ${(e as Error).message}`); }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
