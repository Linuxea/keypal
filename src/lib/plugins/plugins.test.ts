import { describe, it, expect } from "vitest";
import { createRegistry } from "./index";

describe("plugin integration", () => {
  it("creates registry with all builtin plugins", () => {
    const registry = createRegistry();
    expect(registry.getPlugin("emotion-core")).toBeDefined();
    expect(registry.getPlugin("locomotion")).toBeDefined();
    expect(registry.getPlugin("rest")).toBeDefined();
    expect(registry.getPlugin("speech-core")).toBeDefined();
  });

  it("has 5 emotions from emotion plugin", () => {
    const registry = createRegistry();
    expect(registry.getAllEmotions()).toHaveLength(5);
  });

  it("has 6 animations across locomotion + rest", () => {
    const registry = createRegistry();
    expect(registry.getAllAnimations()).toHaveLength(6);
  });

  it("has 6 actions across locomotion + rest", () => {
    const registry = createRegistry();
    expect(registry.getAllActions()).toHaveLength(6);
  });

  it("buildSystemPrompt includes all plugin contributions", () => {
    const registry = createRegistry();
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("情绪系统");
    expect(prompt).toContain("移动系统");
    expect(prompt).toContain("休息系统");
    expect(prompt).toContain("台词系统");
  });
});
