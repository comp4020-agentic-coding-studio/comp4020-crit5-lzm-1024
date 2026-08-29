export interface Vector { x: number; y: number }

export type GameMode = "opening" | "playing" | "upgrade" | "gameover" | "victory";
export type EnemyType = "scout" | "shooter" | "diveBomber" | "shieldDrone" | "interceptor" | "gunship" | "sniper" | "swarm" | "elite";
export type PickupType = "weapon" | "shield" | "repair" | "bomb" | "magnet" | "energy";
export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface RunStats {
  score: number;
  destroyed: number;
  maxCombo: number;
  survivalTime: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pointerActive: boolean;
  pointerX: number;
  pointerY: number;
}

export interface UpgradeChoice {
  id: "twin" | "rapid" | "plasma" | "drone" | "shield" | "critical" | "missile" | "laser" | "magnet" | "repair";
  name: string;
  description: string;
  rarity: Rarity;
  level: number;
}

export interface Poolable { active: boolean; reset(): void }
