type SetPositionFn = (x: number, y: number) => Promise<void>;
type GetPositionFn = () => Promise<{ x: number; y: number }>;

export interface WalkController {
  start(targetX: number, targetY: number): void;
  stop(): void;
  isWalking(): boolean;
}

export function createWalkController(
  setPosition: SetPositionFn,
  getPosition: GetPositionFn,
  speed: number = 120,
): WalkController {
  let raf = 0;
  let walking = false;
  let targetX = 0;
  let targetY = 0;
  let generation = 0;

  async function step(gen: number) {
    if (!walking || gen !== generation) return;

    const current = await getPosition();
    if (!walking || gen !== generation) return;

    const dx = targetX - current.x;
    const dy = targetY - current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      await setPosition(targetX, targetY);
      walking = false;
      return;
    }

    const stepSize = Math.min(speed / 60, dist);
    const ratio = stepSize / dist;
    const newX = Math.round(current.x + dx * ratio);
    const newY = Math.round(current.y + dy * ratio);

    await setPosition(newX, newY);
    if (!walking || gen !== generation) return;
    raf = requestAnimationFrame(() => step(gen));
  }

  return {
    start(x: number, y: number) {
      walking = false;
      cancelAnimationFrame(raf);
      generation += 1;
      targetX = x;
      targetY = y;
      walking = true;
      const gen = generation;
      raf = requestAnimationFrame(() => step(gen));
    },

    stop() {
      walking = false;
      cancelAnimationFrame(raf);
    },

    isWalking() {
      return walking;
    },
  };
}
