import type { PetArt } from "./types";

export const chickArtDef: PetArt = {
  kind: "chick",
  viewBox: "0 0 120 130",
  rootPivot: [60, 60],
  partPivots: {
    legs: [60, 104],
    body: [60, 98],
    eyes: [60, 54],
  },
  palette: {
    body: "#FFD966",
    accent: "#FFEFA0",
    dark: "#2A1810",
    outline: "#2A1810",
    blush: "#FF7A8A",
  },
  render: (uid) => (
    <>
      <defs>
        <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius="2.6" in="SourceAlpha" result="d" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="d" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>

      <g data-part="legs">
        <path d="M52,97 l-4,7 M52,97 l0,7 M52,97 l4,7" stroke="#FF8C1A" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <path d="M68,97 l-4,7 M68,97 l0,7 M68,97 l4,7" stroke="#FF8C1A" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </g>

      <g data-part="body">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={66} rx={30} ry={32} fill="#FFD966" />
          <ellipse cx={60} cy={74} rx={20} ry={24} fill="#FFEFA0" />
          <path d="M38,68 q-7,12 1,22 q9,5 13,-6 q2,-12 -5,-16 Z" fill="#F5C842" />
          <path d="M82,68 q7,12 -1,22 q-9,5 -13,-6 q-2,-12 5,-16 Z" fill="#F5C842" />
        </g>
        <path d="M54,60 L60,68 L66,60 Z" fill="#FF8C1A" stroke="#2A1810" strokeWidth={1.5} strokeLinejoin="round" />
        <ellipse cx={43} cy={62} rx={3.8} ry={2.4} fill="#FF7A8A" opacity={0.8} />
        <ellipse cx={77} cy={62} rx={3.8} ry={2.4} fill="#FF7A8A" opacity={0.8} />
        <g data-part="eyes">
          <circle cx={52} cy={54} r={3.4} fill="#2A1810" />
          <circle cx={68} cy={54} r={3.4} fill="#2A1810" />
          <circle cx={53.2} cy={52.6} r={1.4} fill="#fff" />
          <circle cx={69.2} cy={52.6} r={1.4} fill="#fff" />
        </g>
      </g>
    </>
  ),
};
