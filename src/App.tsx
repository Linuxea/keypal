import { useCallback, useEffect, useState } from "react";
import { PetView } from "./components/PetView";
import { ContextMenu } from "./components/ContextMenu";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechBubble } from "./components/SpeechBubble";
import { HoverToolbar } from "./components/HoverToolbar";
import { useBehavior } from "./hooks/useBehavior";
import { useDrag } from "./hooks/useDrag";
import { configStore } from "./lib/config";
import { log } from "./lib/log";
import { getPetArt } from "./lib/petArt";
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
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [quiet, setQuiet] = useState(false);

  const behavior = useBehavior(config.ai, config.pet);

  useEffect(() => {
    behavior.setActive(!quiet);
  }, [quiet, behavior]);

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
          await w.setPosition(new win.LogicalPosition(cfg.position.x, cfg.position.y));
        }
        const { width: targetW, height: targetH } = windowSizeForPet(cfg.petSize);
        if (Math.abs(winSize.toLogical(factor).width - targetW) > 2) {
          await w.setSize(new win.LogicalSize(targetW, targetH));
        }
        behavior.setScreenSize(window.screen.width, window.screen.height);
      } catch (err) {
        console.warn("[keypal] window init failed", err);
      }
      await log("app", `===== KeyPal ready pet=${cfg.pet} apiKey=${cfg.ai.apiKey ? "(set)" : "(empty)"} =====`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onQuit = useCallback(() => {
    import("@tauri-apps/api/core")
      .then((m) => m.invoke("exit_app"))
      .catch((err) => console.error(err));
  }, []);

  if (!loaded) return null;

  const tint = getPetArt(config.pet).palette.body;

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
          bottom: config.petSize + (hovered ? 64 : 28),
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <SpeechBubble text={behavior.currentSpeech} tint={tint} />
      </div>

      <div
        style={{
          pointerEvents: "auto",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && (
          <div style={{ pointerEvents: "auto" }}>
            <HoverToolbar
              pet={config.pet}
              quiet={quiet}
              onPickPet={onPickPet}
              onOpenSettings={() => setSettingsOpen(true)}
              onToggleQuiet={() => setQuiet((q) => !q)}
              onQuit={onQuit}
            />
          </div>
        )}

        <PetView
          pet={config.pet}
          animation={behavior.currentAnimation}
          energy={behavior.energy}
          size={config.petSize}
          flipX={behavior.flipX}
          onContextMenu={onContextMenu}
          onMouseDown={(e) => {
            if (e.button === 0) void startDrag(e);
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
