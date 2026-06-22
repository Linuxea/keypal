import type { PetArt } from "./types";

export const dogArtDef: PetArt = {
  kind: "dog",
  viewBox: "0 0 120 130",
  rootPivot: [60, 64],
  partPivots: {
    tail: [60, 86],
    legs: [60, 112],
    body: [60, 104],
    head: [60, 70],
    ears: [36, 44],
    eyes: [60, 54],
  },
  palette: {
    body: "#C9956A",
    accent: "#F2E6D0",
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
          <path d="M84,86 q10,-10 4,-22 q-6,-6 -10,2 q-2,8 4,10" fill="#9C6B3F" />
        </g>
      </g>

      <g data-part="ears">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <path d="M38,44 q-14,6 -12,34 q2,12 14,10 q12,-3 10,-26 q-1,-14 -12,-18 Z" fill="#9C6B3F" />
          <path d="M82,44 q14,6 12,34 q-2,12 -14,10 q-12,-3 -10,-26 q1,-14 12,-18 Z" fill="#9C6B3F" />
        </g>
      </g>

      <g data-part="legs">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={47} cy={112} rx={7.5} ry={4.6} fill="#C9956A" />
          <ellipse cx={73} cy={112} rx={7.5} ry={4.6} fill="#C9956A" />
        </g>
      </g>

      <g data-part="body">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={90} rx={27} ry={22} fill="#C9956A" />
          <ellipse cx={60} cy={98} rx={15} ry={14} fill="#F2E6D0" />
        </g>
      </g>

      <g data-part="head">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={56} rx={26} ry={22} fill="#C9956A" />
          <ellipse cx={60} cy={66} rx={13} ry={9} fill="#F2E6D0" />
        </g>
        <ellipse cx={60} cy={63} rx={4} ry={3} fill="#2A1810" />
        <path d="M60,66 Q55,72 51,70" stroke="#2A1810" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M60,66 Q65,72 69,70" stroke="#2A1810" strokeWidth={2} fill="none" strokeLinecap="round" />
        <ellipse cx={60} cy={74} rx={3.4} ry={4.6} fill="#FF7A8A" />
        <ellipse cx={43} cy={62} rx={3.6} ry={2.2} fill="#E88B94" opacity={0.7} />
        <ellipse cx={77} cy={62} rx={3.6} ry={2.2} fill="#E88B94" opacity={0.7} />
        <g data-part="eyes">
          <circle cx={49} cy={54} r={4.4} fill="#2A1810" />
          <circle cx={71} cy={54} r={4.4} fill="#2A1810" />
          <circle cx={50.5} cy={52.5} r={1.7} fill="#fff" />
          <circle cx={72.5} cy={52.5} r={1.7} fill="#fff" />
        </g>
      </g>
    </>
  ),
};
