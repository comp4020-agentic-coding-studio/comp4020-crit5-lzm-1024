export class ComboSystem {
  count = 0; timer = 0; max = 0;
  get multiplier(): number { return 1 + Math.min(4, Math.floor(this.count / 5) * 0.25); }
  add(): void { this.count += 1; this.timer = 2.7; this.max = Math.max(this.max, this.count); }
  update(dt: number): void { if (this.count > 0 && (this.timer -= dt) <= 0) { this.count = 0; this.timer = 0; } }
  reset(): void { this.count = 0; this.timer = 0; this.max = 0; }
}
