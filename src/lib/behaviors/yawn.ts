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
      start: (ctx) => {
        ctx.emitState?.({ animation: "yawn", energy: 0.3 });
        return new Promise<void>((r) => setTimeout(r, 2500));
      },
    };
  },
};
