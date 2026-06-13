import { PetPlugin } from "../types";

export const actionPlugin: PetPlugin = {
  id: "action-core",
  name: "基础动作系统",
  version: "1.0.0",
  dependencies: ["emotion-core"],

  animations: [
    { name: "idle", frameCount: 4, draw: () => {} },
    { name: "walk", frameCount: 4, draw: () => {} },
    { name: "jump", frameCount: 4, draw: () => {} },
    { name: "spin", frameCount: 4, draw: () => {} },
    { name: "yawn", frameCount: 4, draw: () => {} },
    { name: "sleep", frameCount: 4, draw: () => {} },
  ],

  actions: [
    { type: "idle", animation: "idle", duration: 3000, interruptible: true },
    { type: "walk", animation: "walk", duration: 0, interruptible: true },
    { type: "jump", animation: "jump", duration: 1500, interruptible: true },
    { type: "spin", animation: "spin", duration: 2000, interruptible: true },
    { type: "yawn", animation: "yawn", duration: 2500, interruptible: true },
    { type: "sleep", animation: "sleep", duration: 5000, interruptible: false },
  ],

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 动作系统
可用动作：
- idle: 待机（原地发呆，3秒），可打断
- walk: 走路（移动到目标坐标，需要 params.targetX 和 params.targetY），可打断
- jump: 蹦跳（原地跳跃，1.5秒），可打断
- spin: 转圈（原地旋转，2秒），可打断
- yawn: 打哈欠（2.5秒），可打断
- sleep: 睡觉（5秒），不可打断

walk 动作必须提供 params: { targetX: number, targetY: number }，坐标在屏幕范围内（0 到 screenWidth/screenHeight）。
选择动作时考虑当前情绪：HAPPY 倾向 jump/spin，SLEEPY 倾向 yawn/sleep，IDLE 倾向 walk/idle。`
    );
  },
};
