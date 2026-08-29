import type { EnemyType } from "../game/types.ts";

export function enemyVelocity(type: EnemyType, age: number, originX: number, side: number): { vx: number; vy: number } {
  switch (type) {
    case "interceptor": return { vx: side * (210 + Math.sin(age * 3) * 55), vy: 165 };
    case "shooter": return { vx: Math.sin(age * 2.5 + originX) * 58, vy: 132 };
    case "diveBomber": return { vx: Math.sin(age * 3.1 + originX) * 72, vy: 94 };
    case "shieldDrone": return { vx: Math.sin(age * 3.5 + originX) * 82, vy: age < 1.2 ? 118 : 34 };
    case "gunship": return { vx: Math.sin(age * 2.1) * 64, vy: 86 };
    case "sniper": return { vx: Math.sin(age * 2.7) * 60, vy: age < 1.5 ? 112 : 20 };
    case "swarm": return { vx: Math.sin(age * 5.8 + originX) * 124, vy: 195 };
    case "elite": return { vx: Math.sin(age * 2.7) * 138, vy: age < 1.5 ? 96 : 28 };
    default: return { vx: Math.sin(age * 2.8 + originX) * 68, vy: 168 };
  }
}
