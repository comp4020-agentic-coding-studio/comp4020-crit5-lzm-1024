import type { PickupType, Poolable } from "../game/types.ts";
import { COLOURS, WORLD } from "../game/GameConfig.ts";

export class Pickup implements Poolable {
  active = false; type: PickupType = "energy"; x = 0; y = 0; age = 0; radius = 13;

  spawn(type: PickupType, x: number, y: number): void { Object.assign(this, { active: true, type, x, y, age: 0 }); }

  update(dt: number, playerX: number, playerY: number, magnet: number): void {
    this.age += dt; this.y += 48 * dt;
    const dx = playerX - this.x; const dy = playerY - this.y; const distance = Math.hypot(dx, dy);
    if (distance < magnet && distance > 1) { const pull = 260 * (1 - distance / magnet); this.x += dx / distance * pull * dt; this.y += dy / distance * pull * dt; }
    if (this.y > WORLD.height + 30) this.reset();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const colors: Record<PickupType, string> = { weapon: COLOURS.orange, shield: COLOURS.cyan, repair: COLOURS.green, bomb: COLOURS.red, magnet: COLOURS.violet, energy: COLOURS.white };
    const color = colors[this.type];
    ctx.save(); ctx.translate(this.x, this.y + Math.sin(this.age * 4) * 4); ctx.rotate(this.age * 0.8);
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(-2, -5, 4, 10); ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  }

  reset(): void { this.active = false; }
}
