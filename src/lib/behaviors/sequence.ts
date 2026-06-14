import { Behavior, BehaviorExecContext } from "./types";

export function sequence(...behaviors: Behavior[]): Behavior {
  return {
    id: behaviors.map((b) => b.id).join("→"),
    interruptible: behaviors.every((b) => b.interruptible),

    async start(ctx: BehaviorExecContext): Promise<void> {
      for (const b of behaviors) {
        await b.start(ctx);
      }
    },

    stop() {
      behaviors.forEach((b) => b.stop?.());
    },
  };
}
