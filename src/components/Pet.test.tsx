import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Pet } from "./Pet";
import { AnimationRegistration } from "../lib/plugins/types";

const mockAnimations: AnimationRegistration[] = [
  { name: "idle", frameCount: 4, draw: () => {} },
  { name: "walk", frameCount: 4, draw: () => {} },
];

describe("Pet", () => {
  it("renders a canvas element", () => {
    const { container } = render(
      <Pet
        pet="cat"
        animations={mockAnimations}
        currentAnimation="idle"
        energy={0.5}
        size={96}
        flipX={false}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();
  });

  it("sets canvas width and height from size prop", () => {
    const { container } = render(
      <Pet
        pet="cat"
        animations={mockAnimations}
        currentAnimation="idle"
        energy={0.5}
        size={128}
        flipX={false}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(128);
    expect(canvas.height).toBe(128);
  });

  it("applies pixelated image rendering style", () => {
    const { container } = render(
      <Pet
        pet="frog"
        animations={mockAnimations}
        currentAnimation="idle"
        energy={0.5}
        size={64}
        flipX={false}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.imageRendering).toBe("pixelated");
  });
});
