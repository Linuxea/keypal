import { PetKind } from "./types";
import { AnimationRegistration, PetPalette } from "./plugins/types";

export const PET_PALETTE: Record<PetKind, PetPalette> = {
  cat: { body: "#f4a261", accent: "#e76f51", dark: "#6b4423" },
  dog: { body: "#c89b6d", accent: "#8b5a2b", dark: "#3d2817" },
  frog: { body: "#6aa84f", accent: "#38761d", dark: "#274e13" },
  chick: { body: "#ffd966", accent: "#f1c232", dark: "#7f6000" },
};

export const SPRITE_FRAME_WIDTH = 32;
export const SPRITE_FRAME_HEIGHT = 32;

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

      ctx.fillStyle = palette.dark;
      ctx.font = "5px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(anim.name.slice(0, 4).toUpperCase(), frameIndex * SPRITE_FRAME_WIDTH + 1, 1);

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
