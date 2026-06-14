import { describe, it, expect } from "vitest";
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

  it("registers behaviors and their animations", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        behaviors: [
          {
            id: "jump",
            animation: { frameCount: 4, draw: () => {} },
            create: () => ({
              id: "jump",
              interruptible: true,
              getState: () => ({ animation: "jump" }),
              start: () => Promise.resolve(),
            }),
          },
        ],
      }),
    );
    expect(registry.getBehavior("jump")).toBeDefined();
    expect(registry.getAnimation("jump")).toBeDefined();
    expect(registry.getAnimation("jump")!.frameCount).toBe(4);
  });

  it("throws on duplicate behavior id", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        id: "a",
        behaviors: [
          {
            id: "jump",
            animation: { frameCount: 4, draw: () => {} },
            create: () => ({
              id: "jump", interruptible: true,
              getState: () => ({}),
              start: () => Promise.resolve(),
            }),
          },
        ],
      }),
    );
    expect(() =>
      registry.register(
        makePlugin({
          id: "b",
          behaviors: [
            {
              id: "jump",
              create: () => ({
                id: "jump", interruptible: true,
                getState: () => ({}),
                start: () => Promise.resolve(),
              }),
            },
          ],
        }),
      ),
    ).toThrow("already registered");
  });

  it("creates behavior instances from factories", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        behaviors: [
          {
            id: "wave",
            create: () => ({
              id: "wave",
              interruptible: true,
              getState: () => ({ animation: "wave" }),
              start: () => Promise.resolve(),
            }),
          },
        ],
      }),
    );
    const behavior = registry.createBehavior("wave");
    expect(behavior).toBeDefined();
    expect(behavior!.id).toBe("wave");
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

  it("collects speechPool from plugins", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        id: "a",
        speechPool: ["hello", "hi"],
      }),
    );
    registry.register(
      makePlugin({
        id: "b",
        speechPool: ["bye"],
      }),
    );
    expect(registry.getSpeechPool()).toHaveLength(3);
    expect(registry.getSpeechPool()).toContain("hello");
    expect(registry.getSpeechPool()).toContain("bye");
  });

  it("unregisters a plugin and its registrations", () => {
    const registry = new PluginRegistry();
    registry.register(
      makePlugin({
        behaviors: [
          {
            id: "dance",
            animation: { frameCount: 6, draw: () => {} },
            create: () => ({
              id: "dance", interruptible: true,
              getState: () => ({}),
              start: () => Promise.resolve(),
            }),
          },
        ],
      }),
    );
    registry.unregister("test-plugin");
    expect(registry.getPlugin("test-plugin")).toBeUndefined();
    expect(registry.getBehavior("dance")).toBeUndefined();
    expect(registry.getAnimation("dance")).toBeUndefined();
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
});
