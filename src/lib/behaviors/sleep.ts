import { BehaviorFactory } from "../plugins/types";
import { sleepDefinition } from "../actions/sleep";

export const sleepFactory: BehaviorFactory = {
  id: "sleep",
  animation: {
    frameCount: sleepDefinition.frameCount,
    tint: sleepDefinition.tint,
    draw: sleepDefinition.draw,
  },
  create() {
    return {
      id: "sleep",
      interruptible: false,
      start: (ctx) => {
        ctx.emitState?.({ animation: "sleep", energy: 0.2 });
        return new Promise<void>((r) => setTimeout(r, 5000));
      },
    };
  },
};
