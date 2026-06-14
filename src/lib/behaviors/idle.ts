import { idleDefinition } from "../actions/idle";
import { BehaviorFactory } from "../plugins/types";

export const idleFactory: BehaviorFactory = {
  id: "idle",
  animation: {
    frameCount: idleDefinition.frameCount,
    draw: idleDefinition.draw,
  },
  create() {
    return {
      id: "idle",
      interruptible: true,
      start: (ctx) => {
        ctx.emitState?.({ animation: "idle", energy: 0.5 });
        return new Promise<void>((r) => setTimeout(r, 3000));
      },
    };
  },
};
