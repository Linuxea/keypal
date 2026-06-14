import { AIConfig } from "./types";
import { AIDecision, BehaviorContext } from "./plugins/types";
import { log } from "./log";

function extractJson(text: string): {
  json: Record<string, unknown> | null;
  usedRegex: boolean;
} {
  const trimmed = text.trim();
  try {
    return { json: JSON.parse(trimmed), usedRegex: false };
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return { json: null, usedRegex: false };
    try {
      return { json: JSON.parse(match[0]), usedRegex: true };
    } catch {
      return { json: null, usedRegex: true };
    }
  }
}

function parseString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export async function decideBehavior(
  config: AIConfig,
  systemPrompt: string,
  context: BehaviorContext,
): Promise<AIDecision> {
  if (!config.apiKey) {
    await log("ai", `error missing_api_key model=${config.model}`);
    throw new Error("missing_api_key");
  }
  if (!config.baseUrl) {
    await log("ai", `error missing_base_url model=${config.model}`);
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
  const t0 = Date.now();

  await log("ai", `req model=${config.model} url=${url}`);

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
    const latency = Date.now() - t0;
    if (err instanceof DOMException && err.name === "AbortError") {
      await log("ai", `error timeout model=${config.model} latency=${latency}ms`);
      throw new Error("timeout");
    }
    await log(
      "ai",
      `error network model=${config.model} latency=${latency}ms msg=${truncate((err as Error).message, 120)}`,
    );
    throw new Error(`network: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const latency = Date.now() - t0;
    await log(
      "ai",
      `error http_${resp.status} model=${config.model} latency=${latency}ms body=${truncate(text, 120)}`,
    );
    throw new Error(`http_${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json().catch(() => null);
  if (!data) {
    const latency = Date.now() - t0;
    await log(
      "ai",
      `error invalid_json_response model=${config.model} latency=${latency}ms`,
    );
    throw new Error("invalid_json_response");
  }

  const content: string =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    "";

  const { json: parsed, usedRegex } = extractJson(String(content));
  if (!parsed) {
    const latency = Date.now() - t0;
    await log(
      "ai",
      `error parse_failed model=${config.model} latency=${latency}ms content=${truncate(String(content), 120)}`,
    );
    throw new Error("parse_failed");
  }

  const latency = Date.now() - t0;
  await log(
    "ai",
    `resp model=${config.model} -> ${resp.status} ${latency}ms parse=${usedRegex ? "regex-fallback" : "clean"} behavior=${parseString(parsed.behaviorId, "idle")}`,
  );

  const params = (parsed.params as Record<string, unknown>) ?? undefined;

  return {
    thought: parseString(parsed.thought, ""),
    behaviorId: parseString(parsed.behaviorId, "idle"),
    params,
  };
}
