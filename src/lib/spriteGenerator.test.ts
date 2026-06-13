import { describe, it, expect } from "vitest";
import { getAnimationFrameRange } from "./spriteGenerator";
import { AnimationRegistration } from "./plugins/types";

const mockAnimations: AnimationRegistration[] = [
  { name: "idle", frameCount: 4, draw: () => {} },
  { name: "walk", frameCount: 4, draw: () => {} },
  { name: "jump", frameCount: 4, draw: () => {} },
];

describe("spriteGenerator", () => {
  describe("getAnimationFrameRange", () => {
    it("returns correct range for first animation", () => {
      const range = getAnimationFrameRange(mockAnimations, "idle");
      expect(range).toEqual({ start: 0, count: 4 });
    });

    it("returns correct range for second animation", () => {
      const range = getAnimationFrameRange(mockAnimations, "walk");
      expect(range).toEqual({ start: 4, count: 4 });
    });

    it("returns correct range for third animation", () => {
      const range = getAnimationFrameRange(mockAnimations, "jump");
      expect(range).toEqual({ start: 8, count: 4 });
    });

    it("returns null for unknown animation", () => {
      const range = getAnimationFrameRange(mockAnimations, "dance");
      expect(range).toBeNull();
    });

    it("handles empty animations list", () => {
      const range = getAnimationFrameRange([], "idle");
      expect(range).toBeNull();
    });

    it("handles varying frame counts", () => {
      const anims: AnimationRegistration[] = [
        { name: "a", frameCount: 3, draw: () => {} },
        { name: "b", frameCount: 6, draw: () => {} },
        { name: "c", frameCount: 2, draw: () => {} },
      ];
      expect(getAnimationFrameRange(anims, "a")).toEqual({ start: 0, count: 3 });
      expect(getAnimationFrameRange(anims, "b")).toEqual({ start: 3, count: 6 });
      expect(getAnimationFrameRange(anims, "c")).toEqual({ start: 9, count: 2 });
    });
  });
});
