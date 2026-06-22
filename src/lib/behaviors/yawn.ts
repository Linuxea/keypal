import { BehaviorFactory } from "../plugins/types";

export const yawnFactory: BehaviorFactory = {
  id: "yawn",
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
