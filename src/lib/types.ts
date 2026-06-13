export type PetKind = "cat" | "dog" | "frog" | "chick";

export type MoodState = "IDLE" | "HAPPY" | "FOCUSED" | "ANXIOUS" | "SLEEPY";

export const PET_KINDS: PetKind[] = ["cat", "dog", "frog", "chick"];

export const PET_LABELS: Record<PetKind, string> = {
  cat: "猫",
  dog: "狗",
  frog: "蛙",
  chick: "鸡",
};

export const PET_EMOJI: Record<PetKind, string> = {
  cat: "🐱",
  dog: "🐶",
  frog: "🐸",
  chick: "🐔",
};

export const MOOD_STATES: MoodState[] = [
  "IDLE",
  "HAPPY",
  "FOCUSED",
  "ANXIOUS",
  "SLEEPY",
];

export const MOOD_LABELS: Record<MoodState, string> = {
  IDLE: "待机",
  HAPPY: "开心",
  FOCUSED: "专注",
  ANXIOUS: "焦虑",
  SLEEPY: "困倦",
};

export const PET_SIZE_OPTIONS = [64, 96, 128] as const;
export type PetSize = (typeof PET_SIZE_OPTIONS)[number];

export const INTERVAL_OPTIONS = [15, 30, 60] as const;
export type IntervalSec = (typeof INTERVAL_OPTIONS)[number];

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  intervalSec: IntervalSec;
}

export interface AppConfig {
  pet: PetKind;
  petSize: PetSize;
  position: { x: number; y: number } | null;
  ai: AIConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  pet: "cat",
  petSize: 96,
  position: null,
  ai: {
    baseUrl: "https://api.deepseek.com",
    apiKey: "",
    model: "deepseek-chat",
    intervalSec: 30,
  },
};

export const SPRITE_FRAME_WIDTH = 32;
export const SPRITE_FRAME_HEIGHT = 32;
export const FRAMES_PER_STATE = 4;
export const STATE_COUNT = 5;
export const SPRITE_TOTAL_FRAMES = STATE_COUNT * FRAMES_PER_STATE;
export const SPRITE_SHEET_WIDTH = SPRITE_TOTAL_FRAMES * SPRITE_FRAME_WIDTH;
export const SPRITE_SHEET_HEIGHT = SPRITE_FRAME_HEIGHT;

export const MOOD_FRAME_OFFSET: Record<MoodState, number> = {
  IDLE: 0,
  HAPPY: 4,
  FOCUSED: 8,
  ANXIOUS: 12,
  SLEEPY: 16,
};

export interface MoodStateSnapshot {
  current: MoodState;
  energy: number;
  since: number;
}
