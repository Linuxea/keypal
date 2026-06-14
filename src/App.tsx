import { useCallback, useEffect, useState } from "react";
import { Pet } from "./components/Pet";
import { ContextMenu } from "./components/ContextMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechBubble } from "./components/SpeechBubble";
import { useBehavior } from "./hooks/useBehavior";
import { useDrag } from "./hooks/useDrag";
import { configStore } from "./lib/config";
import { log } from "./lib/log";
import {
  AIConfig,
  AppConfig,
  DEFAULT_CONFIG,
  PetKind,
  PetSize,
  windowSizeForPet,
} from "./lib/types";

export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const behavior = useBehavior(config.ai, config.pet);

  useEffect(() => {
    (async () => {
      await log("app", "===== KeyPal starting =====");
      const cfg = await configStore.load();
      setConfig(cfg);
      setLoaded(true);
      try {
        const win = await import("@tauri-apps/api/window");
        const w = win.getCurrentWindow();
        const factor = await w.scaleFactor();
        const winSize = await w.outerSize();
        if (cfg.position) {
          await w.setPosition(
            new win.LogicalPosition(cfg.position.x, cfg.position.y),
          );
        }
        const { width: targetW, height: targetH } = windowSizeForPet(cfg.petSize);
        if (Math.abs(winSize.toLogical(factor).width - targetW) > 2) {
          await w.setSize(
            new win.LogicalSize(targetW, targetH),
          );
        }
        behavior.setScreenSize(window.screen.width, window.screen.height);
      } catch (err) {
        console.warn("[keypal] window init failed", err);
      }
      await log("app", `===== KeyPal ready pet=${cfg.pet} apiKey=${cfg.ai.apiKey ? "(set)" : "(empty)"} =====`);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const win = await import("@tauri-apps/api/window");
        const w = win.getCurrentWindow();
        const { width: targetW, height: targetH } = windowSizeForPet(config.petSize);
        await w.setSize(new win.LogicalSize(targetW, targetH));
      } catch (err) {
        console.warn("[keypal] resize failed", err);
      }
    })();
  }, [config.petSize, loaded]);

  const { startDrag } = useDrag({});

  const onPickPet = useCallback(async (p: PetKind) => {
    setConfig((c) => ({ ...c, pet: p }));
    await configStore.savePet(p);
  }, []);

  const onApplyAI = useCallback(async (ai: AIConfig) => {
    setConfig((c) => ({ ...c, ai }));
    await configStore.saveAI(ai);
  }, []);

  const onApplySize = useCallback(async (s: PetSize) => {
    setConfig((c) => ({ ...c, petSize: s }));
    await configStore.savePetSize(s);
  }, []);

  const onApplyFull = useCallback(async (cfg: AppConfig) => {
    setConfig(cfg);
    await configStore.save(cfg);
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 220);
    setMenuPos({ x, y });
    setMenuOpen(true);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 16,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: config.petSize + 24,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <SpeechBubble text={behavior.currentSpeech} />
      </div>

      <div style={{ pointerEvents: "auto", position: "relative" }}>
        <Pet
          pet={config.pet}
          animations={behavior.animations}
          currentAnimation={behavior.currentAnimation}
          energy={behavior.energy}
          size={config.petSize}
          flipX={behavior.flipX}
          onContextMenu={onContextMenu}
          onMouseDown={(e) => {
            if (e.button === 0) {
              void startDrag(e);
            }
          }}
        />
      </div>

      <ContextMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        config={config}
        onPickPet={onPickPet}
        onOpenSettings={() => setSettingsOpen(true)}
        onClose={() => setMenuOpen(false)}
      />

      <SettingsPanel
        open={settingsOpen}
        config={config}
        onClose={() => setSettingsOpen(false)}
        onApply={onApplyFull}
        onApplyPet={onPickPet}
        onApplySize={onApplySize}
        onApplyAI={onApplyAI}
      />
    </div>
  );
}
