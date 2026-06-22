import { BehaviorFactory } from "../plugins/types";

export const jumpFactory: BehaviorFactory = {
  id: "jump",
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
