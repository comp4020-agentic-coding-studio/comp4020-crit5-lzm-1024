import { Game } from "./src/game/Game.ts";
import { detectLanguage, TRANSLATIONS, type Language } from "./src/i18n/translations.ts";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const frame = document.querySelector<HTMLDivElement>("#game-frame");
const soundToggle = document.querySelector<HTMLButtonElement>("#sound-toggle");
const controlsText = document.querySelector<HTMLSpanElement>("#controls-text");
const ultimateControlText = document.querySelector<HTMLSpanElement>("#ultimate-control-text");

if (!canvas || !frame || !soundToggle || !controlsText || !ultimateControlText) throw new Error("SKYFALL could not initialise its display.");

const soundControl = soundToggle;
const controlsLabel = controlsText;
const ultimateControlLabel = ultimateControlText;

let language = detectLanguage();
const game = new Game(canvas, frame, language);
let soundEnabled = game.soundEnabledPreference;

function applyLanguage(nextLanguage: Language): void {
  language = nextLanguage; const copy = TRANSLATIONS[language];
  document.documentElement.lang = language;
  soundControl.textContent = soundEnabled ? copy.soundOn : copy.soundOff;
  controlsLabel.textContent = copy.controls; ultimateControlLabel.textContent = copy.ultimateControl;
  game.setLanguage(language);
  try { localStorage.setItem("skyfall-language", language); } catch { /* language persistence is optional */ }
}

soundControl.addEventListener("click", () => {
  soundEnabled = game.toggleSound();
  soundControl.setAttribute("aria-pressed", String(soundEnabled));
  soundControl.textContent = soundEnabled ? TRANSLATIONS[language].soundOn : TRANSLATIONS[language].soundOff;
});

// Music begins after the player's first Start click (the browser's required
// user gesture). Keep the visible sound control in sync with that start.
window.addEventListener("skyfall-audio-started", () => {
  soundEnabled = true;
  soundControl.setAttribute("aria-pressed", "true");
  soundControl.textContent = TRANSLATIONS[language].soundOn;
});
window.addEventListener("skyfall-audio-changed", (event) => {
  soundEnabled = Boolean((event as CustomEvent<boolean>).detail);
  soundControl.setAttribute("aria-pressed", String(soundEnabled));
  soundControl.textContent = soundEnabled ? TRANSLATIONS[language].soundOn : TRANSLATIONS[language].soundOff;
});
window.addEventListener("skyfall-language-changed", (event) => applyLanguage((event as CustomEvent<Language>).detail));

applyLanguage(language);
game.start();
