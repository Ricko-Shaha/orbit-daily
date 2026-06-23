import Phaser from "phaser";
import { buildLevel } from "../shared/level.ts";
import { angularGap, normAngle, scoreFor } from "../shared/score.ts";
import { api } from "./api.ts";

/**
 * Production (Devvit) build of ORBIT. Same mechanics as standalone.html, but it
 * fetches the daily seed from the server and submits scores to the community
 * leaderboard. Reuses the verified shared logic in src/shared/*.
 */
const W = 420, H = 560, CX = W / 2, CY = H / 2, R = 120;
const HITARC = 0.34, PLR = 9, HZR = 9, START = Math.hypot(W, H) / 2 + 30, OMEGA = 2.3;

type Haz = { t: number; angle: number; speed: number; done: boolean };

class Orbit extends Phaser.Scene {
  g!: Phaser.GameObjects.Graphics;
  hud!: Phaser.GameObjects.Text;
  center!: Phaser.GameObjects.Text;
  state: "loading" | "ready" | "play" | "dead" = "loading";
  theta = -Math.PI / 2; dir = 1; t = 0; dodged = 0; score = 0; shake = 0;
  haz: Haz[] = [];
  burst: { x: number; y: number; a: number; sp: number; life: number }[] = [];
  date = ""; seed = 0; lbText = "";

  async create() {
    this.g = this.add.graphics();
    this.add.text(CX, 30, "ORBIT", { fontFamily: "monospace", fontSize: "34px", color: "#7fd1ff" }).setOrigin(0.5);
    this.hud = this.add.text(10, H - 26, "", { fontFamily: "monospace", fontSize: "13px", color: "#cdd6ee" });
    this.center = this.add.text(CX, CY, "loading today's board…", { fontFamily: "monospace", fontSize: "15px", color: "#e9eefc", align: "center" }).setOrigin(0.5);
    this.input.keyboard?.on("keydown-SPACE", () => this.act());
    this.input.on("pointerdown", () => this.act());

    const d = await api.daily();
    this.date = d.date; this.seed = d.seed;
    await this.refreshBoard();
    this.haz = buildLevel(this.seed).map((h) => ({ ...h, done: false }));
    this.state = "ready";
    this.center.setText(`tap / space to reverse\n\ndaily board ${this.date}\n${this.lbText}`);
  }

  async refreshBoard() {
    const lb = await api.leaderboard();
    this.lbText = lb.top.length ? "top: " + lb.top.slice(0, 3).map((e, i) => `${i + 1}. ${e.member} ${e.score}`).join("  ") : "be the first to post a score!";
  }

  act() {
    if (this.state === "ready" || this.state === "dead") { this.start(); return; }
    if (this.state === "play") this.dir *= -1;
  }
  start() {
    this.theta = -Math.PI / 2; this.dir = 1; this.t = 0; this.dodged = 0; this.score = 0;
    this.haz = buildLevel(this.seed).map((h) => ({ ...h, done: false }));
    this.center.setText(""); this.state = "play";
  }
  async over() {
    this.state = "dead"; this.shake = 14;
    for (let i = 0; i < 22; i++) this.burst.push({ x: CX + R * Math.cos(this.theta), y: CY + R * Math.sin(this.theta), a: Math.random() * Math.PI * 2, sp: 60 + Math.random() * 160, life: 1 });
    this.center.setText(`CRASH — score ${this.score}\nsubmitting…`);
    const res = await api.submit(this.score);
    await this.refreshBoard();
    this.center.setText(`CRASH — score ${this.score}\nbest ${res.best}${res.rank ? `  ·  rank #${res.rank}` : ""}\n\n${this.lbText}\n\ntap to retry`);
  }

  update(_: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (this.state === "play") {
      this.t += dt; this.theta = normAngle(this.theta + this.dir * OMEGA * dt);
      this.score = scoreFor(this.t, this.dodged);
      for (const h of this.haz) {
        if (h.done || this.t < h.t) continue;
        const dist = START - h.speed * (this.t - h.t);
        if (dist <= R) {
          if (angularGap(this.theta, h.angle) < HITARC) { void this.over(); break; }
          h.done = true; this.dodged++;
        }
      }
    }
    this.hud.setText(`score ${this.score}   ${this.t.toFixed(1)}s   dodged ${this.dodged}`);
    this.draw(dt);
  }

  draw(dt: number) {
    const g = this.g; g.clear();
    const ox = this.shake ? (Math.random() - 0.5) * this.shake : 0, oy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    this.shake = Math.max(0, this.shake - 0.6);
    g.lineStyle(2, 0x2a3566, 1); g.strokeCircle(CX + ox, CY + oy, R);
    g.fillStyle(0x2a6bff, 0.18); g.fillCircle(CX + ox, CY + oy, 30);
    g.fillStyle(0x7fd1ff, 1); g.fillCircle(CX + ox, CY + oy, 11);
    for (const h of this.haz) {
      if (h.done || this.t < h.t) continue;
      const dist = START - h.speed * (this.t - h.t);
      if (dist < R - 14 || dist > START + 5) continue;
      const x = CX + dist * Math.cos(h.angle) + ox, y = CY + dist * Math.sin(h.angle) + oy;
      g.lineStyle(2, 0xff6b6b, 0.22); g.lineBetween(x, y, CX + R * Math.cos(h.angle) + ox, CY + R * Math.sin(h.angle) + oy);
      g.fillStyle(0xff6b6b, 1); g.fillCircle(x, y, HZR);
    }
    const px = CX + R * Math.cos(this.theta) + ox, py = CY + R * Math.sin(this.theta) + oy;
    g.fillStyle(0x6effa6, 0.25); g.fillCircle(px, py, PLR + 6);
    g.fillStyle(0x6effa6, 1); g.fillCircle(px, py, PLR);
    for (const p of this.burst) { p.life -= dt * 1.6; if (p.life <= 0) continue; p.x += Math.cos(p.a) * p.sp * dt; p.y += Math.sin(p.a) * p.sp * dt; g.fillStyle(0xffd36b, Math.max(0, p.life)); g.fillCircle(p.x + ox, p.y + oy, 3); }
    this.burst = this.burst.filter((p) => p.life > 0);
  }
}

new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: "game", backgroundColor: "#06070d",
  scene: Orbit, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
