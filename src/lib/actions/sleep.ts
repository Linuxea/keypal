import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawSleepFrame(
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

export const sleepDefinition: ActionDefinition = {
  type: "sleep",
  duration: 5000,
  interruptible: false,
  frameCount: 4,
  tint: "#c9c9e0",
  draw: drawSleepFrame,
};
