import { describe, it, expect, vi, afterEach } from "vitest";
import { BrainEngine, BrainConfig } from "./brainEngine";
import { PluginRegistry } from "./plugins/registry";
import { emotionPlugin } from "./plugins/builtin/emotionPlugin";
import { actionPlugin } from "./plugins/builtin/actionPlugin";
import { speechPlugin } from "./plugins/builtin/speechPlugin";

function makeConfig(overrides: Partial<BrainConfig> = {}): BrainConfig {
  const registry = new PluginRegistry();
  registry.register(emotionPlugin);
  registry.register(actionPlugin);
  registry.register(speechPlugin);

  return {
    ai: {
      baseUrl: "https://api.example.com",
      apiKey: "sk-test",
      model: "test-model",
      intervalSec: 30,
    },
    registry,
    intervalMs: 50,
    petName: "小咪",
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
      emotion: { primary: "HAPPY", energy: 0.9, mood: "开心" },
      action: { type: "jump", description: "跳起来" },
      speech: "耶！",
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    const cb = vi.fn();
    brain.onDecision(cb);
    brain.start();

    await sleep(150);

    expect(cb).toHaveBeenCalled();
    const decision = cb.mock.calls[0][0];
    expect(decision.emotion.primary).toBe("HAPPY");
    expect(decision.action.type).toBe("jump");
    expect(decision.speech).toBe("耶！");

    brain.stop();
  });

  it("updates internal state after decision", async () => {
    mockAiResponse({
      thought: "tired",
      emotion: { primary: "SLEEPY", energy: 0.2, mood: "困" },
      action: { type: "yawn", description: "打哈欠" },
      speech: null,
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    brain.start();

    await sleep(150);

    expect(brain.getCurrentEmotion()).toBe("SLEEPY");
    expect(brain.getCurrentEnergy()).toBe(0.2);

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
    expect(brain.getCurrentEmotion()).toBe("IDLE");

    brain.stop();
  });

  it("does not tick after stop", async () => {
    mockAiResponse({
      thought: "t",
      emotion: { primary: "IDLE", energy: 0.5, mood: "" },
      action: { type: "idle", description: "" },
      speech: null,
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
          emotion: { primary: "IDLE", energy: 0.5, mood: "" },
          action: { type: "idle", description: "" },
          speech: null,
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
      emotion: { primary: "IDLE", energy: 0.5, mood: "" },
      action: { type: "idle", description: "" },
      speech: null,
    });

    const brain = new BrainEngine(makeConfig({ intervalMs: 50 }));
    brain.start();

    await sleep(150);

    const fetchSpy2 = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          thought: "thought 2",
          emotion: { primary: "IDLE", energy: 0.5, mood: "" },
          action: { type: "idle", description: "" },
          speech: null,
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
