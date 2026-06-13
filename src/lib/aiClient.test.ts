import { describe, it, expect, vi, beforeEach } from "vitest";
import { decideBehavior } from "./aiClient";
import { AIConfig } from "./types";
import { BehaviorContext } from "./plugins/types";

const mockConfig: AIConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "sk-test",
  model: "test-model",
  intervalSec: 30,
};

const mockContext: BehaviorContext = {
  currentEmotion: "IDLE",
  currentEnergy: 0.5,
  lastAction: null,
  lastSpeech: null,
  position: { x: 500, y: 500 },
  screenWidth: 1920,
  screenHeight: 1080,
  pet: "cat",
  petName: "小咪",
  timeSinceLastAction: 10000,
  decisionHistory: [],
};

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("decideBehavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct request structure", async () => {
    const fetchSpy = mockFetchResponse({
      choices: [{ message: { content: JSON.stringify({
        thought: "test",
        emotion: { primary: "IDLE", energy: 0.5, mood: "平静" },
        action: { type: "idle", description: "待机" },
        speech: null,
      }) } }],
    });
    vi.stubGlobal("fetch", fetchSpy);

    await decideBehavior(mockConfig, "test prompt", mockContext);

    const call = fetchSpy.mock.calls[0];
    expect(call[0]).toBe("https://api.example.com/v1/chat/completions");
    const body = JSON.parse(call[1].body);
    expect(body.model).toBe("test-model");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toBe("test prompt");
    expect(body.messages[1].role).toBe("user");
  });

  it("parses a valid response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: JSON.stringify({
        thought: "看到窗外有鸟",
        emotion: { primary: "HAPPY", energy: 0.9, mood: "兴奋" },
        action: { type: "jump", description: "开心地蹦跳" },
        speech: "哇！有鸟！",
      }) } }],
    }));

    const result = await decideBehavior(mockConfig, "prompt", mockContext);
    expect(result.thought).toBe("看到窗外有鸟");
    expect(result.emotion.primary).toBe("HAPPY");
    expect(result.emotion.energy).toBe(0.9);
    expect(result.action.type).toBe("jump");
    expect(result.speech).toBe("哇！有鸟！");
  });

  it("clamps energy to 0.1-1.0", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: JSON.stringify({
        thought: "t",
        emotion: { primary: "IDLE", energy: 5.0, mood: "" },
        action: { type: "idle", description: "" },
        speech: null,
      }) } }],
    }));

    const result = await decideBehavior(mockConfig, "p", mockContext);
    expect(result.emotion.energy).toBe(1.0);
  });

  it("handles missing fields with defaults", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: "{}" } }],
    }));

    const result = await decideBehavior(mockConfig, "p", mockContext);
    expect(result.thought).toBe("");
    expect(result.emotion.primary).toBe("IDLE");
    expect(result.emotion.energy).toBe(0.5);
    expect(result.action.type).toBe("idle");
    expect(result.speech).toBeNull();
  });

  it("extracts JSON from markdown code block", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: '```json\n{"thought":"hi","emotion":{"primary":"IDLE","energy":0.5,"mood":""},"action":{"type":"idle","description":""},"speech":null}\n```' } }],
    }));

    const result = await decideBehavior(mockConfig, "p", mockContext);
    expect(result.thought).toBe("hi");
  });

  it("throws on missing api key", async () => {
    await expect(
      decideBehavior({ ...mockConfig, apiKey: "" }, "p", mockContext),
    ).rejects.toThrow("missing_api_key");
  });

  it("throws on missing base url", async () => {
    await expect(
      decideBehavior({ ...mockConfig, baseUrl: "" }, "p", mockContext),
    ).rejects.toThrow("missing_base_url");
  });

  it("throws on timeout", async () => {
    vi.stubGlobal("fetch", () => new Promise((_, reject) => {
      const err = new DOMException("aborted", "AbortError");
      reject(err);
    }));

    await expect(
      decideBehavior(mockConfig, "p", mockContext),
    ).rejects.toThrow("timeout");
  });

  it("throws on HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({ error: "unauthorized" }, 401));

    await expect(
      decideBehavior(mockConfig, "p", mockContext),
    ).rejects.toThrow("http_401");
  });

  it("throws on invalid JSON response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: "not json at all!!!" } }],
    }));

    await expect(
      decideBehavior(mockConfig, "p", mockContext),
    ).rejects.toThrow("parse_failed");
  });
});
