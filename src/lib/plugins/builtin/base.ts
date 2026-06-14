import { PetPlugin } from "../types";
import { allEmotions } from "../../emotions";

export const basePlugin: PetPlugin = {
  id: "base",

  emotions: allEmotions,

  speechPool: [
    "嗯...在想什么呢",
    "今天天气不错呀",
    "陪我说说话嘛",
    "哼，不理你了",
    "嘿嘿嘿~",
    "好无聊啊...",
    "你在干什么呀",
    "想出去玩...",
  ],

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
