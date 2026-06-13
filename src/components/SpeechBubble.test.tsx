import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SpeechBubble } from "./SpeechBubble";

describe("SpeechBubble", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders text when provided", () => {
    render(<SpeechBubble text="你好！" />);
    expect(screen.getByText("你好！")).toBeDefined();
  });

  it("renders nothing when text is null", () => {
    const { container } = render(<SpeechBubble text={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("hides after duration", () => {
    const { container } = render(<SpeechBubble text="你好！" durationMs={1000} />);
    expect(screen.getByText("你好！")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(container.innerHTML).toBe("");
  });

  it("shows new text when prop changes", () => {
    const { rerender } = render(<SpeechBubble text="你好！" />);
    expect(screen.getByText("你好！")).toBeDefined();

    rerender(<SpeechBubble text="再见！" />);
    expect(screen.getByText("再见！")).toBeDefined();
  });

  it("renders multi-line text", () => {
    render(<SpeechBubble text="第一行\n第二行" />);
    expect(screen.getByText(/第一行/)).toBeDefined();
    expect(screen.getByText(/第二行/)).toBeDefined();
  });
});
