import { describe, it, expect } from "vitest";
import { createRegistry } from "../index";
import { ANIMATION_IDS } from "../../animations/registry";

describe("locomotionPlugin", () => {
  it("registers 4 behaviors", () => {
    const registry = createRegistry();
    const ids = registry.getAllBehaviors().map((b) => b.id);
    expect(ids).toContain("idle");
    expect(ids).toContain("walk");
    expect(ids).toContain("jump");
    expect(ids).toContain("spin");
  });

  it("exposes 4 locomotion animations", () => {
    for (const id of ["idle", "walk", "jump", "spin"]) {
      expect(ANIMATION_IDS).toContain(id);
    }
  });

  it("walk factory requires params", () => {
    const registry = createRegistry();
    const walk = registry.getBehavior("walk");
    expect(walk?.requiresParams).toBeDefined();
  });

  it("creates walk behavior with target coordinates", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("walk", { targetX: 100, targetY: 200 });
    expect(behavior).toBeDefined();
    expect(behavior!.id).toBe("walk");
  });

  it("creates jump behavior", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("jump");
    expect(behavior).toBeDefined();
    expect(behavior!.id).toBe("jump");
    expect(behavior!.interruptible).toBe(true);
  });

  it("augments system prompt with locomotion info", () => {
    const registry = createRegistry();
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("移动行为");
    expect(prompt).toContain("walk");
    expect(prompt).toContain("jump");
  });
});
