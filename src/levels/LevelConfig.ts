import type { EnemyType } from "../game/types.ts";

export type Environment = "stratosphere" | "sunset" | "storm" | "nebula" | "night" | "asteroid" | "tunnel" | "warp" | "armada" | "void";
export type Objective = "destroy" | "survive" | "boss";
export type Hazard = "cloud" | "turbulence" | "lightning" | "low-visibility";
export type Formation = "line" | "v" | "diagonal" | "circle" | "wave" | "cross" | "pincer" | "fleet" | "snake";
export type SpawnDirection = "top" | "sides" | "corners";
export type BulletPattern = "single" | "double" | "triple" | "five" | "wave" | "cross" | "ring" | "spiral" | "tracking";
export type BossVariant = "heavy-gunship" | "carrier" | "titan" | "omega";

export interface LevelPalette {
  top: string; middle: string; bottom: string; accent: string; secondary: string; cloud: string;
}

export interface WaveConfig {
  id: string;
  formation: Formation;
  enemyTypes: EnemyType[];
  count: number;
  rows: number;
  direction?: SpawnDirection;
  bulletPatterns?: BulletPattern[];
  gap?: number;
  spawnInterval?: number;
  burst?: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  identity: string;
  environment: Environment;
  objective: Objective;
  duration: number;
  minimumDuration: number;
  difficulty: number;
  totalEnemyTarget: number;
  waveCount: number;
  enemyRows: 1 | 2 | 3;
  maxActiveEnemies: number;
  activeShooterLimit: number;
  shooterRatio: number;
  waveGapMin: number;
  waveGapMax: number;
  preSpawnThreshold: number;
  enemyTypes: EnemyType[];
  waves: WaveConfig[];
  bulletPatterns: BulletPattern[];
  hazards: Hazard[];
  maxOnScreen: number;
  rewardTier: number;
  damageMultiplier: number;
  movementMultiplier: number;
  bossStart?: number;
  bossHealthMultiplier?: number;
  miniBoss?: BossVariant;
  boss?: BossVariant;
  bossSequence?: BossVariant[];
  palette: LevelPalette;
}
