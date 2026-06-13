import { PetKind } from "../types";

// ---- Animation ----

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

// ---- Action ----

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

// ---- Plugin Context (passed to plugins on load) ----

export interface PluginContext {
  registry: PluginRegistryLike;
}

// ---- Plugin Interface ----

export interface PetPlugin {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];

  onLoad?: (ctx: PluginContext) => Promise<void>;
  onUnload?: () => Promise<void>;

  augmentSystemPrompt?: (base: string) => string;
  augmentContext?: (ctx: BehaviorContext) => BehaviorContext;
  onDecision?: (decision: AIDecision) => AIDecision | null;

  animations?: AnimationRegistration[];
  actions?: ActionRegistration[];
  emotions?: EmotionRegistration[];
}

// ---- Registry Interface (for PluginContext) ----

export interface PluginRegistryLike {
  getAnimation(name: string): AnimationRegistration | undefined;
  getAction(type: string): ActionRegistration | undefined;
  getEmotion(name: string): EmotionRegistration | undefined;
  getAllAnimations(): AnimationRegistration[];
  getAllActions(): ActionRegistration[];
  getAllEmotions(): EmotionRegistration[];
  buildSystemPrompt(): string;
  buildContext(base: BehaviorContext): BehaviorContext;
  executeDecision(decision: AIDecision): Promise<void>;
}
