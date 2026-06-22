import type { PetArt } from "./types";

const catArt: Omit<PetArt, "render"> & { render: PetArt["render"] } = {
  kind: "cat",
  viewBox: "0 0 120 130",
  rootPivot: [60, 62],
  partPivots: {
    tail: [92, 92],
    legs: [60, 112],
    body: [60, 104],
    head: [60, 78],
    ears: [60, 33],
    eyes: [60, 56],
  },
  palette: {
    body: "#FF9A3C",
    accent: "#FFD9A0",
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

      <g data-part="tail">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <path d="M86,98 q20,-2 18,-22 q-1,-9 -10,-8 q-7,1 -7,9 q0,6 5,8" fill="#FF9A3C" />
        </g>
      </g>

      <g data-part="legs">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={48} cy={112} rx={8} ry={5} fill="#FF9A3C" />
          <ellipse cx={72} cy={112} rx={8} ry={5} fill="#FF9A3C" />
        </g>
      </g>

      <g data-part="body">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={90} rx={29} ry={26} fill="#FF9A3C" />
          <ellipse cx={60} cy={99} rx={16} ry={15} fill="#FFD9A0" />
        </g>
      </g>

      <g data-part="head">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={56} rx={27} ry={23} fill="#FF9A3C" />
          <g data-part="ears">
            <path d="M43,43 Q33,27 41,23 Q49,24 51,41 Z" fill="#FF9A3C" />
            <path d="M77,43 Q87,27 79,23 Q71,24 69,41 Z" fill="#FF9A3C" />
          </g>
        </g>
        <path d="M44,41 Q37,30 42,28 Q47,30 49,39 Z" fill="#FF7A8A" />
        <path d="M76,41 Q83,30 78,28 Q73,30 71,39 Z" fill="#FF7A8A" />
        <path d="M56,64 L64,64 L60,70 Z" fill="#FF7A8A" stroke="#2A1810" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M60,70 Q55,75 51,71" stroke="#2A1810" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M60,70 Q65,75 69,71" stroke="#2A1810" strokeWidth={2} fill="none" strokeLinecap="round" />
        <ellipse cx={42} cy={64} rx={4} ry={2.6} fill="#FF7A8A" opacity={0.85} />
        <ellipse cx={78} cy={64} rx={4} ry={2.6} fill="#FF7A8A" opacity={0.85} />
        <g data-part="eyes">
          <ellipse cx={50} cy={56} rx={3.8} ry={5} fill="#2A1810" />
          <ellipse cx={70} cy={56} rx={3.8} ry={5} fill="#2A1810" />
          <circle cx={51.4} cy={54} r={1.6} fill="#fff" />
          <circle cx={71.4} cy={54} r={1.6} fill="#fff" />
        </g>
      </g>
    </>
  ),
};

export const catArtDef: PetArt = catArt;
