import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../registry";
import { emotionPlugin } from "./emotionPlugin";

describe("emotionPlugin", () => {
  it("registers 5 emotions", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    expect(registry.getAllEmotions()).toHaveLength(5);
  });

  it("registers IDLE emotion", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    const e = registry.getEmotion("IDLE");
    expect(e).toBeDefined();
    expect(e!.tint).toBe("transparent");
    expect(e!.defaultEnergy).toBe(0.5);
  });

  it("registers SLEEPY with low energy", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    const e = registry.getEmotion("SLEEPY");
    expect(e!.defaultEnergy).toBe(0.2);
  });

  it("augments system prompt with emotion info", () => {
    const registry = new PluginRegistry();
    registry.register(emotionPlugin);
    const prompt = registry.buildSystemPrompt();
    expect(prompt).toContain("情绪系统");
    expect(prompt).toContain("IDLE");
    expect(prompt).toContain("HAPPY");
    expect(prompt).toContain("SLEEPY");
  });
});
