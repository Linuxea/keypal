import { Behavior, BehaviorExecContext, BehaviorState } from "./behaviors/types";

export interface ExecutorState {
  animation: string;
  emotion: string;
  energy: number;
  speech: string | null;
  flipX: boolean;
}

type StateListener = (state: ExecutorState) => void;

export class BehaviorExecutor {
  private mainBehavior: Behavior | null = null;
  private overlayBehavior: Behavior | null = null;
  private mainQueue: Behavior[] = [];
  private ctx: BehaviorExecContext;
  private listener: StateListener | null = null;

  private state: ExecutorState = {
    animation: "idle",
    emotion: "IDLE",
    energy: 0.5,
    speech: null,
    flipX: false,
  };

  constructor(ctx: BehaviorExecContext) {
    this.ctx = ctx;
  }

  onStateChange(listener: StateListener): void {
    this.listener = listener;
  }

  getState(): ExecutorState {
    return { ...this.state };
  }

  enqueue(behavior: Behavior): void {
    if (this.mainBehavior?.interruptible) {
      this.stopMain();
      this.startMain(behavior);
    } else if (this.mainBehavior) {
      this.mainQueue.push(behavior);
    } else {
      this.startMain(behavior);
    }
  }

  enqueueOverlay(behavior: Behavior): void {
    if (this.overlayBehavior) {
      this.overlayBehavior.stop?.();
    }
    this.overlayBehavior = behavior;
    this.applyState(behavior.getState());
    behavior.start(this.ctx).then(() => {
      if (this.overlayBehavior === behavior) {
        this.overlayBehavior = null;
        this.state.speech = null;
        this.emit();
      }
    });
  }

  private async startMain(behavior: Behavior): Promise<void> {
    this.mainBehavior = behavior;
    this.applyBehaviorState(behavior);

    const startPromise = behavior.start(this.ctx);
    this.applyBehaviorState(behavior);

    await startPromise;

    if (this.mainBehavior === behavior) {
      this.mainBehavior = null;
      this.state.animation = "idle";
      this.emit();
      this.dequeueNext();
    }
  }

  private dequeueNext(): void {
    const next = this.mainQueue.shift();
    if (next) {
      this.startMain(next);
    }
  }

  private stopMain(): void {
    if (this.mainBehavior) {
      this.mainBehavior.stop?.();
      this.mainBehavior = null;
    }
  }

  private applyBehaviorState(behavior: Behavior): void {
    const bs = behavior.getState();
    if (bs.animation) this.state.animation = bs.animation;
    if (bs.emotion) this.state.emotion = bs.emotion;
    if (bs.energy !== undefined) this.state.energy = bs.energy;
    if (bs.flipX !== undefined) this.state.flipX = bs.flipX;
    this.emit();
  }

  private applyState(partial: BehaviorState): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  private emit(): void {
    this.listener?.({ ...this.state });
  }

  stop(): void {
    this.stopMain();
    if (this.overlayBehavior) {
      this.overlayBehavior.stop?.();
      this.overlayBehavior = null;
    }
    this.mainQueue = [];
  }
}
