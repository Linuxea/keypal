import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawIdleFrame(
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

export const idleDefinition: ActionDefinition = {
  type: "idle",
  duration: 3000,
  interruptible: true,
  frameCount: 4,
  draw: drawIdleFrame,
};
