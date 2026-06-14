import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { emotionPlugin } from "./emotionPlugin";
import { restPlugin } from "./rest";

describe("restPlugin", () => {
  it("registers 2 actionDefinitions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    expect(restPlugin.actionDefinitions).toHaveLength(2);
  });

  it("registers yawn and sleep animations", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    const animNames = registry.getAllAnimations().map((a) => a.name);
    expect(animNames).toContain("yawn");
    expect(animNames).toContain("sleep");
  });

  it("registers yawn and sleep actions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    expect(registry.getAction("yawn")).toBeDefined();
    expect(registry.getAction("sleep")).toBeDefined();
  });

  it("sleep is not interruptible", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    expect(registry.getAction("sleep")!.interruptible).toBe(false);
  });

  it("yawn is interruptible", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    expect(registry.getAction("yawn")!.interruptible).toBe(true);
  });

  it("registers without dependencies", () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(restPlugin)).not.toThrow();
  });

  it("augments system prompt with rest info", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(restPlugin);
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("休息系统");
    expect(prompt).toContain("yawn");
    expect(prompt).toContain("sleep");
  });
});
