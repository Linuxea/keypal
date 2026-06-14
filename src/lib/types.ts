export type PetKind = "cat" | "dog" | "frog" | "chick";

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

export const PET_SIZE_OPTIONS = [64, 96, 128] as const;
export type PetSize = (typeof PET_SIZE_OPTIONS)[number];

export const INTERVAL_OPTIONS = [5, 10, 30] as const;
export type IntervalSec = (typeof INTERVAL_OPTIONS)[number];

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  intervalSec: IntervalSec;
  maxTokens: number;
  temperature: number;
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
    intervalSec: 5,
    maxTokens: 300,
    temperature: 0.8,
  },
};

export const SPEECH_BUBBLE_HEIGHT = 100;
export const WINDOW_PADDING = 32;
export const MIN_WINDOW_WIDTH = 300;

export function windowSizeForPet(petSize: PetSize): { width: number; height: number } {
  return {
    width: Math.max(petSize + WINDOW_PADDING, MIN_WINDOW_WIDTH),
    height: petSize + WINDOW_PADDING + SPEECH_BUBBLE_HEIGHT,
  };
}
