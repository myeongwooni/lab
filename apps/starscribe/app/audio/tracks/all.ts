import type { Track } from "../track";
import { climax, ending, lullaby, title } from "./theme";
import { archive, festival, north, sea, tower } from "./places";
import { lucien, sorrow, tension, villain, warm } from "./moods";

export const BUILDERS: Record<string, () => Track> = {
  title,
  lullaby,
  archive,
  tower,
  warm,
  lucien,
  festival,
  tension,
  sorrow,
  villain,
  north,
  sea,
  climax,
  ending,
};
