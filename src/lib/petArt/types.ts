import type { ReactNode } from "react";
import type { PetKind } from "../types";

export interface PetPalette {
  body: string;
  accent: string;
  dark: string;
  outline: string;
  blush: string;
}

export interface PetArt {
  kind: PetKind;
  viewBox: string;
  rootPivot: [number, number];
  partPivots: Record<string, [number, number]>;
  palette: PetPalette;
  render: (uid: string) => ReactNode;
}

export const ROOT_PART = "__root__";
