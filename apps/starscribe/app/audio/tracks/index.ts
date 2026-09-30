import { finalize, Track } from "../track";
import { BUILDERS } from "./all";

const cache = new Map<string, Track>();

/** built lazily and memoized; unknown ids -> null (silence) */
export function getTrack(id: string): Track | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const b = BUILDERS[id];
  if (!b) return null;
  try {
    const t = finalize(b());
    cache.set(id, t);
    return t;
  } catch {
    return null;
  }
}

export const TRACK_IDS = Object.keys(BUILDERS);
