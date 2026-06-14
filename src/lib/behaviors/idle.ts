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
      getState: () => ({ animation: "idle", emotion: "IDLE", energy: 0.5 }),
      start: () => new Promise<void>((r) => setTimeout(r, 3000)),
    };
  },
};
