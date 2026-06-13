import { AIConfig } from "./types";
import { decideBehavior } from "./aiClient";
import { PluginRegistry } from "./plugins/registry";
import { AIDecision, BehaviorContext } from "./plugins/types";
import { appendLogRaw } from "./log";

export interface BrainConfig {
  ai: AIConfig;
  registry: PluginRegistry;
  intervalMs: number;
  petName: string;
}

export type BrainCallback = (decision: AIDecision) => void;

export class BrainEngine {
  private config: BrainConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private currentEmotion = "IDLE";
  private currentEnergy = 0.5;
  private lastAction: string | null = null;
  private lastSpeech: string | null = null;
  private lastDecisionTime = 0;
  private decisionHistory: string[] = [];
  private position = { x: 500, y: 500 };
  private screenWidth = 1920;
  private screenHeight = 1080;
  private callback: BrainCallback | null = null;
  private running = false;

  constructor(config: BrainConfig) {
    this.config = config;
  }

  setPosition(x: number, y: number): void {
    this.position = { x, y };
  }

  setScreenSize(w: number, h: number): void {
    this.screenWidth = w;
    this.screenHeight = h;
  }

  onDecision(cb: BrainCallback): void {
    this.callback = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.tick();
      this.scheduleNext();
    }, this.config.intervalMs);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    const now = Date.now();
    const timeSinceLastAction = this.lastDecisionTime
      ? now - this.lastDecisionTime
      : this.config.intervalMs;

    const baseContext: BehaviorContext = {
      currentEmotion: this.currentEmotion,
      currentEnergy: this.currentEnergy,
      lastAction: this.lastAction,
      lastSpeech: this.lastSpeech,
      position: this.position,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      pet: "cat",
      petName: this.config.petName,
      timeSinceLastAction,
      decisionHistory: this.decisionHistory.slice(-10),
    };

    const context = this.config.registry.buildContext(baseContext);
    const systemPrompt = this.config.registry.buildSystemPrompt();

    try {
      const decision = await decideBehavior(
        this.config.ai,
        systemPrompt,
        context,
      );

      this.lastDecisionTime = now;
      this.currentEmotion = decision.emotion.primary;
      this.currentEnergy = decision.emotion.energy;
      this.lastAction = decision.action.type;
      this.lastSpeech = decision.speech;
      this.decisionHistory.push(decision.thought);
      if (this.decisionHistory.length > 50) {
        this.decisionHistory = this.decisionHistory.slice(-50);
      }

      await appendLogRaw(
        `[brain] ${decision.emotion.primary} e=${decision.emotion.energy.toFixed(2)} ` +
        `action=${decision.action.type} speech=${decision.speech ?? "-"} | ${decision.thought}`,
      );

      await this.config.registry.executeDecision(decision);
      this.callback?.(decision);
    } catch (err) {
      console.warn("[brain] decision failed:", err);
      await appendLogRaw(`[brain] error: ${(err as Error).message}`);
    }
  }

  getCurrentEmotion(): string {
    return this.currentEmotion;
  }

  getCurrentEnergy(): number {
    return this.currentEnergy;
  }
}
