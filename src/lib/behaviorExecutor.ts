import { Behavior, BehaviorExecContext, BehaviorState } from "./behaviors/types";

export interface ExecutorState {
  animation: string;
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
    energy: 0.5,
    speech: null,
    flipX: false,
  };

  constructor(ctx: BehaviorExecContext) {
    this.ctx = {
      ...ctx,
      emitState: (partial: BehaviorState) => {
        this.applyState(partial);
      },
    };
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
    behavior.start(this.ctx).then(() => {
      if (this.overlayBehavior === behavior) {
        this.overlayBehavior = null;
        this.applyState({ speech: null });
      }
    });
  }

  private async startMain(behavior: Behavior): Promise<void> {
    this.mainBehavior = behavior;
    await behavior.start(this.ctx);

    if (this.mainBehavior === behavior) {
      this.mainBehavior = null;
      this.applyState({ animation: "idle" });
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

  private applyState(partial: BehaviorState): void {
    if (partial.animation !== undefined) this.state.animation = partial.animation;
    if (partial.energy !== undefined) this.state.energy = partial.energy;
    if (partial.speech !== undefined) this.state.speech = partial.speech;
    if (partial.flipX !== undefined) this.state.flipX = partial.flipX;
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
