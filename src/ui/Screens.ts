import { WORLD } from "../game/GameConfig.ts";
import type { PickupType, RunStats, UpgradeChoice } from "../game/types.ts";
import type { LocaleStrings } from "../i18n/translations.ts";
import type { LevelConfig } from "../levels/LevelConfig.ts";

const UI = { navy: "#143b78", blue: "#258fe7", sky: "#76d9ff", pale: "#eaf8ff", yellow: "#ffd34e", orange: "#ff9c3c", red: "#ff4d67", white: "#ffffff" } as const;
const LAYOUT = { width: 540, height: 960 } as const;
// Preserve the original card proportions in the wider 3:4 playfield.  A
// single scale factor plus centering avoids horizontal stretching entirely.
const layoutScale = (ctx: CanvasRenderingContext2D): void => {
  const scale = Math.min(WORLD.width / LAYOUT.width, WORLD.height / LAYOUT.height);
  ctx.translate((WORLD.width - LAYOUT.width * scale) / 2, (WORLD.height - LAYOUT.height * scale) / 2);
  ctx.scale(scale, scale);
};

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string = UI.navy, align: CanvasTextAlign = "center", weight = 700): void {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
}
function fittedLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number, color: string = UI.navy, align: CanvasTextAlign = "left", weight = 700): void {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(text, x, y, maxWidth);
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string | CanvasGradient, stroke?: string, lineWidth = 1): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function skyBackdrop(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, LAYOUT.height); sky.addColorStop(0, "#70cfff"); sky.addColorStop(.52, "#2e9ce9"); sky.addColorStop(1, "#1b62b8"); ctx.fillStyle = sky; ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);
  ctx.globalAlpha = .22; ctx.fillStyle = UI.white;
  for (const [x, y, scale] of [[82, 128, 1], [432, 225, .76], [125, 728, 1.25], [448, 805, .9]] as const) { ctx.beginPath(); ctx.ellipse(x, y, 72 * scale, 24 * scale, 0, 0, Math.PI * 2); ctx.ellipse(x + 50 * scale, y - 12 * scale, 54 * scale, 31 * scale, 0, 0, Math.PI * 2); ctx.ellipse(x - 52 * scale, y - 7 * scale, 45 * scale, 23 * scale, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function wideSkyBackdrop(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height); sky.addColorStop(0, "#70cfff"); sky.addColorStop(.52, "#2e9ce9"); sky.addColorStop(1, "#1b62b8"); ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.globalAlpha = .16; ctx.fillStyle = UI.white; ctx.beginPath(); ctx.ellipse(WORLD.width * .2, WORLD.height * .18, 130, 52, 0, 0, Math.PI * 2); ctx.ellipse(WORLD.width * .82, WORLD.height * .76, 155, 58, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
}
function button(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, color: string = UI.yellow, textColor: string = UI.navy): void {
  rounded(ctx, x + 4, y + 7, width, height, 15, "rgba(13,67,139,.34)"); const gradient = ctx.createLinearGradient(0, y, 0, y + height); gradient.addColorStop(0, color); gradient.addColorStop(1, color === UI.yellow ? "#ffad36" : "#278eea"); rounded(ctx, x, y, width, height, 15, gradient, "rgba(255,255,255,.86)", 2); label(ctx, text, x + width / 2, y + height / 2 + 1, 15, textColor, "center", 800);
}
function ribbon(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number): void { rounded(ctx, x, y, width, 28, 12, UI.orange); label(ctx, text, x + width / 2, y + 14, 10, UI.white, "center", 800); }

export type OpeningPanel = "main" | "how" | "settings";
export type GraphicsQuality = "high" | "balanced" | "performance";
export interface OpeningSettingsView {
  soundEnabled: boolean;
  quality: GraphicsQuality;
  antialiasing: boolean;
  fpsLimit: 30 | 60;
  screenShake: boolean;
  reducedMotion: boolean;
  fullscreen: boolean;
}
export type OpeningAction = "start" | "how" | "settings" | "back" | "sound" | "quality" | "antialiasing" | "fps" | "shake" | "effects" | "language" | "fullscreen" | null;

export function drawOpening(ctx: CanvasRenderingContext2D, time: number, copy: LocaleStrings, panel: OpeningPanel = "main", settings: OpeningSettingsView): void {
  ctx.save(); wideSkyBackdrop(ctx); layoutScale(ctx); skyBackdrop(ctx); rounded(ctx, 34, 76, LAYOUT.width - 68, 804, 30, "rgba(255,255,255,.96)", "rgba(255,255,255,.9)", 2); rounded(ctx, 50, 94, LAYOUT.width - 100, 148, 23, "#1c75c8");
  ctx.globalAlpha = .2; ctx.fillStyle = UI.white; ctx.beginPath(); ctx.arc(LAYOUT.width / 2, 145, 72, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; label(ctx, "SKYFALL", LAYOUT.width / 2, 145, 40, UI.white, "center", 900); label(ctx, copy.opening.combatSystem, LAYOUT.width / 2, 190, 10, "#d9f4ff");
  if (panel === "main") {
    ribbon(ctx, copy.opening.mission, LAYOUT.width / 2 - 74, 260, 148); label(ctx, copy.opening.ready, LAYOUT.width / 2, 318, 21, UI.navy, "center", 900);
    const pulse = .94 + Math.sin(time * 4) * .06; ctx.globalAlpha = pulse; button(ctx, copy.menu.start, 120, 374, 300, 62); ctx.globalAlpha = 1;
    button(ctx, copy.menu.howToPlay, 120, 466, 300, 62, UI.blue, UI.white); button(ctx, copy.menu.settings, 120, 558, 300, 62, "#65c9f4", UI.navy);
    label(ctx, copy.opening.hint, LAYOUT.width / 2, 692, 9, "#6685a8", "center", 700);
  } else if (panel === "how") {
    label(ctx, copy.menu.howTitle, LAYOUT.width / 2, 270, 22, UI.navy, "center", 900);
    const instructions = [["↔", copy.menu.move], ["✦", copy.menu.fire], ["⚡", copy.menu.ultimate]] as const;
    instructions.forEach(([icon, instruction], index) => { const y = 298 + index * 48; rounded(ctx, 66, y, 408, 40, 12, index % 2 ? "#f3fbff" : "#e8f7ff"); rounded(ctx, 74, y + 5, 30, 30, 10, index === 2 ? UI.yellow : UI.blue); label(ctx, icon, 89, y + 20, 13, index === 2 ? UI.navy : UI.white, "center", 900); fittedLabel(ctx, instruction, 116, y + 20, 342, 8, UI.navy, "left", 700); });
    label(ctx, copy.menu.pickupsTitle, LAYOUT.width / 2, 452, 13, UI.blue, "center", 900);
    const pickupKeys: PickupType[] = ["weapon", "shield", "repair", "bomb", "magnet", "energy"];
    const pickupIcons: Record<PickupType, string> = { weapon: "✦", shield: "◇", repair: "+", bomb: "✹", magnet: "↻", energy: "⚡" };
    const pickupColors: Record<PickupType, string> = { weapon: UI.blue, shield: UI.sky, repair: "#62d7b0", bomb: UI.red, magnet: "#a66cf4", energy: UI.yellow };
    pickupKeys.forEach((pickup, index) => {
      const x = index % 2 === 0 ? 66 : 276; const y = 470 + Math.floor(index / 2) * 60; const color = pickupColors[pickup];
      rounded(ctx, x, y, 198, 50, 13, "#eef9ff", color, 1.5); rounded(ctx, x + 7, y + 8, 34, 34, 10, color);
      label(ctx, pickupIcons[pickup], x + 24, y + 25, 14, pickup === "energy" ? UI.navy : UI.white, "center", 900);
      fittedLabel(ctx, copy.pickups[pickup], x + 49, y + 16, 135, 8.5, UI.navy, "left", 900);
      fittedLabel(ctx, copy.pickupRules[pickup], x + 49, y + 34, 137, 6.5, "#6685a8", "left", 700);
    });
    button(ctx, copy.menu.back, 145, 688, 250, 58, UI.blue, UI.white);
  } else {
    label(ctx, copy.menu.settingsTitle, LAYOUT.width / 2, 274, 23, UI.navy, "center", 900);
    const settingRow = (name: string, value: string, y: number, enabled = true): void => {
      rounded(ctx, 66, y, 408, 48, 14, "#eef9ff"); label(ctx, name, 84, y + 24, 10, UI.navy, "left", 800);
      rounded(ctx, 324, y + 8, 132, 32, 11, enabled ? "#62d7b0" : "#d7e8f2"); label(ctx, value, 390, y + 24, 9, enabled ? UI.navy : "#5f7898", "center", 900);
    };
    const qualityLabel = settings.quality === "high" ? copy.menu.high : settings.quality === "balanced" ? copy.menu.balanced : copy.menu.performance;
    settingRow(copy.menu.sound, settings.soundEnabled ? copy.menu.on : copy.menu.off, 306, settings.soundEnabled);
    settingRow(copy.menu.quality, qualityLabel, 360);
    settingRow(copy.menu.antialiasing, settings.antialiasing ? copy.menu.on : copy.menu.off, 414, settings.antialiasing);
    settingRow(copy.menu.fps, `${settings.fpsLimit} FPS`, 468);
    settingRow(copy.menu.screenShake, settings.screenShake ? copy.menu.on : copy.menu.off, 522, settings.screenShake);
    settingRow(copy.menu.effects, settings.reducedMotion ? copy.menu.reduced : copy.menu.full, 576, !settings.reducedMotion);
    rounded(ctx, 66, 630, 408, 48, 14, "#e8f7ff"); label(ctx, copy.menu.language, 84, 654, 10, UI.navy, "left", 800); rounded(ctx, 324, 638, 132, 32, 11, "#65c9f4"); label(ctx, copy.languageName, 390, 654, 9, UI.navy, "center", 900);
    label(ctx, copy.menu.languageHint, LAYOUT.width / 2, 700, 8, "#6685a8", "center", 700);
    button(ctx, settings.fullscreen ? copy.menu.exitFullscreen : copy.menu.fullscreen, 66, 734, 198, 54, "#65c9f4", UI.navy);
    button(ctx, copy.menu.back, 276, 734, 198, 54, UI.blue, UI.white);
  }
  ctx.restore();
}

export function openingActionAt(x: number, y: number, panel: OpeningPanel): OpeningAction {
  const scale = Math.min(WORLD.width / LAYOUT.width, WORLD.height / LAYOUT.height); const layoutX = (x - (WORLD.width - LAYOUT.width * scale) / 2) / scale; const layoutY = (y - (WORLD.height - LAYOUT.height * scale) / 2) / scale;
  if (panel === "main" && layoutX > 120 && layoutX < 420) { if (layoutY > 374 && layoutY < 436) return "start"; if (layoutY > 466 && layoutY < 528) return "how"; if (layoutY > 558 && layoutY < 620) return "settings"; }
  if (panel === "settings" && layoutX > 66 && layoutX < 474) {
    if (layoutY > 306 && layoutY < 354) return "sound";
    if (layoutY > 360 && layoutY < 408) return "quality";
    if (layoutY > 414 && layoutY < 462) return "antialiasing";
    if (layoutY > 468 && layoutY < 516) return "fps";
    if (layoutY > 522 && layoutY < 570) return "shake";
    if (layoutY > 576 && layoutY < 624) return "effects";
    if (layoutY > 630 && layoutY < 678) return "language";
    if (layoutX < 264 && layoutY > 734 && layoutY < 788) return "fullscreen";
    if (layoutX > 276 && layoutY > 734 && layoutY < 788) return "back";
  }
  if (panel === "how" && layoutX > 145 && layoutX < 395 && layoutY > 688 && layoutY < 746) return "back";
  return null;
}

const RARITY_COLORS = { COMMON: "#4fa8ed", RARE: "#4e8fff", EPIC: "#a66cf4", LEGENDARY: UI.orange } as const;
export function drawUpgrades(ctx: CanvasRenderingContext2D, choices: UpgradeChoice[], pointerX: number, pointerY: number, copy: LocaleStrings): void {
  const scale = Math.min(WORLD.width / LAYOUT.width, WORLD.height / LAYOUT.height); const offsetX = (WORLD.width - LAYOUT.width * scale) / 2; const offsetY = (WORLD.height - LAYOUT.height * scale) / 2;
  const x = (pointerX - offsetX) / scale; const yPointer = (pointerY - offsetY) / scale;
  ctx.save(); wideSkyBackdrop(ctx); layoutScale(ctx); skyBackdrop(ctx); ctx.fillStyle = "rgba(13,76,154,.4)"; ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height); rounded(ctx, 34, 82, LAYOUT.width - 68, 796, 30, "rgba(255,255,255,.97)"); ribbon(ctx, copy.level.incoming, LAYOUT.width / 2 - 86, 104, 172); label(ctx, copy.upgrade.choose, LAYOUT.width / 2, 166, 24,  UI.navy, "center", 900); label(ctx, copy.upgrade.paused, LAYOUT.width / 2, 197, 10, "#6685a8");
  choices.forEach((choice, index) => { const y = 250 + index * 164; const hovered = x > 52 && x < LAYOUT.width - 52 && yPointer > y && yPointer < y + 136; const color = RARITY_COLORS[choice.rarity]; rounded(ctx, 52, y, LAYOUT.width - 104, 136, 22, hovered ? "#e6f8ff" : "#f7fcff", color, hovered ? 4 : 2); rounded(ctx, 68, y + 18, 72, 72, 20, color); label(ctx, ["⚡", "✦", "⬆"][index], 104, y + 54, 30, UI.white, "center", 900); const localized = copy.upgrades[choice.id]; label(ctx, localized.name, 160, y + 35, 15, UI.navy, "left", 900); label(ctx, localized.description, 160, y + 62, 9, "#6685a8", "left", 700); rounded(ctx, 160, y + 88, 128, 25, 10, "#edf7ff"); label(ctx, `${copy.rarity[choice.rarity]} · ${copy.upgrade.level}${choice.level + 1}`, 224, y + 100, 8, color, "center", 800); rounded(ctx, 404, y + 48, 42, 42, 15, color); label(ctx, String(index + 1), 425, y + 69, 16, UI.white, "center", 900); });
  ctx.restore();
}
export function upgradeIndexAt(x: number, y: number): number { const scale = Math.min(WORLD.width / LAYOUT.width, WORLD.height / LAYOUT.height); const layoutX = (x - (WORLD.width - LAYOUT.width * scale) / 2) / scale; const layoutY = (y - (WORLD.height - LAYOUT.height * scale) / 2) / scale; if (layoutX < 52 || layoutX > LAYOUT.width - 52) return -1; for (let index = 0; index < 3; index += 1) { const top = 250 + index * 164; if (layoutY > top && layoutY < top + 136) return index; } return -1; }

export function drawGameOver(ctx: CanvasRenderingContext2D, stats: RunStats, bestScore: number, copy: LocaleStrings, victory = false): void {
  ctx.save(); layoutScale(ctx); ctx.fillStyle = "rgba(8,42,98,.67)"; ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height); rounded(ctx, 34, 70, LAYOUT.width - 68, 820, 30, "rgba(255,255,255,.97)", "rgba(255,255,255,.9)", 2); const headline = victory ? UI.orange : UI.red; ribbon(ctx, victory ? copy.gameOver.complete : copy.gameOver.gameOver, LAYOUT.width / 2 - 104, 101, 208); label(ctx, victory ? "★" : "!", LAYOUT.width / 2, 190, 42, headline, "center", 900); label(ctx, victory ? copy.gameOver.complete : copy.gameOver.gameOver, LAYOUT.width / 2, 235, 28, headline, "center", 900); label(ctx, victory ? copy.gameOver.neutralised : copy.gameOver.signalLost, LAYOUT.width / 2, 270, 10, "#6685a8");
  const rows = [[copy.gameOver.score, stats.score.toLocaleString()], [copy.gameOver.best, bestScore.toLocaleString()], [copy.gameOver.destroyed, String(stats.destroyed)], [copy.gameOver.maxCombo, `×${stats.maxCombo}`], [copy.gameOver.survival, `${Math.floor(stats.survivalTime / 60).toString().padStart(2, "0")}:${Math.floor(stats.survivalTime % 60).toString().padStart(2, "0")}`]];
  rows.forEach(([name, value], index) => { const y = 340 + index * 62; rounded(ctx, 76, y, LAYOUT.width - 152, 48, 14, index % 2 ? "#edf8ff" : "#f7fcff"); label(ctx, name, 94, y + 24, 10, "#6685a8", "left", 800); label(ctx, value, LAYOUT.width - 94, y + 24, 16, UI.navy, "right", 900); }); button(ctx, copy.gameOver.retry, 76, 683, LAYOUT.width - 152, 64, UI.yellow); label(ctx, copy.gameOver.menu, LAYOUT.width / 2, 798, 11, UI.blue, "center", 800); ctx.restore();
}
export function gameOverActionAt(x: number, y: number): "retry" | "menu" | null { const scale = Math.min(WORLD.width / LAYOUT.width, WORLD.height / LAYOUT.height); const layoutX = (x - (WORLD.width - LAYOUT.width * scale) / 2) / scale; const layoutY = (y - (WORLD.height - LAYOUT.height * scale) / 2) / scale; if (layoutX > 76 && layoutX < LAYOUT.width - 76 && layoutY > 683 && layoutY < 747) return "retry"; if (layoutY > 770 && layoutY < 835) return "menu"; return null; }

export function drawLevelOverlay(ctx: CanvasRenderingContext2D, config: LevelConfig, copy: LocaleStrings, complete: boolean, timer: number): void {
  ctx.save(); layoutScale(ctx); const alpha = Math.min(1, complete ? timer : Math.min(1, (3.2 - timer) * 2)); ctx.globalAlpha = alpha; ctx.fillStyle = "rgba(16,90,181,.58)"; ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height); rounded(ctx, 48, 245, LAYOUT.width - 96, 432, 30, "rgba(255,255,255,.97)"); ribbon(ctx, copy.level.incoming, LAYOUT.width / 2 - 90, 270, 180); label(ctx, `${copy.level.level} ${String(config.level).padStart(2, "0")}`, LAYOUT.width / 2, 358, 31, UI.navy, "center", 900); rounded(ctx, 88, 398, LAYOUT.width - 176, 58, 16, "#e8f7ff"); label(ctx, config.name, LAYOUT.width / 2, 427, 15, UI.blue, "center", 900); label(ctx, `${copy.level.objective} · ${copy.level.objectives[config.objective]}`, LAYOUT.width / 2, 500, 10, "#6685a8"); if (!complete) button(ctx, copy.opening.start, 137, 550, 266, 58, UI.yellow); ctx.restore();
}
