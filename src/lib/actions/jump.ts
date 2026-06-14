import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawJumpFrame(
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

export const jumpDefinition: ActionDefinition = {
  type: "jump",
  duration: 1500,
  interruptible: true,
  frameCount: 4,
  tint: "#fff7a8",
  draw: drawJumpFrame,
};
