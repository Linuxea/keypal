export type LogScope = "brain" | "exec" | "speech" | "ai" | "app";

function timestamp(): string {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  );
}

function formatScope(scope: LogScope): string {
  return `[${scope}]`.padEnd(8);
}

function buildLine(scope: LogScope, message: string): string {
  return `${timestamp()} ${formatScope(scope)} ${message}`;
}

export async function appendLogRaw(line: string): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("append_log", { line });
  } catch (err) {
    console.warn("[keypal] append_log failed", err);
  }
}

export async function log(scope: LogScope, message: string): Promise<void> {
  const line = buildLine(scope, message);
  console.log(line);
  await appendLogRaw(line);
}

export async function logError(
  scope: LogScope,
  message: string,
  err?: unknown,
): Promise<void> {
  let suffix = "";
  if (err instanceof Error) {
    suffix = ` | ${err.message}${err.stack ? `\n${err.stack}` : ""}`;
  } else if (err !== undefined) {
    suffix = ` | ${String(err)}`;
  }
  const line = buildLine(scope, `${message}${suffix}`);
  console.warn(line);
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
