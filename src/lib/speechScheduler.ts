import { Behavior } from "./behaviors/types";
import { BehaviorExecutor } from "./behaviorExecutor";

export class SpeechScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private threshold: number;
  private intervalMs: number;
  private speechPool: string[];
  private executor: BehaviorExecutor;
  private createSpeak: (text: string) => Behavior;

  constructor(opts: {
    intervalMs: number;
    speechPool: string[];
    executor: BehaviorExecutor;
    createSpeak: (text: string) => Behavior;
  }) {
    this.intervalMs = opts.intervalMs;
    this.speechPool = opts.speechPool;
    this.executor = opts.executor;
    this.createSpeak = opts.createSpeak;
    this.threshold = this.randomThreshold();
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    this.tickCount++;
    if (this.tickCount >= this.threshold && this.speechPool.length > 0) {
      this.tickCount = 0;
      this.threshold = this.randomThreshold();
      const text = this.speechPool[Math.floor(Math.random() * this.speechPool.length)];
      this.executor.enqueueOverlay(this.createSpeak(text));
    }
  }

  private randomThreshold(): number {
    return 3 + Math.floor(Math.random() * 3);
  }
}
