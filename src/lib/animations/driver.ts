import { ANIMATIONS, AnimationDef, PartTrack } from "./registry";

export interface DriverOpts {
  getPivot: (part: string) => readonly [number, number] | undefined;
}

interface Sampled {
  rotate: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
}

export class AnimationDriver {
  private elements = new Map<string, SVGElement>();
  private opts: DriverOpts;
  private currentId: string | null = null;
  private energy = 0.5;
  private raf = 0;
  private startTs = 0;

  constructor(opts: DriverOpts) {
    this.opts = opts;
  }

  bind(elements: Map<string, SVGElement>): void {
    this.elements = elements;
  }

  setAnimation(id: string | null, energy: number): void {
    if (id === this.currentId && Math.abs(energy - this.energy) < 0.01) return;
    this.currentId = id;
    this.energy = energy;
    this.startTs = performance.now();
    this.renderFrame();
  }

  start(): void {
    if (this.raf) return;
    if (typeof requestAnimationFrame !== "function") return;
    this.startTs = performance.now();
    const loop = () => {
      this.renderFrame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.raf);
    }
    this.raf = 0;
  }

  private renderFrame(): void {
    const def: AnimationDef | null = this.currentId ? ANIMATIONS[this.currentId] ?? null : null;
    const elapsed = performance.now() - this.startTs;
    const speedMul = 0.45 + 0.65 * clamp01(this.energy);

    if (!def) {
      for (const el of this.elements.values()) el.removeAttribute("transform");
      return;
    }

    for (const partName of Object.keys(def)) {
      const el = this.elements.get(partName);
      if (!el) continue;
      const track = def[partName];
      if (!track) continue;
      const sampled = sampleTrack(track, elapsed, speedMul);
      const pivot = this.opts.getPivot(partName) ?? [0, 0];
      el.setAttribute("transform", toTransform(sampled, pivot));
    }
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function sampleTrack(track: PartTrack, elapsed: number, speedMul: number): Sampled {
  const dur = Math.max(40, track.dur / speedMul);
  let t: number;
  if (track.loop) {
    t = (elapsed % dur) / dur;
  } else {
    t = elapsed / dur;
    if (t > 1) t = 1;
  }
  if (track.ease === "sine") t = (1 - Math.cos(Math.PI * t)) / 2;

  const rotate = track.rotate ? sampleArr(track.rotate, t) : 0;
  const x = track.x ? sampleArr(track.x, t) : 0;
  const y = track.y ? sampleArr(track.y, t) : 0;
  const sxA = track.scaleX ?? track.scale;
  const syA = track.scaleY ?? track.scale;
  const sx = sxA ? sampleArr(sxA, t) : 1;
  const sy = syA ? sampleArr(syA, t) : 1;
  return { rotate, x, y, sx, sy };
}

export function sampleArr(arr: readonly number[], t: number): number {
  const n = arr.length;
  if (n === 0) return 0;
  if (n === 1) return arr[0];
  const pos = t * (n - 1);
  const i = Math.floor(pos);
  if (i >= n - 1) return arr[n - 1];
  const frac = pos - i;
  return arr[i] + (arr[i + 1] - arr[i]) * frac;
}

export function toTransform(v: Sampled, pivot: readonly [number, number]): string {
  const [px, py] = pivot;
  const parts: string[] = [];
  if (v.x !== 0 || v.y !== 0) {
    parts.push(`translate(${round(v.x)} ${round(v.y)})`);
  }
  if (v.rotate !== 0) {
    parts.push(`rotate(${round(v.rotate)} ${px} ${py})`);
  }
  if (v.sx !== 1 || v.sy !== 1) {
    parts.push(`translate(${px} ${py}) scale(${round3(v.sx)} ${round3(v.sy)}) translate(${-px} ${-py})`);
  }
  return parts.join(" ");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
