import { BehaviorFactory } from "../plugins/types";

export const sleepFactory: BehaviorFactory = {
  id: "sleep",
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
