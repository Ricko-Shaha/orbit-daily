# Devpost submission packet — ORBIT

**Hackathon:** Reddit "Games with a Hook" · **Deadline:** 2026-07-15 18:00 PDT
**Built with:** Devvit Web · Phaser · TypeScript

## Prize tracks this targets (it's designed to hit all four)
- **Best App with a Hook ($15k)** — the shared daily seeded board: same board for the
  whole subreddit each day, fresh tomorrow.
- **Best Use of Retention Mechanics ($3k)** — daily board + daily-best leaderboard gives a
  concrete reason to return every day.
- **Best Use of User Contributions ($3k)** — the community leaderboard is the content;
  every player's run populates the day's board.
- **Best Use of Phaser ($5k)** — the whole arcade game is Phaser.

## Text description (paste into Devpost)

**ORBIT — one button, one shared board, every day.** You orbit a star; asteroids streak
inward on a schedule that's *deterministically seeded from today's date*, so everyone in
the subreddit faces the identical board and scores are directly comparable. Tap to reverse
your orbit and dodge. It takes three seconds to understand and all day to master — and
because the board resets every day, there's always a reason to come back and reclaim the
top of your subreddit's leaderboard. Built on Devvit Web with Phaser; the daily seed and
community leaderboard run on Devvit's server + Redis.

## What to submit (Reddit's requirements)
- [ ] **App listing** — link to the app on developer.reddit.com (after `devvit upload`).
- [ ] **Demo post** — link to a public post in your test subreddit running the game.
      Judging is *primarily live community play of this post*, so make sure the board
      loads and the one-line instruction is visible.
- [ ] *(Optional)* Developer-platform satisfaction survey → Best Feedback prize.

## Steps for you (needs your Reddit account)
1. `npm i -g devvit && devvit login` (Reddit account).
2. Scaffold with the current CLI (`npm create devvit@latest`, Phaser/web template) and
   drop in `src/shared`, `src/client`, `src/server` from this repo; keep `devvit.json`
   aligned with the template (see README note).
3. `devvit playtest <your-subreddit>` to verify it renders + plays on Reddit.
4. `devvit upload`, then use the subreddit menu action to create the **demo post**.
5. Share the demo post (even in r/Devvit / your own sub) to get real community plays —
   that's what judges score.

## Status (done by the build)
- ✅ Complete game + mechanics; `standalone.html` is fully playable in a browser now.
- ✅ Deterministic daily-seed engine + collision + scoring, **10 passing tests**.
- ✅ Server logic for daily seed + best-score leaderboard (Redis adapter ready).
- ✅ Devvit Web client/server/manifest scaffold + README + this packet.
- ⏳ Only the live Devvit deploy + demo post need your Reddit account (can't be automated).
