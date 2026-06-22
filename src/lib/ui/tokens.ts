import type { CSSProperties } from "react";

export const STICKER = {
  surface: "#FFFDF7",
  ink: "#2A1810",
  border: "#2A1810",
  accent: "#FF9A3C",
  pink: "#FF7A8A",
  muted: "#9a8a72",
  danger: "#D94A4A",
  hoverTint: "#FFE9D2",
  fontFamily: "'PingFang SC','Microsoft YaHei',system-ui,sans-serif",
  strokeWidth: 2.5,
  radius: 14,
  radiusLg: 20,
} as const;

export const stickerShadow = `0 0 0 3px ${STICKER.surface}, 0 10px 22px rgba(0,0,0,0.4)`;
export const stickerShadowSoft = `0 0 0 3px ${STICKER.surface}, 0 6px 16px rgba(0,0,0,0.35)`;

export const stickerSurface = (radius: number = STICKER.radius): CSSProperties => ({
  background: STICKER.surface,
  color: STICKER.ink,
  border: `${STICKER.strokeWidth}px solid ${STICKER.border}`,
  borderRadius: radius,
  boxShadow: stickerShadow,
  fontFamily: STICKER.fontFamily,
});

export const labelStyle = (): CSSProperties => ({
  display: "block",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: STICKER.muted,
  margin: "12px 0 6px",
});

export const inputStyle = (): CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  background: STICKER.surface,
  color: STICKER.ink,
  border: `${STICKER.strokeWidth - 0.3}px solid ${STICKER.border}`,
  borderRadius: 10,
  padding: "7px 9px",
  fontSize: 12,
  fontWeight: 600,
  outline: "none",
});
