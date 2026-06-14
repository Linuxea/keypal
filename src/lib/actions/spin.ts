import { PetKind } from "../types";
import { ActionDefinition, PetPalette } from "../plugins/types";
import {
  drawBody,
  drawEars,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../spriteGenerator";

function drawSpinFrame(
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

export const spinDefinition: ActionDefinition = {
  type: "spin",
  duration: 2000,
  interruptible: true,
  frameCount: 4,
  tint: "#a8d8ff",
  draw: drawSpinFrame,
};
