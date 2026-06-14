import { BehaviorFactory } from "../plugins/types";
import { yawnDefinition } from "../actions/yawn";

export const yawnFactory: BehaviorFactory = {
  id: "yawn",
  animation: {
    frameCount: yawnDefinition.frameCount,
    tint: yawnDefinition.tint,
    draw: yawnDefinition.draw,
  },
  create() {
    return {
      id: "yawn",
      interruptible: true,
      getState: () => ({ animation: "yawn", emotion: "SLEEPY", energy: 0.3 }),
      start: () => new Promise<void>((r) => setTimeout(r, 2500)),
    };
  },
};
