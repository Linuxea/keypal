import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawSnoreFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  pet: PetKind,
  frameInAnim: number,
  palette: PetPalette,
) {
  const baseX = frameIndex * SPRITE_FRAME_WIDTH;
  const cx = baseX + SPRITE_FRAME_WIDTH / 2;
  const breath = frameInAnim === 1 ? -1 : frameInAnim === 3 ? 1 : 0;
  const cy = SPRITE_FRAME_HEIGHT / 2 + 4 + breath;

  drawBody(ctx, cx, cy, 10, palette);
  drawEars(ctx, cx, cy - 5, 5, 4, palette, pet);

  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 5, cy - 1, 3, 1);
  ctx.fillRect(cx + 2, cy - 1, 3, 1);

  ctx.fillRect(cx - 4, cy + 8, 8, 3);

  ctx.fillStyle = palette.accent;
  if (frameInAnim === 1) {
    ctx.fillRect(cx + 6, cy - 3, 2, 2);
  } else if (frameInAnim === 2) {
    ctx.fillRect(cx + 7, cy - 5, 3, 2);
  } else if (frameInAnim === 3) {
    ctx.fillRect(cx + 8, cy - 7, 3, 3);
  }
}

export const snoreDefinition: ActionDefinition = {
  type: "snore",
  duration: 6000,
  interruptible: false,
  frameCount: 4,
  tint: "#b0b0d0",
  draw: drawSnoreFrame,
};
