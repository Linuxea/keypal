import { walkDefinition } from "../actions/walk";
import { BehaviorFactory } from "../plugins/types";

export const walkFactory: BehaviorFactory = {
  id: "walk",
  animation: {
    frameCount: walkDefinition.frameCount,
    draw: walkDefinition.draw,
  },
  requiresParams: "targetX (0到screenWidth), targetY (0到screenHeight)",
  create(params?) {
    const targetX = params?.targetX as number;
    const targetY = params?.targetY as number;
    let flipX = false;

    return {
      id: "walk",
      interruptible: true,
      getState: () => ({
        animation: "walk",
        emotion: "HAPPY",
        energy: 0.7,
        flipX,
      }),
      start: (ctx) => {
        if (typeof targetX === "number") {
          flipX = targetX < ctx.position.x;
        }
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
