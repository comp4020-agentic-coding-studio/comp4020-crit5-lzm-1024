import type { EnemyType, Poolable } from "../game/types.ts";
import { COLOURS, WORLD } from "../game/GameConfig.ts";
import { enemyVelocity } from "../patterns/MovementPatterns.ts";

const STATS: Record<EnemyType, { hp: number; radius: number; score: number; xp: number; fire: number }> = {
  scout: { hp: 22, radius: 16, score: 120, xp: 45, fire: 2.2 },
  shooter: { hp: 38, radius: 19, score: 210, xp: 68, fire: 1.9 },
  diveBomber: { hp: 42, radius: 18, score: 240, xp: 76, fire: 99 },
  shieldDrone: { hp: 54, radius: 16, score: 260, xp: 92, fire: 4.2 },
  interceptor: { hp: 34, radius: 18, score: 180, xp: 60, fire: 2.7 },
  gunship: { hp: 115, radius: 27, score: 360, xp: 100, fire: 1.65 },
  sniper: { hp: 58, radius: 20, score: 280, xp: 85, fire: 3.4 },
  swarm: { hp: 16, radius: 12, score: 90, xp: 30, fire: 4.5 },
  elite: { hp: 420, radius: 42, score: 1400, xp: 320, fire: 1.25 },
};

const ENEMY_COLOUR: Record<EnemyType, { body: string; edge: string; core: string }> = {
  scout: { body: "#ff7894", edge: "#ff365f", core: "#ffd4df" },
  shooter: { body: "#ffb75d", edge: "#ff6a3d", core: "#fff0b0" },
  diveBomber: { body: "#f77c9a", edge: "#ff365f", core: "#ffe4ed" },
  shieldDrone: { body: "#70d7ff", edge: "#9d7cff", core: "#e4f5ff" },
  interceptor: { body: "#d86cff", edge: "#8c4dff", core: "#f4d7ff" },
  gunship: { body: "#ffb14d", edge: "#ff6a3d", core: "#fff0b0" },
  sniper: { body: "#ff5b4d", edge: "#ffcf5d", core: "#fff2d0" },
  swarm: { body: "#6df5b2", edge: "#21c97e", core: "#dcffef" },
  elite: { body: "#9d7cff", edge: "#ff65d4", core: "#f0ddff" },
};

export class Enemy implements Poolable {
  active = false; type: EnemyType = "scout";
  x = 0; y = -50; originX = 0; side = 1; age = 0; hp = 1; maxHp = 1;
  radius = 16; score = 100; xp = 30; fireTimer = 1; fireInterval = 2;
  flash = 0; shield = 0; warning = 0; patternStep = 0;
  lockX = 0; lockY = 0;
  auraShield = 0; diving = false; diveVx = 0; diveVy = 0;
  motionTimer = 0; motionBias = 0; motionSeed = 0;
  canAttack = true; attackCount = 0; enteredScreen = false;

  spawn(type: EnemyType, x: number, y = -50, side = 1, durabilityMultiplier = 1, canAttack = true): void {
    const stats = STATS[type];
    Object.assign(this, {
      active: true, type, x, y, originX: x, side, age: 0, hp: stats.hp * durabilityMultiplier, maxHp: stats.hp * durabilityMultiplier,
      radius: stats.radius, score: stats.score, xp: stats.xp, fireTimer: 0.8 + Math.random(),
      fireInterval: stats.fire, flash: 0, shield: type === "elite" ? 150 * durabilityMultiplier : 0, warning: 0, patternStep: 0, lockX: 0, lockY: 0, auraShield: 0, diving: false, diveVx: 0, diveVy: 0,
      motionTimer: 0.18 + Math.random() * 0.45, motionBias: (Math.random() - 0.5) * 140, motionSeed: Math.random() * Math.PI * 2,
      canAttack, attackCount: 0, enteredScreen: false,
    });
  }

  update(dt: number, movementMultiplier = 1): boolean {
    this.age += dt; this.fireTimer -= dt; this.flash = Math.max(0, this.flash - dt * 5); this.warning = Math.max(0, this.warning - dt);
    const velocity = this.diving ? { vx: this.diveVx, vy: this.diveVy } : enemyVelocity(this.type, this.age, this.originX, this.side);
    if (!this.diving) {
      this.motionTimer -= dt;
      if (this.motionTimer <= 0) {
        this.motionTimer = 0.32 + Math.random() * 0.58;
        this.motionBias = (Math.random() - 0.5) * this.movementRange();
      }
      velocity.vx += this.motionBias + Math.sin(this.age * (4.2 + this.motionSeed) + this.motionSeed) * this.movementRange() * 0.32;
    }
    this.x += velocity.vx * dt * movementMultiplier; this.y += velocity.vy * dt * movementMultiplier;
    if (this.y > 20) this.enteredScreen = true;
    if (!this.diving && this.type !== "interceptor") {
      if (this.x < 26) { this.x = 26; this.motionBias = Math.abs(this.motionBias); }
      if (this.x > WORLD.width - 26) { this.x = WORLD.width - 26; this.motionBias = -Math.abs(this.motionBias); }
    }
    const escaped = ((this.type === "interceptor" || this.type === "diveBomber") && (this.x < -80 || this.x > WORLD.width + 80)) || this.y > WORLD.height + 90;
    if (escaped) this.reset();
    return escaped;
  }

  takeDamage(damage: number): boolean {
    this.flash = 1;
    if (this.auraShield > 0) return false;
    if (this.shield > 0) this.shield = Math.max(0, this.shield - damage);
    else this.hp -= damage;
    return this.hp <= 0;
  }

  private movementRange(): number {
    switch (this.type) {
      case "gunship": return 92;
      case "shieldDrone": return 115;
      case "sniper": return 125;
      case "elite": return 155;
      case "swarm": return 170;
      case "diveBomber": return 190;
      case "interceptor": return 210;
      default: return 145;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.save(); ctx.translate(this.x, this.y);
    if (this.type === "interceptor" || this.type === "diveBomber") ctx.rotate(this.side * -0.42);
    const colors = ENEMY_COLOUR[this.type]; const colour = this.flash > 0 ? "#fff" : colors.body;
    ctx.fillStyle = colour; ctx.strokeStyle = colors.edge; ctx.lineWidth = 1.2;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = this.type === "elite" ? 14 : 4;

    if (this.type === "shieldDrone") {
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(157,124,255,.75)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 24 + Math.sin(time * 5) * 3, 0, Math.PI * 2); ctx.stroke();
    } else if (this.type === "swarm") {
      ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(-12, -8); ctx.lineTo(0, -4); ctx.lineTo(12, -8); ctx.closePath();
    } else if (this.type === "gunship") {
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(-32, 4); ctx.lineTo(-22, -22); ctx.lineTo(0, -31); ctx.lineTo(22, -22); ctx.lineTo(32, 4); ctx.closePath();
    } else if (this.type === "elite") {
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(-47, 10); ctx.lineTo(-31, -34); ctx.lineTo(0, -47); ctx.lineTo(31, -34); ctx.lineTo(47, 10); ctx.closePath();
    } else {
      ctx.beginPath(); ctx.moveTo(0, 23); ctx.lineTo(-this.radius, -13); ctx.lineTo(-7, -8); ctx.lineTo(0, -this.radius - 6); ctx.lineTo(7, -8); ctx.lineTo(this.radius, -13); ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = colors.core; ctx.shadowColor = colors.core; ctx.shadowBlur = 8; ctx.fillRect(-4, -10, 8, 19); ctx.shadowBlur = 0;

    if (this.shield > 0 || this.auraShield > 0) {
      ctx.strokeStyle = COLOURS.violet; ctx.globalAlpha = 0.55 + Math.sin(time * 6) * 0.15; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 9, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.warning > 0) {
      ctx.strokeStyle = COLOURS.red; ctx.globalAlpha = Math.sin(time * 24) > 0 ? 0.9 : 0.25; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.fireTimer > 0 && this.fireTimer < 0.28 && this.y > 0) {
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = this.type === "elite" ? COLOURS.violet : COLOURS.orange; ctx.globalAlpha = 0.45 + Math.sin(time * 34) * 0.25;
      ctx.beginPath(); ctx.arc(0, this.radius * 0.55, 5 + (0.28 - this.fireTimer) * 28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  reset(): void { this.active = false; }
}
