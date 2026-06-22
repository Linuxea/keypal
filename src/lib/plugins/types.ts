import { PetKind } from "../types";
import { Behavior } from "../behaviors/types";

// ---- Behavior Factory (used by plugins — behavior atoms) ----

export interface BehaviorFactory {
  id: string;
  requiresParams?: string;
  create(params?: Record<string, unknown>): Behavior;
}

// ---- Emotion ----

export interface EmotionRegistration {
  name: string;
  tint: string;
  defaultEnergy: number;
}

// ---- AI Decision ----

export interface AIDecision {
  thought: string;
  behaviorId: string;
  params?: Record<string, unknown>;
}

// ---- Behavior Context (passed to AI) ----

export interface BehaviorContext {
  currentBehavior: string | null;
  position: { x: number; y: number };
  screenWidth: number;
  screenHeight: number;
  pet: PetKind;
  petName: string;
  decisionHistory: string[];
  energy: number;
  tickCount: number;
}

// ---- Plugin Interface ----

export interface PetPlugin {
  id: string;
  behaviors?: BehaviorFactory[];
  emotions?: EmotionRegistration[];
  speechPool?: string[];
  augmentSystemPrompt?: (base: string) => string;
}
