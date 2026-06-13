import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setPosition: vi.fn(),
    outerPosition: () => Promise.resolve({ x: 0, y: 0 }),
    scaleFactor: () => Promise.resolve(1),
    outerSize: () => ({ toLogical: () => ({ width: 128, height: 128 }) }),
    setSize: vi.fn(),
  }),
  LogicalPosition: vi.fn(),
  LogicalSize: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-store", () => ({
  load: () => Promise.resolve({
    get: () => null,
    set: vi.fn(),
    save: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it("renders a canvas for the pet", () => {
    const { container } = render(<App />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();
  });
});
