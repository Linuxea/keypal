import { EmotionRegistration } from "../plugins/types";

export const idleEmotion: EmotionRegistration = {
  name: "IDLE",
  tint: "transparent",
  defaultEnergy: 0.5,
};

export const happyEmotion: EmotionRegistration = {
  name: "HAPPY",
  tint: "#fffbe6",
  defaultEnergy: 0.9,
};

export const focusedEmotion: EmotionRegistration = {
  name: "FOCUSED",
  tint: "#e6f4ff",
  defaultEnergy: 0.7,
};

export const anxiousEmotion: EmotionRegistration = {
  name: "ANXIOUS",
  tint: "#ffe6e6",
  defaultEnergy: 0.85,
};

export const sleepyEmotion: EmotionRegistration = {
  name: "SLEEPY",
  tint: "#e8e8f0",
  defaultEnergy: 0.2,
};

export const allEmotions: EmotionRegistration[] = [
  idleEmotion,
  happyEmotion,
  focusedEmotion,
  anxiousEmotion,
  sleepyEmotion,
];
