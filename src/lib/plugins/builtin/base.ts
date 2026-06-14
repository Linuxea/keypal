import { PetPlugin } from "../types";
import { allEmotions } from "../../emotions";

export const basePlugin: PetPlugin = {
  id: "base",

  emotions: allEmotions,

  augmentSystemPrompt(base: string): string {
    return (
      base +
      `\n## 基础情绪
可用情绪：IDLE（待机）、HAPPY（开心）、FOCUSED（专注）、ANXIOUS（焦虑）、SLEEPY（困倦）
energy 值影响动画速度（0.2=很慢，1.0=很快）。
根据当前上下文和历史，自然演变情绪。`
    );
  },
};
