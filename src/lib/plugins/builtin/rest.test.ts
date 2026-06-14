import { describe, it, expect } from "vitest";
import { createRegistry } from "../index";

describe("restPlugin", () => {
  it("registers yawn and sleep behaviors", () => {
    const registry = createRegistry();
    const ids = registry.getAllBehaviors().map((b) => b.id);
    expect(ids).toContain("yawn");
    expect(ids).toContain("sleep");
  });

  it("registers yawn and sleep animations", () => {
    const registry = createRegistry();
    const names = registry.getAllAnimations().map((a) => a.name);
    expect(names).toContain("yawn");
    expect(names).toContain("sleep");
  });

  it("sleep behavior is not interruptible", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("sleep");
    expect(behavior).toBeDefined();
    expect(behavior!.interruptible).toBe(false);
  });

  it("yawn behavior is interruptible", () => {
    const registry = createRegistry();
    const behavior = registry.createBehavior("yawn");
    expect(behavior).toBeDefined();
    expect(behavior!.interruptible).toBe(true);
  });

  it("contributes rest speechPool", () => {
    const registry = createRegistry();
    const pool = registry.getSpeechPool();
    expect(pool.some((s) => s.includes("困"))).toBe(true);
  });

  it("augments system prompt with rest info", () => {
    const registry = createRegistry();
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("休息行为");
    expect(prompt).toContain("yawn");
    expect(prompt).toContain("sleep");
  });
});
