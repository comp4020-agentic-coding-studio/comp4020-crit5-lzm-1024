import { getLevel, MAX_LEVEL } from "../levels/levels.ts";
import type { LevelConfig } from "../levels/LevelConfig.ts";

export function levelUpgradeLimit(config: LevelConfig): number {
  if (config.boss || config.miniBoss || config.bossSequence || config.objective === "boss") return 1;
  return config.duration >= 80 ? 2 : 1;
}

export function shouldOfferLevelUpgrade(config: LevelConfig, progress: number, xpGained: number, upgradesTaken: number): boolean {
  const limit = levelUpgradeLimit(config);
  if (upgradesTaken >= limit) return false;
  if (config.boss || config.miniBoss || config.bossSequence || config.objective === "boss") return progress >= 0.34;
  if (limit === 2) {
    const progressGate = upgradesTaken === 0 ? 0.32 : 0.7;
    const xpGate = upgradesTaken === 0 ? 320 : 900;
    return progress >= progressGate && xpGained >= xpGate;
  }
  return progress >= 0.48 && xpGained >= 320;
}

export class LevelSystem {
  levelNumber = 1;
  elapsed = 0;
  introTimer = 3.2;
  completeTimer = 0;
  bossSpawned = false;
  climaxSpawned = false;
  bossIndex = 0;

  get config(): LevelConfig { return getLevel(this.levelNumber); }
  get progress(): number { return Math.min(1, this.elapsed / this.config.duration); }
  get active(): boolean { return this.introTimer <= 0 && this.completeTimer <= 0; }
  get pressure(): number { return [0.72, 1, 0.58, 1.18][Math.min(3, Math.floor(this.progress * 4))]; }

  reset(startLevel = 1): void {
    this.levelNumber = Math.max(1, Math.min(MAX_LEVEL, startLevel)); this.elapsed = 0; this.introTimer = 3.2; this.completeTimer = 0; this.bossSpawned = false; this.climaxSpawned = false; this.bossIndex = 0;
  }

  update(dt: number): "advanced" | null {
    if (this.introTimer > 0) { this.introTimer = Math.max(0, this.introTimer - dt); return null; }
    if (this.completeTimer > 0) {
      this.completeTimer -= dt;
      // The completion card already presents the next level, so resume its
      // combat immediately instead of showing that same level a second time.
      if (this.completeTimer <= 0 && this.levelNumber < MAX_LEVEL) { this.levelNumber += 1; this.elapsed = 0; this.introTimer = 0; this.completeTimer = 0; this.bossSpawned = false; this.climaxSpawned = false; this.bossIndex = 0; return "advanced"; }
      return null;
    }
    this.elapsed += dt;
    return null;
  }

  complete(): void { if (this.completeTimer <= 0) this.completeTimer = 3; }

  advanceBoss(): boolean {
    const sequence = this.config.bossSequence;
    if (!sequence || this.bossIndex >= sequence.length - 1) return false;
    this.bossIndex += 1; this.bossSpawned = false; return true;
  }
}
