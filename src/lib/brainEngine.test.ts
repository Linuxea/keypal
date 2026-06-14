import { describe, it, expect, vi, afterEach } from "vitest";
import { BrainEngine, BrainConfig } from "./brainEngine";
import { PluginRegistry } from "./plugins/registry";
import { basePlugin } from "./plugins/builtin/base";
import { locomotionPlugin } from "./plugins/builtin/locomotion";
import { restPlugin } from "./plugins/builtin/rest";
import { BehaviorExecutor } from "./behaviorExecutor";

function makeConfig(overrides: Partial<BrainConfig> = {}): BrainConfig {
  const registry = new PluginRegistry();
  registry.register(basePlugin);
  registry.register(locomotionPlugin);
  registry.register(restPlugin);

  const executor = new BehaviorExecutor({
    position: { x: 500, y: 500 },
    screenWidth: 1920,
    screenHeight: 1080,
  });

  return {
    ai: {
      baseUrl: "https://api.example.com",
      apiKey: "sk-test",
      model: "test-model",
      intervalSec: 30,
      maxTokens: 300,
      temperature: 0.8,
    },
    registry,
    executor,
    intervalMs: 50,
    petName: "小咪",
    pet: "cat",
    ...overrides,
  };
}

function mockAiResponse(decision: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: JSON.stringify(decision) } }],
    }),
    text: () => Promise.resolve(JSON.stringify(decision)),
  }));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("BrainEngine", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts and stops", () => {
    const brain = new BrainEngine(makeConfig());
    brain.start();
    brain.stop();
  });

  it("calls onDecision callback after tick", async () => {
    mockAiResponse({
      thought: "hello",
      behaviorId: "jump",
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    const cb = vi.fn();
    brain.onDecision(cb);
    brain.start();

    await sleep(150);

    expect(cb).toHaveBeenCalled();
    const decision = cb.mock.calls[0][0];
    expect(decision.behaviorId).toBe("jump");
    expect(decision.thought).toBe("hello");

    brain.stop();
  });

  it("enqueues behavior into executor after tick", async () => {
    mockAiResponse({
      thought: "jump!",
      behaviorId: "jump",
    });

    const config = makeConfig({ intervalMs: 50 });
    const brain = new BrainEngine(config);
    brain.start();

    await sleep(150);

    expect(config.executor.getState().animation).toBe("jump");

    brain.stop();
  });

  it("handles AI error gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    const cb = vi.fn();
    brain.onDecision(cb);
    brain.start();

    await sleep(150);

    expect(cb).not.toHaveBeenCalled();

    brain.stop();
  });

  it("does not tick after stop", async () => {
    mockAiResponse({
      thought: "t",
      behaviorId: "idle",
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    const cb = vi.fn();
    brain.onDecision(cb);
    brain.start();
    brain.stop();

    await sleep(200);

    expect(cb).not.toHaveBeenCalled();
  });

  it("passes context with position and screen size", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          thought: "t",
          behaviorId: "idle",
        }) } }],
      }),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    brain.setPosition(300, 400);
    brain.setScreenSize(2560, 1440);
    brain.start();

    await sleep(150);

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    const userMsg = JSON.parse(body.messages[1].content);
    expect(userMsg.position).toEqual({ x: 300, y: 400 });
    expect(userMsg.screenWidth).toBe(2560);
    expect(userMsg.screenHeight).toBe(1440);

    brain.stop();
  });

  it("accumulates decision history", async () => {
    mockAiResponse({
      thought: "thought 1",
      behaviorId: "idle",
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    brain.start();

    await sleep(150);

    const fetchSpy2 = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          thought: "thought 2",
          behaviorId: "idle",
        }) } }],
      }),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchSpy2);

    await sleep(150);

    const body = JSON.parse(fetchSpy2.mock.calls[0][1].body);
    const userMsg = JSON.parse(body.messages[1].content);
    expect(userMsg.decisionHistory).toContain("thought 1");

    brain.stop();
  });
});
