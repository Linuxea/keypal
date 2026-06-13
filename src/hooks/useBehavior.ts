import { useEffect, useRef, useState, useCallback } from "react";
import { BrainEngine } from "../lib/brainEngine";
import { PluginRegistry } from "../lib/plugins/registry";
import { AIDecision, AnimationRegistration } from "../lib/plugins/types";
import { createRegistry } from "../lib/plugins";
import { createWalkController, WalkController } from "../lib/walkController";
import { AIConfig } from "../lib/types";

export interface BehaviorState {
  currentAnimation: string;
  currentSpeech: string | null;
  energy: number;
  flipX: boolean;
  animations: AnimationRegistration[];
}

const LOCAL_ACTIONS = ["idle", "walk", "jump", "spin", "yawn"] as const;

function randomAction(): { type: string; targetX?: number; targetY?: number } {
  const type = LOCAL_ACTIONS[Math.floor(Math.random() * LOCAL_ACTIONS.length)];
  if (type === "walk") {
    const margin = 100;
    const targetX = margin + Math.floor(Math.random() * (window.screen.width - margin * 2));
    const targetY = margin + Math.floor(Math.random() * (window.screen.height - margin * 2));
    return { type, targetX, targetY };
  }
  return { type };
}

export function useBehavior(aiConfig: AIConfig, petName: string = "小咪") {
  const registryRef = useRef<PluginRegistry>(createRegistry());
  const brainRef = useRef<BrainEngine | null>(null);
  const walkRef = useRef<WalkController | null>(null);
  const localTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [state, setState] = useState<BehaviorState>({
    currentAnimation: "idle",
    currentSpeech: null,
    energy: 0.5,
    flipX: false,
    animations: [],
  });

  useEffect(() => {
    const registry = registryRef.current;
    setState((s) => ({
      ...s,
      animations: registry.getAllAnimations(),
    }));
  }, []);

  const applyDecision = useCallback((decision: AIDecision) => {
    const actionType = decision.action.type;
    let flipX = false;

    if (actionType === "walk") {
      walkRef.current?.stop();
      const targetX = decision.action.params?.targetX as number | undefined;
      const targetY = decision.action.params?.targetY as number | undefined;
      if (targetX !== undefined && targetY !== undefined) {
        flipX = targetX < lastPosRef.current.x;
        walkRef.current?.start(targetX, targetY);
      }
    } else {
      walkRef.current?.stop();
    }

    setState((prev) => ({
      ...prev,
      currentAnimation: actionType,
      currentSpeech: decision.speech,
      energy: decision.emotion.energy,
      flipX,
    }));
  }, []);

  const applyLocalDecision = useCallback((action: ReturnType<typeof randomAction>) => {
    walkRef.current?.stop();

    if (action.type === "walk" && action.targetX !== undefined && action.targetY !== undefined) {
      const flipX = action.targetX < lastPosRef.current.x;
      walkRef.current?.start(action.targetX, action.targetY);
      setState((prev) => ({
        ...prev,
        currentAnimation: "walk",
        currentSpeech: null,
        energy: 0.6,
        flipX,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentAnimation: action.type,
        currentSpeech: null,
        energy: action.type === "jump" ? 0.9 : action.type === "yawn" ? 0.3 : 0.5,
        flipX: false,
      }));
    }
  }, []);

  useEffect(() => {
    const registry = registryRef.current;

    const initWalk = async () => {
      try {
        const win = await import("@tauri-apps/api/window");
        const w = win.getCurrentWindow();
        const pos = await w.outerPosition();
        const factor = await w.scaleFactor();
        lastPosRef.current = { x: Math.round(pos.x / factor), y: Math.round(pos.y / factor) };

        walkRef.current = createWalkController(
          async (x, y) => {
            await w.setPosition(new win.LogicalPosition(x, y));
            lastPosRef.current = { x, y };
          },
          async () => {
            const p = await w.outerPosition();
            const f = await w.scaleFactor();
            return { x: Math.round(p.x / f), y: Math.round(p.y / f) };
          },
          120,
        );
      } catch (err) {
        console.warn("[keypal] walk init failed", err);
      }
    };

    initWalk();

    const brain = new BrainEngine({
      ai: aiConfig,
      registry,
      intervalMs: aiConfig.intervalSec * 1000,
      petName,
    });

    brain.onDecision((decision: AIDecision) => {
      applyDecision(decision);
    });

    brainRef.current = brain;

    if (aiConfig.apiKey) {
      brain.start();
    } else {
      localTimerRef.current = setInterval(() => {
        applyLocalDecision(randomAction());
      }, aiConfig.intervalSec * 1000);
    }

    return () => {
      brain.stop();
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
      walkRef.current?.stop();
    };
  }, [aiConfig, petName, applyDecision, applyLocalDecision]);

  const setPosition = useCallback((x: number, y: number) => {
    lastPosRef.current = { x, y };
    brainRef.current?.setPosition(x, y);
  }, []);

  const setScreenSize = useCallback((w: number, h: number) => {
    brainRef.current?.setScreenSize(w, h);
  }, []);

  return {
    ...state,
    setPosition,
    setScreenSize,
  };
}
