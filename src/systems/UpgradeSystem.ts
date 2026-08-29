import type { UpgradeChoice } from "../game/types.ts";
import type { Player } from "../entities/Player.ts";

export const UPGRADES: Omit<UpgradeChoice, "rarity" | "level">[] = [
  { id: "twin", name: "TWIN CANNON", description: "Deploy two synchronized wing guns." },
  { id: "rapid", name: "RAPID FIRE", description: "Fire cycle accelerates by 25%." },
  { id: "plasma", name: "PLASMA", description: "Rounds pierce through one target." },
  { id: "drone", name: "STRIKE DRONE", description: "Add autonomous flank support." },
  { id: "shield", name: "AEGIS SHIELD", description: "Increase and restore shielding." },
  { id: "critical", name: "CRITICAL CORE", description: "Gain a chance to deal double damage." },
  { id: "missile", name: "SEEKER", description: "Launch periodic homing warheads." },
  { id: "laser", name: "ION LANCE", description: "Emit a periodic focused beam." },
  { id: "magnet", name: "GRAVITY WELL", description: "Pull rewards from farther away." },
  { id: "repair", name: "FIELD REPAIR", description: "Restore hull integrity immediately." },
];

export class UpgradeSystem {
  readonly levels = new Map<string, number>();

  choices(): UpgradeChoice[] {
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
    return shuffled.map((upgrade) => {
      const roll = Math.random();
      const rarity = roll > 0.95 ? "LEGENDARY" : roll > 0.78 ? "EPIC" : roll > 0.42 ? "RARE" : "COMMON";
      return { ...upgrade, rarity, level: this.levels.get(upgrade.id) ?? 0 };
    });
  }

  apply(choice: UpgradeChoice, player: Player): void {
    const level = (this.levels.get(choice.id) ?? 0) + 1; this.levels.set(choice.id, level);
    const rarityMultiplier = choice.rarity === "LEGENDARY" ? 1.7 : choice.rarity === "EPIC" ? 1.4 : choice.rarity === "RARE" ? 1.2 : 1;
    switch (choice.id) {
      case "twin": player.weaponLevel = Math.min(6, player.weaponLevel + 1); if (player.weaponLevel === 6) player.weaponOverdrive = 6; player.damage += 2 * rarityMultiplier; break;
      case "rapid": player.fireInterval = Math.max(0.09, player.fireInterval * (1 - 0.2 * rarityMultiplier)); break;
      case "plasma": player.piercing = true; player.damage += 4 * rarityMultiplier; break;
      case "drone": player.drones = Math.min(2, player.drones + 1); break;
      case "shield": player.maxShield += 16 * rarityMultiplier; player.shield = player.maxShield; break;
      case "critical": player.criticalChance = Math.min(0.5, player.criticalChance + 0.1 * rarityMultiplier); break;
      case "missile": player.missiles += 1; break;
      case "laser": player.laser += 1; break;
      case "magnet": player.magnet += 60 * rarityMultiplier; break;
      case "repair": player.hp = Math.min(player.maxHp, player.hp + 42 * rarityMultiplier); break;
    }
  }

  reset(): void { this.levels.clear(); }
}
