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

function drawBody(
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

function drawEars(
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

export function drawIdleFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const bob = Math.sin((frameInAnim / 4) * Math.PI * 2) * 1;
  const cy = SPRITE_FRAME_HEIGHT / 2 + bob;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  const blink = frameInAnim === 1 || frameInAnim === 3;
  if (blink) {
    ctx.fillRect(cx - 5, cy, 3, 1);
    ctx.fillRect(cx + 2, cy, 3, 1);
  } else {
    ctx.fillRect(cx - 5, cy - 1, 2, 2);
    ctx.fillRect(cx + 3, cy - 1, 2, 2);
  }
}

export function drawWalkFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const bob = Math.sin((frameInAnim / 4) * Math.PI * 2) * 2;
  const cy = SPRITE_FRAME_HEIGHT / 2 + bob;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 5, cy - 1, 2, 2);
  ctx.fillRect(cx + 3, cy - 1, 2, 2);

  const legOffset = frameInAnim % 2 === 0 ? 2 : -2;
  ctx.fillRect(cx - 3, cy + 7 + legOffset, 2, 3);
  ctx.fillRect(cx + 1, cy + 7 - legOffset, 2, 3);
}

export function drawJumpFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const jumpHeight = frameInAnim === 1 ? -6 : frameInAnim === 2 ? -3 : 0;
  const cy = SPRITE_FRAME_HEIGHT / 2 + jumpHeight;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  if (frameInAnim === 1) {
    ctx.fillRect(cx - 3, cy - 2, 2, 2);
    ctx.fillRect(cx + 1, cy - 2, 2, 2);
  } else {
    ctx.fillRect(cx - 5, cy - 1, 2, 2);
    ctx.fillRect(cx + 3, cy - 1, 2, 2);
  }

  ctx.fillStyle = palette.accent;
  ctx.fillRect(cx - 2, cy + 4, 1, 1);
  ctx.fillRect(cx + 1, cy + 4, 1, 1);
}

export function drawSpinFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const cy = SPRITE_FRAME_HEIGHT / 2;

  const scaleX = frameInAnim === 1 ? 0.5 : frameInAnim === 3 ? 0.5 : 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);
  ctx.translate(-cx, -cy);

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 5, cy - 1, 2, 2);
  ctx.fillRect(cx + 3, cy - 1, 2, 2);

  ctx.restore();
}

export function drawYawnFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const cy = SPRITE_FRAME_HEIGHT / 2;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  if (frameInAnim === 1 || frameInAnim === 2) {
    ctx.fillRect(cx - 5, cy - 1, 2, 1);
    ctx.fillRect(cx + 3, cy - 1, 2, 1);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx - 3, cy + 2, 6, 3);
  } else {
    ctx.fillRect(cx - 5, cy - 1, 2, 2);
    ctx.fillRect(cx + 3, cy - 1, 2, 2);
  }
}

export function drawSleepFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const cy = SPRITE_FRAME_HEIGHT / 2 + 4;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 5, cy - 1, 3, 1);
  ctx.fillRect(cx + 2, cy - 1, 3, 1);

  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 4, cy + 8, 8, 3);

  if (frameInAnim === 1 || frameInAnim === 3) {
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx + 6, cy - 3, 3, 2);
  }
}

const ANIMATION_DRAWERS: Record<string, (
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) => void> = {
  idle: drawIdleFrame,
  walk: drawWalkFrame,
  jump: drawJumpFrame,
  spin: drawSpinFrame,
  yawn: drawYawnFrame,
  sleep: drawSleepFrame,
};

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
    const drawer = anim.draw ?? ANIMATION_DRAWERS[anim.name];

    for (let i = 0; i < anim.frameCount; i++) {
      if (tint !== "transparent") {
        fillFrame(ctx, frameIndex, tint);
      }

      if (drawer) {
        drawer(ctx, frameIndex, pet, i, palette);
      } else {
        drawIdleFrame(ctx, frameIndex, pet, i, palette);
      }

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
