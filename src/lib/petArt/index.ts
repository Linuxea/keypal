import type { PetKind } from "../types";
import type { PetArt } from "./types";
import { catArtDef } from "./cat";
import { dogArtDef } from "./dog";
import { frogArtDef } from "./frog";
import { chickArtDef } from "./chick";

export const PET_ART: Record<PetKind, PetArt> = {
  cat: catArtDef,
  dog: dogArtDef,
  frog: frogArtDef,
  chick: chickArtDef,
};

export function getPetArt(kind: PetKind): PetArt {
  return PET_ART[kind];
}

export * from "./types";
