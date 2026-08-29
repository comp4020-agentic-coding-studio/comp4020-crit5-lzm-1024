import { WORLD, COLOURS, COMBAT_LIMITS } from "./GameConfig.ts";
import type { GameMode, PickupType, RunStats, UpgradeChoice } from "./types.ts";
import { ObjectPool } from "../utils/ObjectPool.ts";
import { Projectile } from "../entities/Projectile.ts";
import { Player } from "../entities/Player.ts";
import { Enemy } from "../entities/Enemy.ts";
import { Pickup } from "../entities/Pickup.ts";
import { Boss } from "../entities/Boss.ts";
import { InputSystem } from "../systems/InputSystem.ts";
import { AudioSystem } from "../systems/AudioSystem.ts";
import { EnemySpawner, enemyDurabilityMultiplier } from "../systems/EnemySpawner.ts";
import { getLevel, MAX_LEVEL } from "../levels/levels.ts";
import { LevelSystem } from "../systems/LevelSystem.ts";
import { HazardSystem } from "../systems/HazardSystem.ts";
import type { BossVariant } from "../levels/LevelConfig.ts";
import { ComboSystem } from "../systems/ComboSystem.ts";
import { UpgradeSystem } from "../systems/UpgradeSystem.ts";
import { ParticleSystem } from "../effects/ParticleSystem.ts";
import { Background } from "../effects/Background.ts";
import { aimed, cross, fan3, fan5, radial, spiral, straight, wave } from "../patterns/BulletPatterns.ts";
import { drawHUD, ultimateButtonContains } from "../ui/HUD.ts";
import { drawGameOver, drawLevelOverlay, drawOpening, drawUpgrades, gameOverActionAt, openingActionAt, upgradeIndexAt, type GraphicsQuality, type OpeningPanel } from "../ui/Screens.ts";
import { SUPPORTED_LANGUAGES, TRANSLATIONS, type Language } from "../i18n/translations.ts";

const FIXED_STEP = 1 / 60;
const MAX_UPDATES_PER_FRAME = 2;
const COLLISION_CELL_SIZE = 96;
const COLLISION_GRID_COLUMNS = Math.ceil(WORLD.width / COLLISION_CELL_SIZE);
const COLLISION_GRID_ROWS = Math.ceil(WORLD.height / COLLISION_CELL_SIZE);
const COLLISION_GRID_SIZE = COLLISION_GRID_COLUMNS * COLLISION_GRID_ROWS;
const SETTINGS_KEY = "skyfall-settings";
type MessageKey = keyof (typeof TRANSLATIONS)["en"]["messages"];

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: InputSystem;
  private readonly audio = new AudioSystem();
  private readonly player = new Player();
  private readonly boss = new Boss();
  private readonly bullets = new ObjectPool(() => new Projectile(), 420);
  // A full late-game wave may coexist on screen.  This is deliberately sized
  // for the authored encounter rather than acting as a gameplay limiter.
  private readonly enemies = new ObjectPool(() => new Enemy(), 260);
  private readonly pickups = new ObjectPool(() => new Pickup(), 28);
  private readonly effects = new ParticleSystem();
  private readonly background = new Background();
  private readonly combo = new ComboSystem();
  private readonly upgrades = new UpgradeSystem();
  private readonly spawner: EnemySpawner;
  private readonly levels = new LevelSystem();
  private readonly hazards = new HazardSystem();
  // Fixed buckets avoid per-frame Map entries, string keys, and candidate
  // arrays while keeping the same 3×3 broad-phase collision search.
  private readonly enemyCells: Enemy[][] = Array.from({ length: COLLISION_GRID_SIZE }, () => []);
  private readonly readyShooters: Enemy[] = [];
  private readonly activeEnemies: Enemy[] = [];
  private readonly activeProjectiles: Projectile[] = [];
  private readonly activePlayerProjectiles: Projectile[] = [];
  private readonly activeEnemyProjectiles: Projectile[] = [];
  private mode: GameMode = "opening";
  private openingPanel: OpeningPanel = "main";
  private lastFrame = 0; private lastPresentedFrame = 0; private accumulator = 0; private worldTime = 0; private openingTime = 0; private runTime = 0;
  private score = 0; private xp = 0; private levelStartXp = 0; private upgradesThisLevel = 0; private upgradeChoices: UpgradeChoice[] = [];
  private destroyed = 0; private shake = 0; private damageFlash = 0; private hitStop = 0; private dying = 0; private deathBurst = false;
  private messageKey: MessageKey = "mission"; private messageUpgrade?: UpgradeChoice["id"]; private messageTimer = 0; private bossStarted = false; private bossExplosionStep = 0;
  private laserFlash = 0; private laserTimer = 1.8; private missileTimer = 2.2; private bestScore = 0;
  private playerProjectileCount = 0; private enemyProjectileCount = 0; private shieldAuraTimer = 0; private trailTimer = 0;
  private bossEntranceTimer = 0; private levelClearTimer = 0; private enemyShotSpacing = 0; private shotCursor = 0; private combatGapTimer = 0;
  private soundPreference = true;
  private graphicsQuality: GraphicsQuality = "balanced";
  private antialiasing = true;
  private fpsLimit: 30 | 60 = 60;
  private screenShake = true;
  private reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly debugMode = new URLSearchParams(location.search).get("debug");
  private readonly requestedLevel = Number(new URLSearchParams(location.search).get("level") ?? 0);

  constructor(private readonly canvas: HTMLCanvasElement, private readonly frame: HTMLDivElement, private language: Language) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D is unavailable.");
    this.ctx = context; this.loadSettings();
    this.input = new InputSystem(canvas); this.spawner = new EnemySpawner(this.enemies);
    try { this.bestScore = Number(localStorage.getItem("skyfall-best") ?? 0); } catch { this.bestScore = 0; }
    this.effects.setDensity(this.reducedMotion ? 0.45 : 1);
    this.resize(); window.addEventListener("resize", () => this.resize()); document.addEventListener("fullscreenchange", () => this.resize());
  }

  start(): void { this.lastFrame = performance.now(); requestAnimationFrame(this.loop); }
  get soundEnabledPreference(): boolean { return this.soundPreference; }
  toggleSound(): boolean {
    this.soundPreference = !this.soundPreference;
    if (this.soundPreference && !this.audio.enabled) this.audio.start();
    else if (!this.soundPreference && this.audio.enabled) this.audio.toggle();
    this.saveSettings();
    return this.soundPreference;
  }
  setLanguage(language: Language): void { this.language = language; }

  private readonly loop = (now: number): void => {
    requestAnimationFrame(this.loop);
    if (now - this.lastPresentedFrame < 1000 / this.fpsLimit - 0.5) return;
    this.lastPresentedFrame = now;
    const realDelta = Math.min(0.05, (now - this.lastFrame) / 1000); this.lastFrame = now; this.accumulator += realDelta;
    this.handleCommands();
    let updates = 0;
    while (this.accumulator >= FIXED_STEP && updates < MAX_UPDATES_PER_FRAME) { this.update(FIXED_STEP); this.accumulator -= FIXED_STEP; updates += 1; }
    // On a slow device, dropping stale simulation time prevents a catch-up
    // spiral where every late frame performs more work than the last one.
    if (updates === MAX_UPDATES_PER_FRAME) this.accumulator = 0;
    this.render();
  };

  private resize(): void {
    const deviceRatio = window.devicePixelRatio || 1;
    const ratio = this.graphicsQuality === "high" ? Math.min(3, Math.max(2, deviceRatio)) : this.graphicsQuality === "balanced" ? Math.min(2.5, Math.max(1.5, deviceRatio)) : Math.min(1.5, Math.max(1, deviceRatio));
    this.canvas.width = Math.round(WORLD.width * ratio); this.canvas.height = Math.round(WORLD.height * ratio);
    this.ctx.imageSmoothingEnabled = this.antialiasing;
  }

  private loadSettings(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<{ sound: boolean; quality: GraphicsQuality; antialiasing: boolean; fps: number; shake: boolean; reducedMotion: boolean }>;
      if (typeof saved.sound === "boolean") this.soundPreference = saved.sound;
      if (saved.quality === "high" || saved.quality === "balanced" || saved.quality === "performance") this.graphicsQuality = saved.quality;
      if (typeof saved.antialiasing === "boolean") this.antialiasing = saved.antialiasing;
      if (saved.fps === 30 || saved.fps === 60) this.fpsLimit = saved.fps;
      if (typeof saved.shake === "boolean") this.screenShake = saved.shake;
      if (typeof saved.reducedMotion === "boolean") this.reducedMotion = saved.reducedMotion;
    } catch { /* settings are optional when browser storage is unavailable */ }
  }

  private saveSettings(): void {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: this.soundPreference, quality: this.graphicsQuality, antialiasing: this.antialiasing, fps: this.fpsLimit, shake: this.screenShake, reducedMotion: this.reducedMotion })); } catch { /* settings persistence is optional */ }
  }

  private applyOpeningSetting(action: Exclude<ReturnType<typeof openingActionAt>, "start" | "how" | "settings" | "back" | null>): void {
    if (action === "sound") {
      const enabled = this.toggleSound(); window.dispatchEvent(new CustomEvent("skyfall-audio-changed", { detail: enabled })); return;
    }
    if (action === "quality") { const order: GraphicsQuality[] = ["high", "balanced", "performance"]; this.graphicsQuality = order[(order.indexOf(this.graphicsQuality) + 1) % order.length]; this.resize(); }
    else if (action === "antialiasing") { this.antialiasing = !this.antialiasing; this.ctx.imageSmoothingEnabled = this.antialiasing; }
    else if (action === "fps") { this.fpsLimit = this.fpsLimit === 60 ? 30 : 60; this.lastPresentedFrame = 0; }
    else if (action === "shake") this.screenShake = !this.screenShake;
    else if (action === "effects") { this.reducedMotion = !this.reducedMotion; this.effects.setDensity(this.reducedMotion ? 0.45 : 1); }
    else if (action === "language") {
      this.language = SUPPORTED_LANGUAGES[(SUPPORTED_LANGUAGES.indexOf(this.language) + 1) % SUPPORTED_LANGUAGES.length];
      try { localStorage.setItem("skyfall-language", this.language); } catch { /* language persistence is optional */ }
      window.dispatchEvent(new CustomEvent("skyfall-language-changed", { detail: this.language }));
    }
    else if (action === "fullscreen") { if (document.fullscreenElement) void document.exitFullscreen(); else void this.frame.requestFullscreen(); return; }
    this.saveSettings();
  }

  private handleCommands(): void {
    const primary = this.input.consumePrimary();
    if (this.mode === "opening" && primary) {
      const action = openingActionAt(this.input.state.pointerX, this.input.state.pointerY, this.openingPanel);
      if (action === "start") this.beginRun();
      else if (action === "how" || action === "settings") this.openingPanel = action;
      else if (action === "back") this.openingPanel = "main";
      else if (action) this.applyOpeningSetting(action);
      return;
    }
    if (this.mode === "upgrade") {
      const keyboardChoice = this.input.consumeChoice();
      const pointerChoice = primary ? upgradeIndexAt(this.input.state.pointerX, this.input.state.pointerY) : -1;
      const choice = keyboardChoice >= 0 ? keyboardChoice : pointerChoice;
      if (choice >= 0) this.selectUpgrade(choice);
      return;
    }
    if (this.mode === "gameover" || this.mode === "victory") {
      if (!primary) return;
      const action = gameOverActionAt(this.input.state.pointerX, this.input.state.pointerY);
      if (action === "menu") { this.mode = "opening"; this.openingTime = 0; this.openingPanel = "main"; }
      else this.beginRun();
      return;
    }
    const ultimateRequested = this.input.consumeAction() || (primary && ultimateButtonContains(this.input.state.pointerX, this.input.state.pointerY));
    if (this.mode === "playing" && ultimateRequested) this.activateUltimate();
  }

  private update(dt: number): void {
    this.worldTime += dt; this.messageTimer = Math.max(0, this.messageTimer - dt); this.damageFlash = Math.max(0, this.damageFlash - dt * 3.4); this.shake = Math.max(0, this.shake - dt * 26); this.laserFlash = Math.max(0, this.laserFlash - dt);
    if (this.mode === "opening") { this.openingTime += dt; return; }
    if (this.mode === "upgrade" || this.mode === "gameover" || this.mode === "victory") { this.background.update(dt * 0.18, 0.25); this.effects.update(dt); return; }
    if (this.hitStop > 0) { this.hitStop -= dt; this.effects.update(dt); return; }

    const levelEvent = this.levels.update(dt);
    if (levelEvent === "advanced") { this.onLevelAdvanced(); return; }
    const config = this.levels.config;
    if (!this.levels.active) { this.background.update(dt * 0.35, 0.7); this.effects.update(dt); return; }

    this.runTime += dt; const ultimateActive = this.player.ultimateTimer > 0; const worldDt = dt * (ultimateActive ? 0.45 : 1);
    this.background.update(worldDt, 1 + this.levels.pressure * 0.35); this.combo.update(dt); this.effects.update(dt);

    if (this.dying > 0) { this.updateDeath(dt, worldDt); return; }
    this.player.update(dt, this.input.state);
    const wind = this.hazards.update(worldDt, config, this.player.x, (amount) => this.damagePlayer(amount));
    this.player.x = Math.max(30, Math.min(WORLD.width - 30, this.player.x + wind * worldDt));
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) { this.effects.trail(this.player.x, this.player.y + 34, ultimateActive ? COLOURS.violet : COLOURS.cyan); this.trailTimer = 1 / 30; }
    this.updateWeapons(dt);

    if (!this.bossStarted) this.spawner.update(dt, config);
    this.updateLevelScript(dt);
    this.updateEnemies(worldDt); this.updateBoss(worldDt); this.buildEnemySpatialHash();
    if (this.shieldAuraTimer <= 0) { this.applyShieldDroneProtection(); this.shieldAuraTimer = 0.1; }
    this.updateBullets(dt, worldDt); this.updatePickups(worldDt); this.resolveCollisions();
    if (this.player.hp <= 0) this.beginDeath();
    this.trackCombatGap(dt);
    if (!config.boss && !config.miniBoss && !config.bossSequence && this.levels.elapsed >= config.minimumDuration && this.spawner.isComplete && !this.hasActiveEnemies()) {
      this.levelClearTimer += dt;
      if (this.levelClearTimer >= 1) this.completeLevel();
    } else this.levelClearTimer = 0;
  }

  private beginRun(): void {
    this.mode = "playing"; if (this.soundPreference) { this.audio.start(); window.dispatchEvent(new Event("skyfall-audio-started")); } this.player.reset(); this.input.clearPointerFollow(); this.boss.active = false; this.bullets.releaseAll(); this.enemies.releaseAll(); this.pickups.releaseAll(); this.combo.reset(); this.upgrades.reset(); this.spawner.reset();
    const debugBossLevel = this.debugMode?.startsWith("boss") ? 10 : 1;
    this.levels.reset(this.requestedLevel >= 1 && this.requestedLevel <= MAX_LEVEL ? this.requestedLevel : debugBossLevel); this.hazards.reset();
    Object.assign(this, { runTime: 0, score: 0, xp: 0, levelStartXp: 0, upgradesThisLevel: 0, destroyed: 0, shake: 0, damageFlash: 0, dying: 0, deathBurst: false, messageKey: "mission", messageUpgrade: undefined, messageTimer: 0, bossStarted: false, bossExplosionStep: 0, laserTimer: 1.8, missileTimer: 2.2, playerProjectileCount: 0, enemyProjectileCount: 0, shieldAuraTimer: 0, trailTimer: 0, bossEntranceTimer: 0, levelClearTimer: 0, enemyShotSpacing: 0, shotCursor: 0, combatGapTimer: 0 });
    if (this.debugMode?.startsWith("boss")) {
      const config = this.levels.config; const variant = config.boss ?? config.miniBoss ?? config.bossSequence?.[0];
      if (variant) { this.levels.bossSpawned = true; this.startBoss(variant); }
    }
  }

  private updateLevelScript(dt: number): void {
    const config = this.levels.config;
    const bossVariant = config.bossSequence?.[this.levels.bossIndex] ?? config.boss ?? config.miniBoss;
    if (!bossVariant) return;
    if (!this.levels.bossSpawned && this.spawner.isComplete && !this.hasActiveEnemies()) {
      this.levels.bossSpawned = true; this.bossEntranceTimer = 2.2; this.messageKey = "climax"; this.messageUpgrade = undefined; this.messageTimer = 2.2; this.audio.play("warning");
    }
    if (this.levels.bossSpawned && !this.bossStarted) {
      this.bossEntranceTimer -= dt;
      if (this.bossEntranceTimer <= 0) this.startBoss(bossVariant);
    }
  }

  private completeLevel(): void {
    if (this.levels.completeTimer > 0) return;
    this.enemies.releaseAll(); this.clearEnemyBullets(); this.pickups.releaseAll(); this.boss.active = false; this.bossStarted = false;
    this.player.shield = Math.min(this.player.maxShield, this.player.shield + 16); this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8); this.player.ultimate = Math.min(100, this.player.ultimate + 12);
    this.levels.complete(); this.shake = 10; this.audio.play("upgrade");
  }

  private onLevelAdvanced(): void {
    this.boss.active = false; this.bossStarted = false; this.bossExplosionStep = 0; this.bossEntranceTimer = 0; this.levelClearTimer = 0; this.combatGapTimer = 0; this.spawner.reset(); this.hazards.reset();
    this.enemies.releaseAll(); this.clearEnemyBullets(); this.pickups.releaseAll(); this.combo.reset(); this.levelStartXp = this.xp; this.upgradesThisLevel = 0; this.shieldAuraTimer = 0;
    this.grantMilestonePower(this.levels.levelNumber);
    // Upgrade and repair choices are consolidated into the between-level
    // hand-off, never interrupting active combat in the middle of a wave.
    this.openUpgrade();
  }

  private grantMilestonePower(level: number): void {
    if (level === 5) { this.player.weaponLevel = Math.max(3, this.player.weaponLevel); this.player.damage += 3; }
    if (level === 10) { this.player.weaponLevel = Math.max(4, this.player.weaponLevel); this.player.damage += 5; }
    if (level === 15) { this.player.weaponLevel = Math.max(5, this.player.weaponLevel); this.player.drones = Math.max(1, this.player.drones); this.player.missiles = Math.max(1, this.player.missiles); this.player.laser = Math.max(1, this.player.laser); }
    if (level === 20) { this.player.weaponLevel = 6; this.player.drones = 2; this.player.missiles = Math.max(2, this.player.missiles); this.player.laser = Math.max(2, this.player.laser); this.player.ultimate = 100; }
  }

  private enemyBulletSpeed(): number { return 152 + (this.levels.config.level - 1) * 7; }
  private enemyMovementMultiplier(): number { return this.levels.config.movementMultiplier; }

  private updateWeapons(dt: number): void {
    if (this.player.fireTimer <= 0) this.firePlayer();
    this.missileTimer -= dt; this.laserTimer -= dt;
    if (this.player.missiles > 0 && this.missileTimer <= 0) { this.fireMissile(); this.missileTimer = Math.max(0.7, 2.4 - this.player.missiles * 0.25); }
    if (this.player.laser > 0 && this.laserTimer <= 0) { this.fireLaser(); this.laserTimer = Math.max(1.1, 3.2 - this.player.laser * 0.3); }
  }

  private firePlayer(): void {
    const level = this.player.weaponLevel; const intervalFactor = this.player.weaponOverdrive > 0 ? 0.3 : level >= 6 ? 0.52 : level >= 2 ? 0.82 : 1;
    this.player.fireTimer = Math.max(COMBAT_LIMITS.minPlayerShotInterval, this.player.fireInterval * intervalFactor); this.player.recoil = 1;
    const damage = this.player.damage * (Math.random() < this.player.criticalChance ? 2 : 1); const critical = damage > this.player.damage;
    const shot = (x: number, vx: number, vy = -710, radius = 3.1, piercing = this.player.piercing): void => { this.spawnBullet(x, this.player.y - 31, vx, vy, false, damage, radius, critical ? COLOURS.orange : COLOURS.cyan, piercing); };
    shot(this.player.x - 10, 0); shot(this.player.x + 10, 0);
    if (level >= 3) shot(this.player.x, 0, -760, 3.6);
    if (level >= 4) { shot(this.player.x - 24, -105, -690); shot(this.player.x + 24, 105, -690); }
    if (level >= 5) shot(this.player.x, 0, -620, 6, true);
    if (this.player.drones > 0) { shot(this.player.x - 42, -32, -650, 2.8); if (this.player.drones > 1) shot(this.player.x + 42, 32, -650, 2.8); }
    this.effects.burst(this.player.x, this.player.y - 31, level >= 5 ? COLOURS.violet : COLOURS.cyan, 3 + level, 55);
    this.audio.play(level >= 5 ? "heavyShoot" : "shoot");
  }

  private fireMissile(): void {
    const target = this.enemies.items.find((enemy) => enemy.active) ?? (this.boss.active ? { x: this.boss.x, y: this.boss.y } : undefined);
    if (!target) return; const vectors = aimed(this.player, target, 470); const vector = vectors[0];
    this.spawnBullet(this.player.x, this.player.y - 22, vector.x, vector.y, false, this.player.damage * 3, 6, COLOURS.orange, true); this.audio.play("heavyShoot");
  }

  private fireLaser(): void {
    this.laserFlash = 0.18; let hit = false;
    for (const enemy of this.enemies.items) if (enemy.active && Math.abs(enemy.x - this.player.x) < 22) { if (enemy.takeDamage(this.player.damage * 3.5)) this.destroyEnemy(enemy); hit = true; }
    if (this.boss.active && Math.abs(this.boss.x - this.player.x) < 145) { this.boss.hit(this.player.x, this.player.damage * 3.5); hit = true; }
    if (hit) this.hitStop = 0.018; this.effects.shockwave(this.player.x, this.player.y - 40, COLOURS.cyan, 35);
  }

  private updateEnemies(dt: number): void {
    const speed = this.enemyBulletSpeed(); const movementMultiplier = this.enemyMovementMultiplier();
    const ready = this.readyShooters; ready.length = 0;
    this.enemyShotSpacing = Math.max(0, this.enemyShotSpacing - dt);
    for (const enemy of this.enemies.items) if (enemy.active) {
      const escaped = enemy.update(dt, movementMultiplier);
      if (escaped) {
        // Letting an enemy leave the combat zone is a tactical failure too.
        this.damagePlayer(7 * this.levels.config.damageMultiplier);
      }
      if (!enemy.active) {
        if (this.debugMode === "waves" && enemy.enteredScreen && enemy.canAttack && enemy.attackCount === 0) console.warn("Enemy exited without attacking");
        continue;
      }
      if (!enemy.canAttack) continue;
      if (enemy.type === "diveBomber") { this.updateDiveBomber(enemy, speed); continue; }
      if (enemy.type !== "shieldDrone" && enemy.fireTimer <= 0 && enemy.y > 20) ready.push(enemy);
    }
    this.shieldAuraTimer -= dt;
    const limit = Math.min(this.levels.config.activeShooterLimit, ready.length);
    if (limit > 0 && this.enemyShotSpacing <= 0) {
      const enemy = ready[this.shotCursor % limit]; this.shotCursor += 1; this.fireEnemy(enemy, speed);
      this.enemyShotSpacing = Math.max(0.1, 0.19 - this.levels.config.level * 0.008);
    }
  }

  private updateDiveBomber(enemy: Enemy, speed: number): void {
    if (enemy.diving) return;
    if (enemy.patternStep === 0 && enemy.age > 1.1) {
      enemy.warning = 0.72; enemy.lockX = this.player.x; enemy.lockY = this.player.y; enemy.patternStep = 1; this.audio.play("warning"); return;
    }
    if (enemy.patternStep === 1 && enemy.warning <= 0) {
      const vector = aimed(enemy, { x: enemy.lockX, y: enemy.lockY }, speed * 2.45)[0];
      enemy.diving = true; enemy.diveVx = vector.x; enemy.diveVy = vector.y; enemy.patternStep = 2;
      enemy.attackCount += 1;
    }
  }

  private applyShieldDroneProtection(): void {
    const radius = 135; const radiusSquared = radius * radius;
    for (const enemy of this.activeEnemies) enemy.auraShield = 0;
    for (const drone of this.activeEnemies) if (drone.type === "shieldDrone") {
      const minCellX = Math.max(0, Math.floor((drone.x - radius) / COLLISION_CELL_SIZE));
      const maxCellX = Math.min(COLLISION_GRID_COLUMNS - 1, Math.floor((drone.x + radius) / COLLISION_CELL_SIZE));
      const minCellY = Math.max(0, Math.floor((drone.y - radius) / COLLISION_CELL_SIZE));
      const maxCellY = Math.min(COLLISION_GRID_ROWS - 1, Math.floor((drone.y + radius) / COLLISION_CELL_SIZE));
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        for (const target of this.enemyCells[cellY * COLLISION_GRID_COLUMNS + cellX]) {
          if (!target.active || target === drone) continue;
          const dx = target.x - drone.x; const dy = target.y - drone.y;
          if (dx * dx + dy * dy < radiusSquared) target.auraShield = 1;
        }
      }
    }
  }

  private fireEnemy(enemy: Enemy, speed: number): void {
    const damageMultiplier = this.levels.config.damageMultiplier;
    const emit = (vectors: { x: number; y: number }[], radius = 4, color: string = COLOURS.red): void => { for (const vector of vectors) this.spawnBullet(enemy.x, enemy.y + enemy.radius * 0.7, vector.x, vector.y, true, (enemy.type === "elite" ? 22 : 15) * damageMultiplier, radius, color); };
    switch (enemy.type) {
      case "scout": emit(this.patternVectors(enemy, speed, enemy.patternStep % 2 ? "single" : "single")); break;
      case "shooter": emit(this.patternVectors(enemy, speed, this.levels.config.bulletPatterns.includes("triple") ? "triple" : "single"), 4.2, COLOURS.orange); break;
      case "interceptor": emit(this.patternVectors(enemy, speed * 1.2, "double"), 4, COLOURS.orange); break;
      case "gunship": emit(this.patternVectors(enemy, speed, enemy.patternStep % 2 ? "triple" : "single"), 4.8, COLOURS.red); break;
      case "swarm": emit(straight(speed * 0.8), 3); break;
      case "elite": {
        const patterns = this.levels.config.bulletPatterns; const pattern = patterns[enemy.patternStep % patterns.length] ?? "five";
        emit(this.patternVectors(enemy, speed, pattern), 4.5, COLOURS.violet); break;
      }
      case "sniper": {
        if (enemy.patternStep % 2 === 0) { enemy.warning = 0.82; enemy.lockX = this.player.x; enemy.lockY = this.player.y; enemy.fireTimer = 0.82; enemy.patternStep += 1; this.audio.play("warning"); return; }
        const vector = aimed(enemy, { x: enemy.lockX, y: enemy.lockY }, speed * 2.2)[0]; this.spawnBullet(enemy.x, enemy.y + 16, vector.x, vector.y, true, 28 * damageMultiplier, 5, COLOURS.orange); break;
      }
      case "diveBomber": case "shieldDrone": break;
    }
    enemy.attackCount += 1; enemy.patternStep += 1; enemy.fireTimer = enemy.fireInterval * (0.9 + Math.random() * 0.25);
  }

  private patternVectors(enemy: Enemy, speed: number, pattern: string): { x: number; y: number }[] {
    switch (pattern) {
      case "double": return [{ x: -speed * 0.23, y: speed }, { x: speed * 0.23, y: speed }];
      case "triple": return fan3(speed);
      case "five": return fan5(speed);
      case "wave": return wave(speed, enemy.age * 2);
      case "cross": return cross(speed * 0.72, Math.PI / 4);
      case "ring": return radial(10, speed * 0.68, enemy.age);
      case "spiral": return spiral(enemy.patternStep, speed);
      case "tracking": return aimed(enemy, this.player, speed * 1.35);
      default: return enemy.type === "scout" ? straight(speed) : aimed(enemy, this.player, speed);
    }
  }

  private startBoss(variant: BossVariant): void {
    this.bossStarted = true; this.enemies.releaseAll(); this.clearEnemyBullets(); this.boss.spawn(variant, enemyDurabilityMultiplier(this.levels.config.level) * (this.levels.config.bossHealthMultiplier ?? 1) * 1.5); if (this.debugMode === "boss3") this.boss.hp = this.boss.maxHp * 0.24; this.messageKey = "boss"; this.messageUpgrade = undefined; this.messageTimer = 3; this.shake = 14; this.audio.play("boss");
  }

  private updateBoss(dt: number): void {
    if (!this.boss.active) return;
    const previousPhase = this.boss.phase; this.boss.update(dt);
    if (this.boss.destroyed) { this.updateBossDestruction(); return; }
    if (this.boss.phase !== previousPhase) {
      this.messageKey = this.boss.phase === 3 ? "phase3" : "phase2"; this.messageUpgrade = undefined; this.messageTimer = 2.8; this.shake = 18; this.audio.play("warning");
      if (this.boss.variant === "omega" && this.boss.phase === 4) { this.player.ultimate = 100; this.messageKey = "finalStrike"; this.messageTimer = 3.2; }
    }
    if (this.boss.fireTimer <= 0) this.fireBoss();
  }

  private fireBoss(): void {
    const speed = this.enemyBulletSpeed(); const damage = 24 * this.levels.config.damageMultiplier;
    const emitAt = (x: number, y: number, vectors: { x: number; y: number }[], color: string = COLOURS.red, radius = 5): void => { for (const vector of vectors) this.spawnBullet(x, y, vector.x, vector.y, true, damage, radius, color); };
    const phaseCounts = [0, 10, 14, 18, 22];
    const variantBonus = this.boss.variant === "omega" ? 2 : this.boss.variant === "carrier" ? 1 : 0;
    const count = phaseCounts[this.boss.phase] + variantBonus;
    const volleySpeed = speed * (0.72 + this.boss.phase * 0.09);
    // Rotate every circular volley so successive rings create moving gaps
    // instead of stacking into the same fixed lanes.
    const rotation = this.boss.patternStep * (Math.PI / Math.max(8, count)) + this.boss.age * 0.12;
    const color = this.boss.phase >= 3 ? COLOURS.violet : this.boss.variant === "carrier" ? COLOURS.cyan : COLOURS.orange;
    emitAt(this.boss.x, this.boss.y + 20, radial(count, volleySpeed, rotation), color, this.boss.phase >= 3 ? 5.1 : 4.7);
    if (this.boss.variant === "carrier" && this.boss.patternStep % 4 === 3) this.spawner.spawnClimax("swarm", 2, this.levels.config.level);
    if (this.boss.variant === "omega" && this.boss.phase < 4 && this.boss.patternStep % 5 === 4) this.spawner.spawnClimax("shooter", 5, this.levels.config.level);
    this.boss.fireTimer = this.boss.phase === 1 ? 0.72 : this.boss.phase === 2 ? 0.58 : this.boss.phase === 3 ? 0.45 : 0.38;
    this.boss.patternStep += 1;
  }

  private updateBossDestruction(): void {
    const steps = [0.05, 0.48, 0.91, 1.36, 1.85, 2.45]; const offsets = [[0, 18], [-88, 25], [88, 25], [-40, -25], [48, -18], [0, 15]];
    while (this.bossExplosionStep < steps.length && this.boss.destructionTimer >= steps[this.bossExplosionStep]) {
      const [ox, oy] = offsets[this.bossExplosionStep]; const final = this.bossExplosionStep === steps.length - 1;
      this.explosion(this.boss.x + ox, this.boss.y + oy, final ? 56 : 25, final ? COLOURS.white : COLOURS.orange); this.shake = final ? 28 : 13; this.bossExplosionStep += 1;
    }
    if (this.boss.destructionTimer > 3.25) {
      if (this.levels.advanceBoss()) { this.boss.active = false; this.bossStarted = false; this.bossExplosionStep = 0; this.clearEnemyBullets(); }
      else if (this.levels.levelNumber >= MAX_LEVEL) this.finishRun(true); else this.completeLevel();
    }
  }

  private updateBullets(playerDt: number, worldDt: number): void {
    this.activeProjectiles.length = 0; this.activePlayerProjectiles.length = 0; this.activeEnemyProjectiles.length = 0;
    for (const bullet of this.bullets.items) if (bullet.active) {
      const enemyBullet = bullet.enemy;
      bullet.update(enemyBullet ? worldDt : playerDt);
      // Projectiles expire inside Projectile.update. Keep the caps accurate
      // here instead of performing a second full-pool recount every tick.
      if (!bullet.active) this.decrementProjectileCount(enemyBullet);
      else {
        this.activeProjectiles.push(bullet);
        if (enemyBullet) this.activeEnemyProjectiles.push(bullet); else this.activePlayerProjectiles.push(bullet);
      }
    }
  }

  private updatePickups(dt: number): void { for (const pickup of this.pickups.items) if (pickup.active) pickup.update(dt, this.player.x, this.player.y, this.player.magnet); }

  private resolveCollisions(): void {
    for (const bullet of this.activePlayerProjectiles) if (bullet.active) {
      if (this.boss.active && !this.boss.destroyed && Math.abs(bullet.x - this.boss.x) < 150 * this.boss.scale && Math.abs(bullet.y - this.boss.y) < 112 * this.boss.scale) {
        const result = this.boss.hit(bullet.x, bullet.damage); this.effects.burst(bullet.x, bullet.y, result.turret ? COLOURS.orange : COLOURS.cyan, 3, 45); if (!bullet.piercing) this.releaseBullet(bullet); if (result.destroyed) { this.clearEnemyBullets(); this.audio.play("destroyed"); } continue;
      }
      const cellX = Math.floor(bullet.x / COLLISION_CELL_SIZE); const cellY = Math.floor(bullet.y / COLLISION_CELL_SIZE);
      for (let y = cellY - 1; y <= cellY + 1 && bullet.active; y += 1) for (let x = cellX - 1; x <= cellX + 1 && bullet.active; x += 1) {
        if (x < 0 || x >= COLLISION_GRID_COLUMNS || y < 0 || y >= COLLISION_GRID_ROWS) continue;
        const candidates = this.enemyCells[y * COLLISION_GRID_COLUMNS + x];
        for (const enemy of candidates) if (bullet.active && enemy.active && this.overlaps(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
          if (enemy.takeDamage(bullet.damage)) this.destroyEnemy(enemy); else { this.effects.burst(bullet.x, bullet.y, enemy.shield > 0 || enemy.auraShield > 0 ? COLOURS.violet : COLOURS.cyan, 3, 42); this.audio.play("enemyHit"); }
          if (!bullet.piercing) this.releaseBullet(bullet);
        }
      }
    }
    for (const bullet of this.activeEnemyProjectiles) if (bullet.active && this.overlaps(bullet.x, bullet.y, bullet.radius, this.player.x, this.player.y, 10)) { this.releaseBullet(bullet); this.damagePlayer(bullet.damage); }
    for (const enemy of this.activeEnemies) if (enemy.active && this.overlaps(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, 11)) { enemy.reset(); this.damagePlayer(35 * this.levels.config.damageMultiplier); }
    for (const pickup of this.pickups.items) if (pickup.active && this.overlaps(pickup.x, pickup.y, pickup.radius, this.player.x, this.player.y, 20)) { this.collectPickup(pickup); pickup.reset(); }
  }

  private destroyEnemy(enemy: Enemy): void {
    const x = enemy.x; const y = enemy.y; const elite = enemy.type === "elite"; const score = Math.round(enemy.score * this.combo.multiplier);
    if (this.debugMode === "waves" && enemy.enteredScreen && enemy.canAttack && enemy.attackCount === 0) console.warn("Enemy exited without attacking");
    this.score += score; this.xp += enemy.xp; this.destroyed += 1; this.player.ultimate = Math.min(100, this.player.ultimate + (elite ? 22 : 4)); this.combo.add();
    this.explosion(x, y, elite ? 32 : enemy.radius, elite ? COLOURS.violet : COLOURS.orange); this.effects.popup(x, y - 14, `+${score}`, elite ? COLOURS.violet : COLOURS.white, elite ? 19 : 14); this.hitStop = elite ? 0.045 : 0.022; enemy.reset();
    if (elite || Math.random() < 0.17) this.spawnPickup(elite ? "weapon" : this.randomPickup(), x, y);
  }

  private damagePlayer(amount: number): void {
    const result = this.player.takeDamage(amount); if (result === "ignored") return;
    this.damageFlash = result === "shield" ? 0.28 : 0.52; this.shake = result === "shield" ? 7 : 13; this.effects.burst(this.player.x, this.player.y, result === "shield" ? COLOURS.cyan : COLOURS.red, 17, 125); this.audio.play(result === "shield" ? "shieldHit" : "playerHit");
  }

  private explosion(x: number, y: number, size: number, color: string): void {
    this.effects.burst(x, y, color, Math.min(48, Math.round(size * 0.9)), 110 + size * 3); this.effects.burst(x, y, COLOURS.white, Math.min(18, Math.round(size * 0.35)), 75 + size * 2); this.effects.shockwave(x, y, color, size * 2.7); this.audio.play("destroyed");
  }

  private spawnPickup(type: PickupType, x: number, y: number): void { this.pickups.acquire()?.spawn(type, x, y); }
  private randomPickup(): PickupType { const types: PickupType[] = ["weapon", "shield", "repair", "bomb", "magnet", "energy"]; return types[Math.floor(Math.random() * types.length)]; }

  private collectPickup(pickup: Pickup): void {
    switch (pickup.type) {
      case "weapon": this.player.weaponLevel = Math.min(6, this.player.weaponLevel + 1); if (this.player.weaponLevel === 6) this.player.weaponOverdrive = 6; break;
      case "shield": this.player.shield = Math.min(this.player.maxShield, this.player.shield + 30); break;
      case "repair": this.player.hp = Math.min(this.player.maxHp, this.player.hp + 28); break;
      case "bomb": for (const enemy of this.enemies.items) if (enemy.active) this.destroyEnemy(enemy); this.clearEnemyBullets(); this.shake = 18; break;
      case "magnet": this.player.magnet += 35; break;
      case "energy": this.player.ultimate = Math.min(100, this.player.ultimate + 24); break;
    }
    this.effects.shockwave(pickup.x, pickup.y, COLOURS.cyan, 42); this.effects.popup(pickup.x, pickup.y, TRANSLATIONS[this.language].pickups[pickup.type], COLOURS.cyan, 12); this.audio.play("pickup");
  }

  private activateUltimate(): void {
    if (this.player.ultimate < 100 || this.player.ultimateTimer > 0) return;
    this.player.ultimate = 0; this.player.ultimateTimer = 5; this.clearEnemyBullets(); this.messageKey = "ultimate"; this.messageUpgrade = undefined; this.messageTimer = 2; this.shake = 18; this.effects.shockwave(this.player.x, this.player.y, COLOURS.violet, 260); this.audio.play("ultimate");
  }

  private clearEnemyBullets(): void {
    for (const bullet of this.activeEnemyProjectiles) if (bullet.active) { this.effects.trail(bullet.x, bullet.y, bullet.color); this.releaseBullet(bullet); }
  }

  private openUpgrade(): void { this.upgradesThisLevel += 1; this.upgradeChoices = this.upgrades.choices(); this.mode = "upgrade"; this.audio.play("upgrade"); }
  private selectUpgrade(index: number): void { const choice = this.upgradeChoices[index]; if (!choice) return; this.upgrades.apply(choice, this.player); this.mode = "playing"; this.messageUpgrade = choice.id; this.messageTimer = 1.8; this.audio.play("upgrade"); }

  private beginDeath(): void { if (this.dying > 0) return; this.dying = 1.75; this.player.crash = 0.01; this.clearEnemyBullets(); this.audio.play("playerHit"); }

  private updateDeath(dt: number, worldDt: number): void {
    this.dying -= dt; this.player.crash += dt * 2.8; this.player.y += 38 * dt; this.trailTimer -= dt;
    if (this.trailTimer <= 0) { this.effects.trail(this.player.x + Math.sin(this.worldTime * 20) * 8, this.player.y, "#8a9498"); this.trailTimer = 1 / 30; }
    this.updateEnemies(worldDt * 0.35); this.updateBullets(worldDt * 0.35, worldDt * 0.35);
    if (this.dying < 0.75 && !this.deathBurst) { this.deathBurst = true; this.explosion(this.player.x, this.player.y, 42, COLOURS.orange); this.shake = 22; }
    if (this.dying <= 0) this.finishRun(false);
  }

  private finishRun(victory: boolean): void {
    this.mode = victory ? "victory" : "gameover"; this.bestScore = Math.max(this.bestScore, this.score); try { localStorage.setItem("skyfall-best", String(this.bestScore)); } catch { /* storage is optional */ } this.audio.play(victory ? "upgrade" : "gameover");
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, enemy: boolean, damage: number, radius: number, color: string, piercing = false): Projectile | undefined {
    if ((!enemy && this.playerProjectileCount >= COMBAT_LIMITS.maxPlayerProjectiles) || (enemy && this.enemyProjectileCount >= COMBAT_LIMITS.maxEnemyProjectiles)) return undefined;
    const bullet = this.bullets.acquire();
    if (!bullet) return undefined;
    bullet.launch(x, y, vx, vy, enemy, damage, radius, color, piercing);
    if (enemy) this.enemyProjectileCount += 1; else this.playerProjectileCount += 1;
    return bullet;
  }

  private buildEnemySpatialHash(): void {
    this.activeEnemies.length = 0;
    for (const cell of this.enemyCells) cell.length = 0;
    for (const enemy of this.enemies.items) if (enemy.active) {
      this.activeEnemies.push(enemy);
      const cellX = Math.max(0, Math.min(COLLISION_GRID_COLUMNS - 1, Math.floor(enemy.x / COLLISION_CELL_SIZE)));
      const cellY = Math.max(0, Math.min(COLLISION_GRID_ROWS - 1, Math.floor(enemy.y / COLLISION_CELL_SIZE)));
      this.enemyCells[cellY * COLLISION_GRID_COLUMNS + cellX].push(enemy);
    }
  }

  private releaseBullet(bullet: Projectile): void {
    if (!bullet.active) return;
    const enemyBullet = bullet.enemy; bullet.reset(); this.decrementProjectileCount(enemyBullet);
  }

  private decrementProjectileCount(enemyBullet: boolean): void {
    if (enemyBullet) this.enemyProjectileCount = Math.max(0, this.enemyProjectileCount - 1);
    else this.playerProjectileCount = Math.max(0, this.playerProjectileCount - 1);
  }

  private hasActiveEnemies(): boolean {
    for (const enemy of this.activeEnemies) if (enemy.active) return true;
    // Before the first collision build of a level, newly spawned enemies may
    // not be present in the reusable frame list yet.
    for (const enemy of this.enemies.items) if (enemy.active) return true;
    return false;
  }

  private trackCombatGap(dt: number): void {
    if (this.bossStarted || this.spawner.isComplete || this.hasActiveEnemies()) { this.combatGapTimer = 0; return; }
    this.combatGapTimer += dt;
    if (this.combatGapTimer > 3 && this.debugMode === "waves") { console.warn("Unexpected combat gap detected"); this.combatGapTimer = 0; }
  }

  private overlaps(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean { const dx = ax - bx; const dy = ay - by; const radius = ar + br; return dx * dx + dy * dy <= radius * radius; }

  private render(): void {
    const ratio = this.canvas.width / WORLD.width; this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0); this.ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    const copy = TRANSLATIONS[this.language];
    if (this.mode === "opening") { drawOpening(this.ctx, this.openingTime, copy, this.openingPanel, { soundEnabled: this.soundPreference, quality: this.graphicsQuality, antialiasing: this.antialiasing, fpsLimit: this.fpsLimit, screenShake: this.screenShake, reducedMotion: this.reducedMotion, fullscreen: Boolean(document.fullscreenElement) }); return; }
    const config = this.levels.config;
    this.background.draw(this.ctx, this.worldTime, 1 + this.levels.pressure * 0.35, config.palette, config.environment);
    this.ctx.save();
    if (this.shake > 0 && this.screenShake && !this.reducedMotion) this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    this.hazards.drawBehind(this.ctx, config, this.worldTime);
    this.drawWarningLines();
    Projectile.drawAll(this.ctx, this.activeProjectiles);
    for (const pickup of this.pickups.items) if (pickup.active) pickup.draw(this.ctx);
    for (const enemy of this.activeEnemies) if (enemy.active) enemy.draw(this.ctx, this.worldTime);
    this.boss.draw(this.ctx, this.worldTime);
    if (this.laserFlash > 0) this.drawPlayerLaser();
    if (this.dying <= 0 || !this.deathBurst) this.player.draw(this.ctx, this.worldTime);
    if (this.debugMode === "hitbox") { this.ctx.strokeStyle = COLOURS.green; this.ctx.lineWidth = 1; this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2); this.ctx.stroke(); }
    this.effects.draw(this.ctx); this.hazards.drawFront(this.ctx, config, this.worldTime); this.ctx.restore();
    drawHUD(this.ctx, this.player, this.score, this.combo, this.boss, this.runTime, copy, config);
    if (this.debugMode === "waves") this.drawWaveDebug();
    if (config.objective === "survive") this.drawSurvivalCountdown();
    this.drawFeedback();
    if (this.levels.introTimer > 0) drawLevelOverlay(this.ctx, config, copy, false, this.levels.introTimer);
    if (this.levels.completeTimer > 0) drawLevelOverlay(this.ctx, getLevel(Math.min(MAX_LEVEL, this.levels.levelNumber + 1)), copy, true, this.levels.completeTimer);
    if (this.mode === "upgrade") drawUpgrades(this.ctx, this.upgradeChoices, this.input.state.pointerX, this.input.state.pointerY, copy);
    if (this.mode === "gameover" || this.mode === "victory") drawGameOver(this.ctx, this.runStats(), this.bestScore, copy, this.mode === "victory");
  }

  private drawWarningLines(): void {
    this.ctx.save(); this.ctx.globalCompositeOperation = "lighter";
    for (const enemy of this.activeEnemies) if (enemy.active && enemy.warning > 0) { this.ctx.strokeStyle = `rgba(255,77,98,${0.25 + Math.sin(this.worldTime * 30) * 0.18})`; this.ctx.lineWidth = 1.5; this.ctx.setLineDash([8, 8]); this.ctx.beginPath(); this.ctx.moveTo(enemy.x, enemy.y); this.ctx.lineTo(enemy.lockX, enemy.lockY); this.ctx.stroke(); }
    this.ctx.restore();
  }

  private drawPlayerLaser(): void {
    this.ctx.save(); this.ctx.globalCompositeOperation = "lighter"; this.ctx.globalAlpha = this.laserFlash / 0.18; this.ctx.strokeStyle = COLOURS.cyan; this.ctx.shadowColor = COLOURS.cyan; this.ctx.shadowBlur = 22; this.ctx.lineWidth = 10 + this.player.laser * 2; this.ctx.beginPath(); this.ctx.moveTo(this.player.x, this.player.y - 35); this.ctx.lineTo(this.player.x, 0); this.ctx.stroke(); this.ctx.restore();
  }

  private drawSurvivalCountdown(): void {
    const remaining = Math.ceil(this.levels.config.duration - this.levels.elapsed);
    if (remaining > 10 || remaining <= 0) return;
    this.ctx.save(); this.ctx.globalAlpha = 0.72 + Math.sin(this.worldTime * 9) * 0.18; this.ctx.fillStyle = this.levels.config.palette.secondary; this.ctx.font = "700 42px Segoe UI, sans-serif"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText(String(remaining), WORLD.width / 2, WORLD.height * 0.32); this.ctx.restore();
  }

  private drawWaveDebug(): void {
    const debug = this.spawner.debug(this.levels.config);
    const lines = [
      `LEVEL: ${this.levels.levelNumber}    WAVE: ${debug.wave} / ${debug.waveCount}`,
      `ACTIVE ENEMIES: ${debug.active} / ${this.levels.config.maxActiveEnemies}`,
      `ACTIVE SHOOTERS: ${Math.min(this.levels.config.activeShooterLimit, debug.active)} / ${this.levels.config.activeShooterLimit}`,
      `TOTAL SPAWNED: ${debug.spawned} / ${debug.target}`,
      `PENDING SPAWN: ${debug.pending}    LAST: ${debug.sinceLastSpawn.toFixed(1)}s`,
    ];
    this.ctx.save(); this.ctx.fillStyle = "rgba(2,7,13,.72)"; this.ctx.fillRect(16, 88, 246, 82); this.ctx.strokeStyle = "rgba(98,244,255,.38)"; this.ctx.strokeRect(16.5, 88.5, 245, 81); this.ctx.fillStyle = COLOURS.cyan; this.ctx.font = "600 10px Consolas, monospace"; this.ctx.textBaseline = "top";
    for (let index = 0; index < lines.length; index += 1) this.ctx.fillText(lines[index], 25, 98 + index * 13);
    this.ctx.restore();
  }

  private drawFeedback(): void {
    if (this.damageFlash > 0) { const gradient = this.ctx.createRadialGradient(WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.2, WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.75); gradient.addColorStop(0, "rgba(255,30,50,0)"); gradient.addColorStop(1, `rgba(255,30,50,${this.damageFlash})`); this.ctx.fillStyle = gradient; this.ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
    if (this.player.ultimateTimer > 0) { this.ctx.strokeStyle = "rgba(173,124,255,.25)"; this.ctx.lineWidth = 6; this.ctx.strokeRect(3, 3, WORLD.width - 6, WORLD.height - 6); this.ctx.strokeStyle = "rgba(98,244,255,.13)"; this.ctx.strokeRect(9, 0, WORLD.width - 9, WORLD.height); this.ctx.strokeStyle = "rgba(255,77,98,.09)"; this.ctx.strokeRect(0, 0, WORLD.width - 9, WORLD.height); this.ctx.fillStyle = "rgba(70,25,110,.035)"; this.ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
    if (this.messageTimer > 0) { const copy = TRANSLATIONS[this.language]; let message = this.messageUpgrade ? `${copy.upgrades[this.messageUpgrade].name}  //  ${copy.upgrade.online}` : copy.messages[this.messageKey]; if (this.messageKey === "boss") message = message.replace("TITAN-01", this.boss.displayName); const alpha = Math.min(1, this.messageTimer * 2); this.ctx.save(); this.ctx.globalAlpha = alpha; this.ctx.fillStyle = "rgba(2,7,13,.68)"; this.ctx.fillRect(75, WORLD.height * 0.44, WORLD.width - 150, 58); this.ctx.strokeStyle = this.messageKey === "boss" || this.messageKey === "phase3" || this.messageKey === "climax" ? this.levels.config.palette.secondary : this.levels.config.palette.accent; this.ctx.strokeRect(75.5, WORLD.height * 0.44 + 0.5, WORLD.width - 151, 57); this.ctx.fillStyle = COLOURS.white; this.ctx.font = "600 13px Segoe UI, sans-serif"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText(message, WORLD.width / 2, WORLD.height * 0.44 + 29); this.ctx.restore(); }
  }

  private runStats(): RunStats { return { score: this.score, destroyed: this.destroyed, maxCombo: this.combo.max, survivalTime: this.runTime }; }
}
