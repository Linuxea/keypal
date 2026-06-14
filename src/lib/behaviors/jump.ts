import { BehaviorFactory } from "../plugins/types";
import { jumpDefinition } from "../actions/jump";

export const jumpFactory: BehaviorFactory = {
  id: "jump",
  animation: {
    frameCount: jumpDefinition.frameCount,
    tint: jumpDefinition.tint,
    draw: jumpDefinition.draw,
  },
  create() {
    return {
      id: "jump",
      interruptible: true,
      start: (ctx) => {
        ctx.emitState?.({ animation: "jump", energy: 0.9 });
        return new Promise<void>((r) => setTimeout(r, 1500));
      },
    };
  },
};
