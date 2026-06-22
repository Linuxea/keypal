import type { PetArt } from "./types";

export const frogArtDef: PetArt = {
  kind: "frog",
  viewBox: "0 0 120 130",
  rootPivot: [60, 60],
  partPivots: {
    legs: [60, 108],
    body: [60, 96],
    head: [60, 68],
    eyes: [60, 32],
  },
  palette: {
    body: "#6AA84F",
    accent: "#B6D7A8",
    dark: "#2A1810",
    outline: "#2A1810",
    blush: "#E88B94",
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
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={42} cy={106} rx={10} ry={5} fill="#6AA84F" />
          <ellipse cx={78} cy={106} rx={10} ry={5} fill="#6AA84F" />
        </g>
      </g>

      <g data-part="body">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={84} rx={34} ry={26} fill="#6AA84F" />
          <ellipse cx={60} cy={92} rx={20} ry={16} fill="#B6D7A8" />
        </g>
        <circle cx={44} cy={92} r={3} fill="#4A8530" opacity={0.7} />
        <circle cx={76} cy={96} r={3} fill="#4A8530" opacity={0.7} />
      </g>

      <g data-part="head">
        <g filter={`url(#${uid})`} stroke="#2A1810" strokeWidth={3} strokeLinejoin="round">
          <ellipse cx={60} cy={56} rx={31} ry={22} fill="#6AA84F" />
          <circle cx={46} cy={32} r={11} fill="#6AA84F" />
          <circle cx={74} cy={32} r={11} fill="#6AA84F" />
        </g>
        <path d="M40,58 Q60,76 80,58" stroke="#2A1810" strokeWidth={3} fill="none" strokeLinecap="round" />
        <ellipse cx={60} cy={66} rx={4} ry={2.6} fill="#2A1810" />
        <ellipse cx={36} cy={62} rx={4} ry={2.6} fill="#E88B94" opacity={0.7} />
        <ellipse cx={84} cy={62} rx={4} ry={2.6} fill="#E88B94" opacity={0.7} />
        <g data-part="eyes">
          <circle cx={46} cy={32} r={7} fill="#fff" stroke="#2A1810" strokeWidth={1.4} />
          <circle cx={74} cy={32} r={7} fill="#fff" stroke="#2A1810" strokeWidth={1.4} />
          <circle cx={47} cy={34} r={3.4} fill="#2A1810" />
          <circle cx={75} cy={34} r={3.4} fill="#2A1810" />
          <circle cx={48} cy={31} r={1.2} fill="#fff" />
          <circle cx={76} cy={31} r={1.2} fill="#fff" />
        </g>
      </g>
    </>
  ),
};
