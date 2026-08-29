import { ObjectPool } from "../utils/ObjectPool.ts";
import type { Poolable } from "../game/types.ts";

class Particle implements Poolable {
  active = false; x = 0; y = 0; vx = 0; vy = 0; age = 0; life = 1; size = 2; color = "#fff"; drag = 0.96;
  reset(): void { this.active = false; }
}

class Ring implements Poolable {
  active = false; x = 0; y = 0; age = 0; life = 0.5; maxRadius = 80; color = "#fff";
  reset(): void { this.active = false; }
}

class Popup implements Poolable {
  active = false; x = 0; y = 0; age = 0; life = 0.8; text = ""; color = "#fff"; size = 15;
  reset(): void { this.active = false; }
}

export class ParticleSystem {
  private readonly particles = new ObjectPool(() => new Particle(), 260);
  private readonly rings = new ObjectPool(() => new Ring(), 24);
  private readonly popups = new ObjectPool(() => new Popup(), 32);
  private readonly activeParticles: Particle[] = [];
  private readonly activeRings: Ring[] = [];
  private readonly activePopups: Popup[] = [];
  private readonly particleBudget = 220;
  private density = 1;

  setDensity(density: number): void { this.density = Math.max(0.25, Math.min(1, density)); }

  burst(x: number, y: number, color: string, count = 16, force = 170): void {
    const adjustedCount = Math.max(1, Math.ceil(count * this.density));
    for (let i = 0; i < adjustedCount; i += 1) {
      if (this.activeParticles.length >= this.particleBudget) break;
      const particle = this.particles.acquire(); if (!particle) break;
      const angle = Math.random() * Math.PI * 2; const speed = force * (0.25 + Math.random() * 0.75);
      Object.assign(particle, { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: 0.3 + Math.random() * 0.55, size: 1.5 + Math.random() * 3.5, color, drag: 0.94 + Math.random() * 0.04 });
      this.activeParticles.push(particle);
    }
  }

  trail(x: number, y: number, color: string): void {
    if (Math.random() > this.density) return;
    if (this.activeParticles.length >= this.particleBudget) return;
    const particle = this.particles.acquire(); if (!particle) return;
    Object.assign(particle, { x: x + (Math.random() - 0.5) * 5, y, vx: (Math.random() - 0.5) * 18, vy: 35 + Math.random() * 30, age: 0, life: 0.2 + Math.random() * 0.25, size: 1 + Math.random() * 2.5, color, drag: 0.96 });
    this.activeParticles.push(particle);
  }

  shockwave(x: number, y: number, color: string, radius = 85): void {
    if (this.density < 0.5 && Math.random() > this.density) return;
    const ring = this.rings.acquire(); if (ring) { Object.assign(ring, { x, y, age: 0, life: 0.55, maxRadius: radius, color }); this.activeRings.push(ring); }
  }

  popup(x: number, y: number, text: string, color = "#effbff", size = 15): void {
    const popup = this.popups.acquire(); if (popup) { Object.assign(popup, { x, y, age: 0, life: 0.85, text, color, size }); this.activePopups.push(popup); }
  }

  update(dt: number): void {
    for (let index = this.activeParticles.length - 1; index >= 0; index -= 1) {
      const particle = this.activeParticles[index];
      particle.age += dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vx *= particle.drag; particle.vy *= particle.drag;
      if (particle.age >= particle.life) { particle.reset(); this.removeActiveAt(this.activeParticles, index); }
    }
    for (let index = this.activeRings.length - 1; index >= 0; index -= 1) { const ring = this.activeRings[index]; if ((ring.age += dt) >= ring.life) { ring.reset(); this.removeActiveAt(this.activeRings, index); } }
    for (let index = this.activePopups.length - 1; index >= 0; index -= 1) { const popup = this.activePopups[index]; if ((popup.age += dt) >= popup.life) { popup.reset(); this.removeActiveAt(this.activePopups, index); } }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const particle of this.activeParticles) {
      const alpha = 1 - particle.age / particle.life; ctx.globalAlpha = alpha; ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    for (const ring of this.activeRings) {
      const progress = ring.age / ring.life; ctx.globalAlpha = 1 - progress; ctx.strokeStyle = ring.color; ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.maxRadius * progress, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 15px Segoe UI, sans-serif";
    for (const popup of this.activePopups) {
      const progress = popup.age / popup.life; ctx.globalAlpha = 1 - progress; ctx.fillStyle = popup.color; ctx.font = `700 ${popup.size}px Segoe UI, sans-serif`;
      ctx.fillText(popup.text, popup.x, popup.y - progress * 35);
    }
    ctx.restore();
  }

  private removeActiveAt<T>(items: T[], index: number): void {
    const last = items.length - 1;
    if (index !== last) items[index] = items[last];
    items.pop();
  }
}
