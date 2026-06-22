import { useEffect, useState } from "react";
import { STICKER } from "../lib/ui/tokens";

interface SpeechBubbleProps {
  text: string | null;
  durationMs?: number;
  tint?: string;
}

export function SpeechBubble({ text, durationMs = 5000, tint }: SpeechBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  useEffect(() => {
    if (text) {
      setCurrentText(text);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), durationMs);
      return () => clearTimeout(timer);
    }
  }, [text, durationMs]);

  if (!visible || !currentText) return null;

  return (
    <div
      style={{
        background: STICKER.surface,
        color: STICKER.ink,
        border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
        borderRadius: 16,
        padding: "7px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: STICKER.fontFamily,
        fontWeight: 800,
        maxWidth: 280,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        boxShadow: `0 0 0 3px ${STICKER.surface}, 0 8px 18px rgba(0,0,0,0.35)`,
        pointerEvents: "none",
        zIndex: 100,
        animation: "keypal-bubble-in 0.2s ease-out",
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      {tint ? (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: tint,
            flex: "0 0 auto",
          }}
        />
      ) : null}
      <span>{currentText}</span>
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: `9px solid ${STICKER.border}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "calc(100% - 2.5px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `6px solid ${STICKER.surface}`,
          zIndex: 2,
        }}
      />
    </div>
  );
}
