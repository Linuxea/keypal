import { useEffect, useState } from "react";

interface SpeechBubbleProps {
  text: string | null;
  durationMs?: number;
}

export function SpeechBubble({ text, durationMs = 5000 }: SpeechBubbleProps) {
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
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: 4,
        background: "rgba(255,255,255,0.95)",
        color: "#222",
        padding: "6px 12px",
        borderRadius: 10,
        fontSize: 12,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 200,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {currentText}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(255,255,255,0.95)",
        }}
      />
    </div>
  );
}
