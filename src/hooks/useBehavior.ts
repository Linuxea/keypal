import { useEffect, useRef, useState, useCallback } from "react";
import { BrainEngine } from "../lib/brainEngine";
import { PluginRegistry } from "../lib/plugins/registry";
import { AnimationRegistration } from "../lib/plugins/types";
import { createRegistry } from "../lib/plugins";
import { createWalkController, WalkController } from "../lib/walkController";
import { BehaviorExecutor, ExecutorState } from "../lib/behaviorExecutor";
import { createSpeak } from "../lib/behaviors/speak";
import { AIConfig, PetKind } from "../lib/types";

export interface BehaviorState {
  currentAnimation: string;
  currentSpeech: string | null;
  energy: number;
  flipX: boolean;
  animations: AnimationRegistration[];
}

export function useBehavior(aiConfig: AIConfig, pet: PetKind = "cat", petName: string = "小咪") {
  const registryRef = useRef<PluginRegistry>(createRegistry());
  const brainRef = useRef<BrainEngine | null>(null);
  const executorRef = useRef<BehaviorExecutor | null>(null);
  const walkRef = useRef<WalkController | null>(null);
  const localTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const aiConfigRef = useRef(aiConfig);
  aiConfigRef.current = aiConfig;

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
            brainRef.current?.setPosition(x, y);
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

    const executor = new BehaviorExecutor({
      position: lastPosRef.current,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      moveTo: (x, y, done) => {
        walkRef.current?.start(x, y);
        const check = setInterval(() => {
          if (!walkRef.current?.isWalking()) {
            clearInterval(check);
            done();
          }
        }, 100);
      },
    });

    executor.onStateChange((es: ExecutorState) => {
      setState((prev) => ({
        ...prev,
        currentAnimation: es.animation,
        currentSpeech: es.speech,
        energy: es.energy,
        flipX: es.flipX,
      }));
    });

    executorRef.current = executor;

    const brain = new BrainEngine({
      ai: aiConfigRef.current,
      registry,
      executor,
      intervalMs: aiConfigRef.current.intervalSec * 1000,
      petName,
      pet,
    });

    brainRef.current = brain;

    brain.onDecision((d) => {
      if (d.thought) {
        const dur = aiConfigRef.current.intervalSec * 1000;
        executor.enqueueOverlay(createSpeak(d.thought, dur));
      }
    });

    if (aiConfigRef.current.apiKey) {
      brain.start();
    } else {
      const tick = () => {
        const behaviors = registry.getAllBehaviors().filter((b) => b.id !== "idle");
        const factory = behaviors[Math.floor(Math.random() * behaviors.length)];
        const params: Record<string, unknown> = {};
        if (factory.id === "walk") {
          params.targetX = 100 + Math.floor(Math.random() * (window.screen.width - 200));
          params.targetY = 100 + Math.floor(Math.random() * (window.screen.height - 200));
        }
        const behavior = registry.createBehavior(factory.id, params);
        if (behavior) executor.enqueue(behavior);
      };
      tick();
      localTimerRef.current = setInterval(tick, aiConfigRef.current.intervalSec * 1000);
    }

    return () => {
      brain.stop();
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
      executor.stop();
      walkRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const brain = brainRef.current;
    if (!brain) return;

    brain.stop();
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }

    brain.updateAi(aiConfig);

    if (aiConfig.apiKey) {
      brain.start();
    } else {
      const executor = executorRef.current!;
      const registry = registryRef.current;
      const tick = () => {
        const behaviors = registry.getAllBehaviors().filter((b) => b.id !== "idle");
        const factory = behaviors[Math.floor(Math.random() * behaviors.length)];
        const params: Record<string, unknown> = {};
        if (factory.id === "walk") {
          params.targetX = 100 + Math.floor(Math.random() * (window.screen.width - 200));
          params.targetY = 100 + Math.floor(Math.random() * (window.screen.height - 200));
        }
        const behavior = registry.createBehavior(factory.id, params);
        if (behavior) executor.enqueue(behavior);
      };
      tick();
      localTimerRef.current = setInterval(tick, aiConfig.intervalSec * 1000);
    }
  }, [aiConfig.apiKey, aiConfig.intervalSec]);

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
