export interface BehaviorState {
  animation?: string;
  emotion?: string;
  energy?: number;
  speech?: string | null;
  flipX?: boolean;
}

export interface BehaviorExecContext {
  position: { x: number; y: number };
  screenWidth: number;
  screenHeight: number;
  moveTo?: (x: number, y: number, onDone: () => void) => void;
}

export interface Behavior {
  id: string;
  interruptible: boolean;
  getState(): BehaviorState;
  start(ctx: BehaviorExecContext): Promise<void>;
  stop?(): void;
}
