import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { speechPlugin } from "./speechPlugin";

describe("speechPlugin", () => {
  it("registers without dependencies", () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(speechPlugin)).not.toThrow();
  });

  it("augments system prompt with speech rules", () => {
    const registry = new PluginRegistry();
    registry.register(speechPlugin);
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("台词系统");
    expect(prompt).toContain("speech");
    expect(prompt).toContain("20字以内");
  });

  it("has no animations, actions, or emotions", () => {
    const registry = new PluginRegistry();
    registry.register(speechPlugin);
    expect(registry.getAllAnimations()).toHaveLength(0);
    expect(registry.getAllActions()).toHaveLength(0);
    expect(registry.getAllEmotions()).toHaveLength(0);
  });
});
