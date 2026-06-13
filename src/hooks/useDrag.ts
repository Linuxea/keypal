import { useCallback, useEffect, useRef } from "react";
import { configStore } from "../lib/config";

interface UseDragOptions {
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
}

export function useDrag({ onDragStart, onDragEnd }: UseDragOptions = {}) {
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const startDrag = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    movedRef.current = false;
    onDragStart?.();

    try {
      const win = await import("@tauri-apps/api/window");
      await win.getCurrentWindow().startDragging();
      movedRef.current = true;
    } catch (err) {
      console.warn("[keypal] startDragging failed", err);
      draggingRef.current = false;
    }
  }, [onDragStart]);

  useEffect(() => {
    const persist = async () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (!movedRef.current) return;
      try {
        const win = await import("@tauri-apps/api/window");
        const w = win.getCurrentWindow();
        const factor = await w.scaleFactor();
        const pos = await w.outerPosition();
        const physX = pos.x;
        const physY = pos.y;
        const x = Math.round(physX / factor);
        const y = Math.round(physY / factor);
        await configStore.savePosition(x, y);
        onDragEnd?.(x, y);
      } catch (err) {
        console.warn("[keypal] drag persist failed", err);
      }
    };

    window.addEventListener("mouseup", persist);
    window.addEventListener("blur", persist);
    return () => {
      window.removeEventListener("mouseup", persist);
      window.removeEventListener("blur", persist);
    };
  }, [onDragEnd]);

  return { startDrag, isDragging: () => draggingRef.current };
}
