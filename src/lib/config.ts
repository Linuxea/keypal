import { AppConfig, AIConfig, DEFAULT_CONFIG } from "./types";

const STORE_FILE = "settings.json";

interface StoreApi {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  save: () => Promise<void>;
}

let storePromise: Promise<StoreApi | null> | null = null;

async function getStore(): Promise<StoreApi | null> {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    try {
      const mod = await import("@tauri-apps/plugin-store");
      const store = await (mod as unknown as {
        load: (path: string) => Promise<StoreApi>;
      }).load(STORE_FILE);
      return store ?? null;
    } catch (err) {
      console.warn("[keypal] store unavailable, using in-memory fallback", err);
      return null;
    }
  })();
  return storePromise;
}

const memoryStore = new Map<string, unknown>();

async function readValue<T>(key: string, fallback: T): Promise<T> {
  const store = await getStore();
  if (store) {
    const v = store.get(key);
    if (v !== undefined && v !== null) return v as T;
  } else {
    if (memoryStore.has(key)) return memoryStore.get(key) as T;
  }
  return fallback;
}

async function writeValue(key: string, value: unknown): Promise<void> {
  memoryStore.set(key, value);
  const store = await getStore();
  if (store) {
    store.set(key, value);
    try {
      await store.save();
    } catch (err) {
      console.warn("[keypal] store save failed", err);
    }
  }
}

function mergeConfig(partial: unknown): AppConfig {
  if (!partial || typeof partial !== "object") return { ...DEFAULT_CONFIG };
  const p = partial as Partial<AppConfig>;
  const ai: AIConfig = {
    ...DEFAULT_CONFIG.ai,
    ...(p.ai ?? {}),
  };
  return {
    pet: p.pet ?? DEFAULT_CONFIG.pet,
    petSize: p.petSize ?? DEFAULT_CONFIG.petSize,
    position: p.position ?? DEFAULT_CONFIG.position,
    ai,
  };
}

export const configStore = {
  async load(): Promise<AppConfig> {
    const raw = await readValue<unknown>("config", null);
    return mergeConfig(raw);
  },
  async save(cfg: AppConfig): Promise<void> {
    await writeValue("config", cfg);
  },
  async savePosition(x: number, y: number): Promise<void> {
    const current = await this.load();
    await writeValue("config", { ...current, position: { x, y } });
  },
  async saveAI(ai: AIConfig): Promise<void> {
    const current = await this.load();
    await writeValue("config", { ...current, ai });
  },
  async savePet(pet: AppConfig["pet"]): Promise<void> {
    const current = await this.load();
    await writeValue("config", { ...current, pet });
  },
  async savePetSize(size: AppConfig["petSize"]): Promise<void> {
    const current = await this.load();
    await writeValue("config", { ...current, petSize: size });
  },
};
