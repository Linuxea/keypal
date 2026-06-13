import { useEffect, useRef } from "react";
import {
  MoodState,
  MoodStateSnapshot,
  PetKind,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
} from "../lib/types";
import { getSpriteSource, generateSpriteSheet } from "../lib/spriteGenerator";
import { createSpriteController, SpriteController } from "../lib/spritesheet";

interface PetProps {
  pet: PetKind;
  mood: MoodStateSnapshot;
  size: number;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function Pet({ pet, mood, size, onContextMenu, onMouseDown }: PetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctrlRef = useRef<SpriteController | null>(null);
  const moodRef = useRef(mood);
  const petRef = useRef(pet);
  moodRef.current = mood;
  petRef.current = pet;

  useEffect(() => {
    generateSpriteSheet(pet);
  }, [pet]);

  useEffect(() => {
    if (!ctrlRef.current) {
      ctrlRef.current = createSpriteController(8);
    }
    const ctrl = ctrlRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastState: MoodState = moodRef.current.current;

    const render = () => {
      const now = performance.now();
      const m = moodRef.current;

      if (lastState !== m.current) {
        ctrl.setFrame(m.current, 0);
        lastState = m.current;
      }

      const { frameIndex } = ctrl.tick(now, m.energy);

      const src = getSpriteSource(petRef.current, m.current, 0);
      void src;

      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;

      const sheet = generateSpriteSheet(petRef.current);
      const sx = (frameIndex % 20) * SPRITE_FRAME_WIDTH;
      const sy = 0;

      ctx.drawImage(
        sheet,
        sx,
        sy,
        SPRITE_FRAME_WIDTH,
        SPRITE_FRAME_HEIGHT,
        0,
        0,
        size,
        size,
      );

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size]);

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
