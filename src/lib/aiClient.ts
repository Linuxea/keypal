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
    max_tokens: config.maxTokens,
    temperature: config.temperature,
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

  const params =
    (parsed.params as Record<string, unknown>) ?? undefined;

  return {
    thought: parseString(parsed.thought, ""),
    behaviorId: parseString(parsed.behaviorId, "idle"),
    params,
  };
}
