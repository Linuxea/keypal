import { PetPlugin } from "../types";

export const emotionPlugin: PetPlugin = {
  id: "emotion-core",
  name: "情绪系统",
  version: "1.0.0",

  emotions: [
    { name: "IDLE", tint: "transparent", defaultEnergy: 0.5 },
    { name: "HAPPY", tint: "#fff7a8", defaultEnergy: 0.9 },
    { name: "FOCUSED", tint: "#a8d8ff", defaultEnergy: 0.7 },
    { name: "ANXIOUS", tint: "#ffb3b3", defaultEnergy: 0.85 },
    { name: "SLEEPY", tint: "#c9c9e0", defaultEnergy: 0.2 },
  ],

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
