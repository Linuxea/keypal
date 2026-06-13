import { AnimationRegistration } from "./plugins/types";
import { getAnimationFrameRange } from "./spriteGenerator";

export interface SpriteController {
  getFrameIndex(): number;
  setAnimation(name: string): void;
  tick(now: number, energy: number): { frameIndex: number; changed: boolean };
  reset(): void;
}

export function createSpriteController(
  animations: AnimationRegistration[],
  baseFps: number = 8,
): SpriteController {
  let currentFrame = 0;
  let lastTick = 0;
  let currentAnim = "idle";

  const getRange = (name: string) => getAnimationFrameRange(animations, name);

  return {
    getFrameIndex: () => currentFrame,

    setAnimation(name) {
      const range = getRange(name);
      if (range) {
        currentAnim = name;
        currentFrame = range.start;
      }
    },

    tick(now, energy) {
      const fps = Math.max(1, baseFps * Math.max(0.3, Math.min(1.0, energy)));
      const interval = 1000 / fps;
      if (now - lastTick < interval) {
        return { frameIndex: currentFrame, changed: false };
      }
      lastTick = now;

      const range = getRange(currentAnim);
      if (!range) {
        currentFrame = 0;
        return { frameIndex: 0, changed: true };
      }

      const offset = (currentFrame - range.start + 1) % range.count;
      currentFrame = range.start + offset;
      return { frameIndex: currentFrame, changed: true };
    },

    reset() {
      currentFrame = 0;
      lastTick = 0;
      currentAnim = "idle";
    },
  };
}
