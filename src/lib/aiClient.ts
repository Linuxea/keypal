import { AIConfig } from "./types";
import { AIDecision, BehaviorContext } from "./plugins/types";

function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function parseNumber(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

export async function decideBehavior(
  config: AIConfig,
  systemPrompt: string,
  context: BehaviorContext,
): Promise<AIDecision> {
  if (!config.apiKey) {
    throw new Error("missing_api_key");
  }
  if (!config.baseUrl) {
    throw new Error("missing_base_url");
  }

  const base = config.baseUrl.replace(/\/+$/, "");
  const url = `${base}/v1/chat/completions`;

  const userMsg = JSON.stringify(context);

  const body = {
    model: config.model,
    max_tokens: 300,
    temperature: 0.8,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("timeout");
    }
    throw new Error(`network: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`http_${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json().catch(() => null);
  if (!data) throw new Error("invalid_json_response");

  const content: string =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    "";

  const parsed = extractJson(String(content));
  if (!parsed) throw new Error("parse_failed");

  const emotion = parsed.emotion as Record<string, unknown> | undefined;
  const action = parsed.action as Record<string, unknown> | undefined;

  return {
    thought: parseString(parsed.thought, ""),
    emotion: {
      primary: parseString(emotion?.primary, "IDLE"),
      energy: parseNumber(emotion?.energy, 0.5, 0.1, 1.0),
      mood: parseString(emotion?.mood, ""),
    },
    action: {
      type: parseString(action?.type, "idle"),
      params: (action?.params as Record<string, unknown>) ?? undefined,
      description: parseString(action?.description, ""),
    },
    speech: typeof parsed.speech === "string" ? parsed.speech : null,
  };
}
