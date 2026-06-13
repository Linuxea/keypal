import {
  MoodState,
  MoodStateSnapshot,
  TypingMetrics,
  TypingSession,
} from "./types";

export function createEmptySession(): TypingSession {
  return {
    chars: [],
    backspaceCount: 0,
    keyTimestamps: [],
    lastKeyTime: 0,
    pauseCount: 0,
  };
}

export function pushKey(
  session: TypingSession,
  payload: { isBackspace: boolean; isChar: boolean; char: string | null; timestamp: number },
  windowMs: number = 60_000,
): TypingSession {
  const now = payload.timestamp;

  if (session.lastKeyTime > 0 && now - session.lastKeyTime >= 3_000) {
    session.pauseCount += 1;
  }

  session.lastKeyTime = now;

  if (payload.isBackspace) {
    session.backspaceCount += 1;
    if (session.chars.length > 0) session.chars.pop();
    return session;
  }

  session.keyTimestamps.push(now);
  if (payload.isChar && payload.char) {
    session.chars.push(payload.char);
  }

  const cutoff = now - windowMs;
  while (session.keyTimestamps.length > 0 && session.keyTimestamps[0] < cutoff) {
    session.keyTimestamps.shift();
  }
  const bsCutoffIdx = session.keyTimestamps.length;
  void bsCutoffIdx;

  return session;
}

export function computeMetrics(
  session: TypingSession,
  _now: number,
): TypingMetrics {
  const timestamps = session.keyTimestamps;
  const charCount = session.chars.length;
  const totalKeys = timestamps.length + session.backspaceCount;

  const durationMs =
    timestamps.length >= 2
      ? timestamps[timestamps.length - 1] - timestamps[0]
      : 0;

  let wpm = 0;
  if (durationMs >= 500) {
    const minutes = durationMs / 60_000;
    wpm = minutes > 0 ? charCount / minutes : 0;
  }

  const backspaceRate = totalKeys > 0 ? session.backspaceCount / totalKeys : 0;

  let avgKeyInterval = 0;
  if (timestamps.length >= 2) {
    let sum = 0;
    for (let i = 1; i < timestamps.length; i++) {
      sum += timestamps[i] - timestamps[i - 1];
    }
    avgKeyInterval = sum / (timestamps.length - 1);
  }

  return {
    wpm: Math.round(wpm),
    backspaceRate: Math.round(backspaceRate * 100) / 100,
    avgKeyInterval: Math.round(avgKeyInterval),
    pauseCount: session.pauseCount,
    charCount,
    durationMs,
  };
}

export function localInfer(
  metrics: TypingMetrics,
  text: string = "",
): {
  state: MoodState;
  energy: number;
} {
  const lowerText = text.toLowerCase();

  const negativePatterns = [
    "ta ma",
    "cao",
    "caonima",
    "fan si",
    "beng kui",
    "fuck",
    "shit",
    "damn",
    "wtf",
    "deadline",
    "error",
    "crash",
    "stuck",
    "blocked",
  ];
  const hasNegative = negativePatterns.some((p) =>
    lowerText.includes(p),
  );

  if (hasNegative) {
    return { state: "ANXIOUS", energy: 0.9 };
  }

  const positivePatterns = [
    "kai xin",
    "gao xing",
    "xi huan",
    "tai bang",
    "tai hao",
    "haha",
    "good",
    "great",
    "nice",
    "love",
    "awesome",
    "done",
    "finished",
  ];
  const hasPositive = positivePatterns.some((p) =>
    lowerText.includes(p),
  );

  if (hasPositive && metrics.backspaceRate < 0.1) {
    return { state: "HAPPY", energy: 1.0 };
  }

  if (metrics.charCount === 0) {
    return { state: "IDLE", energy: 0.5 };
  }

  if (metrics.backspaceRate > 0.18) {
    return { state: "ANXIOUS", energy: 0.85 };
  }

  if (metrics.wpm >= 50 && metrics.backspaceRate < 0.05) {
    return { state: "HAPPY", energy: 0.9 };
  }

  if (
    metrics.wpm >= 15 &&
    metrics.avgKeyInterval > 0 &&
    metrics.avgKeyInterval < 500
  ) {
    return { state: "FOCUSED", energy: 0.7 };
  }

  return { state: "IDLE", energy: 0.5 };
}

export function createInitialMood(): MoodStateSnapshot {
  return {
    current: "IDLE",
    energy: 0.6,
    since: Date.now(),
  };
}

export function transition(
  current: MoodStateSnapshot,
  next: MoodState,
  energy: number,
  now: number,
): MoodStateSnapshot {
  if (current.current === next) {
    return {
      ...current,
      energy: Math.max(0.1, Math.min(1.0, energy)),
      since: current.since,
    };
  }
  return {
    current: next,
    energy: Math.max(0.1, Math.min(1.0, energy)),
    since: now,
  };
}

export function shouldAnalyze(
  session: TypingSession,
  lastAnalyzedAt: number,
  intervalMs: number,
  charThreshold: number,
  now: number,
): boolean {
  if (now - lastAnalyzedAt < 5_000) return false;
  if (session.chars.length >= charThreshold) return true;
  if (now - lastAnalyzedAt >= intervalMs && session.chars.length >= 5) {
    return true;
  }
  return false;
}
