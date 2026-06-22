import { describe, it, expect } from "vitest";
import { AnimationDriver, sampleArr, toTransform } from "./driver";
import { ANIMATIONS, ANIMATION_IDS, isAnimation } from "./registry";

describe("sampleArr", () => {
  it("returns the single value for length-1 arrays", () => {
    expect(sampleArr([5], 0)).toBe(5);
    expect(sampleArr([5], 0.5)).toBe(5);
  });

  it("lerps between two keyframes", () => {
    expect(sampleArr([0, 10], 0)).toBe(0);
    expect(sampleArr([0, 10], 0.5)).toBe(5);
    expect(sampleArr([0, 10], 1)).toBe(10);
  });

  it("lerps across multiple keyframes", () => {
    expect(sampleArr([0, 10, 0], 0)).toBe(0);
    expect(sampleArr([0, 10, 0], 0.25)).toBe(5);
    expect(sampleArr([0, 10, 0], 0.5)).toBe(10);
    expect(sampleArr([0, 10, 0], 0.75)).toBe(5);
    expect(sampleArr([0, 10, 0], 1)).toBe(0);
  });

  it("clamps past the end", () => {
    expect(sampleArr([0, 10], 1.5)).toBe(10);
  });
});

describe("toTransform", () => {
  it("emits translate when x or y non-zero", () => {
    const t = toTransform({ rotate: 0, x: 3, y: -2, sx: 1, sy: 1 }, [0, 0]);
    expect(t).toContain("translate(3 -2)");
    expect(t).not.toContain("rotate");
    expect(t).not.toContain("scale");
  });

  it("emits rotate with pivot", () => {
    const t = toTransform({ rotate: 12, x: 0, y: 0, sx: 1, sy: 1 }, [10, 20]);
    expect(t).toBe("rotate(12 10 20)");
  });

  it("emits scale around pivot", () => {
    const t = toTransform({ rotate: 0, x: 0, y: 0, sx: 1.1, sy: 0.9 }, [5, 5]);
    expect(t).toContain("translate(5 5) scale(1.1 0.9) translate(-5 -5)");
  });

  it("emits nothing for identity", () => {
    expect(toTransform({ rotate: 0, x: 0, y: 0, sx: 1, sy: 1 }, [0, 0])).toBe("");
  });
});

describe("AnimationDriver", () => {
  it("clears transforms when animation becomes null", () => {
    const calls: string[] = [];
    const fakeEl = {
      setAttribute: (name: string, value: string) => {
        if (value === "") calls.push(`clear:${name}`);
      },
      removeAttribute: (name: string) => calls.push(`remove:${name}`),
    } as unknown as SVGElement;
    const map = new Map<string, SVGElement>();
    map.set("body", fakeEl);
    const driver = new AnimationDriver({ getPivot: () => [0, 0] });
    driver.bind(map);
    driver.setAnimation("idle", 0.5);
    driver.setAnimation(null, 0.5);
    expect(calls.some((c) => c.startsWith("remove:transform"))).toBe(true);
  });
});

describe("ANIMATIONS registry", () => {
  it("defines all 7 behavior animations", () => {
    for (const id of ["idle", "walk", "jump", "spin", "yawn", "sleep", "snore"]) {
      expect(isAnimation(id)).toBe(true);
      expect(ANIMATION_IDS).toContain(id);
    }
    expect(ANIMATION_IDS).toHaveLength(7);
  });

  it("jump and spin target the root part", () => {
    expect(ANIMATIONS.jump.__root__).toBeDefined();
    expect(ANIMATIONS.spin.__root__).toBeDefined();
  });
});
