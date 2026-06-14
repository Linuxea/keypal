import { Behavior, BehaviorExecContext, BehaviorState } from "./behaviors/types";
import { log } from "./log";

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
      const prevId = this.mainBehavior.id;
      this.stopMain();
      void log(
        "exec",
        `enqueue ${behavior.id} interruptible=${behavior.interruptible} replaced=${prevId}`,
      );
      void this.startMain(behavior);
    } else if (this.mainBehavior) {
      this.mainQueue.push(behavior);
      void log(
        "exec",
        `enqueue ${behavior.id} interruptible=${behavior.interruptible} queued (behind ${this.mainBehavior.id}, queue=${this.mainQueue.length})`,
      );
    } else {
      void log(
        "exec",
        `enqueue ${behavior.id} interruptible=${behavior.interruptible}`,
      );
      void this.startMain(behavior);
    }
  }

  enqueueOverlay(behavior: Behavior): void {
    const prevId = this.overlayBehavior?.id;
    if (this.overlayBehavior) {
      this.overlayBehavior.stop?.();
    }
    this.overlayBehavior = behavior;
    void log(
      "exec",
      `overlay enqueue ${behavior.id}${prevId ? ` replaced=${prevId}` : ""}`,
    );
    behavior.start(this.ctx).then(() => {
      if (this.overlayBehavior === behavior) {
        this.overlayBehavior = null;
        this.applyState({ speech: null });
        void log("exec", `overlay complete ${behavior.id}`);
      }
    });
  }

  private async startMain(behavior: Behavior): Promise<void> {
    this.mainBehavior = behavior;
    void log("exec", `start ${behavior.id} interruptible=${behavior.interruptible}`);
    await behavior.start(this.ctx);

    if (this.mainBehavior === behavior) {
      this.mainBehavior = null;
      this.applyState({ animation: "idle" });
      void log("exec", `complete ${behavior.id} -> idle`);
      this.dequeueNext();
    }
  }

  private dequeueNext(): void {
    const next = this.mainQueue.shift();
    if (next) {
      void log(
        "exec",
        `dequeue ${next.id} (remaining=${this.mainQueue.length})`,
      );
      void this.startMain(next);
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
    void log(
      "exec",
      `stop teardown main=${this.mainBehavior?.id ?? "null"} overlay=${this.overlayBehavior?.id ?? "null"} queue=${this.mainQueue.length}`,
    );
    this.stopMain();
    if (this.overlayBehavior) {
      this.overlayBehavior.stop?.();
      this.overlayBehavior = null;
    }
    this.mainQueue = [];
  }
}
