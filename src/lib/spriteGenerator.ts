import {
  MoodState,
  PetKind,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
  FRAMES_PER_STATE,
  SPRITE_TOTAL_FRAMES,
  SPRITE_SHEET_WIDTH,
  SPRITE_SHEET_HEIGHT,
  MOOD_FRAME_OFFSET,
} from "./types";

const PET_PALETTE: Record<
  PetKind,
  { body: string; accent: string; dark: string }
> = {
  cat: { body: "#f4a261", accent: "#e76f51", dark: "#6b4423" },
  dog: { body: "#c89b6d", accent: "#8b5a2b", dark: "#3d2817" },
  frog: { body: "#6aa84f", accent: "#38761d", dark: "#274e13" },
  chick: { body: "#ffd966", accent: "#f1c232", dark: "#7f6000" },
};

const MOOD_TINT: Record<MoodState, string> = {
  IDLE: "transparent",
  HAPPY: "#fff7a8",
  FOCUSED: "#a8d8ff",
  ANXIOUS: "#ffb3b3",
  SLEEPY: "#c9c9e0",
};

const MOOD_LABEL_SHORT: Record<MoodState, string> = {
  IDLE: "IDLE",
  HAPPY: "HAPPY",
  FOCUSED: "FOCUS",
  ANXIOUS: "ANX",
  SLEEPY: "SLEEP",
};

const PET_INITIAL: Record<PetKind, string> = {
  cat: "C",
  dog: "D",
  frog: "F",
  chick: "H",
};

function fillFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  fill: string,
) {
  const x = frameIndex * SPRITE_FRAME_WIDTH;
  ctx.fillStyle = fill;
  ctx.fillRect(x, 0, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT);
}

function drawPetShape(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  state: MoodState,
  frameInState: number,
) {
  const palette = PET_PALETTE[pet];
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;

  const bob = Math.sin((frameInState / FRAMES_PER_STATE) * Math.PI * 2) * 1.5;
  const cy = SPRITE_FRAME_HEIGHT / 2 + bob;

  const bodyR = 10;
  const earOff = 5;
  const earH = 4;

  if (state === "SLEEPY") {
    ctx.fillStyle = palette.dark;
    ctx.fillRect(baseX + 8, 22, 16, 4);
  }

  if (state === "ANXIOUS") {
    const shake = (frameInState % 2 === 0 ? 1 : -1) * 1.5;
    drawBody(ctx, cx + shake, cy, bodyR, palette);
    drawEars(ctx, cx + shake, cy - bodyR + earOff, earOff, earH, palette, pet);
    return;
  }

  drawBody(ctx, cx, cy, bodyR, palette);
  drawEars(ctx, cx, cy - bodyR + earOff, earOff, earH, palette, pet);

  if (state === "HAPPY" && pet === "dog") {
    ctx.fillStyle = palette.dark;
    ctx.fillRect(cx - 6, cy + bodyR - 2, 12, 3);
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: { body: string; accent: string; dark: string },
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
  palette: { body: string; accent: string; dark: string },
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

function drawFace(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  state: MoodState,
  frameInState: number,
  palette: { body: string; accent: string; dark: string },
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const cy = SPRITE_FRAME_HEIGHT / 2;

  ctx.fillStyle = palette.dark;

  if (state === "SLEEPY") {
    ctx.fillRect(cx - 5, cy - 1, 3, 1);
    ctx.fillRect(cx + 2, cy - 1, 3, 1);
    return;
  }
  if (state === "FOCUSED") {
    ctx.fillRect(cx - 5, cy - 1, 2, 2);
    ctx.fillRect(cx + 3, cy - 1, 2, 2);
    return;
  }
  if (state === "HAPPY") {
    const blink = frameInState === 2;
    if (blink) {
      ctx.fillRect(cx - 5, cy, 3, 1);
      ctx.fillRect(cx + 2, cy, 3, 1);
    } else {
      ctx.fillRect(cx - 5, cy - 1, 2, 2);
      ctx.fillRect(cx + 3, cy - 1, 2, 2);
    }
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx - 2, cy + 3, 1, 1);
    ctx.fillRect(cx + 1, cy + 3, 1, 1);
    return;
  }
  if (state === "ANXIOUS") {
    ctx.fillRect(cx - 5, cy - 2, 1, 1);
    ctx.fillRect(cx - 4, cy - 1, 1, 1);
    ctx.fillRect(cx + 4, cy - 2, 1, 1);
    ctx.fillRect(cx + 3, cy - 1, 1, 1);
    return;
  }

  const blink = frameInState === 1 || frameInState === 3;
  if (blink) {
    ctx.fillRect(cx - 5, cy, 3, 1);
    ctx.fillRect(cx + 2, cy, 3, 1);
  } else {
    ctx.fillRect(cx - 5, cy - 1, 2, 2);
    ctx.fillRect(cx + 3, cy - 1, 2, 2);
  }
}

const cache = new Map<PetKind, HTMLCanvasElement>();

export function generateSpriteSheet(pet: PetKind): HTMLCanvasElement {
  const cached = cache.get(pet);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_SHEET_WIDTH;
  canvas.height = SPRITE_SHEET_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d not available");

  ctx.imageSmoothingEnabled = false;

  const states: MoodState[] = ["IDLE", "HAPPY", "FOCUSED", "ANXIOUS", "SLEEPY"];
  const palette = PET_PALETTE[pet];

  states.forEach((state) => {
    const startFrame = MOOD_FRAME_OFFSET[state];
    for (let i = 0; i < FRAMES_PER_STATE; i++) {
      const frameIndex = startFrame + i;

      const tint = MOOD_TINT[state];
      if (tint !== "transparent") {
        fillFrame(ctx, frameIndex, tint);
      }

      drawPetShape(ctx, frameIndex, pet, state, i);
      drawFace(ctx, frameIndex, state, i, palette);

      ctx.fillStyle = palette.dark;
      ctx.font = "5px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(MOOD_LABEL_SHORT[state], frameIndex * SPRITE_FRAME_WIDTH + 1, 1);
      ctx.textAlign = "right";
      ctx.fillText(PET_INITIAL[pet], (frameIndex + 1) * SPRITE_FRAME_WIDTH - 1, 1);
    }
  });

  cache.set(pet, canvas);
  return canvas;
}

export function getSpriteSource(
  pet: PetKind,
  state: MoodState,
  frameInState: number,
): { canvas: HTMLCanvasElement; sx: number; sy: number } {
  const canvas = generateSpriteSheet(pet);
  const frameIndex = MOOD_FRAME_OFFSET[state] + (frameInState % FRAMES_PER_STATE);
  return {
    canvas,
    sx: frameIndex * SPRITE_FRAME_WIDTH,
    sy: 0,
  };
}

export function clearSpriteCache() {
  cache.clear();
}

export function spriteSheetToDataURL(pet: PetKind): string {
  return generateSpriteSheet(pet).toDataURL("image/png");
}

export const SPRITE_FRAME_COUNT = SPRITE_TOTAL_FRAMES;
