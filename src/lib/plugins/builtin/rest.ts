import { PetPlugin } from "../types";
import { yawnFactory } from "../../behaviors/yawn";
import { sleepFactory } from "../../behaviors/sleep";
import { snoreFactory } from "../../behaviors/snore";

export const restPlugin: PetPlugin = {
  id: "rest",

  behaviors: [yawnFactory, sleepFactory, snoreFactory],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 休息行为
- yawn: 打哈欠（2.5秒）
- sleep: 睡觉（5秒，不可打断）
- snore: 打呼噜（6秒，不可打断，深度睡眠）

每 2-3 tick 至少选一次休息行为。energy < 0.3 时优先选 snore 或 sleep；energy < 0.5 时选 yawn。
snore 是最自然的深度休息——玩累了打呼噜才像真正的宠物。`
    );
  },
};
