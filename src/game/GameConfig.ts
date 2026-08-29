// A 3:4 playfield is compact on desktop while retaining a comfortable
// vertical mobile play area without stretching the original UI artwork.
export const WORLD = { width: 600, height: 800 } as const;

export const COLOURS = {
  cyan: "#62f4ff",
  blue: "#2e8dff",
  white: "#effbff",
  orange: "#ff9b54",
  red: "#ff4d62",
  violet: "#ad7cff",
  green: "#75f0bf",
  night: "#02070d",
} as const;

export const PLAYER_CONFIG = {
  maxHp: 130,
  maxShield: 22.5,
  visualWidth: 58,
  visualHeight: 76,
  hitRadius: 10,
  speed: 430,
  acceleration: 12,
  fireInterval: 0.155,
  damage: 12,
} as const;

export const COMBAT_LIMITS = {
  minPlayerShotInterval: 0.085,
  // Keep the final stages readable while leaving headroom in the shared pool
  // for a short burst instead of letting Canvas fill-rate become the limiter.
  maxPlayerProjectiles: 110,
  maxEnemyProjectiles: 160,
} as const;

export interface DifficultyBand {
  spawnInterval: number;
  bulletSpeed: number;
  maxEnemies: number;
  tier: number;
}

export function difficultyAt(seconds: number): DifficultyBand {
  if (seconds < 30) return { spawnInterval: 1.15, bulletSpeed: 145, maxEnemies: 8, tier: 0 };
  if (seconds < 60) return { spawnInterval: 0.82, bulletSpeed: 165, maxEnemies: 11, tier: 1 };
  if (seconds < 90) return { spawnInterval: 0.62, bulletSpeed: 185, maxEnemies: 14, tier: 2 };
  if (seconds < 120) return { spawnInterval: 0.52, bulletSpeed: 205, maxEnemies: 16, tier: 3 };
  if (seconds < 180) return { spawnInterval: 0.44, bulletSpeed: 225, maxEnemies: 18, tier: 4 };
  return { spawnInterval: 0.38, bulletSpeed: 245, maxEnemies: 20, tier: 5 };
}

export const XP_THRESHOLDS = [320, 780, 1360, 2050, 2900, 3900, 5100];
