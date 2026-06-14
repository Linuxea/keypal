export interface BehaviorState {
  animation?: string;
  energy?: number;
  speech?: string | null;
  flipX?: boolean;
}

export interface BehaviorExecContext {
  position: { x: number; y: number };
  screenWidth: number;
  screenHeight: number;
  moveTo?: (x: number, y: number, onDone: () => void) => void;
  emitState?: (partial: BehaviorState) => void;
}

export interface Behavior {
  id: string;
  interruptible: boolean;
  start(ctx: BehaviorExecContext): Promise<void>;
  stop?(): void;
}
