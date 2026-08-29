import type { Poolable } from "../game/types.ts";
import { WORLD } from "../game/GameConfig.ts";

export class Projectile implements Poolable {
  active = false;
  x = 0; y = 0; vx = 0; vy = 0; radius = 4; damage = 1;
  enemy = false; piercing = false; age = 0; life = 3; color = "#fff";
  waveAmplitude = 0; waveFrequency = 0; originX = 0;

  launch(x: number, y: number, vx: number, vy: number, enemy: boolean, damage: number, radius: number, color: string, piercing = false): void {
    Object.assign(this, { active: true, x, y, vx, vy, enemy, damage, radius, color, piercing, age: 0, life: 3, originX: x, waveAmplitude: 0, waveFrequency: 0 });
  }

  update(dt: number): void {
    this.age += dt;
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.waveAmplitude) this.x += Math.sin(this.age * this.waveFrequency) * this.waveAmplitude * dt;
    if (this.life <= 0 || this.x < -24 || this.x > WORLD.width + 24 || this.y < -36 || this.y > WORLD.height + 36) this.reset();
  }

  static drawAll(ctx: CanvasRenderingContext2D, projectiles: readonly Projectile[]): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const projectile of projectiles) {
      if (!projectile.active) continue;
      ctx.strokeStyle = projectile.color;
      ctx.lineWidth = projectile.radius * 1.15;
      ctx.globalAlpha = 0.24;
      ctx.beginPath();
      ctx.moveTo(projectile.x - projectile.vx * 0.035, projectile.y - projectile.vy * 0.035);
      ctx.lineTo(projectile.x, projectile.y);
      ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  reset(): void { this.active = false; }
}
