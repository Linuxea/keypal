import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PetView } from "./PetView";
import { PetKind } from "../lib/types";

const PETS: PetKind[] = ["cat", "dog", "frog", "chick"];

describe("PetView", () => {
  it("renders an svg element", () => {
    const { container } = render(
      <PetView
        pet="cat"
        animation="idle"
        energy={0.5}
        flipX={false}
        size={96}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders named body/head part groups", () => {
    const { container } = render(
      <PetView
        pet="cat"
        animation="idle"
        energy={0.5}
        flipX={false}
        size={96}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    expect(container.querySelector('[data-part="body"]')).toBeTruthy();
    expect(container.querySelector('[data-part="head"]')).toBeTruthy();
    expect(container.querySelector('[data-part="eyes"]')).toBeTruthy();
  });

  it.each(PETS)("renders %s without crashing", (pet) => {
    const { container } = render(
      <PetView
        pet={pet}
        animation="idle"
        energy={0.5}
        flipX={false}
        size={96}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector('[data-part="body"]')).toBeTruthy();
  });

  it("applies a flip transform on the wrapper when flipX", () => {
    const { container } = render(
      <PetView
        pet="cat"
        animation="idle"
        energy={0.5}
        flipX={true}
        size={96}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    const wrapper = container.querySelector("svg > g") as SVGGElement;
    expect(wrapper.getAttribute("transform")).toContain("scale(-1");
  });

  it("omits flip transform when not flipX", () => {
    const { container } = render(
      <PetView
        pet="cat"
        animation="idle"
        energy={0.5}
        flipX={false}
        size={96}
        onContextMenu={() => {}}
        onMouseDown={() => {}}
      />,
    );
    const wrapper = container.querySelector("svg > g") as SVGGElement;
    expect(wrapper.getAttribute("transform")).toBeNull();
  });
});
