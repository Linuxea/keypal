import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWalkController } from "./walkController";

describe("walkController", () => {
  let currentPos: { x: number; y: number };
  let setPosition: (x: number, y: number) => Promise<void>;
  let getPosition: () => Promise<{ x: number; y: number }>;

  beforeEach(() => {
    currentPos = { x: 100, y: 100 };
    setPosition = vi.fn(async (x: number, y: number) => {
      currentPos = { x, y };
    }) as unknown as (x: number, y: number) => Promise<void>;
    getPosition = vi.fn(async () => ({ ...currentPos })) as unknown as () => Promise<{ x: number; y: number }>;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });

  it("isWalking returns true after start", () => {
    const ctrl = createWalkController(setPosition, getPosition, 600);
    ctrl.start(200, 100);
    expect(ctrl.isWalking()).toBe(true);
    ctrl.stop();
  });

  it("stops walking immediately", () => {
    const ctrl = createWalkController(setPosition, getPosition, 60);
    ctrl.start(500, 500);
    ctrl.stop();
    expect(ctrl.isWalking()).toBe(false);
  });

  it("reaches target position", async () => {
    const ctrl = createWalkController(setPosition, getPosition, 600);
    ctrl.start(200, 100);

    await new Promise((r) => setTimeout(r, 300));

    expect(currentPos.x).toBe(200);
    expect(currentPos.y).toBe(100);
    expect(ctrl.isWalking()).toBe(false);
  });

  it("stops at exact target when close enough", async () => {
    currentPos = { x: 199, y: 100 };
    const ctrl = createWalkController(setPosition, getPosition, 600);
    ctrl.start(200, 100);

    await new Promise((r) => setTimeout(r, 100));

    expect(currentPos.x).toBe(200);
    expect(currentPos.y).toBe(100);
  });

  it("setPosition is called during walk", async () => {
    const ctrl = createWalkController(setPosition, getPosition, 600);
    ctrl.start(500, 100);

    await new Promise((r) => setTimeout(r, 100));

    expect(setPosition).toHaveBeenCalled();
    ctrl.stop();
  });

  it("new start cancels previous walk", async () => {
    const ctrl = createWalkController(setPosition, getPosition, 600);
    ctrl.start(500, 500);
    ctrl.start(200, 200);

    await new Promise((r) => setTimeout(r, 500));

    // Should have reached the second target (200,200), not the first (500,500)
    expect(currentPos.x).toBe(200);
    expect(currentPos.y).toBe(200);
    expect(ctrl.isWalking()).toBe(false);
  });
});
