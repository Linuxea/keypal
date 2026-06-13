import { describe, it, expect, beforeEach } from "vitest";
import { createSpriteController } from "./spritesheet";
import { AnimationRegistration } from "./plugins/types";

const mockAnimations: AnimationRegistration[] = [
  { name: "idle", frameCount: 4, draw: () => {} },
  { name: "walk", frameCount: 4, draw: () => {} },
];

describe("createSpriteController", () => {
  let ctrl: ReturnType<typeof createSpriteController>;

  beforeEach(() => {
    ctrl = createSpriteController(mockAnimations, 8);
  });

  it("starts at frame 0", () => {
    expect(ctrl.getFrameIndex()).toBe(0);
  });

  it("setAnimation changes to correct frame range", () => {
    ctrl.setAnimation("walk");
    expect(ctrl.getFrameIndex()).toBe(4);
  });

  it("setAnimation with unknown name does nothing", () => {
    ctrl.setAnimation("dance");
    expect(ctrl.getFrameIndex()).toBe(0);
  });

  it("tick advances frame within animation range", () => {
    ctrl.setAnimation("idle");
    const result1 = ctrl.tick(200, 1.0);
    expect(result1.frameIndex).toBe(1);
    expect(result1.changed).toBe(true);

    const result2 = ctrl.tick(400, 1.0);
    expect(result2.frameIndex).toBe(2);
  });

  it("tick wraps around animation range", () => {
    ctrl.setAnimation("idle");
    ctrl.tick(200, 1.0); // 1
    ctrl.tick(400, 1.0); // 2
    ctrl.tick(600, 1.0); // 3
    const result = ctrl.tick(800, 1.0);
    expect(result.frameIndex).toBe(0);
  });

  it("tick does not advance before interval", () => {
    const result = ctrl.tick(50, 1.0);
    expect(result.changed).toBe(false);
  });

  it("energy affects animation speed", () => {
    ctrl.setAnimation("idle");
    // Low energy = slow animation = higher interval
    const result = ctrl.tick(100, 0.3);
    expect(result.changed).toBe(false);
  });

  it("reset returns to frame 0", () => {
    ctrl.setAnimation("walk");
    ctrl.tick(100, 1.0);
    ctrl.reset();
    expect(ctrl.getFrameIndex()).toBe(0);
  });
});
