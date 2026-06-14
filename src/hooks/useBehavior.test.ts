import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBehavior } from "./useBehavior";
import { AIConfig } from "../lib/types";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setPosition: vi.fn(),
    outerPosition: () => Promise.resolve({ x: 100, y: 100 }),
    scaleFactor: () => Promise.resolve(1),
  }),
  LogicalPosition: vi.fn(),
}));

const mockAiConfig: AIConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "sk-test",
  model: "test-model",
  intervalSec: 30,
  maxTokens: 300,
  temperature: 0.8,
};

describe("useBehavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useBehavior(mockAiConfig, "cat", "小咪"));
    expect(result.current.currentAnimation).toBe("idle");
    expect(result.current.currentSpeech).toBeNull();
    expect(result.current.energy).toBe(0.5);
    expect(result.current.flipX).toBe(false);
  });

  it("returns animations from registry", () => {
    const { result } = renderHook(() => useBehavior(mockAiConfig, "cat", "小咪"));
    expect(result.current.animations.length).toBeGreaterThan(0);
    expect(result.current.animations.some((a) => a.name === "idle")).toBe(true);
    expect(result.current.animations.some((a) => a.name === "walk")).toBe(true);
  });

  it("setPosition and setScreenSize do not throw", () => {
    const { result } = renderHook(() => useBehavior(mockAiConfig, "cat", "小咪"));
    act(() => {
      result.current.setPosition(100, 200);
      result.current.setScreenSize(1920, 1080);
    });
  });

  it("starts local fallback when no api key", async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const noKeyConfig: AIConfig = { ...mockAiConfig, apiKey: "" };
    const { result } = renderHook(() => useBehavior(noKeyConfig, "cat", "小咪"));

    act(() => {
      vi.advanceTimersByTime(31000);
    });

    expect(result.current.currentAnimation).not.toBe("idle");

    randomSpy.mockRestore();
    vi.useRealTimers();
  });
});
