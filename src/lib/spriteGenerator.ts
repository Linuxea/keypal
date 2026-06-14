import { PetKind } from "./types";
import { AnimationRegistration, PetPalette } from "./plugins/types";

export const PET_PALETTE: Record<PetKind, PetPalette> = {
  cat: {
    body: "#f4a261",
    accent: "#fbe0c0",
    dark: "#5c3a1e",
    outline: "#2d1b0e",
    highlight: "#ffffff",
    shadow: "#d4893a",
  },
  dog: {
    body: "#c89b6d",
    accent: "#e8d5b7",
    dark: "#3d2817",
    outline: "#1a0f07",
    highlight: "#ffffff",
    shadow: "#a67b4e",
  },
  frog: {
    body: "#6aa84f",
    accent: "#b6d7a8",
    dark: "#274e13",
    outline: "#0f1f07",
    highlight: "#d9ead3",
    shadow: "#4a8530",
  },
  chick: {
    body: "#ffd966",
    accent: "#fff2cc",
    dark: "#7f6000",
    outline: "#3d2e00",
    highlight: "#ffffff",
    shadow: "#e6b800",
  },
};

export const SPRITE_FRAME_WIDTH = 32;
export const SPRITE_FRAME_HEIGHT = 32;

const PALETTE_INDEX_TO_COLOR: (keyof PetPalette)[] = [
  "body",      // index 0 reserved for transparent, skipped
  "body",
  "accent",
  "dark",
  "outline",
  "highlight",
  "shadow",
];

export function renderCommands(
  ctx: CanvasRenderingContext2D,
  commands: string[],
  palette: PetPalette,
  ox: number,
  oy: number,
) {
  for (const cmd of commands) {
    const parts = cmd.trim().split(/\s+/);
    if (parts.length === 0) continue;
    const type = parts[0];
    const args = parts.slice(1).map(Number);
    const colorIdx = args.pop()!;
    const color = colorIdx === 0 ? "transparent" : palette[PALETTE_INDEX_TO_COLOR[colorIdx]];

    ctx.fillStyle = color;
    ctx.strokeStyle = palette.outline;
    ctx.lineWidth = 1;

    switch (type) {
      case "R": {
        const [x, y, w, h] = args;
        ctx.fillRect(ox + x, oy + y, w, h);
        ctx.strokeRect(ox + x - 0.5, oy + y - 0.5, w + 1, h + 1);
        break;
      }
      case "E": {
        const [cx, cy, rx, ry] = args;
        ctx.beginPath();
        ctx.ellipse(ox + cx, oy + cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "C": {
        const [cx, cy, r] = args;
        ctx.beginPath();
        ctx.arc(ox + cx, oy + cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "T": {
        const [x1, y1, x2, y2, x3, y3] = args;
        ctx.beginPath();
        ctx.moveTo(ox + x1, oy + y1);
        ctx.lineTo(ox + x2, oy + y2);
        ctx.lineTo(ox + x3, oy + y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "L": {
        const [x1, y1, x2, y2, w] = args;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(ox + x1, oy + y1);
        ctx.lineTo(ox + x2, oy + y2);
        ctx.stroke();
        ctx.lineWidth = 1;
        break;
      }
      case "P": {
        const [x, y] = args;
        ctx.fillRect(ox + x, oy + y, 1, 1);
        break;
      }
    }
  }
}

function fillFrame(ctx: CanvasRenderingContext2D, frameIndex: number, fill: string) {
  const x = frameIndex * SPRITE_FRAME_WIDTH;
  ctx.fillStyle = fill;
  ctx.fillRect(x, 0, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT);
}

export function drawBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: PetPalette,
) {
  ctx.fillStyle = palette.body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(cx, cy + 3, r - 3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  off: number,
  h: number,
  palette: PetPalette,
  pet: PetKind,
) {
  ctx.fillStyle = palette.body;
  if (pet === "cat") {
    ctx.beginPath();
    ctx.moveTo(cx - off - 2, cy + h);
    ctx.lineTo(cx - off, cy - h);
    ctx.lineTo(cx - off + 3, cy + h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + off + 2, cy + h);
    ctx.lineTo(cx + off, cy - h);
    ctx.lineTo(cx + off - 3, cy + h);
    ctx.closePath();
    ctx.fill();
  } else if (pet === "dog") {
    ctx.fillRect(cx - off - 2, cy - 1, 3, h);
    ctx.fillRect(cx + off - 1, cy - 1, 3, h);
  } else if (pet === "frog") {
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(cx - off + 1, cy - 1, 2, 0, Math.PI * 2);
    ctx.arc(cx + off - 1, cy - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet === "chick") {
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.moveTo(cx - off, cy + 2);
    ctx.lineTo(cx - off - 1, cy - h);
    ctx.lineTo(cx - off + 2, cy + 1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + off, cy + 2);
    ctx.lineTo(cx + off + 1, cy - h);
    ctx.lineTo(cx + off - 2, cy + 1);
    ctx.fill();
  }
}

const cache = new Map<string, HTMLCanvasElement>();

function cacheKey(pet: PetKind, animations: AnimationRegistration[]): string {
  const names = animations.map((a) => a.name).sort().join(",");
  return `${pet}:${names}`;
}

export function generateSpriteSheet(
  pet: PetKind,
  animations: AnimationRegistration[],
): HTMLCanvasElement {
  const key = cacheKey(pet, animations);
  const cached = cache.get(key);
  if (cached) return cached;

  const totalFrames = animations.reduce((sum, a) => sum + a.frameCount, 0);
  const width = totalFrames * SPRITE_FRAME_WIDTH;
  const height = SPRITE_FRAME_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d not available");

  ctx.imageSmoothingEnabled = false;

  const palette = PET_PALETTE[pet];
  let frameIndex = 0;

  for (const anim of animations) {
    const tint = anim.tint ?? "transparent";

    for (let i = 0; i < anim.frameCount; i++) {
      if (tint !== "transparent") {
        fillFrame(ctx, frameIndex, tint);
      }

      anim.draw(ctx, frameIndex, pet, i, palette);

      frameIndex++;
    }
  }

  cache.set(key, canvas);
  return canvas;
}

export function getAnimationFrameRange(
  animations: AnimationRegistration[],
  animName: string,
): { start: number; count: number } | null {
  let offset = 0;
  for (const anim of animations) {
    if (anim.name === animName) {
      return { start: offset, count: anim.frameCount };
    }
    offset += anim.frameCount;
  }
  return null;
}

export function getSpriteSource(
  pet: PetKind,
  animations: AnimationRegistration[],
  animName: string,
  frameInAnim: number,
): { canvas: HTMLCanvasElement; sx: number; sy: number } | null {
  const range = getAnimationFrameRange(animations, animName);
  if (!range) return null;

  const canvas = generateSpriteSheet(pet, animations);
  const frameIndex = range.start + (frameInAnim % range.count);
  return {
    canvas,
    sx: frameIndex * SPRITE_FRAME_WIDTH,
    sy: 0,
  };
}

export function clearSpriteCache() {
  cache.clear();
}
