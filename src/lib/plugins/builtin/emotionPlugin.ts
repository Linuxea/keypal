import { PetPlugin } from "../types";
import { allEmotions } from "../../emotions";

export const emotionPlugin: PetPlugin = {
  id: "emotion-core",

  emotions: allEmotions,

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 情绪系统
可用情绪：IDLE（待机）、HAPPY（开心）、FOCUSED（专注）、ANXIOUS（焦虑）、SLEEPY（困倦）
每种情绪对应不同的色调和默认能量值。
- IDLE: 平静，能量 0.5
- HAPPY: 开心，能量 0.9
- FOCUSED: 专注，能量 0.7
- ANXIOUS: 焦虑，能量 0.85
- SLEEPY: 困倦，能量 0.2

根据当前上下文和历史，自然演变情绪。情绪可以渐变，不需要每次大跳变。
energy 值影响动画速度（0.2=很慢，1.0=很快）。`
    );
  },
};
