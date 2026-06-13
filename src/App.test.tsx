import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

describe("App", () => {
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
