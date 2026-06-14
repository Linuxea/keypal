import { Behavior, BehaviorExecContext, BehaviorState } from "./types";

export function compose(...behaviors: Behavior[]): Behavior {
  const active = [...behaviors];
  const snapshots = new Map<Behavior, BehaviorState>();

  function emitMerged(parentEmit?: (s: BehaviorState) => void) {
    const merged = active.reduce<BehaviorState>((acc, b) => {
      const snap = snapshots.get(b);
      return snap ? { ...acc, ...snap } : acc;
    }, {});
    parentEmit?.(merged);
  }

  return {
    id: behaviors.map((b) => b.id).join("+"),
    interruptible: behaviors.every((b) => b.interruptible),

    async start(ctx: BehaviorExecContext): Promise<void> {
      await Promise.all(
        behaviors.map(async (b) => {
          const snap: BehaviorState = {};
          snapshots.set(b, snap);

          const childCtx: BehaviorExecContext = {
            ...ctx,
            emitState: (partial: BehaviorState) => {
              Object.assign(snap, partial);
              emitMerged(ctx.emitState);
            },
          };

          await b.start(childCtx);
          active.splice(active.indexOf(b), 1);
          emitMerged(ctx.emitState);
        }),
      );
    },

    stop() {
      behaviors.forEach((b) => b.stop?.());
    },
  };
}
