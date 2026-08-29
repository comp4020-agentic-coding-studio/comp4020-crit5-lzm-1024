import { WORLD } from "../game/GameConfig.ts";
import type { InputState } from "../game/types.ts";

export class InputSystem {
  readonly state: InputState = { left: false, right: false, up: false, down: false, pointerActive: false, pointerX: WORLD.width / 2, pointerY: WORLD.height * 0.78 };
  actionPressed = false; primaryPressed = false; pointerType = "mouse";
  choicePressed = -1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", this.onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", (event) => { if (event.pointerType !== "mouse") this.state.pointerActive = false; });
  }

  consumeAction(): boolean { const pressed = this.actionPressed; this.actionPressed = false; return pressed; }
  consumePrimary(): boolean { const pressed = this.primaryPressed; this.primaryPressed = false; return pressed; }
  consumeChoice(): number { const choice = this.choicePressed; this.choicePressed = -1; return choice; }
  clearPointerFollow(): void { this.state.pointerActive = false; }

  private mapPointer(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.pointerX = (event.clientX - rect.left) / rect.width * WORLD.width;
    this.state.pointerY = (event.clientY - rect.top) / rect.height * WORLD.height;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    event.preventDefault(); this.pointerType = event.pointerType; this.mapPointer(event);
    this.state.pointerActive = true; this.primaryPressed = true;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" || this.state.pointerActive) { event.preventDefault(); this.mapPointer(event); this.state.pointerActive = true; }
  };

  private readonly onPointerUp = (event: PointerEvent): void => { if (event.pointerType !== "mouse") this.state.pointerActive = false; };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
    if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") this.state.left = true;
    if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") this.state.right = true;
    if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") this.state.up = true;
    if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") this.state.down = true;
    if (event.key === " " && !event.repeat) this.actionPressed = true;
    if (["Enter", "r", "R"].includes(event.key) && !event.repeat) this.primaryPressed = true;
    if (["1", "2", "3"].includes(event.key) && !event.repeat) this.choicePressed = Number(event.key) - 1;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") this.state.left = false;
    if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") this.state.right = false;
    if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") this.state.up = false;
    if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") this.state.down = false;
  };
}
