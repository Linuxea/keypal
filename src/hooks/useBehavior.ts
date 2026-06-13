import { useEffect, useRef, useState, useCallback } from "react";
import { BrainEngine } from "../lib/brainEngine";
import { PluginRegistry } from "../lib/plugins/registry";
import { AIDecision, AnimationRegistration } from "../lib/plugins/types";
import { createRegistry } from "../lib/plugins";
import { AIConfig } from "../lib/types";

export interface BehaviorState {
  currentAnimation: string;
  currentSpeech: string | null;
  energy: number;
  flipX: boolean;
  animations: AnimationRegistration[];
}

export function useBehavior(aiConfig: AIConfig, petName: string = "小咪") {
  const registryRef = useRef<PluginRegistry>(createRegistry());
  const brainRef = useRef<BrainEngine | null>(null);
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
    const brain = new BrainEngine({
      ai: aiConfig,
      registry,
      intervalMs: aiConfig.intervalSec * 1000,
      petName,
    });

    brain.onDecision((decision: AIDecision) => {
      handleDecision(decision);
    });

    brainRef.current = brain;
    brain.start();

    return () => {
      brain.stop();
    };
  }, [aiConfig, petName]);

  const handleDecision = useCallback((decision: AIDecision) => {
    const actionType = decision.action.type;
    let flipX = false;

    if (actionType === "walk" && decision.action.params) {
      const targetX = decision.action.params.targetX as number | undefined;
      if (targetX !== undefined) {
        flipX = targetX < 0;
      }
    }

    setState((prev) => ({
      ...prev,
      currentAnimation: actionType,
      currentSpeech: decision.speech,
      energy: decision.emotion.energy,
      flipX,
    }));
  }, []);

  const setPosition = useCallback((x: number, y: number) => {
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
