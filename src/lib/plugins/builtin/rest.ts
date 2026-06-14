import { PetPlugin } from "../types";
import { yawnFactory } from "../../behaviors/yawn";
import { sleepFactory } from "../../behaviors/sleep";
import { snoreFactory } from "../../behaviors/snore";

export const restPlugin: PetPlugin = {
  id: "rest",

  behaviors: [yawnFactory, sleepFactory, snoreFactory],

  speechPool: [
    "好困啊...",
    "让我再睡一会儿...",
    "哈欠~想睡了",
    "呼噜噜...",
    "zzz...",
    "呼~哧~",
  ],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 休息行为
- yawn: 打哈欠（2.5秒）
- sleep: 睡觉（5秒，不可打断）
- snore: 打呼噜（6秒，不可打断，深度睡眠）

累了或晚上可以选这些行为。很困时可以选 snore。`
    );
  },
};
