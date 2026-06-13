import { useEffect, useRef } from "react";
import {
  AppConfig,
  PET_KINDS,
  PET_EMOJI,
  PET_LABELS,
  PetKind,
} from "../lib/types";

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  config: AppConfig;
  onPickPet: (pet: PetKind) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export function ContextMenu({
  open,
  x,
  y,
  config,
  onPickPet,
  onOpenSettings,
  onClose,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    minWidth: 160,
    background: "rgba(35, 36, 42, 0.96)",
    color: "#eee",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "6px 0",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    zIndex: 9999,
    userSelect: "none",
  };

  const itemStyle: React.CSSProperties = {
    padding: "6px 14px",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div ref={ref} style={style} onContextMenu={(e) => e.preventDefault()}>
      <div
        style={{
          padding: "4px 12px",
          color: "#888",
          fontSize: 11,
          textTransform: "uppercase",
        }}
      >
        切换宠物
      </div>
      {PET_KINDS.map((k) => (
        <div
          key={k}
          style={{
            ...itemStyle,
            background:
              config.pet === k ? "rgba(120,160,255,0.18)" : "transparent",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.background =
              config.pet === k
                ? "rgba(120,160,255,0.25)"
                : "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.background =
              config.pet === k ? "rgba(120,160,255,0.18)" : "transparent")
          }
          onClick={() => {
            onPickPet(k);
            onClose();
          }}
        >
          <span style={{ fontSize: 16 }}>{PET_EMOJI[k]}</span>
          <span>{PET_LABELS[k]}</span>
          {config.pet === k ? (
            <span style={{ marginLeft: "auto", color: "#7aa2ff" }}>✓</span>
          ) : null}
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          margin: "4px 0",
        }}
      />
      <div
        style={itemStyle}
        onMouseEnter={(e) =>
          ((e.target as HTMLElement).style.background =
            "rgba(255,255,255,0.06)")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLElement).style.background = "transparent")
        }
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
      >
        ⚙️ 设置
      </div>
      <div
        style={itemStyle}
        onMouseEnter={(e) =>
          ((e.target as HTMLElement).style.background =
            "rgba(255,80,80,0.15)")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLElement).style.background = "transparent")
        }
        onClick={() => {
          import("@tauri-apps/api/core")
            .then((m) => m.invoke("exit_app"))
            .catch((err) => console.error(err));
        }}
      >
        ✕ 退出
      </div>
    </div>
  );
}
