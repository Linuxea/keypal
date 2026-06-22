import { BehaviorFactory } from "../plugins/types";

export const walkFactory: BehaviorFactory = {
  id: "walk",
  requiresParams: "targetX (0到screenWidth), targetY (0到screenHeight)",
  create(params?) {
    const targetX = params?.targetX as number;
    const targetY = params?.targetY as number;

    return {
      id: "walk",
      interruptible: true,
      start: (ctx) => {
        const flipX = typeof targetX === "number" ? targetX < ctx.position.x : false;
        ctx.emitState?.({ animation: "walk", energy: 0.7, flipX });
        return new Promise<void>((resolve) => {
          if (ctx.moveTo && typeof targetX === "number" && typeof targetY === "number") {
            ctx.moveTo(targetX, targetY, resolve);
          } else {
            setTimeout(resolve, 3000);
          }
        });
      },
    };
  },
};
