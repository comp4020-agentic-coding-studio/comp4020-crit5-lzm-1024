import { COLOURS, PLAYER_CONFIG, WORLD } from "../game/GameConfig.ts";
import type { InputState } from "../game/types.ts";

export class Player {
  x = WORLD.width / 2; y = WORLD.height * 0.78; vx = 0; vy = 0;
  hp: number = PLAYER_CONFIG.maxHp; shield: number = PLAYER_CONFIG.maxShield;
  maxHp: number = PLAYER_CONFIG.maxHp; maxShield: number = PLAYER_CONFIG.maxShield;
  fireInterval: number = PLAYER_CONFIG.fireInterval; damage: number = PLAYER_CONFIG.damage;
  moveSpeed: number = PLAYER_CONFIG.speed; weaponLevel: number = 1; fireTimer: number = 0;
  ultimate: number = 0; ultimateTimer: number = 0; invulnerable: number = 0; flash: number = 0; recoil: number = 0;
  crash: number = 0;
  weaponOverdrive = 0;
  piercing = false; criticalChance = 0; drones = 0; missiles = 0; laser = 0; magnet = 82;

  reset(): void {
    Object.assign(this, {
      x: WORLD.width / 2, y: WORLD.height * 0.78, vx: 0, vy: 0,
      hp: this.maxHp, shield: this.maxShield, fireInterval: PLAYER_CONFIG.fireInterval,
      damage: PLAYER_CONFIG.damage, moveSpeed: PLAYER_CONFIG.speed, weaponLevel: 1,
      fireTimer: 0, ultimate: 0, ultimateTimer: 0, invulnerable: 0, flash: 0, crash: 0,
      piercing: false, criticalChance: 0, drones: 0, missiles: 0, laser: 0, magnet: 82, weaponOverdrive: 0,
    });
  }

  update(dt: number, input: InputState): void {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.recoil = Math.max(0, this.recoil - dt * 7);
    this.ultimateTimer = Math.max(0, this.ultimateTimer - dt);
    this.weaponOverdrive = Math.max(0, this.weaponOverdrive - dt);
    this.fireTimer -= dt;

    if (input.pointerActive) {
      // Keep mouse control responsive, but retain a tiny amount of inertia so
      // the ship feels like it has mass instead of teleporting to the cursor.
      const targetX = Math.max(30, Math.min(WORLD.width - 30, input.pointerX));
      const targetY = Math.max(WORLD.height * 0.42, Math.min(WORLD.height - 62, input.pointerY));
      const follow = 1 - Math.exp(-18 * dt);
      this.vx = (targetX - this.x) / Math.max(dt, 0.001);
      this.vy = (targetY - this.y) / Math.max(dt, 0.001);
      this.x += (targetX - this.x) * follow;
      this.y += (targetY - this.y) * follow;
      return;
    }
    const desiredX = (Number(input.right) - Number(input.left)) * this.moveSpeed;
    const desiredY = (Number(input.down) - Number(input.up)) * this.moveSpeed;
    const smoothing = 1 - Math.exp(-PLAYER_CONFIG.acceleration * dt);
    this.vx += (desiredX - this.vx) * smoothing;
    this.vy += (desiredY - this.vy) * smoothing;
    this.x = Math.max(30, Math.min(WORLD.width - 30, this.x + this.vx * dt));
    this.y = Math.max(WORLD.height * 0.42, Math.min(WORLD.height - 62, this.y + this.vy * dt));
  }

  takeDamage(amount: number): "shield" | "hp" | "ignored" {
    if (this.invulnerable > 0 || this.ultimateTimer > 0) return "ignored";
    this.invulnerable = 0.68;
    this.flash = 0.18;
    if (this.shield > 0) {
      const overflow = Math.max(0, amount - this.shield);
      this.shield = Math.max(0, this.shield - amount);
      if (overflow > 0) this.hp = Math.max(0, this.hp - overflow);
      return "shield";
    }
    this.hp = Math.max(0, this.hp - amount);
    return "hp";
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 18) % 2 === 0) ctx.globalAlpha = 0.38;
    ctx.save();
    ctx.translate(this.x, this.y + this.recoil * 5);
    ctx.rotate(this.crash);

    const engine = 16 + Math.sin(time * 28) * 5;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = COLOURS.cyan;
    ctx.shadowColor = COLOURS.cyan;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-8, 27); ctx.lineTo(0, 27 + engine); ctx.lineTo(8, 27); ctx.closePath(); ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.flash > 0 ? "#fff" : "#d9f7fb";
    ctx.strokeStyle = COLOURS.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -39); ctx.lineTo(12, -13); ctx.lineTo(28, 18); ctx.lineTo(10, 13);
    ctx.lineTo(5, 30); ctx.lineTo(-5, 30); ctx.lineTo(-10, 13); ctx.lineTo(-28, 18);
    ctx.lineTo(-12, -13); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#0d3545";
    ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(7, -6); ctx.lineTo(0, 7); ctx.lineTo(-7, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = COLOURS.orange;
    ctx.fillRect(-20, 14, 7, 3); ctx.fillRect(13, 14, 7, 3);

    if (this.shield > 0 || this.ultimateTimer > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = this.ultimateTimer > 0 ? COLOURS.violet : COLOURS.cyan;
      ctx.globalAlpha = 0.22 + Math.sin(time * 5) * 0.05;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 37, 47, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.weaponOverdrive > 0) {
      ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = COLOURS.orange; ctx.globalAlpha = 0.32 + Math.sin(time * 12) * 0.1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 45, 55, 0, 0, Math.PI * 2); ctx.stroke();
    }

    if (this.drones > 0) {
      for (const side of [-1, 1]) {
        ctx.fillStyle = COLOURS.cyan;
        ctx.fillRect(side * 42 - 4, 2 + Math.sin(time * 3 + side) * 5, 8, 14);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
