import { describe, it, expect, vi } from "vitest";
import { PluginRegistry } from "./registry";
import { PetPlugin, BehaviorContext } from "./types";

function makePlugin(overrides: Partial<PetPlugin> = {}): PetPlugin {
  return {
    id: "test-plugin",
    name: "Test",
    version: "1.0.0",
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

  it("throws on missing dependency", () => {
    const registry = new PluginRegistry();
    expect(() =>
      registry.register(makePlugin({ dependencies: ["missing"] })),
    ).toThrow("depends on");
  });

  it("registers with satisfied dependencies", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin({ id: "base" }));
    registry.register(makePlugin({ id: "child", dependencies: ["base"] }));
    expect(registry.getPlugin("child")).toBeDefined();
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

  it("buildContext chains plugin augmentations", () => {
    const registry = new PluginRegistry();
    const base = { currentEmotion: "IDLE", currentEnergy: 0.5 } as BehaviorContext;
    registry.register(
      makePlugin({
        id: "a",
        augmentContext: (ctx) => ({ ...ctx, timeSinceLastAction: 999 }),
      }),
    );
    registry.register(
      makePlugin({
        id: "b",
        augmentContext: (ctx) => ({ ...ctx, lastAction: "forced" }),
      }),
    );
    const result = registry.buildContext(base);
    expect(result.timeSinceLastAction).toBe(999);
    expect(result.lastAction).toBe("forced");
  });

  it("executeDecision runs onDecision chain and executes action", async () => {
    const registry = new PluginRegistry();
    const executeSpy = vi.fn();

    registry.register(
      makePlugin({
        id: "a",
        onDecision: (d) => ({ ...d, thought: d.thought + "!" }),
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

  it("executeDecision stops when onDecision returns null", async () => {
    const registry = new PluginRegistry();
    const executeSpy = vi.fn();

    registry.register(
      makePlugin({
        id: "blocker",
        onDecision: () => null,
        actionDefinitions: [
          { type: "idle", duration: 1000, interruptible: true, frameCount: 4, draw: () => {}, execute: executeSpy },
        ],
      }),
    );

    await registry.executeDecision({
      thought: "test",
      emotion: { primary: "IDLE", energy: 0.5, mood: "平静" },
      action: { type: "idle", description: "待机" },
      speech: null,
    });

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
