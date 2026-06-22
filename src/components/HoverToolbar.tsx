import { useState, useId } from "react";
import { PET_KINDS, PET_LABELS, PetKind } from "../lib/types";
import { getPetArt } from "../lib/petArt";
import { STICKER } from "../lib/ui/tokens";

interface HoverToolbarProps {
  pet: PetKind;
  quiet: boolean;
  onPickPet: (p: PetKind) => void;
  onOpenSettings: () => void;
  onToggleQuiet: () => void;
  onQuit: () => void;
}

function MiniPet({ kind, size = 24 }: { kind: PetKind; size?: number }) {
  const art = getPetArt(kind);
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox={art.viewBox} width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      {art.render(uid)}
    </svg>
  );
}

export function HoverToolbar({
  pet,
  quiet,
  onPickPet,
  onOpenSettings,
  onToggleQuiet,
  onQuit,
}: HoverToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const baseBtn = (bg: string, color: string): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: bg,
    color,
    border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 15,
    boxShadow: `0 0 0 2px ${STICKER.surface}, 0 4px 10px rgba(0,0,0,0.35)`,
    padding: 0,
    lineHeight: 1,
  });

  return (
    <div style={{ position: "relative", display: "flex", gap: 8, marginBottom: 10, animation: "keypal-bubble-in 0.15s ease-out" }}>
      <button
        style={baseBtn(STICKER.accent, "#fff")}
        title="切换宠物"
        onClick={(e) => {
          e.stopPropagation();
          setPickerOpen((v) => !v);
        }}
      >
        <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <MiniPet kind={pet} size={26} />
        </span>
      </button>
      <button style={baseBtn(STICKER.surface, STICKER.ink)} title="设置" onClick={onOpenSettings}>
        ⚙️
      </button>
      <button
        style={baseBtn(quiet ? STICKER.muted : STICKER.surface, quiet ? "#fff" : STICKER.ink)}
        title={quiet ? "恢复活力" : "安静模式"}
        onClick={onToggleQuiet}
      >
        {quiet ? "🔇" : "🌙"}
      </button>
      <button style={baseBtn(STICKER.pink, "#fff")} title="退出" onClick={onQuit}>
        ✕
      </button>

      {pickerOpen ? (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: STICKER.surface,
            border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
            borderRadius: STICKER.radius,
            boxShadow: `0 0 0 3px ${STICKER.surface}, 0 10px 22px rgba(0,0,0,0.4)`,
            padding: 6,
            display: "flex",
            gap: 6,
            fontFamily: STICKER.fontFamily,
            zIndex: 200,
          }}
        >
          {PET_KINDS.map((k) => (
            <button
              key={k}
              title={PET_LABELS[k]}
              onClick={(e) => {
                e.stopPropagation();
                onPickPet(k);
                setPickerOpen(false);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: pet === k ? STICKER.hoverTint : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <MiniPet kind={k} size={30} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
