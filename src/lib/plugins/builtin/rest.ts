import { PetPlugin } from "../types";
import { yawnFactory } from "../../behaviors/yawn";
import { sleepFactory } from "../../behaviors/sleep";

export const restPlugin: PetPlugin = {
  id: "rest",

  behaviors: [yawnFactory, sleepFactory],

  speechPool: ["好困啊...", "让我再睡一会儿...", "哈欠~想睡了"],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 休息行为
- yawn: 打哈欠（2.5秒）
- sleep: 睡觉（5秒，不可打断）

累了或晚上可以选这些行为。`
    );
  },
};
