import { useEffect, useRef, useId } from "react";
import {
  AppConfig,
  PET_KINDS,
  PET_LABELS,
  PetKind,
} from "../lib/types";
import { getPetArt } from "../lib/petArt";
import { STICKER } from "../lib/ui/tokens";

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  config: AppConfig;
  onPickPet: (pet: PetKind) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

function PetBadge({ kind, size = 22 }: { kind: PetKind; size?: number }) {
  const art = getPetArt(kind);
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox={art.viewBox} width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <g transform="translate(0 -4) scale(1)">
        {art.render(uid)}
      </g>
    </svg>
  );
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

  const itemStyle = (): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 700,
    color: STICKER.ink,
    cursor: "default",
  });

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: x,
        top: y,
        minWidth: 160,
        background: STICKER.surface,
        color: STICKER.ink,
        border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
        borderRadius: STICKER.radius,
        boxShadow: `0 0 0 3px ${STICKER.surface}, 0 10px 22px rgba(0,0,0,0.4)`,
        padding: 6,
        fontFamily: STICKER.fontFamily,
        fontSize: 13,
        zIndex: 9999,
        userSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={{ padding: "4px 8px", color: STICKER.muted, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        切换宠物
      </div>
      {PET_KINDS.map((k) => (
        <div
          key={k}
          style={{
            ...itemStyle(),
            background: config.pet === k ? STICKER.hoverTint : "transparent",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = STICKER.hoverTint)}
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.background = config.pet === k ? STICKER.hoverTint : "transparent")
          }
          onClick={() => {
            onPickPet(k);
            onClose();
          }}
        >
          <PetBadge kind={k} />
          <span>{PET_LABELS[k]}</span>
          {config.pet === k ? (
            <span style={{ marginLeft: "auto", color: STICKER.accent, fontSize: 16, lineHeight: 1 }}>●</span>
          ) : null}
        </div>
      ))}
      <div style={{ height: 2, background: "#EEE6D5", borderRadius: 2, margin: "4px 6px" }} />
      <div
        style={itemStyle()}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.background = STICKER.hoverTint)}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
      >
        <span style={{ fontSize: 15 }}>⚙️</span>
        <span>设置</span>
      </div>
      <div
        style={{ ...itemStyle(), color: STICKER.danger }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "rgba(217,74,74,0.15)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
        onClick={() => {
          import("@tauri-apps/api/core")
            .then((m) => m.invoke("exit_app"))
            .catch((err) => console.error(err));
        }}
      >
        <span style={{ fontSize: 15 }}>✕</span>
        <span>退出</span>
      </div>
    </div>
  );
}
