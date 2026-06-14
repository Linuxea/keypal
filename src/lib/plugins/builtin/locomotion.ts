import { PetPlugin } from "../types";
import { idleFactory } from "../../behaviors/idle";
import { walkFactory } from "../../behaviors/walk";
import { jumpFactory } from "../../behaviors/jump";
import { spinFactory } from "../../behaviors/spin";

export const locomotionPlugin: PetPlugin = {
  id: "locomotion",

  behaviors: [idleFactory, walkFactory, jumpFactory, spinFactory],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 移动行为
- idle: 待机（3秒）
- walk: 走路，需要 params: { targetX, targetY }
- jump: 蹦跳（1.5秒）
- spin: 转圈（2秒）

walk 时必须在屏幕范围内选坐标。大约一半时间保持活跃，另一半可以休息。`
    );
  },
};
