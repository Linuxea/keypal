import {
  AIConfig,
  MoodAnalysisRequest,
  MoodAnalysisResponse,
  MoodState,
} from "./types";

const SYSTEM_PROMPT = `你是一个桌面宠物的情绪分析引擎。根据用户的打字内容和行为数据，判断用户当前的情绪状态。只能返回 JSON。

返回格式：
{
  "state": "IDLE" | "HAPPY" | "FOCUSED" | "ANXIOUS" | "SLEEPY",
  "energy": 0.0-1.0,
  "reason": "10字内"
}

text 字段说明：
- 用户使用中文输入法（IME）时，text 是按键序列（拼音字母、空格、回车）
- 例如 "wo hen kai xin" 表示用户在打"我很开心"
- 需要识别常见中文拼音的语义
- 若 text 是纯空白，主要依据 typingMetrics 判断

判断规则（必须严格基于实际内容判定，不要默认偏向）：
- ANXIOUS：text 含明确负面词
  · 拼音脏话/抱怨：ta ma, tm, cao, fuck, shit, damn, wtf, fan si, beng kui
  · 中文：烦死、累、崩溃、压力、紧张、草、妈的
  · 英文：deadline, error, crash, fail, stuck, blocked
  · 或退格率 > 0.15
- HAPPY：text 含明确正面词
  · 拼音：kai xin, gao xing, xi huan, zan, bang, tai hao le
  · 中文：开心、高兴、喜欢、赞、棒、太好了
  · 英文：good, great, nice, love, awesome, done, finished
  · 且退格率 < 0.1
- FOCUSED：text 是代码/技术内容（function, class, import, def, const, var 等），WPM 中等稳定
- IDLE：内容稀少且无明显情绪倾向
- SLEEPY：永远不返回（由前端判断）

energy 值影响动画速度（0.3=慢，1.0=快）

注意：无明确情绪倾向时判 IDLE，不要默认偏向 ANXIOUS 或 HAPPY。`;

function buildBody(req: MoodAnalysisRequest, model: string) {
  const userMsg = JSON.stringify(req);
  return {
    model,
    max_tokens: 100,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  };
}

function parseState(s: unknown): MoodState | null {
  if (typeof s !== "string") return null;
  const upper = s.trim().toUpperCase();
  const valid: MoodState[] = ["IDLE", "HAPPY", "FOCUSED", "ANXIOUS", "SLEEPY"];
  return valid.includes(upper as MoodState) ? (upper as MoodState) : null;
}

function parseEnergy(e: unknown): number {
  const n = Number(e);
  if (!Number.isFinite(n)) return 0.7;
  return Math.max(0.1, Math.min(1.0, n));
}

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

export async function analyzeMood(
  config: AIConfig,
  req: MoodAnalysisRequest,
): Promise<MoodAnalysisResponse> {
  if (!config.apiKey) {
    throw new Error("missing_api_key");
  }
  if (!config.baseUrl) {
    throw new Error("missing_base_url");
  }

  const base = config.baseUrl.replace(/\/+$/, "");
  const url = `${base}/v1/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildBody(req, config.model)),
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
  if (!parsed) {
    throw new Error("parse_failed");
  }

  const state = parseState(parsed.state);
  if (!state) {
    throw new Error("invalid_state");
  }

  return {
    state,
    energy: parseEnergy(parsed.energy),
    reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 30) : "",
  };
}
