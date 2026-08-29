import type { Enemy } from "../entities/Enemy.ts";
import type { EnemyType } from "../game/types.ts";
import { WORLD } from "../game/GameConfig.ts";
import type { Formation, LevelConfig, WaveConfig } from "../levels/LevelConfig.ts";
import type { ObjectPool } from "../utils/ObjectPool.ts";

interface PendingWave { waveIndex: number; nextIndex: number; spawnTimer: number; }
export interface SpawnDebug { wave: number; waveCount: number; active: number; spawned: number; target: number; pending: number; sinceLastSpawn: number; complete: boolean; }

// Level 1 starts at the base HP.  Every later level adds the same amount,
// reaching exactly 1.5× health on the final Level 10.
export function enemyDurabilityMultiplier(level: number): number { return 1 + Math.min(1, Math.max(0, level - 1) / 9) * 0.5; }

export class EnemySpawner {
  private pending?: PendingWave;
  private totalSpawned = 0;
  private timeSinceLastSpawn = 0;
  private completed = false;
  constructor(private readonly pool: ObjectPool<Enemy>) {}

  reset(): void { this.pending = undefined; this.totalSpawned = 0; this.timeSinceLastSpawn = 0; this.completed = false; }
  get isComplete(): boolean { return this.completed; }
  get hasPendingSpawn(): boolean { return this.pending !== undefined; }

  debug(config: LevelConfig): SpawnDebug {
    const pending = this.pending ? config.waves[this.pending.waveIndex].count - this.pending.nextIndex : 0;
    const waveIndex = this.pending?.waveIndex ?? (this.completed ? config.waveCount - 1 : this.nextWaveIndex(config));
    return { wave: Math.min(config.waveCount, waveIndex + 1), waveCount: config.waveCount, active: this.pool.activeCount(), spawned: this.totalSpawned, target: config.totalEnemyTarget, pending, sinceLastSpawn: this.timeSinceLastSpawn, complete: this.completed };
  }

  update(dt: number, config: LevelConfig): void {
    if (this.completed) return;
    this.timeSinceLastSpawn += dt;
    if (!this.pending) this.tryStartNextWave(config);
    if (!this.pending) return;
    this.pending.spawnTimer -= dt;
    if (this.pending.spawnTimer <= 0) this.spawnChunk(config);
  }

  spawnClimax(type: EnemyType, count = 1, level = 1): void {
    const durability = enemyDurabilityMultiplier(level);
    for (let index = 0; index < count; index += 1) this.spawn(type, WORLD.width / 2 + (index - (count - 1) / 2) * 96, -70 - index * 28, 1, durability, true);
  }

  private tryStartNextWave(config: LevelConfig): void {
    const nextIndex = this.totalSpawned >= config.totalEnemyTarget ? config.waves.length : this.nextWaveIndex(config);
    if (nextIndex >= config.waves.length) { this.completed = true; return; }
    this.pending = { waveIndex: nextIndex, nextIndex: 0, spawnTimer: 0 };
  }

  private nextWaveIndex(config: LevelConfig): number {
    if (this.pending) return this.pending.waveIndex;
    let spawned = 0;
    for (let index = 0; index < config.waves.length; index += 1) {
      if (spawned === this.totalSpawned) return index;
      spawned += config.waves[index].count;
      if (spawned > this.totalSpawned) return index;
    }
    return config.waves.length;
  }

  private spawnChunk(config: LevelConfig): void {
    const pending = this.pending; if (!pending) return;
    const wave = config.waves[pending.waveIndex];
    // Do not throttle the encounter by the current number of active enemies:
    // every authored formation is allowed to enter the screen together.
    const amount = Math.min(wave.burst ?? 2, wave.count - pending.nextIndex);
    if (amount <= 0) return;
    const rows = Math.max(1, Math.min(wave.rows, config.enemyRows));
    const columns = Math.ceil(wave.count / rows); const durability = enemyDurabilityMultiplier(config.level);
    const attackingCount = Math.round(wave.count * config.shooterRatio);
    for (let offset = 0; offset < amount; offset += 1) {
      const index = pending.nextIndex + offset; const row = Math.floor(index / columns); const column = index % columns;
      const type = wave.enemyTypes[index % wave.enemyTypes.length];
      const position = this.positionFor(wave.formation, row, column, rows, columns, wave.direction ?? "top");
      this.spawn(type, position.x, position.y, position.side, durability, index < attackingCount || type === "diveBomber");
    }
    pending.nextIndex += amount; this.totalSpawned += amount; this.timeSinceLastSpawn = 0;
    pending.spawnTimer = wave.spawnInterval ?? 0.22;
    if (pending.nextIndex < wave.count) return;
    this.pending = undefined;
    if (this.totalSpawned >= config.totalEnemyTarget) this.completed = true;
  }

  private positionFor(formation: Formation, row: number, column: number, rows: number, columns: number, direction: WaveConfig["direction"]): { x: number; y: number; side: number } {
    const span = Math.min(420, Math.max(110, (columns - 1) * 68)); const baseX = WORLD.width / 2 - span / 2 + (columns === 1 ? 0 : column * span / (columns - 1));
    let x = baseX; let y = -55 - row * 94 - column * 12; let side = 1;
    if (formation === "v") y -= Math.abs(column - (columns - 1) / 2) * 30;
    if (formation === "diagonal") { x = 85 + column * 68; y = -45 - row * 88 - column * 44; }
    if (formation === "circle") { const angle = ((row * columns + column) / Math.max(1, rows * columns)) * Math.PI * 2; x = WORLD.width / 2 + Math.cos(angle) * 130; y = -115 + Math.sin(angle) * 62; }
    if (formation === "wave") y = -70 - row * 92 - Math.sin(column * 1.4) * 42;
    if (formation === "snake") { x = 60 + (column / Math.max(1, columns - 1)) * (WORLD.width - 120); y = -65 - row * 82 - Math.sin(column * 1.75) * 55; }
    if (formation === "cross") { x = column % 2 ? WORLD.width - 42 : 42; y = 54 + row * 90 + column * 58; }
    if (formation === "fleet") { x = 65 + (column / Math.max(1, columns - 1)) * (WORLD.width - 130); y = -55 - row * 105 - (column % 2) * 48; }
    if (formation === "pincer" || direction === "sides" || direction === "corners") { side = (row + column) % 2 === 0 ? 1 : -1; x = side > 0 ? -36 : WORLD.width + 36; y = 92 + row * 115 + column * 55; }
    return { x, y, side };
  }

  private spawn(type: EnemyType, x: number, y: number, side: number, durability: number, canAttack: boolean): void { this.pool.acquire()?.spawn(type, x, y, side, durability, canAttack); }
}
