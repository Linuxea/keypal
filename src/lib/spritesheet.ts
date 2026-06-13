import { MoodState } from "./types";
import { FRAMES_PER_STATE, MOOD_FRAME_OFFSET } from "./types";

export interface SpriteController {
  getFrameIndex(): number;
  setFrame(state: MoodState, frameInState: number): void;
  tick(now: number, energy: number): { frameIndex: number; changed: boolean };
  reset(): void;
}

export function createSpriteController(
  baseFps: number = 8,
): SpriteController {
  let currentFrame = 0;
  let lastTick = 0;

  const stateStart = (state: MoodState) => MOOD_FRAME_OFFSET[state];

  return {
    getFrameIndex: () => currentFrame,
    setFrame(state, frameInState) {
      currentFrame = stateStart(state) + (frameInState % FRAMES_PER_STATE);
    },
    tick(now, energy) {
      const fps = Math.max(1, baseFps * Math.max(0.3, Math.min(1.0, energy)));
      const interval = 1000 / fps;
      if (now - lastTick < interval) {
        return { frameIndex: currentFrame, changed: false };
      }
      lastTick = now;
      const start = Math.floor(currentFrame / FRAMES_PER_STATE) * FRAMES_PER_STATE;
      const offset = (currentFrame - start + 1) % FRAMES_PER_STATE;
      currentFrame = start + offset;
      return { frameIndex: currentFrame, changed: true };
    },
    reset() {
      currentFrame = 0;
      lastTick = 0;
    },
  };
}

export function getFrameOffset(state: MoodState, frameInState: number): number {
  return MOOD_FRAME_OFFSET[state] + (frameInState % FRAMES_PER_STATE);
}
