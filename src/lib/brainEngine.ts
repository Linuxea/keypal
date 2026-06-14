import { AIConfig, PetKind } from "./types";
import { decideBehavior } from "./aiClient";
import { PluginRegistry } from "./plugins/registry";
import { AIDecision, BehaviorContext } from "./plugins/types";
import { BehaviorExecutor } from "./behaviorExecutor";
import { log, logError } from "./log";

export interface BrainConfig {
  ai: AIConfig;
  registry: PluginRegistry;
  executor: BehaviorExecutor;
  intervalMs: number;
  petName: string;
  pet: PetKind;
}

export type BrainCallback = (decision: AIDecision) => void;

export class BrainEngine {
  private config: BrainConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private decisionHistory: string[] = [];
  private position = { x: 500, y: 500 };
  private screenWidth = 1920;
  private screenHeight = 1080;
  private callback: BrainCallback | null = null;
  private running = false;
  private tickCount = 0;

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
    this.tickCount++;
    const tick = this.tickCount;

    const baseContext: BehaviorContext = {
      currentBehavior: this.config.executor.getState().animation,
      position: this.position,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      pet: this.config.pet,
      petName: this.config.petName,
      decisionHistory: this.decisionHistory.slice(-10),
    };

    const pluginPrompt = this.config.registry.buildSystemPrompt();
    const systemPrompt = this.buildBasePrompt() + pluginPrompt;

    const t0 = Date.now();
    try {
      const decision = await decideBehavior(
        this.config.ai,
        systemPrompt,
        baseContext,
      );
      const latency = Date.now() - t0;

      this.decisionHistory.push(decision.thought);
      if (this.decisionHistory.length > 50) {
        this.decisionHistory = this.decisionHistory.slice(-50);
      }

      const behavior = this.config.registry.createBehavior(
        decision.behaviorId,
        decision.params,
      );

      const posStr = `pos=(${this.position.x},${this.position.y})`;
      const paramsStr = formatParamsForLog(decision.behaviorId, decision.params);
      const thoughtStr = `thought="${escapeForLog(decision.thought)}"`;

      if (behavior) {
        this.config.executor.enqueue(behavior);
        await log(
          "brain",
          `tick=${tick} decide behavior=${decision.behaviorId}${paramsStr ? ` ${paramsStr}` : ""} ${posStr} latency=${latency}ms ${thoughtStr}`,
        );
      } else {
        await log(
          "brain",
          `tick=${tick} decide behavior=${decision.behaviorId} UNKNOWN-not-in-registry ${posStr} latency=${latency}ms ${thoughtStr}`,
        );
      }

      this.callback?.(decision);
    } catch (err) {
      const latency = Date.now() - t0;
      const lastThought = this.decisionHistory[this.decisionHistory.length - 1];
      const posStr = `pos=(${this.position.x},${this.position.y})`;
      const lastStr = lastThought
        ? ` lastThought="${escapeForLog(lastThought)}"`
        : "";
      await logError(
        "brain",
        `error tick=${tick} ${posStr} latency=${latency}ms${lastStr} msg=${(err as Error).message}`,
        err,
      );
    }
  }

  private buildBasePrompt(): string {
    const behaviors = this.config.registry.getAllBehaviors();
    const behaviorList = behaviors
      .map((b) => {
        const params = b.requiresParams ? `（需要 ${b.requiresParams}）` : "";
        return `- ${b.id}${params}`;
      })
      .join("\n");

    return `你是一只桌面宠物，名字叫${this.config.petName}。你生活在用户的电脑桌面上。
你可以自由走动、蹦跳、转圈、打哈欠、睡觉。用户能看到你的动作，也能看到你说的话。

你的性格：对屏幕上的一切充满无限好奇心。你想探索每个角落、追问每件新鲜事，
像个永远问不完"为什么"的小孩，又像刚到新家到处嗅来嗅去的小猫。脑子里全是问号。

规则：
- 你必须主动活动！不要一直 idle。优先走动去探索还没到过的屏幕区域。
- walk 时必须提供 params: { targetX: 数字, targetY: 数字 }
  当前屏幕 ${this.screenWidth}x${this.screenHeight}，当前坐标 (${this.position.x}, ${this.position.y})
  例如 targetX: ${Math.floor(this.screenWidth * 0.3)}, targetY: ${Math.floor(this.screenHeight * 0.5)}
- 其他行为不需要 params
- thought 字段是你此刻脱口而出的话，会实时显示在气泡里给用户看。
  用中文，10-20 字，多用疑问句和惊叹，表达强烈的好奇。
  例："那边亮亮的是什么？""咦，这角落还没去过！""用户在敲什么呀？好想看"
  不要写无声的内心独白，要像在大声自言自语。
- behaviorId 只能从以下值选：${behaviors.map((b) => b.id).join(", ")}
- 返回严格的 JSON，不要 markdown 代码块标记

可选行为：
${behaviorList}

返回格式示例：
{"thought":"咦，那边是什么？过去看看","behaviorId":"walk","params":{"targetX":${Math.floor(this.screenWidth * 0.7)},"targetY":${Math.floor(this.screenHeight * 0.6)}}}
或
{"thought":"蹦一下能看更远！","behaviorId":"jump"}

`;
  }
}

function formatParamsForLog(
  behaviorId: string,
  params?: Record<string, unknown>,
): string {
  if (!params) return "";
  if (behaviorId === "walk") {
    const tx = params.targetX;
    const ty = params.targetY;
    if (typeof tx === "number" && typeof ty === "number") {
      return `target=(${tx},${ty})`;
    }
  }
  try {
    return `params=${JSON.stringify(params)}`;
  } catch {
    return "";
  }
}

function escapeForLog(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}
