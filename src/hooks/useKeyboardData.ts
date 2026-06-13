import { useEffect, useRef } from "react";
import {
  AppConfig,
  KeyEventPayload,
  MoodState,
  MoodStateSnapshot,
  TypingSession,
  SLEEPY_TIMEOUT_MS,
  MAX_ANALYSIS_TEXT_LEN,
  ANALYSIS_CHAR_THRESHOLD,
} from "../lib/types";
import {
  createEmptySession,
  pushKey,
  computeMetrics,
  localInfer,
  transition,
  shouldAnalyze,
  createInitialMood,
} from "../lib/moodEngine";
import { analyzeMood } from "../lib/aiClient";
import { appendAnalysisLog, appendLogRaw } from "../lib/log";

interface UseKeyboardDataOptions {
  config: AppConfig;
  onMoodChange: (mood: MoodStateSnapshot) => void;
  onTypingActivity?: (active: boolean) => void;
  onAnalysisLog?: (msg: string) => void;
}

export function useKeyboardData({
  config,
  onMoodChange,
  onTypingActivity,
  onAnalysisLog,
}: UseKeyboardDataOptions) {
  const sessionRef = useRef<TypingSession>(createEmptySession());
  const moodRef = useRef<MoodStateSnapshot>(createInitialMood());
  const lastAnalyzedAtRef = useRef<number>(Date.now());
  const lastKeyAtRef = useRef<number>(0);
  const analyzeLockRef = useRef<boolean>(false);
  const configRef = useRef<AppConfig>(config);
  configRef.current = config;

  useEffect(() => {
    onMoodChange(moodRef.current);
  }, [onMoodChange]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unsub = await listen<KeyEventPayload>("key-event", (e) => {
          handleKey(e.payload);
        });
        if (cancelled) {
          unsub();
          return;
        }
        unlisten = unsub;
      } catch (err) {
        console.warn("[keypal] event listen failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const mood = moodRef.current;
      if (
        mood.current !== "SLEEPY" &&
        lastKeyAtRef.current > 0 &&
        now - lastKeyAtRef.current >= SLEEPY_TIMEOUT_MS
      ) {
        moodRef.current = transition(mood, "SLEEPY", 0.2, now);
        onMoodChange(moodRef.current);
        onAnalysisLog?.("[sleepy] 120s 无输入");
      }
    }, 5_000);
    return () => window.clearInterval(id);
  }, [onMoodChange, onAnalysisLog]);

  function handleKey(payload: KeyEventPayload) {
    const now = payload.timestamp || Date.now();
    lastKeyAtRef.current = now;
    onTypingActivity?.(true);

    const mood = moodRef.current;
    if (mood.current === "SLEEPY") {
      moodRef.current = transition(mood, "IDLE", 0.6, now);
      onMoodChange(moodRef.current);
    }

    pushKey(sessionRef.current, {
      isBackspace: payload.isBackspace,
      isChar: payload.isChar,
      char: payload.char,
      timestamp: now,
    });

    if (payload.isChar || payload.isBackspace) {
      void appendLogRaw(
        `[KEY] name=${payload.key} char=${payload.char ?? "-"} bs=${payload.isBackspace} total=${sessionRef.current.keyTimestamps.length + sessionRef.current.backspaceCount}`,
      );
    }

    maybeAnalyze(now);
  }

  async function maybeAnalyze(now: number) {
    const cfg = configRef.current;
    const intervalMs = cfg.ai.intervalSec * 1000;

    if (
      !shouldAnalyze(
        sessionRef.current,
        lastAnalyzedAtRef.current,
        intervalMs,
        ANALYSIS_CHAR_THRESHOLD,
        now,
      )
    ) {
      return;
    }

    if (analyzeLockRef.current) return;
    analyzeLockRef.current = true;
    lastAnalyzedAtRef.current = now;

    const metrics = computeMetrics(sessionRef.current, now);
    const text = sessionRef.current.chars
      .join("")
      .slice(-MAX_ANALYSIS_TEXT_LEN);

    if (cfg.ai.apiKey) {
      try {
        const result = await analyzeMood(cfg.ai, {
          text,
          typingMetrics: metrics,
        });
        moodRef.current = transition(
          moodRef.current,
          result.state,
          result.energy,
          now,
        );
        onMoodChange(moodRef.current);
        onAnalysisLog?.(
          `[ai] -> ${result.state} (e=${result.energy.toFixed(2)}) ${result.reason} | text="${text.slice(-40)}" wpm=${metrics.wpm} bs=${metrics.backspaceRate}`,
        );
        void appendAnalysisLog({
          text,
          metrics,
          result,
          source: "ai",
        });
      } catch (err) {
        const inferred = localInfer(metrics, text);
        moodRef.current = transition(
          moodRef.current,
          inferred.state,
          inferred.energy,
          now,
        );
        onMoodChange(moodRef.current);
        onAnalysisLog?.(
          `[ai-fail ${(err as Error).message}] -> ${inferred.state} (local)`,
        );
        void appendAnalysisLog({
          text,
          metrics,
          result: {
            state: inferred.state,
            energy: inferred.energy,
            reason: "local fallback",
          },
          source: "ai_fail",
          error: (err as Error).message,
        });
      }
    } else {
      const inferred = localInfer(metrics, text);
      moodRef.current = transition(
        moodRef.current,
        inferred.state,
        inferred.energy,
        now,
      );
      onMoodChange(moodRef.current);
      onAnalysisLog?.(`[local] -> ${inferred.state}`);
      void appendAnalysisLog({
        text,
        metrics,
        result: {
          state: inferred.state,
          energy: inferred.energy,
          reason: "local (no api key)",
        },
        source: "local",
      });
    }

    sessionRef.current = createEmptySession();
    analyzeLockRef.current = false;
  }

  function resetMood(state: MoodState, energy: number) {
    moodRef.current = transition(moodRef.current, state, energy, Date.now());
    onMoodChange(moodRef.current);
  }

  return {
    resetMood,
    getCurrentMood: () => moodRef.current,
    getSession: () => sessionRef.current,
  };
}
