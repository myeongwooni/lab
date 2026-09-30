import type { Track } from "../track";
import { between, climax, ending, title } from "./theme";
import { court, festival, seoul, solein, tavern, villa } from "./places";
import { elios, razel, sian } from "./people";
import { death, sorrow, tension } from "./moods";

export const BUILDERS: Record<string, () => Track> = {
  title,
  seoul,
  solein,
  tavern,
  villa,
  elios,
  razel,
  sian,
  court,
  tension,
  death,
  between,
  festival,
  sorrow,
  climax,
  ending,
};
