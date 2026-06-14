import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { emotionPlugin } from "./emotionPlugin";
import { locomotionPlugin } from "./locomotion";

describe("locomotionPlugin", () => {
  it("registers 4 actionDefinitions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    expect(locomotionPlugin.actionDefinitions).toHaveLength(4);
  });

  it("registers 4 animations", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    const animNames = registry.getAllAnimations().map((a) => a.name);
    expect(animNames).toContain("idle");
    expect(animNames).toContain("walk");
    expect(animNames).toContain("jump");
    expect(animNames).toContain("spin");
  });

  it("registers 4 actions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    expect(registry.getAction("idle")).toBeDefined();
    expect(registry.getAction("walk")).toBeDefined();
    expect(registry.getAction("jump")).toBeDefined();
    expect(registry.getAction("spin")).toBeDefined();
  });

  it("walk has movement flag", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    expect(registry.getAction("walk")!.movement).toBe(true);
  });

  it("walk is continuous (duration 0)", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    expect(registry.getAction("walk")!.duration).toBe(0);
  });

  it("registers without dependencies", () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(locomotionPlugin)).not.toThrow();
  });

  it("augments system prompt with locomotion info", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(locomotionPlugin);
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("移动系统");
    expect(prompt).toContain("walk");
    expect(prompt).toContain("jump");
  });
});
