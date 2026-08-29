import { describe, expect, it } from "vitest";
import { COMBAT_LIMITS, WORLD, difficultyAt } from "../src/game/GameConfig.ts";
import { aimed, cross, fan3, fan5, radial, spiral, wave } from "../src/patterns/BulletPatterns.ts";
import { ObjectPool } from "../src/utils/ObjectPool.ts";
import type { Poolable } from "../src/game/types.ts";
import { Boss } from "../src/entities/Boss.ts";
import { Player } from "../src/entities/Player.ts";
import { Enemy } from "../src/entities/Enemy.ts";
import { Projectile } from "../src/entities/Projectile.ts";
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from "../src/i18n/translations.ts";
import { LEVELS, getLevel } from "../src/levels/levels.ts";
import { LevelSystem, levelUpgradeLimit, shouldOfferLevelUpgrade } from "../src/systems/LevelSystem.ts";
import { EnemySpawner, enemyDurabilityMultiplier } from "../src/systems/EnemySpawner.ts";
import { UPGRADES } from "../src/systems/UpgradeSystem.ts";
import { MUSIC_SEQUENCE } from "../src/systems/AudioSystem.ts";
import { openingActionAt } from "../src/ui/Screens.ts";

class TestItem implements Poolable {
  active = false;
  reset(): void { this.active = false; }
}

describe("arcade game contracts", () => {
  it("starts the player with a 130-point hull and half-capacity shield", () => {
    const player = new Player();
    expect(player.maxHp).toBe(130);
    expect(player.hp).toBe(130);
    expect(player.maxShield).toBe(22.5);
    expect(player.shield).toBe(22.5);
  });

  it("allows later levels to accelerate enemy movement without accelerating fire timers", () => {
    const normal = new Enemy(); const fast = new Enemy(); normal.spawn("scout", 200, 0); fast.spawn("scout", 200, 0);
    normal.fireTimer = 2; fast.fireTimer = 2; normal.update(0.5, 1); fast.update(0.5, 1.8);
    expect(fast.y).toBeGreaterThan(normal.y);
    expect(fast.fireTimer).toBeCloseTo(normal.fireTimer);
  });

  it("scales enemy durability and damage across the campaign", () => {
    expect(enemyDurabilityMultiplier(1)).toBe(1);
    expect(enemyDurabilityMultiplier(10)).toBe(1.5);
    expect(getLevel(10).damageMultiplier).toBeGreaterThan(getLevel(1).damageMultiplier);
    const enemy = new Enemy(); enemy.spawn("gunship", 200, 0, 1, 3);
    expect(enemy.maxHp).toBe(345);
    const boss = new Boss(); boss.spawn("titan", 2);
    expect(boss.maxHp).toBe(2400);
  });

  it("moves bosses dynamically after their entrance instead of leaving a static target", () => {
    const boss = new Boss(); boss.spawn("titan");
    boss.update(1); const firstX = boss.x; const firstY = boss.y;
    boss.update(1);
    expect(boss.x).not.toBeCloseTo(firstX);
    expect(boss.y).not.toBeCloseTo(firstY);
    expect(boss.fireTimer).toBeLessThan(0);
  });

  it("reserves projectile capacity for enemies and caps maximum player fire density", () => {
    expect(COMBAT_LIMITS.minPlayerShotInterval).toBeGreaterThanOrEqual(0.08);
    expect(COMBAT_LIMITS.maxPlayerProjectiles).toBeLessThan(COMBAT_LIMITS.maxEnemyProjectiles);
    expect(COMBAT_LIMITS.maxPlayerProjectiles + COMBAT_LIMITS.maxEnemyProjectiles).toBeLessThan(420);
  });

  it("recycles every projectile after three seconds", () => {
    const projectile = new Projectile(); projectile.launch(300, 400, 0, 0, true, 10, 4, "#fff");
    projectile.update(2.99); expect(projectile.active).toBe(true);
    projectile.update(0.02); expect(projectile.active).toBe(false);
  });

  it("uses fixed-capacity pools instead of allocating beyond capacity", () => {
    const pool = new ObjectPool(() => new TestItem(), 2);
    expect(pool.acquire()).toBeDefined();
    expect(pool.acquire()).toBeDefined();
    expect(pool.acquire()).toBeUndefined();
    expect(pool.activeCount()).toBe(2);
  });

  it("does not throttle a formation by the number of enemies already on screen", () => {
    const pool = new ObjectPool(() => new Enemy(), 30);
    const spawner = new EnemySpawner(pool);
    const config = { ...getLevel(1), maxActiveEnemies: 1, totalEnemyTarget: 15, waves: [{ ...getLevel(1).waves[0], count: 15, burst: 15 }] };
    spawner.update(1 / 60, config);
    expect(pool.activeCount()).toBe(15);
  });

  it("raises pressure through spawn timing, speed and combinations", () => {
    const opening = difficultyAt(10);
    const bossApproach = difficultyAt(170);
    expect(bossApproach.spawnInterval).toBeLessThan(opening.spawnInterval);
    expect(bossApproach.bulletSpeed).toBeGreaterThan(opening.bulletSpeed);
    expect(bossApproach.maxEnemies).toBeGreaterThan(opening.maxEnemies);
    expect(difficultyAt(180).tier).toBe(5);
  });

  it("provides the required readable bullet-pattern families", () => {
    expect(fan3(100)).toHaveLength(3);
    expect(fan5(100)).toHaveLength(5);
    expect(radial(16, 100)).toHaveLength(16);
    expect(spiral(3, 100)).toHaveLength(2);
    expect(cross(100)).toHaveLength(4);
    expect(wave(100, 1)).toHaveLength(1);
  });

  it("aimed shots preserve configured speed and point at the target", () => {
    const [shot] = aimed({ x: 0, y: 0 }, { x: 3, y: 4 }, 200);
    expect(Math.hypot(shot.x, shot.y)).toBeCloseTo(200);
    expect(shot.x).toBeGreaterThan(0);
    expect(shot.y).toBeGreaterThan(0);
  });

  it("moves TITAN-01 through its 60% and 25% phase boundaries", () => {
    const boss = new Boss();
    boss.spawn();
    boss.hp = boss.maxHp * 0.59; boss.update(1 / 60);
    expect(boss.phase).toBe(2);
    boss.hp = boss.maxHp * 0.24; boss.update(1 / 60);
    expect(boss.phase).toBe(3);
  });

  it("routes damage through the restored shield and grants brief invulnerability", () => {
    const player = new Player();
    expect(player.takeDamage(20)).toBe("shield");
    expect(player.shield).toBe(2.5);
    expect(player.hp).toBe(player.maxHp);
    expect(player.takeDamage(20)).toBe("ignored");
  });

  it("gives the pointer a small, responsive amount of ship inertia", () => {
    const player = new Player();
    player.update(1 / 60, { left: false, right: false, up: false, down: false, pointerActive: true, pointerX: 90, pointerY: 620 });
    expect(player.x).toBeGreaterThan(90);
    expect(player.x).toBeLessThan(270);
    expect(player.y).toBeGreaterThan(620);
    expect(player.y).toBeLessThan(960 * 0.78);
    expect(player.vx).not.toBe(0);
    expect(player.vy).not.toBe(0);
  });

  it("offers the restored shield upgrade", () => {
    expect(UPGRADES.some((choice) => choice.id === "shield")).toBe(true);
  });

  it("ships a looping electronic background-music phrase", () => {
    expect(MUSIC_SEQUENCE).toHaveLength(16);
    expect(new Set(MUSIC_SEQUENCE).size).toBeGreaterThan(6);
  });

  it("keeps the opening screen in a three-option main menu", () => {
    const scale = Math.min(WORLD.width / 540, WORLD.height / 960); const toWorld = (x: number, y: number): [number, number] => [(WORLD.width - 540 * scale) / 2 + x * scale, (WORLD.height - 960 * scale) / 2 + y * scale];
    expect(openingActionAt(...toWorld(270, 405), "main")).toBe("start");
    expect(openingActionAt(...toWorld(270, 497), "main")).toBe("how");
    expect(openingActionAt(...toWorld(270, 589), "main")).toBe("settings");
    expect(openingActionAt(...toWorld(270, 717), "how")).toBe("back");
    expect(openingActionAt(...toWorld(270, 330), "settings")).toBe("sound");
    expect(openingActionAt(...toWorld(270, 384), "settings")).toBe("quality");
    expect(openingActionAt(...toWorld(270, 438), "settings")).toBe("antialiasing");
    expect(openingActionAt(...toWorld(270, 492), "settings")).toBe("fps");
    expect(openingActionAt(...toWorld(270, 546), "settings")).toBe("shake");
    expect(openingActionAt(...toWorld(270, 600), "settings")).toBe("effects");
    expect(openingActionAt(...toWorld(270, 654), "settings")).toBe("language");
    expect(openingActionAt(...toWorld(165, 761), "settings")).toBe("fullscreen");
    expect(openingActionAt(...toWorld(375, 761), "settings")).toBe("back");
  });

  it("defines 10 complete, data-driven levels with distinct identities", () => {
    expect(LEVELS).toHaveLength(10);
    expect(LEVELS.map((level) => level.level)).toEqual(Array.from({ length: 10 }, (_, index) => index + 1));
    expect(new Set(LEVELS.map((level) => level.name)).size).toBe(10);
    expect(LEVELS.every((level) => level.palette.accent && level.identity && level.waves.length === level.waveCount && level.activeShooterLimit > 0)).toBe(true);
  });

  it("implements the requested milestone encounters", () => {
    expect(getLevel(5).miniBoss).toBe("heavy-gunship");
    expect(getLevel(10).boss).toBe("omega");
    expect(getLevel(5).bossHealthMultiplier).toBe(1.5);
    expect(getLevel(10).bossHealthMultiplier).toBe(1.6);
    expect(getLevel(10).waveCount).toBe(16);
  });

  it("advances directly into Level 2 after the next-level transition card", () => {
    const levels = new LevelSystem(); levels.reset(1); levels.introTimer = 0; levels.complete();
    expect(levels.update(3.1)).toBe("advanced");
    expect(levels.levelNumber).toBe(2);
    expect(levels.introTimer).toBe(0);
  });

  it("limits upgrade interruptions by level type and progress", () => {
    const normal = getLevel(1); const boss = getLevel(10);
    const longLevel = { ...getLevel(2), duration: 100 };
    expect(levelUpgradeLimit(normal)).toBe(1);
    expect(levelUpgradeLimit(longLevel)).toBe(2);
    expect(levelUpgradeLimit(boss)).toBe(1);
    expect(shouldOfferLevelUpgrade(normal, 0.2, 1000, 0)).toBe(false);
    expect(shouldOfferLevelUpgrade(normal, 0.5, 320, 0)).toBe(true);
    expect(shouldOfferLevelUpgrade(normal, 0.9, 2000, 1)).toBe(false);
    expect(shouldOfferLevelUpgrade(longLevel, 0.72, 900, 1)).toBe(true);
    expect(shouldOfferLevelUpgrade(boss, 0.34, 0, 0)).toBe(true);
  });

  it("unlocks rows, shooters and bullet patterns in readable stages", () => {
    expect(getLevel(1).enemyRows).toBe(1);
    expect(getLevel(6).enemyRows).toBe(2);
    expect(getLevel(8).enemyRows).toBe(3);
    expect(getLevel(1).activeShooterLimit).toBe(2);
    expect(getLevel(6).activeShooterLimit).toBe(5);
    expect(getLevel(10).activeShooterLimit).toBe(7);
    expect(getLevel(8).bulletPatterns).toEqual(expect.arrayContaining(["five", "triple"]));
  });

  it("uses dense, staged waves that keep every level active for at least 30 seconds", () => {
    const totalEnemies = (level: number): number => getLevel(level).waves.reduce((total, wave) => total + wave.count, 0);
    expect(LEVELS.map((level) => level.totalEnemyTarget)).toEqual([76, 91, 106, 122, 121, 152, 168, 180, 195, 204]);
    expect(LEVELS.every((level) => totalEnemies(level.level) === level.totalEnemyTarget && level.minimumDuration >= 30 && level.waves.every((wave) => (wave.spawnInterval ?? 1) <= 0.35))).toBe(true);
    expect(LEVELS.map((level) => level.difficulty)).toEqual([1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.05, 2.2, 2.35]);
  });

  it("reports an enemy that escapes the combat area", () => {
    const enemy = new Enemy();
    enemy.spawn("scout", 200, 1060);
    expect(enemy.update(1 / 60)).toBe(true);
    expect(enemy.active).toBe(false);
  });

  it("ships complete interface and upgrade copy in all five languages", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["en", "zh-CN", "ja", "ko", "es"]);
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = TRANSLATIONS[language];
      expect(copy.opening.start.length).toBeGreaterThan(0);
      expect(copy.menu.start.length).toBeGreaterThan(0);
      expect(copy.menu.howToPlay.length).toBeGreaterThan(0);
      expect(copy.menu.settings.length).toBeGreaterThan(0);
      expect(copy.gameOver.retry.length).toBeGreaterThan(0);
      expect(copy.level.level.length).toBeGreaterThan(0);
      expect(Object.keys(copy.level.objectives)).toHaveLength(10);
      expect(Object.keys(copy.pickupRules)).toHaveLength(6);
      expect(Object.values(copy.pickupRules).every(Boolean)).toBe(true);
      expect(Object.keys(copy.upgrades)).toHaveLength(10);
      expect(Object.values(copy.upgrades).every((upgrade) => upgrade.name && upgrade.description)).toBe(true);
    }
  });
});
