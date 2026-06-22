export interface PartTrack {
  rotate?: number[];
  x?: number[];
  y?: number[];
  scale?: number[];
  scaleX?: number[];
  scaleY?: number[];
  dur: number;
  loop: boolean;
  ease?: "linear" | "sine";
}

export type AnimationDef = Partial<Record<string, PartTrack>>;

export const ANIMATIONS: Record<string, AnimationDef> = {
  idle: {
    body: { y: [0, -1.2, 0], dur: 2000, loop: true, ease: "sine" },
    eyes: { scaleY: [1, 1, 0.1, 1, 1], dur: 4200, loop: true },
    tail: { rotate: [0, 8, 0, -8, 0], dur: 1600, loop: true, ease: "sine" },
  },
  walk: {
    legs: { rotate: [0, 16, 0, -16, 0], dur: 600, loop: true, ease: "sine" },
    body: { y: [0, -1.6, 0], dur: 300, loop: true, ease: "sine" },
    tail: { rotate: [0, 14, -8, 0], dur: 600, loop: true, ease: "sine" },
  },
  jump: {
    __root__: { y: [0, -26, -26, 0], scale: [1, 0.92, 0.92, 1.08, 1], dur: 820, loop: false, ease: "sine" },
  },
  spin: {
    __root__: { rotate: [0, 360], dur: 820, loop: false },
  },
  yawn: {
    head: { rotate: [0, 6, 0, -3, 0], dur: 1400, loop: false, ease: "sine" },
    body: { scale: [1, 1.03, 1], dur: 1400, loop: false, ease: "sine" },
  },
  sleep: {
    body: { y: [0, 0.9, 0], dur: 3000, loop: true, ease: "sine" },
    eyes: { scaleY: [1, 0.1, 0.1], dur: 3000, loop: false },
  },
  snore: {
    body: { scale: [1, 1.05, 1], dur: 1800, loop: true, ease: "sine" },
    eyes: { scaleY: [1, 0.1, 0.1], dur: 3000, loop: false },
  },
};

export function isAnimation(id: string): boolean {
  return id in ANIMATIONS;
}

export const ANIMATION_IDS = Object.keys(ANIMATIONS);
