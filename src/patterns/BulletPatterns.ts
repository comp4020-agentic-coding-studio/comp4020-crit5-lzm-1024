import type { Vector } from "../game/types.ts";

function velocity(angle: number, speed: number): Vector {
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

export function straight(speed: number): Vector[] { return [{ x: 0, y: speed }]; }

export function spread(count: number, centre: number, arc: number, speed: number): Vector[] {
  if (count === 1) return [velocity(centre, speed)];
  return Array.from({ length: count }, (_, index) => velocity(centre - arc / 2 + arc * index / (count - 1), speed));
}

export function radial(count: number, speed: number, offset = 0): Vector[] {
  return Array.from({ length: count }, (_, index) => velocity(offset + Math.PI * 2 * index / count, speed));
}

export function aimed(from: Vector, target: Vector, speed: number): Vector[] {
  return [velocity(Math.atan2(target.y - from.y, target.x - from.x), speed)];
}

export function spiral(step: number, speed: number): Vector[] {
  const angle = step * 0.37;
  return [velocity(angle, speed), velocity(angle + Math.PI, speed)];
}

export function wave(speed: number, phase: number): Vector[] {
  return [{ x: Math.sin(phase) * speed * 0.7, y: speed }];
}

export function cross(speed: number, rotation = 0): Vector[] {
  return Array.from({ length: 4 }, (_, index) => velocity(rotation + index * Math.PI / 2, speed));
}

export function fan3(speed: number): Vector[] { return spread(3, Math.PI / 2, 0.7, speed); }
export function fan5(speed: number): Vector[] { return spread(5, Math.PI / 2, 1.25, speed); }
