import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawYawnFrame(
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

export const yawnDefinition: ActionDefinition = {
  type: "yawn",
  duration: 2500,
  interruptible: true,
  frameCount: 4,
  tint: "#c9c9e0",
  draw: drawYawnFrame,
};
