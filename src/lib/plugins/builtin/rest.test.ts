import { describe, it, expect } from "vitest";
import { createRegistry } from "../index";
import { ANIMATION_IDS } from "../../animations/registry";

describe("restPlugin", () => {
  it("registers yawn, sleep, and snore behaviors", () => {
    const registry = createRegistry();
    const ids = registry.getAllBehaviors().map((b) => b.id);
    expect(ids).toContain("yawn");
    expect(ids).toContain("sleep");
    expect(ids).toContain("snore");
  });

  it("exposes yawn, sleep, and snore animations", () => {
    for (const id of ["yawn", "sleep", "snore"]) {
      expect(ANIMATION_IDS).toContain(id);
    }
  });

  it("sleep behavior is not interruptible", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("sleep");
    expect(behavior).toBeDefined();
    expect(behavior!.interruptible).toBe(false);
  });

  it("snore behavior is not interruptible", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("snore");
    expect(behavior).toBeDefined();
    expect(behavior!.interruptible).toBe(false);
  });

  it("yawn behavior is interruptible", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("yawn");
    expect(behavior).toBeDefined();
    expect(behavior!.interruptible).toBe(true);
  });

  it("augments system prompt with rest info", () => {
    const registry = createRegistry();
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("休息行为");
    expect(prompt).toContain("yawn");
    expect(prompt).toContain("sleep");
    expect(prompt).toContain("snore");
  });
});
