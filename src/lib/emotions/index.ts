import { EmotionRegistration } from "../plugins/types";

export const idleEmotion: EmotionRegistration = {
  name: "IDLE",
  tint: "transparent",
  defaultEnergy: 0.5,
};

export const happyEmotion: EmotionRegistration = {
  name: "HAPPY",
  tint: "#fff7a8",
  defaultEnergy: 0.9,
};

export const focusedEmotion: EmotionRegistration = {
  name: "FOCUSED",
  tint: "#a8d8ff",
  defaultEnergy: 0.7,
};

export const anxiousEmotion: EmotionRegistration = {
  name: "ANXIOUS",
  tint: "#ffb3b3",
  defaultEnergy: 0.85,
};

export const sleepyEmotion: EmotionRegistration = {
  name: "SLEEPY",
  tint: "#c9c9e0",
  defaultEnergy: 0.2,
};

export const allEmotions: EmotionRegistration[] = [
  idleEmotion,
  happyEmotion,
  focusedEmotion,
  anxiousEmotion,
  sleepyEmotion,
];
