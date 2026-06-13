export async function appendLogRaw(line: string): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("append_log", { line });
  } catch (err) {
    console.warn("[keypal] append_log failed", err);
  }
}

export async function getLogPath(): Promise<string | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("log_path");
  } catch {
    return null;
  }
}
