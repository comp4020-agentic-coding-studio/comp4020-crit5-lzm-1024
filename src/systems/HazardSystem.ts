import { COLOURS, WORLD } from "../game/GameConfig.ts";
import type { LevelConfig } from "../levels/LevelConfig.ts";

export class HazardSystem {
  private lightningTimer = 2.4;
  private warning = 0;
  private strike = 0;
  private strikeX = WORLD.width / 2;

  reset(): void { this.lightningTimer = 2.4; this.warning = 0; this.strike = 0; }

  update(dt: number, config: LevelConfig, playerX: number, damage: (amount: number) => void): number {
    let wind = 0;
    if (config.hazards.includes("turbulence")) wind = Math.sin(this.lightningTimer * 0.7 + playerX * 0.01) * 24;
    if (!config.hazards.includes("lightning")) return wind;

    const wasWarning = this.warning;
    this.lightningTimer -= dt; this.warning = Math.max(0, this.warning - dt); this.strike = Math.max(0, this.strike - dt);
    if (this.lightningTimer <= 0 && this.warning <= 0 && this.strike <= 0) {
      this.strikeX = 55 + Math.random() * (WORLD.width - 110); this.warning = 1.05; this.lightningTimer = 3.2 + Math.random() * 2;
    }
    if (wasWarning > 0 && this.warning <= 0) {
      this.strike = 0.22;
      if (Math.abs(playerX - this.strikeX) < 42) damage(34 * config.damageMultiplier);
    }
    return wind;
  }

  drawBehind(ctx: CanvasRenderingContext2D, config: LevelConfig, time: number): void {
    if (this.warning > 0) {
      const pulse = 0.12 + Math.abs(Math.sin(time * 16)) * 0.2; ctx.fillStyle = `rgba(255,221,93,${pulse})`; ctx.fillRect(this.strikeX - 42, 0, 84, WORLD.height);
      ctx.strokeStyle = COLOURS.orange; ctx.lineWidth = 2; ctx.setLineDash([12, 9]); ctx.strokeRect(this.strikeX - 42, 0, 84, WORLD.height); ctx.setLineDash([]);
    }
    if (this.strike > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "#f7f1ff"; ctx.shadowColor = "#9d8cff"; ctx.shadowBlur = 22; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(this.strikeX, 0); for (let y = 0; y < WORLD.height; y += 75) ctx.lineTo(this.strikeX + (Math.random() - 0.5) * 44, y); ctx.stroke(); ctx.restore();
    }
  }

  drawFront(ctx: CanvasRenderingContext2D, config: LevelConfig, time: number): void {
    if (config.hazards.includes("cloud")) {
      ctx.save(); ctx.fillStyle = config.palette.cloud; ctx.globalAlpha = 0.14;
      for (let index = 0; index < 4; index += 1) { const y = (index * 285 + time * 38) % (WORLD.height + 180) - 90; ctx.beginPath(); ctx.ellipse(index % 2 ? 430 : 110, y, 230, 72, index % 2 ? 0.2 : -0.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (config.hazards.includes("low-visibility")) {
      const gradient = ctx.createRadialGradient(WORLD.width / 2, WORLD.height * 0.72, 90, WORLD.width / 2, WORLD.height * 0.72, 330); gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, "rgba(0,0,0,.78)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }
}
