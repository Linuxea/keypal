import { PetKind } from "../types";
import { Behavior } from "../behaviors/types";

// ---- Animation (internal — used by engine) ----

export interface AnimationRegistration {
  name: string;
  frameCount: number;
  tint?: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    pet: PetKind,
    frameInAnim: number,
    palette: PetPalette,
  ) => void;
}

// ---- Action Definition (used by actions/*.ts — animation atoms) ----

export interface ActionDefinition {
  type: string;
  duration: number;
  interruptible: boolean;
  movement?: boolean;
  frameCount: number;
  tint?: string;
  draw: AnimationRegistration["draw"];
}

// ---- Behavior Factory (used by plugins — behavior atoms) ----

export interface BehaviorFactory {
  id: string;
  animation?: {
    frameCount: number;
    tint?: string;
    draw: AnimationRegistration["draw"];
  };
  requiresParams?: string;
  create(params?: Record<string, unknown>): Behavior;
}

// ---- Emotion ----

export interface EmotionRegistration {
  name: string;
  tint: string;
  defaultEnergy: number;
}

// ---- Palette ----

export interface PetPalette {
  body: string;
  accent: string;
  dark: string;
  outline: string;
  highlight: string;
  shadow: string;
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
}

// ---- Plugin Interface ----

export interface PetPlugin {
  id: string;
  behaviors?: BehaviorFactory[];
  emotions?: EmotionRegistration[];
  speechPool?: string[];
  augmentSystemPrompt?: (base: string) => string;
}
