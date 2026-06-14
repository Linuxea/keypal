import { PetPlugin } from "../types";
import { idleDefinition } from "../../actions/idle";
import { walkDefinition } from "../../actions/walk";
import { jumpDefinition } from "../../actions/jump";
import { spinDefinition } from "../../actions/spin";

export const locomotionPlugin: PetPlugin = {
  id: "locomotion",
  name: "移动系统",
  version: "1.0.0",

  actionDefinitions: [idleDefinition, walkDefinition, jumpDefinition, spinDefinition],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 移动系统
可用动作：
- idle: 待机（原地发呆，3秒），可打断
- walk: 走路（移动到目标坐标，需要 params.targetX 和 params.targetY），可打断
- jump: 蹦跳（原地跳跃，1.5秒），可打断
- spin: 转圈（原地旋转，2秒），可打断

walk 动作必须提供 params: { targetX: number, targetY: number }，坐标在屏幕范围内（0 到 screenWidth/screenHeight）。
选择动作时考虑当前情绪：HAPPY 倾向 jump/spin，IDLE 倾向 walk/idle。`
    );
  },
};
