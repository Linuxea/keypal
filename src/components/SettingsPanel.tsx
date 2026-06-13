import { useEffect, useState } from "react";
import {
  AIConfig,
  AppConfig,
  INTERVAL_OPTIONS,
  IntervalSec,
  PET_KINDS,
  PET_EMOJI,
  PET_LABELS,
  PET_SIZE_OPTIONS,
  PetKind,
  PetSize,
} from "../lib/types";

interface SettingsPanelProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onApply: (cfg: AppConfig) => void;
  onApplyPet: (pet: PetKind) => void;
  onApplySize: (size: PetSize) => void;
  onApplyAI: (ai: AIConfig) => void;
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
    const next: AppConfig = {
      ...config,
      pet,
      petSize: size,
      ai,
    };
    onApply(next);
    onApplyPet(pet);
    onApplySize(size);
    onApplyAI(ai);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const card: React.CSSProperties = {
    width: 320,
    background: "rgba(28, 30, 36, 0.98)",
    color: "#eee",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "#9aa0a6",
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    background: "rgba(255,255,255,0.04)",
    color: "#eee",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    fontSize: 13,
    boxSizing: "border-box",
  };

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <strong style={{ fontSize: 15 }}>KeyPal 设置</strong>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 16,
            }}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <label style={labelStyle}>宠物种类</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PET_KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setPet(k)}
              style={{
                flex: "1 1 0",
                padding: "6px 4px",
                background: pet === k ? "rgba(120,160,255,0.2)" : "rgba(255,255,255,0.04)",
                border:
                  pet === k
                    ? "1px solid rgba(120,160,255,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#eee",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 18 }}>{PET_EMOJI[k]}</div>
              <div>{PET_LABELS[k]}</div>
            </button>
          ))}
        </div>

        <label style={labelStyle}>宠物大小</label>
        <div style={{ display: "flex", gap: 6 }}>
          {PET_SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              style={{
                flex: 1,
                padding: "6px",
                background: size === s ? "rgba(120,160,255,0.2)" : "rgba(255,255,255,0.04)",
                border:
                  size === s
                    ? "1px solid rgba(120,160,255,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#eee",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {s}px
            </button>
          ))}
        </div>

        <label style={labelStyle}>AI Base URL</label>
        <input
          style={inputStyle}
          value={ai.baseUrl}
          onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })}
          placeholder="https://api.deepseek.com"
        />

        <label style={labelStyle}>AI API Key</label>
        <input
          style={inputStyle}
          type="password"
          value={ai.apiKey}
          onChange={(e) => setAi({ ...ai, apiKey: e.target.value })}
          placeholder="sk-..."
          autoComplete="off"
        />

        <label style={labelStyle}>模型名</label>
        <input
          style={inputStyle}
          value={ai.model}
          onChange={(e) => setAi({ ...ai, model: e.target.value })}
          placeholder="deepseek-chat"
        />

        <label style={labelStyle}>分析触发间隔</label>
        <div style={{ display: "flex", gap: 6 }}>
          {INTERVAL_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setAi({ ...ai, intervalSec: s as IntervalSec })}
              style={{
                flex: 1,
                padding: "6px",
                background:
                  ai.intervalSec === s
                    ? "rgba(120,160,255,0.2)"
                    : "rgba(255,255,255,0.04)",
                border:
                  ai.intervalSec === s
                    ? "1px solid rgba(120,160,255,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#eee",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {s}s
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={apply}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(120,160,255,0.25)",
              border: "1px solid rgba(120,160,255,0.6)",
              borderRadius: 4,
              color: "#eee",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {saved ? "已保存 ✓" : "保存"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: "#eee",
              cursor: "pointer",
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
