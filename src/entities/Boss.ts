import { COLOURS, WORLD } from "../game/GameConfig.ts";
import type { BossVariant } from "../levels/LevelConfig.ts";

export class Boss {
  variant: BossVariant = "titan";
  displayName = "TITAN-01";
  scale = 1;
  active = false; x = WORLD.width / 2; y = -180; hp = 1200; maxHp = 1200;
  leftTurret = 180; rightTurret = 180; phase = 1; age = 0; fireTimer = 1.2;
  patternStep = 0; flash = 0; destructionTimer = 0; destroyed = false; warningShown = false;

  spawn(variant: BossVariant = "titan", durabilityMultiplier = 1): void {
    const specs: Record<BossVariant, { name: string; hp: number; scale: number; turrets: number }> = {
      "heavy-gunship": { name: "HEAVY GUNSHIP", hp: 620, scale: 0.76, turrets: 130 },
      carrier: { name: "CARRIER", hp: 1120, scale: 1, turrets: 170 },
      titan: { name: "TITAN-01", hp: 1200, scale: 1, turrets: 180 },
      omega: { name: "OMEGA", hp: 5200, scale: 1.3, turrets: 300 },
    };
    const spec = specs[variant];
    const hp = Math.round(spec.hp * durabilityMultiplier); const turrets = Math.round(spec.turrets * durabilityMultiplier);
    Object.assign(this, { active: true, variant, displayName: spec.name, scale: spec.scale, x: WORLD.width / 2, y: -180, hp, maxHp: hp, leftTurret: turrets, rightTurret: turrets, phase: 1, age: 0, fireTimer: 0.72, patternStep: 0, flash: 0, destructionTimer: 0, destroyed: false, warningShown: false });
  }

  update(dt: number): void {
    if (!this.active) return;
    this.age += dt; this.flash = Math.max(0, this.flash - dt * 5);
    if (this.destroyed) { this.destructionTimer += dt; return; }
    this.phase = this.variant === "omega" ? (this.hp < this.maxHp * 0.15 ? 4 : this.hp < this.maxHp * 0.4 ? 3 : this.hp < this.maxHp * 0.7 ? 2 : 1) : this.hp < this.maxHp * 0.25 ? 3 : this.hp < this.maxHp * 0.6 ? 2 : 1;
    const phaseSpeed = 1.45 + this.phase * 0.42;
    const sweep = this.variant === "omega" ? 178 : this.variant === "heavy-gunship" ? 142 : 158;
    const strafe = Math.sin(this.age * phaseSpeed) * sweep;
    const feint = Math.sin(this.age * (phaseSpeed * 0.47) + 1.3) * (this.phase >= 3 ? 42 : 24);
    const targetX = Math.max(92, Math.min(WORLD.width - 92, WORLD.width / 2 + strafe + feint));
    const targetY = (this.variant === "omega" ? 172 : 132) + Math.sin(this.age * (1.1 + this.phase * 0.12)) * (this.phase >= 3 ? 54 : 30);
    this.x += (targetX - this.x) * (1 - Math.exp(-(5.4 + this.phase) * dt));
    this.y += (targetY - this.y) * (1 - Math.exp(-3.4 * dt));
    this.fireTimer -= dt;
  }

  hit(bulletX: number, damage: number): { destroyed: boolean; turret: boolean } {
    if (!this.active || this.destroyed) return { destroyed: false, turret: false };
    this.flash = 1;
    const localX = bulletX - this.x;
    if (this.phase === 1 && localX < -55 && this.leftTurret > 0) { this.leftTurret = Math.max(0, this.leftTurret - damage); return { destroyed: false, turret: true }; }
    if (this.phase === 1 && localX > 55 && this.rightTurret > 0) { this.rightTurret = Math.max(0, this.rightTurret - damage); return { destroyed: false, turret: true }; }
    const multiplier = this.phase >= 3 && Math.abs(localX) < 42 ? 1.75 : 1;
    this.hp = Math.max(0, this.hp - damage * multiplier);
    if (this.hp <= 0) this.destroyed = true;
    return { destroyed: this.destroyed, turret: false };
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.active) return;
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.scale, this.scale);
    const damage = 1 - this.hp / this.maxHp;
    ctx.globalAlpha = this.destroyed ? Math.max(0, 1 - this.destructionTimer / 3.1) : 1;
    const variantColor = this.variant === "carrier" ? COLOURS.cyan : this.variant === "heavy-gunship" ? COLOURS.orange : this.variant === "omega" ? COLOURS.violet : COLOURS.red;
    ctx.fillStyle = this.flash > 0 ? "#fff" : this.variant === "carrier" ? "#688ba7" : this.variant === "heavy-gunship" ? "#9d7659" : this.variant === "omega" ? "#6a4d85" : "#7b8c98"; ctx.strokeStyle = variantColor; ctx.lineWidth = 2;
    ctx.shadowColor = variantColor; ctx.shadowBlur = this.phase >= 3 ? 20 : 7;
    ctx.beginPath();
    ctx.moveTo(0, 112); ctx.lineTo(-52, 65); ctx.lineTo(-142, 42); ctx.lineTo(-119, -25); ctx.lineTo(-56, -58);
    ctx.lineTo(0, -76); ctx.lineTo(56, -58); ctx.lineTo(119, -25); ctx.lineTo(142, 42); ctx.lineTo(52, 65); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#172631"; ctx.fillRect(-52, -39, 104, 90);
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.strokeRect(-51, -38, 102, 88);

    for (const [side, hp] of [[-1, this.leftTurret], [1, this.rightTurret]] as const) {
      if (hp <= 0) continue;
      ctx.save(); ctx.translate(side * 89, 25); ctx.fillStyle = "#263a45"; ctx.fillRect(-17, -23, 34, 46); ctx.fillStyle = COLOURS.orange; ctx.fillRect(-5, 17, 10, 25); ctx.restore();
    }

    ctx.globalCompositeOperation = "lighter";
    const coreColor = this.phase >= 3 ? COLOURS.orange : this.variant === "omega" ? COLOURS.violet : COLOURS.cyan;
    ctx.fillStyle = coreColor; ctx.shadowColor = coreColor; ctx.shadowBlur = 18 + this.phase * 6;
    ctx.beginPath(); ctx.arc(0, 17, this.phase >= 3 ? 31 + Math.sin(time * 10) * 4 : 18, 0, Math.PI * 2); ctx.fill();
    if (this.fireTimer > 0 && this.fireTimer < 0.24) { ctx.globalAlpha = 0.45; ctx.strokeStyle = COLOURS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 17, 38 + (0.24 - this.fireTimer) * 70, 0, Math.PI * 2); ctx.stroke(); }
    if (damage > 0.4) {
      ctx.fillStyle = "rgba(190,210,220,.13)";
      for (let i = 0; i < 5; i += 1) { const a = time * 0.25 + i; ctx.beginPath(); ctx.arc(Math.sin(a) * 65, -55 - (time * 28 + i * 22) % 90, 12 + i * 2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
}
