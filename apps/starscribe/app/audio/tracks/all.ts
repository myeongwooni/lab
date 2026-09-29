import type { Track } from "../track";
import { climax, ending, lullaby, title } from "./theme";

export const BUILDERS: Record<string, () => Track> = {
  title,
  lullaby,
  climax,
  ending,
};
