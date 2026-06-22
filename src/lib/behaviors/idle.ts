import { BehaviorFactory } from "../plugins/types";

export const idleFactory: BehaviorFactory = {
  id: "idle",
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
