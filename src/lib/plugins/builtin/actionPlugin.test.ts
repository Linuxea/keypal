import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { emotionPlugin } from "./emotionPlugin";
import { actionPlugin } from "./actionPlugin";

describe("actionPlugin", () => {
  it("registers 6 animations", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    expect(registry.getAllAnimations()).toHaveLength(6);
  });

  it("registers 6 actions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    expect(registry.getAllActions()).toHaveLength(6);
  });

  it("walk is interruptible", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    expect(registry.getAction("walk")!.interruptible).toBe(true);
  });

  it("sleep is not interruptible", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    expect(registry.getAction("sleep")!.interruptible).toBe(false);
  });

  it("walk duration is 0 (continuous)", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    expect(registry.getAction("walk")!.duration).toBe(0);
  });

  it("requires emotion-core dependency", () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(actionPlugin)).toThrow("depends on");
  });

  it("augments system prompt with action info", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    registry.register(actionPlugin);
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("动作系统");
    expect(prompt).toContain("walk");
    expect(prompt).toContain("jump");
    expect(prompt).toContain("sleep");
  });
});
