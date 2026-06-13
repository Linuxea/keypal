import { MoodAnalysisResponse, TypingMetrics } from "./types";

function ts(): string {
  const d = new Date();
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `.${pad(d.getMilliseconds(), 3)}`
  );
}

function truncate(s: string, n: number): string {
  const trimmed = s.replace(/\s+/g, " ").trim();
  if (trimmed.length <= n) return trimmed;
  return trimmed.slice(-n);
}

export interface AnalysisLogEntry {
  text: string;
  metrics: TypingMetrics;
  result?: MoodAnalysisResponse;
  source: "ai" | "local" | "ai_fail";
  error?: string;
}

export async function appendLogRaw(line: string): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("append_log", { line });
  } catch (err) {
    console.warn("[keypal] append_log failed", err);
  }
}

export async function appendAnalysisLog(entry: AnalysisLogEntry): Promise<void> {
  const time = ts();
  const tag =
    entry.source === "ai"
      ? "AI_OK"
      : entry.source === "ai_fail"
        ? "AI_FAIL"
        : "LOCAL";
  const state = entry.result?.state ?? "UNKNOWN";
  const energy = entry.result?.energy?.toFixed(2) ?? "n/a";
  const reason = entry.result?.reason ?? entry.error ?? "";

  const m = entry.metrics;
  const metricsStr =
    `wpm=${m.wpm} bs=${m.backspaceRate.toFixed(2)} ` +
    `interval=${m.avgKeyInterval}ms pauses=${m.pauseCount} ` +
    `chars=${m.charCount} dur=${(m.durationMs / 1000).toFixed(1)}s`;

  const textPreview = truncate(entry.text, 200);

  const line =
    `${time} [${tag}] state=${state} energy=${energy} ` +
    `| ${metricsStr} | reason="${reason}" | text="${textPreview}"`;

  await appendLogRaw(line);
}

export async function getLogPath(): Promise<string | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("log_path");
  } catch {
    return null;
  }
}
