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
        marginBottom: 6,
        background: "rgba(252,248,240,0.97)",
        color: "#3a3226",
        padding: "8px 16px",
        borderRadius: 16,
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
        fontWeight: 500,
        maxWidth: 280,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        border: "2px solid rgba(180,160,130,0.2)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)",
        pointerEvents: "none",
        zIndex: 100,
        animation: "keypal-bubble-in 0.2s ease-out",
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
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid rgba(252,248,240,0.97)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(100% - 2px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "10px solid rgba(180,160,130,0.2)",
          zIndex: -1,
        }}
      />
    </div>
  );
}
