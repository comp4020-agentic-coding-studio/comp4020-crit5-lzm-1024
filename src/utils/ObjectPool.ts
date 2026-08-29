import type { Poolable } from "../game/types.ts";

export class ObjectPool<T extends Poolable> {
  readonly items: T[];
  private nextIndex = 0;

  constructor(factory: () => T, capacity: number) {
    this.items = Array.from({ length: capacity }, factory);
  }

  acquire(): T | undefined {
    // A rotating search keeps rapid projectile allocation from repeatedly
    // walking the same active prefix of the pool.
    for (let offset = 0; offset < this.items.length; offset += 1) {
      const index = (this.nextIndex + offset) % this.items.length;
      const item = this.items[index];
      if (item.active) continue;
      item.active = true;
      this.nextIndex = (index + 1) % this.items.length;
      return item;
    }
    return undefined;
  }

  releaseAll(): void {
    for (const item of this.items) item.reset();
  }

  activeCount(): number {
    return this.items.reduce((count, item) => count + Number(item.active), 0);
  }
}
