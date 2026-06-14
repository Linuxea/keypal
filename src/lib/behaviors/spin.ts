import { BehaviorFactory } from "../plugins/types";
import { spinDefinition } from "../actions/spin";

export const spinFactory: BehaviorFactory = {
  id: "spin",
  animation: {
    frameCount: spinDefinition.frameCount,
    tint: spinDefinition.tint,
    draw: spinDefinition.draw,
  },
  create() {
    return {
      id: "spin",
      interruptible: true,
      getState: () => ({ animation: "spin", emotion: "FOCUSED", energy: 0.7 }),
      start: () => new Promise<void>((r) => setTimeout(r, 2000)),
    };
  },
};
