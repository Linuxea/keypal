import { useEffect, useState, useId } from "react";
import {
  AIConfig,
  AppConfig,
  INTERVAL_OPTIONS,
  IntervalSec,
  PET_KINDS,
  PET_LABELS,
  PET_SIZE_OPTIONS,
  PetKind,
  PetSize,
} from "../lib/types";
import { getPetArt } from "../lib/petArt";
import { STICKER, labelStyle, inputStyle } from "../lib/ui/tokens";

interface SettingsPanelProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onApply: (cfg: AppConfig) => void;
  onApplyPet: (pet: PetKind) => void;
  onApplySize: (size: PetSize) => void;
  onApplyAI: (ai: AIConfig) => void;
}

function MiniPet({ kind, active }: { kind: PetKind; active: boolean }) {
  const art = getPetArt(kind);
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={art.viewBox}
      width={30}
      height={30}
      style={{ display: "block", overflow: "visible", opacity: active ? 1 : 0.85 }}
    >
      {art.render(uid)}
    </svg>
  );
}

export function SettingsPanel({
  open,
  config,
  onClose,
  onApply,
  onApplyPet,
  onApplySize,
  onApplyAI,
}: SettingsPanelProps) {
  const [ai, setAi] = useState<AIConfig>(config.ai);
  const [pet, setPet] = useState<PetKind>(config.pet);
  const [size, setSize] = useState<PetSize>(config.petSize);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setAi(config.ai);
      setPet(config.pet);
      setSize(config.petSize);
      setSaved(false);
    }
  }, [open, config]);

  if (!open) return null;

  const apply = () => {
    const next: AppConfig = { ...config, pet, petSize: size, ai };
    onApply(next);
    onApplyPet(pet);
    onApplySize(size);
    onApplyAI(ai);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const chipBase = (on: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 54,
    border: `${STICKER.strokeWidth - 0.3}px solid ${STICKER.border}`,
    borderRadius: 11,
    padding: "7px 4px",
    textAlign: "center",
    fontSize: 11,
    fontWeight: 800,
    background: on ? STICKER.accent : STICKER.surface,
    color: on ? "#fff" : STICKER.ink,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  });

  const pill = (on: boolean): React.CSSProperties => ({
    flex: 1,
    border: `${STICKER.strokeWidth - 0.3}px solid ${STICKER.border}`,
    borderRadius: 11,
    padding: "7px 4px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
    background: on ? STICKER.accent : STICKER.surface,
    color: on ? "#fff" : STICKER.ink,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 320,
          background: STICKER.surface,
          color: STICKER.ink,
          border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
          borderRadius: STICKER.radiusLg,
          boxShadow: `0 0 0 3px ${STICKER.surface}, 0 16px 40px rgba(0,0,0,0.45)`,
          padding: 18,
          fontFamily: STICKER.fontFamily,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <strong style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <MiniPet kind={pet} active /> KeyPal 设置
          </strong>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: STICKER.muted, cursor: "pointer", fontSize: 16 }}
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 10, color: STICKER.muted, fontWeight: 700, marginBottom: 6 }}>一切都在这里调</div>

        <label style={labelStyle()}>宠物</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PET_KINDS.map((k) => (
            <button key={k} style={chipBase(pet === k)} onClick={() => setPet(k)}>
              <MiniPet kind={k} active={pet === k} />
              {PET_LABELS[k]}
            </button>
          ))}
        </div>

        <label style={labelStyle()}>大小</label>
        <div style={{ display: "flex", gap: 6 }}>
          {PET_SIZE_OPTIONS.map((s) => (
            <button key={s} style={pill(size === s)} onClick={() => setSize(s)}>
              {s}px
            </button>
          ))}
        </div>

        <label style={labelStyle()}>AI Base URL</label>
        <input style={inputStyle()} value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} placeholder="https://api.deepseek.com" />

        <label style={labelStyle()}>AI API Key</label>
        <input style={inputStyle()} type="password" value={ai.apiKey} onChange={(e) => setAi({ ...ai, apiKey: e.target.value })} placeholder="sk-..." autoComplete="off" />

        <label style={labelStyle()}>模型名</label>
        <input style={inputStyle()} value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} placeholder="deepseek-chat" />

        <label style={labelStyle()}>思考间隔</label>
        <div style={{ display: "flex", gap: 6 }}>
          {INTERVAL_OPTIONS.map((s) => (
            <button key={s} style={pill(ai.intervalSec === s)} onClick={() => setAi({ ...ai, intervalSec: s as IntervalSec })}>
              {s}s
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={apply}
            style={{
              flex: 1,
              padding: "9px",
              background: STICKER.accent,
              border: `${STICKER.strokeWidth - 0.3}px solid ${STICKER.border}`,
              borderRadius: 11,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {saved ? "已保存 ✓" : "保存"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "9px",
              background: STICKER.surface,
              border: `${STICKER.strokeWidth - 0.3}px solid ${STICKER.border}`,
              borderRadius: 11,
              color: STICKER.ink,
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
