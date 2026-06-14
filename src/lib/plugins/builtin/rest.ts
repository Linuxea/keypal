import { PetPlugin } from "../types";
import { yawnDefinition } from "../../actions/yawn";
import { sleepDefinition } from "../../actions/sleep";

export const restPlugin: PetPlugin = {
  id: "rest",
  name: "休息系统",
  version: "1.0.0",

  actionDefinitions: [yawnDefinition, sleepDefinition],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 休息系统
可用动作：
- yawn: 打哈欠（2.5秒），可打断
- sleep: 睡觉（5秒），不可打断

选择动作时考虑当前情绪：SLEEPY 倾向 yawn/sleep。`
    );
  },
};
