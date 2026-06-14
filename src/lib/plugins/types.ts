import { PetKind } from "../types";

// ---- Animation (internal — used by registry & engine) ----

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

// ---- Action (internal — used by registry & engine) ----

export interface ActionContext {
  targetX?: number;
  targetY?: number;
  description: string;
  params?: Record<string, unknown>;
}

export interface ActionRegistration {
  type: string;
  animation: string;
  duration: number;
  interruptible: boolean;
  movement?: boolean;
  execute?: (ctx: ActionContext) => Promise<void>;
}

// ---- Action Definition (public — merged action + animation for plugins) ----

export interface ActionDefinition {
  type: string;
  duration: number;
  interruptible: boolean;
  movement?: boolean;
  execute?: (ctx: ActionContext) => Promise<void>;
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
}

// ---- AI Decision ----

export interface AIDecision {
  thought: string;
  emotion: {
    primary: string;
    energy: number;
    mood: string;
  };
  action: {
    type: string;
    params?: Record<string, unknown>;
    description: string;
  };
  speech: string | null;
}

// ---- Behavior Context (passed to AI) ----

export interface BehaviorContext {
  currentEmotion: string;
  currentEnergy: number;
  lastAction: string | null;
  lastSpeech: string | null;
  position: { x: number; y: number };
  screenWidth: number;
  screenHeight: number;
  pet: PetKind;
  petName: string;
  timeSinceLastAction: number;
  decisionHistory: string[];
}

// ---- Plugin Interface ----

export interface PetPlugin {
  id: string;
  augmentSystemPrompt?: (base: string) => string;
  actionDefinitions?: ActionDefinition[];
  emotions?: EmotionRegistration[];
}
