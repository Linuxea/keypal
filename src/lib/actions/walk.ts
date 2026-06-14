import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawWalkFrame(
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

export const walkDefinition: ActionDefinition = {
  type: "walk",
  duration: 0,
  interruptible: true,
  movement: true,
  frameCount: 4,
  draw: drawWalkFrame,
};
