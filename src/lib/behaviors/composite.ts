import { Behavior, BehaviorExecContext, BehaviorState } from "./types";

export function compose(...behaviors: Behavior[]): Behavior {
  const active = [...behaviors];

  return {
    id: behaviors.map((b) => b.id).join("+"),
    interruptible: behaviors.every((b) => b.interruptible),

    getState(): BehaviorState {
      return active.reduce<BehaviorState>(
        (acc, b) => ({ ...acc, ...b.getState() }),
        {},
      );
    },

    start(ctx: BehaviorExecContext): Promise<void> {
      return Promise.all(
        behaviors.map(async (b) => {
          await b.start(ctx);
          const idx = active.indexOf(b);
          if (idx >= 0) active.splice(idx, 1);
        }),
      ).then(() => {});
    },

    stop() {
      behaviors.forEach((b) => b.stop?.());
    },
  };
}
