import { describe, it, expect } from "vitest";
import { createRegistry } from "./index";

describe("plugin integration", () => {
  it("creates registry with all builtin plugins", () => {
    const registry = createRegistry();
    expect(registry.getPlugin("base")).toBeDefined();
    expect(registry.getPlugin("locomotion")).toBeDefined();
    expect(registry.getPlugin("rest")).toBeDefined();
  });

  it("has 5 emotions from base plugin", () => {
    const registry = createRegistry();
    expect(registry.getAllEmotions()).toHaveLength(5);
  });

  it("has 7 behaviors across locomotion + rest", () => {
    const registry = createRegistry();
    expect(registry.getAllBehaviors()).toHaveLength(7);
  });

  it("has 7 animations from behaviors", () => {
    const registry = createRegistry();
    expect(registry.getAllAnimations()).toHaveLength(7);
  });

  it("buildSystemPrompt includes all plugin contributions", () => {
    const registry = createRegistry();
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("基础情绪");
    expect(prompt).toContain("移动行为");
    expect(prompt).toContain("休息行为");
  });
});
