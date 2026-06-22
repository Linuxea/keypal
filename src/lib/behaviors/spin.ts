import { BehaviorFactory } from "../plugins/types";

export const spinFactory: BehaviorFactory = {
  id: "spin",
  create() {
    return {
      id: "spin",
      interruptible: true,
      start: (ctx) => {
        ctx.emitState?.({ animation: "spin", energy: 0.7 });
        return new Promise<void>((r) => setTimeout(r, 2000));
      },
    };
  },
};
