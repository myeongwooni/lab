import type { Ev } from "./theory";
import type { Inst } from "./synth";

export type Fx = "ah" | "oo" | "body" | "dark" | "air";

export type ChSpec = {
  inst: Inst;
  gain?: number;
  pan?: number;
  rev?: number; // reverb send 0..1
  fx?: Fx;
  prio?: number; // voice-stealing priority (0 = expendable, 2 = melody)
  bright?: number;
  att?: number;
  rel?: number;
};

export type Track = {
  id: string;
  bpm: number;
  len: number; // loop length in beats
  ch: Record<string, ChSpec>;
  ev: Ev[];
  gain?: number;
};

/** sort, wrap and clamp events so the loop is seamless */
export function finalize(t: Track): Track {
  const ev = t.ev
    .map((e) => ({ ...e, t: ((e.t % t.len) + t.len) % t.len }))
    .filter((e) => t.ch[e.ch] !== undefined)
    .sort((a, b) => a.t - b.t);
  return { ...t, ev };
}
