# 🛰️ ORBIT — a one-button daily game for Reddit

**Everyone in the subreddit plays the *exact same* board today. One button. Beat your
neighbours, come back tomorrow for a new board.**

Submission for **Reddit's "Games with a Hook" Hackathon** — built on **Devvit Web + Phaser**.

## The hook (why people come back)

Most arcade games are solitary and random. ORBIT's board is **deterministically seeded
from the UTC date**, so *every redditor faces the identical sequence of hazards on a
given day*. That turns a simple skill game into a daily community competition:

- **Retention:** a brand-new board every day → a reason to return. Your best-of-the-day
  is what counts.
- **User contributions / social:** every score feeds the subreddit's **daily
  leaderboard**; the community board *is* the content, and it resets fresh each day.
- **Collective joy + self-explanatory:** one rule — *tap/space to reverse your orbit and
  dodge the asteroids.* You understand it in three seconds, which matters because the
  hackathon is judged on live community play.

## Gameplay

You orbit a star. Asteroids fly inward toward the ring at seeded times and angles. Tap
(or Space) to **reverse your orbit direction** and be on the opposite side when one
arrives. Survive as long as you can; score rewards time survived + hazards dodged.

## Try it right now (no install)

Open **[`standalone.html`](standalone.html)** in any browser — a fully self-contained,
playable build (Phaser via CDN). This is the quickest way to feel the hook.

## Deploy to Reddit (the actual submission)

This repo is structured for **Devvit Web**:

```
src/shared/   rng.ts · level.ts · score.ts   ← pure, deterministic, unit-tested
src/client/   index.html · main.ts · api.ts   ← Phaser game (production build)
src/server/   index.ts                        ← daily seed + Redis leaderboard
devvit.json   app manifest
standalone.html   instant browser preview
test/run.ts   10 passing tests (logic + leaderboard)
```

Steps:

```bash
npm install -g devvit && devvit login
npm install                       # phaser
# Align the project with the current CLI (the Devvit schema evolves):
#   npm create devvit@latest      → pick the Phaser/web template, then drop in
#   src/shared, src/client (game), and src/server (handlers) from this repo.
devvit playtest <your-test-subreddit>   # live-reload on Reddit
devvit upload                            # publish the app
# Then use the subreddit menu action "Create ORBIT daily post" to make the demo post.
```

> **Honest note:** the game + all logic are complete and tested here, and `standalone.html`
> is fully playable. The Devvit *wrapper* (`devvit.json`, server import names) tracks
> Devvit Web ~v0.13 — confirm against your installed CLI version, since Reddit changes
> the schema between releases. The server logic in `src/server/index.ts` is written
> against a small `KV` interface with a ready-to-uncomment Devvit Redis adapter.

## Tests

```
npm test
  ✅ daily seed deterministic per date · varies across dates
  ✅ level is deterministic for a seed (same board for everyone)
  ✅ difficulty escalates (gaps shrink over time)
  ✅ angular collision math · scoring
  ✅ server: submit keeps a player's best · leaderboard ranks high→low
  10 passed, 0 failed
```

## License

MIT — see [LICENSE](LICENSE).
