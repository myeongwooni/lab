// Shared material: the main theme 「천 번째 새벽」 (its 4/4 and 3/4 forms,
// harmony, mode changes) and small arranging helpers used by every track.

import { Score, Seg, above, harm, parse, pc, transposeSegs, voicing } from "../theory";

// ---------------------------------------------------------------- main theme

/**
 * MAIN THEME in D major, 4/4. One-beat pickup (A4 D5) sits at beat -1.
 *   a  (1-4)  3-2-1-5 | 6-#4-5-1' … half cadence on the sus
 *   a' (5-8)  answer; the minor iv (Gm6) in bar 7 is the bittersweet turn
 *   b  (9-12) rises to the high E on the vi-ii, sus4 on the dominant
 *   a''(13-16) the Bb over Gm — a dawn that almost doesn't come — then home
 */
export const PICKUP = "A4:.5 D5:.5";
export const MAIN =
  "F#5:1.5 E5:.5 D5:1 A4:1 | B4:1.5 C#5:.5 D5:1 G5:1 | F#5:1.5 E5:.5 E5:1 D5:.5 E5:.5 | E5:3 A4:.5 D5:.5 | " +
  "F#5:1.5 E5:.5 D5:1 A4:1 | D5:1.5 C#5:.5 B4:1 F#5:1 | B5:1.5 A5:.5 G5:1 E5:1 | G5:.5 F#5:.5 E5:1 D5:2 | " +
  "F#5:1 B5:1 B5:1.5 A5:.5 | A5:1.5 G5:.5 F#5:1 D5:1 | G5:1 B5:1 E6:1.5 D6:.5 | D6:2 C#6:1 A5:1 | " +
  "D6:1.5 C#6:.5 B5:1 F#5:1 | B5:1.5 A5:.5 G5:1 Bb5:1 | A5:2 F#5:1 E5:1 | D5:4";
export const MAIN_LEN = 64;

export const MAIN_HARM =
  "D:4 G/B:4 Em7:4 A7sus4:2 A7:2 | D:4 Bm:4 G:2 Gm6:2 A7sus4:1 A7:1 D:2 | " +
  "Bm:4 Gmaj7:4 Em7:4 A7sus4:2 A7:2 | Bm:4 G:2 Gm:2 D/A:2 A7:2 D:4";

/** richer reharmonisation for the second statement / the ending */
export const MAIN_HARM2 =
  "Dmaj7:4 G/B:2 Gm/Bb:2 F#m7:2 Bm7:2 Em7:2 A7:2 | Dmaj7/F#:2 D7/F#:2 Gmaj7:2 Bm7:2 Em7:2 Gm6:2 A7sus4:1 A7:1 D:2 | " +
  "Bm7:2 Bm7/A:2 Gmaj7:2 F#7:2 Em7:2 Em7/D:2 A7sus4:2 A7:2 | F#m7:2 Bm7:2 Gmaj7:2 Gm6:2 D/A:2 A7:2 D:4";

/** the Ash King's version: same tune in D harmonic minor */
export const MINOR_HARM =
  "Dm:4 Gm/Bb:4 Em7b5:4 A7sus4:2 A7:2 | Dm:4 Bb:4 Gm:2 Gm6:2 A7sus4:1 A7:1 Dm:2 | " +
  "Bbmaj7:4 Gm7:4 Em7b5:4 A7sus4:2 A7:2 | Bb:4 Gm:4 Dm/A:2 A7:2 Dm:4";

/** 3/4 form of the tune (each 4/4 bar becomes two waltz bars), pickup at -1 */
export const MAIN3_A =
  "F#5:2 E5:1 | D5:2 A4:1 | B4:2 C#5:1 | D5:2 G5:1 | F#5:2 E5:1 | E5:2 D5:.5 E5:.5 | E5:5 A4:.5 D5:.5 | " +
  "F#5:2 E5:1 | D5:2 A4:1 | D5:2 C#5:1 | B4:2 F#5:1 | B5:2 A5:1 | G5:2 E5:1 | G5:1 F#5:1 E5:1 | D5:3";
export const MAIN3_B =
  "F#5:1 B5:2 | B5:2 A5:1 | A5:2 G5:1 | F#5:2 D5:1 | G5:1 B5:1 E6:1 | _:2 D6:1 | D6:3 | C#6:2 A5:1 | " +
  "D6:2 C#6:1 | B5:2 F#5:1 | B5:2 A5:1 | G5:2 Bb5:1 | A5:3 | F#5:2 E5:1 | D5:6";
export const MAIN3 = MAIN3_A + " | " + MAIN3_B;
export const MAIN3_LEN = 96;

/** the head motif alone (bars 1-2 of the 4/4 tune) — the "dawn" figure */
export const HEAD = "F#5:1.5 E5:.5 D5:1 A4:1 | B4:1.5 C#5:.5 D5:1 G5:1";
export const HEAD3 = "F#5:2 E5:1 | D5:2 A4:1 | B4:2 C#5:1 | D5:2 G5:1";

/** harmony of the tune scaled to 3/4 */
export const harm3 = (src: string, t0 = 0): Seg[] => harm(src, 0, 4).map((s) => ({ ...s, t: t0 + s.t * 1.5, d: s.d * 1.5 }));

export const tuneHarm = (bar1: number, tr = 0, src = MAIN_HARM): Seg[] => transposeSegs(harm(src, 0, 4), tr, bar1);

/** melody dynamics for the 4/4 tune: rises through b, peaks on the high E (bar 11) */
export const arch = (rel: number): number => {
  const bar = Math.floor(rel / 4) + 1;
  if (bar <= 4) return 1;
  if (bar <= 8) return 1.06;
  if (bar <= 10) return 1.18;
  if (bar <= 12) return 1.32;
  if (bar <= 14) return 1.18;
  return 0.95;
};
export const arch3 = (rel: number): number => arch(rel / 1.5);

// ---------------------------------------------------------------- note spelling / modes

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const nameOf = (m: number): string => NAMES[pc(m)] + (Math.floor(m / 12) - 1);

const MAJ = [0, 2, 4, 5, 7, 9, 11];
export const HARM_MINOR = [0, 2, 3, 5, 7, 8, 11];
export const NAT_MINOR = [0, 2, 3, 5, 7, 8, 10];

/**
 * Re-spell a major-key DSL melody in another mode (same tonic).
 * Diatonic notes move with their degree; chromatic notes stay put.
 */
export function remode(src: string, tonicPc: number, mode: number[]): string {
  return src
    .split(/\s+/)
    .map((tok) => {
      const r = /^([>~]?)([A-G][#b]?-?\d(?:\+[A-G][#b]?-?\d)*)(:.*)?$/.exec(tok);
      if (!r) return tok;
      const notes = r[2].split("+").map((n) => {
        const m = parse(n + ":1").notes[0].m[0];
        const off = pc(m - tonicPc);
        const deg = MAJ.indexOf(off);
        if (deg < 0) return n;
        return nameOf(m + (mode[deg] - MAJ[deg]));
      });
      return r[1] + notes.join("+") + (r[3] ?? "");
    })
    .join(" ");
}

/** melody transposition as a DSL string (keeps rhythm tokens) */
export function trans(src: string, tr: number): string {
  if (!tr) return src;
  return src
    .split(/\s+/)
    .map((tok) => {
      const r = /^([>~]?)([A-G][#b]?-?\d(?:\+[A-G][#b]?-?\d)*)(:.*)?$/.exec(tok);
      if (!r) return tok;
      return r[1] + r[2].split("+").map((n) => nameOf(parse(n + ":1").notes[0].m[0] + tr)).join("+") + (r[3] ?? "");
    })
    .join(" ");
}

// ---------------------------------------------------------------- arranging helpers

/** augment a DSL phrase by factor k (for the climax) */
export function augment(s: Score, ch: string, t0: number, src: string, k: number, o: { tr?: number; v?: number; oct?: number[]; dyn?: (t: number) => number; leg?: number } = {}): number {
  const { notes, len } = parse(src, o.tr || 0);
  for (const n of notes) {
    const dv = o.dyn ? o.dyn(n.t) : 1;
    for (const m of n.m) {
      s.n(ch, t0 + n.t * k, n.d * k * (o.leg ?? 0.97), m, n.v * (o.v ?? 1) * dv);
      if (o.oct) for (const x of o.oct) s.n(ch, t0 + n.t * k, n.d * k * (o.leg ?? 0.97), m + x, n.v * (o.v ?? 1) * dv * 0.8);
    }
  }
  return t0 + len * k;
}

/** waltz accompaniment: bass on 1, chord on 2 and 3 */
export function oompah(s: Score, bassCh: string, chordCh: string, segs: Seg[], o: { lo: number; up: number; v: number; n?: number; beat?: number; skip2?: boolean }): void {
  const beat = o.beat ?? 1;
  for (const seg of segs) {
    let prev: number[] | undefined;
    for (let b = 0; b < seg.d - 1e-6; b += beat) {
      const t = seg.t + b;
      const pos = Math.round(t / beat) % 3;
      if (pos === 0) s.n(bassCh, t, beat * 1.5, above(seg.c.bass, o.lo), o.v);
      else if (!(o.skip2 && pos === 1)) {
        const vs = voicing(seg.c, o.up, o.n ?? 3, prev);
        prev = vs;
        vs.forEach((m, i) => s.n(chordCh, t + i * 0.012, beat * 0.8, m, o.v * 0.62));
      }
    }
  }
}

/** a clock's escapement: tick-tock on every `step` beats; `acc` tick every bar */
export function clock(s: Score, ch: string, t0: number, t1: number, step: number, v: number, o: { tock?: number; tick?: number; bar?: number; swing?: number } = {}): void {
  const tick = o.tick ?? 64;
  const tock = o.tock ?? 58;
  const bar = o.bar ?? 4;
  let k = 0;
  for (let t = t0; t < t1 - 1e-6; t += step, k++) {
    const onBar = Math.abs((t - t0) % bar) < 1e-6;
    const sw = k % 2 === 1 ? (o.swing ?? 0) : 0;
    s.n(ch, t + sw, 0.2, k % 2 === 0 ? tick : tock, v * (onBar ? 1.15 : 0.85) * (0.92 + s.rnd() * 0.16));
  }
}

/** the "clockwork" motif: music-box tick-tock on the tonic's 5th and root (8ths) */
export function tickTock(s: Score, ch: string, segs: Seg[], lo: number, v: number, step = 0.5): void {
  for (const seg of segs) {
    const r = above(seg.c.root, lo);
    const fifth = above(seg.c.pcs[seg.c.pcs.length > 2 ? 2 : 1], r + 1);
    const third = above(seg.c.pcs[1], r + 1);
    const pat = [fifth + 12, r + 12, third + 12, r + 12];
    for (let i = 0; i < Math.round(seg.d / step); i++) s.n(ch, seg.t + i * step, step * 2, pat[i % 4], v * (i % 2 === 0 ? 1 : 0.75));
  }
}

/** reversed-bell swell that lands exactly on beat `at` (bank rglass is 1.4 s at its native pitch) */
export function rbell(s: Score, ch: string, at: number, m: number, v: number, bpm: number): void {
  const natives = [60, 65, 70, 75, 80, 85, 90, 95, 100];
  let best = natives[0];
  let bd = Infinity;
  for (const x of natives) {
    const d = Math.abs(x - m) + (x < m ? 0.01 : 0);
    if (d < bd) {
      bd = d;
      best = x;
    }
  }
  const secs = 1.4 / Math.pow(2, (m - best) / 12);
  const beats = (secs * bpm) / 60;
  s.n(ch, at - beats, beats + 0.5, m, v);
}

/** simple drum pattern writer: "x..x..x." strings per channel, one char per step */
export function drums(s: Score, t0: number, bars: number, barLen: number, pats: Record<string, { p: string; m?: number; v: number }>, level = 1): void {
  for (const ch of Object.keys(pats)) {
    const { p, m, v } = pats[ch];
    const step = barLen / p.length;
    for (let b = 0; b < bars; b++) {
      for (let i = 0; i < p.length; i++) {
        const c = p[i];
        if (c === "." || c === " ") continue;
        const vel = c === "X" ? 1.25 : c === "o" ? 0.6 : 1;
        s.n(ch, t0 + b * barLen + i * step, step * 0.9, m ?? 60, v * vel * level * (0.94 + s.rnd() * 0.12));
      }
    }
  }
}
