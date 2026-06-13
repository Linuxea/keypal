import { useEffect, useRef } from "react";
import { PetKind } from "../lib/types";
import { AnimationRegistration } from "../lib/plugins/types";
import { generateSpriteSheet, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT } from "../lib/spriteGenerator";
import { createSpriteController, SpriteController } from "../lib/spritesheet";

interface PetProps {
  pet: PetKind;
  animations: AnimationRegistration[];
  currentAnimation: string;
  energy: number;
  size: number;
  flipX: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function Pet({
  pet,
  animations,
  currentAnimation,
  energy,
  size,
  flipX,
  onContextMenu,
  onMouseDown,
}: PetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctrlRef = useRef<SpriteController | null>(null);
  const animRef = useRef(currentAnimation);
  const petRef = useRef(pet);
  const animsRef = useRef(animations);
  animRef.current = currentAnimation;
  petRef.current = pet;
  animsRef.current = animations;

  useEffect(() => {
    generateSpriteSheet(pet, animations);
  }, [pet, animations]);

  useEffect(() => {
    if (!ctrlRef.current) {
      ctrlRef.current = createSpriteController(animations, 8);
    }
    const ctrl = ctrlRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastAnim = animRef.current;

    const render = () => {
      const now = performance.now();
      const current = animRef.current;

      if (lastAnim !== current) {
        ctrl.setAnimation(current);
        lastAnim = current;
      }

      const { frameIndex } = ctrl.tick(now, energy);

      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;

      if (flipX) {
        ctx.save();
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      const sheet = generateSpriteSheet(petRef.current, animsRef.current);
      const sx = frameIndex * SPRITE_FRAME_WIDTH;

      ctx.drawImage(
        sheet,
        sx,
        0,
        SPRITE_FRAME_WIDTH,
        SPRITE_FRAME_HEIGHT,
        flipX ? 0 : 0,
        0,
        size,
        size,
      );

      if (flipX) {
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size, energy, flipX, animations]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "block",
        imageRendering: "pixelated",
        cursor: "grab",
      }}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
    />
  );
}
