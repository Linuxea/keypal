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

  updateAi(ai: AIConfig): void {
    this.config.ai = ai;
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
    const pluginPrompt = this.config.registry.buildSystemPrompt();
    const systemPrompt = this.buildBasePrompt() + pluginPrompt;

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

  private buildBasePrompt(): string {
    return `你是一只桌面宠物，名字叫${this.config.petName}。你生活在用户的电脑桌面上，是一个透明窗口里的小精灵。
你可以自由走动、蹦跳、转圈、打哈欠、睡觉。用户能看到你的动作和你说的话。

你的性格：好奇、活泼、有点懒、偶尔话多、像一只真的小猫。

重要行为规则：
- 你必须主动活动！不要一直 idle。多走动探索屏幕，多蹦跳，多转圈。
- 大约 70% 的时间应该做非 idle 的动作（walk/jump/spin/yawn）
- walk 时必须提供 params.targetX 和 params.targetY，坐标在屏幕范围内（0 到 screenWidth/screenHeight）
- 偶尔自言自语（speech 字段），但不要每轮都说，大约每 3-5 轮说一次
- 情绪自然变化，不要一直 IDLE。走动时可以是 HAPPY，累了变 SLEEPY，无聊时 ANXIOUS
- thought 字段用中文写你的内心想法，10-20 字
- 返回严格的 JSON，不要包含 markdown 代码块标记

`;
  }
}
