import { Behavior } from "./types";
import { BehaviorFactory } from "../plugins/types";

export function createSpeak(text: string, durationMs = 4000): Behavior {
  return {
    id: "speak",
    interruptible: true,
    getState: () => ({ speech: text }),
    start: () => new Promise<void>((r) => setTimeout(r, durationMs)),
  };
}

export const speakFactory: BehaviorFactory = {
  id: "speak",
  create(params?) {
    const text = (params?.text as string) ?? "...";
    return createSpeak(text);
  },
};
