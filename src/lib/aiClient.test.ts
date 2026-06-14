import { describe, it, expect, vi, beforeEach } from "vitest";
import { decideBehavior } from "./aiClient";
import { AIConfig } from "./types";
import { BehaviorContext } from "./plugins/types";

const mockConfig: AIConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "sk-test",
  model: "test-model",
  intervalSec: 30,
  maxTokens: 300,
  temperature: 0.8,
};

const mockContext: BehaviorContext = {
  currentBehavior: "idle",
  position: { x: 500, y: 500 },
  screenWidth: 1920,
  screenHeight: 1080,
  pet: "cat",
  petName: "小咪",
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
        behaviorId: "idle",
      }) } }],
    });
    vi.stubGlobal("fetch", fetchSpy);

    await decideBehavior(mockConfig, "test prompt", mockContext);

    const call = fetchSpy.mock.calls[0];
    expect(call[0]).toBe("https://api.example.com/v1/chat/completions");
    const body = JSON.parse(call[1].body);
    expect(body.model).toBe("test-model");
    expect(body.messages[0].content).toBe("test prompt");
    expect(body.messages[1].role).toBe("user");
  });

  it("parses a valid response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: JSON.stringify({
        thought: "看到窗外有鸟",
        behaviorId: "jump",
      }) } }],
    }));

    const result = await decideBehavior(mockConfig, "prompt", mockContext);
    expect(result.thought).toBe("看到窗外有鸟");
    expect(result.behaviorId).toBe("jump");
  });

  it("parses response with params", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: JSON.stringify({
        thought: "去那边看看",
        behaviorId: "walk",
        params: { targetX: 800, targetY: 600 },
      }) } }],
    }));

    const result = await decideBehavior(mockConfig, "prompt", mockContext);
    expect(result.behaviorId).toBe("walk");
    expect(result.params?.targetX).toBe(800);
    expect(result.params?.targetY).toBe(600);
  });

  it("handles missing fields with defaults", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: "{}" } }],
    }));

    const result = await decideBehavior(mockConfig, "p", mockContext);
    expect(result.thought).toBe("");
    expect(result.behaviorId).toBe("idle");
  });

  it("extracts JSON from markdown code block", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({
      choices: [{ message: { content: '```json\n{"thought":"hi","behaviorId":"idle"}\n```' } }],
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
