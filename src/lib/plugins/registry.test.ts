import { describe, it, expect, vi } from "vitest";
import { PluginRegistry } from "./registry";
import { PetPlugin } from "./types";

function makePlugin(overrides: Partial<PetPlugin> = {}): PetPlugin {
  return {
    id: "test-plugin",
    ...overrides,
  };
}

describe("PluginRegistry", () => {
  it("registers a plugin", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin());
    expect(registry.getPlugin("test-plugin")).toBeDefined();
  });

  it("throws on duplicate plugin id", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin());
    expect(() => registry.register(makePlugin())).toThrow("already registered");
  });

  it("registers animations from actionDefinitions", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        actionDefinitions: [
          { type: "jump", duration: 1000, interruptible: true, frameCount: 4, draw: () => {} },
        ],
      }),
    );
    expect(registry.getAnimation("jump")).toBeDefined();
    expect(registry.getAnimation("jump")!.frameCount).toBe(4);
  });

  it("throws on duplicate actionDefinition type", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        id: "a",
        actionDefinitions: [
          { type: "jump", duration: 1000, interruptible: true, frameCount: 4, draw: () => {} },
        ],
      }),
    );
    expect(() =>
      registry.register(
        makePlugin({
          id: "b",
          actionDefinitions: [
            { type: "jump", duration: 2000, interruptible: false, frameCount: 6, draw: () => {} },
          ],
        }),
      ),
    ).toThrow("already registered");
  });

  it("registers actions from actionDefinitions", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        actionDefinitions: [
          { type: "walk", duration: 0, interruptible: true, frameCount: 4, draw: () => {} },
        ],
      }),
    );
    expect(registry.getAction("walk")).toBeDefined();
    expect(registry.getAction("walk")!.interruptible).toBe(true);
  });

  it("registers emotions", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        emotions: [{ name: "HAPPY", tint: "#fff7a8", defaultEnergy: 0.8 }],
      }),
    );
    expect(registry.getEmotion("HAPPY")).toBeDefined();
  });

  it("unregisters a plugin and its registrations", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        actionDefinitions: [
          { type: "dance", duration: 3000, interruptible: true, frameCount: 6, draw: () => {} },
        ],
      }),
    );
    registry.unregister("test-plugin");
    expect(registry.getPlugin("test-plugin")).toBeUndefined();
    expect(registry.getAnimation("dance")).toBeUndefined();
    expect(registry.getAction("dance")).toBeUndefined();
  });

  it("buildSystemPrompt chains plugin augmentations", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        id: "a",
        augmentSystemPrompt: (base) => base + "A",
      }),
    );
    registry.register(
      makePlugin({
        id: "b",
        augmentSystemPrompt: (base) => base + "B",
      }),
    );
    expect(registry.buildSystemPrompt()).toBe("AB");
  });

  it("executeDecision executes action", async () => {
    const registry = new PluginRegistry();
    const executeSpy = vi.fn();

    registry.register(
      makePlugin({
        id: "a",
        actionDefinitions: [
          { type: "idle", duration: 1000, interruptible: true, frameCount: 4, draw: () => {}, execute: executeSpy },
        ],
      }),
    );

    const decision = {
      thought: "hello",
      emotion: { primary: "IDLE", energy: 0.5, mood: "平静" },
      action: { type: "idle", description: "待机" },
      speech: null,
    };

    await registry.executeDecision(decision);
    expect(executeSpy).toHaveBeenCalledTimes(1);
  });
});
