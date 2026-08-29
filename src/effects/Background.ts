import { WORLD } from "../game/GameConfig.ts";
import type { Environment, LevelPalette } from "../levels/LevelConfig.ts";

interface Star { x: number; y: number; size: number; speed: number; alpha: number }

export class Background {
  private readonly farStars: Star[] = this.createStars(48, 22, 0.55);
  private readonly nearStars: Star[] = this.createStars(34, 74, 0.9);
  private cityOffset = 0; private cloudOffset = 0; private streakTimer = 2;

  private createStars(count: number, speed: number, alpha: number): Star[] {
    return Array.from({ length: count }, () => ({ x: Math.random() * WORLD.width, y: Math.random() * WORLD.height, size: 0.5 + Math.random() * 1.7, speed: speed * (0.6 + Math.random() * 0.8), alpha: alpha * (0.5 + Math.random() * 0.5) }));
  }

  update(dt: number, intensity: number): void {
    for (const layer of [this.farStars, this.nearStars]) for (const star of layer) { star.y += star.speed * intensity * dt; if (star.y > WORLD.height) { star.y = -5; star.x = Math.random() * WORLD.width; } }
    this.cityOffset = (this.cityOffset + 14 * intensity * dt) % 120;
    this.cloudOffset = (this.cloudOffset + 62 * intensity * dt) % 260;
    this.streakTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D, time: number, intensity: number, palette: LevelPalette, environment: Environment): void {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height); sky.addColorStop(0, palette.top); sky.addColorStop(0.55, palette.middle); sky.addColorStop(1, palette.bottom); ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.save();
    for (const star of this.farStars) { ctx.globalAlpha = star.alpha; ctx.fillStyle = palette.accent; ctx.fillRect(star.x, star.y, star.size, star.size); }
    ctx.globalAlpha = environment === "armada" ? 0.3 : 0.14; ctx.fillStyle = palette.secondary;
    for (let x = -40; x < WORLD.width + 40; x += 35) { const h = 30 + ((x * 7 + this.cityOffset) % 90); ctx.fillRect(x, WORLD.height - 230 + this.cityOffset - h, 21, h); }
    ctx.globalAlpha = environment === "storm" ? 0.18 : 0.08; ctx.fillStyle = palette.cloud;
    for (let i = -1; i < 5; i += 1) { const y = (i * 250 + this.cloudOffset) % (WORLD.height + 250) - 130; ctx.beginPath(); ctx.ellipse(80 + i % 2 * 310, y, 220, 70, -0.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalCompositeOperation = "lighter";
    for (const star of this.nearStars) { ctx.globalAlpha = star.alpha; ctx.strokeStyle = palette.accent; ctx.lineWidth = star.size; ctx.beginPath(); ctx.moveTo(star.x, star.y - star.speed * 0.12 * intensity); ctx.lineTo(star.x, star.y); ctx.stroke(); }
    if (Math.sin(time * 0.21) > 0.94) { ctx.globalAlpha = 0.12; ctx.fillStyle = palette.secondary; ctx.beginPath(); ctx.ellipse(WORLD.width * 0.75, (time * 85) % 1200 - 100, 180, 28, -0.32, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
