import { BehaviorFactory } from "../plugins/types";

export const snoreFactory: BehaviorFactory = {
  id: "snore",
  create() {
    return {
      id: "snore",
      interruptible: false,
      start: (ctx) => {
        ctx.emitState?.({ animation: "snore", energy: 0.1 });
        return new Promise<void>((r) => setTimeout(r, 6000));
      },
    };
  },
};
