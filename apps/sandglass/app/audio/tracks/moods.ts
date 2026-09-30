// Mood themes: tension (the Faceless), death (the hand going cold), sorrow.

import { Score, harm, voicing } from "../theory";
import type { Track } from "../track";
import { MAIN, clock, drums, rbell } from "./common";

// ================================================================ tension 「무면」 — 4/4, E phrygian, 104 bpm

export function tension(): Track {
  const s = new Score(4101);
  // 3+3+2 eighths, E with the phrygian F leaning on it
  const OST = [0, 0, 0, 1, 0, 0, 3, 1];
  const ost = (t0: number, bars: number, root: number, v: number, dbl = false): void => {
    for (let b = 0; b < bars; b++) {
      for (let i = 0; i < 8; i++) {
        const t = t0 + b * 4 + i * 0.5;
        const acc = i === 0 || i === 3 || i === 6;
        s.n("ost", t, 0.4, root + OST[i], v * (acc ? 1.25 : 0.7));
        if (dbl) s.n("ost", t + 0.25, 0.2, root + OST[i], v * 0.45);
        if (acc) s.n("ostlo", t, 0.45, root - 12, v * 0.85);
      }
    }
  };
  const heart = (t0: number, t1: number, every: number, v: number): void => {
    for (let t = t0; t < t1; t += every) {
      s.n("hb", t, 0.5, 60, v);
      s.n("hb", t + 0.4, 0.5, 57, v * 0.7);
    }
  };
  const low = (t: number, d: number, v = 0.45): void => {
    s.n("low", t, d + 0.5, 28, v);
    s.n("low", t, d + 0.5, 35, v * 0.6);
  };

  // A (0-32): a clock, a heart, a drone. Something is in the room.
  clock(s, "clk", 0, 32, 1, 0.45);
  heart(0, 32, 2, 0.75);
  low(0, 32);
  s.n("dis", 16, 16, 76, 0.3, 1);
  s.n("dis", 16, 16, 77, 0.28, 1);

  // B (32-64): the ostinato starts
  ost(32, 8, 40, 0.58);
  clock(s, "clk", 32, 64, 0.5, 0.35);
  heart(32, 64, 2, 0.8);
  low(32, 32);
  s.seq("vc", 32, "E2:8 | F2:8 | E2:4 G2:4 | F2:8", { v: 0.8 });
  s.n("dis", 32, 16, 71, 0.34, 1);
  s.n("dis", 32, 16, 72, 0.3, 1);
  s.n("dis", 48, 16, 70, 0.36, 1);
  s.n("dis", 48, 16, 77, 0.3, 1);
  [32, 40, 48, 56].forEach((t) => s.n("timp", t, 2, 40, 0.55));

  // C (64-96): double time; brass stabs; porcelain
  ost(64, 8, 40, 0.64, true);
  heart(64, 96, 1, 0.85);
  low(64, 32, 0.5);
  drums(s, 64, 8, 4, { dr: { p: "x..x..x.x..x..x.", v: 0.5 } });
  [64, 72, 80, 88].forEach((t, i) => {
    voicing(harm(["E5", "F5", "E5", "G5"][i], 0)[0].c, 40, 3).forEach((m) => s.n("brass", t + 3, 1, m, 0.6, 3));
    s.n("timp", t, 2, 40, 0.65);
  });
  s.n("dis", 64, 16, 79, 0.3, 1);
  s.n("dis", 64, 16, 80, 0.28, 1);
  s.n("dis", 80, 16, 82, 0.34, 1);
  s.n("dis", 80, 16, 83, 0.3, 1);
  s.seq("glass", 66, "F7:1 r:7 E7:1 r:7 Bb6:1 r:7 F7:1", { v: 0.35 });
  s.n("swell", 88, 8, 60, 0.6, 1);

  // D (96-128): gone quiet — only the heart and the clock, then it comes back
  heart(96, 120, 2, 0.7);
  clock(s, "clk", 96, 128, 1, 0.4);
  low(96, 32, 0.4);
  [96, 108].forEach((t) => [40, 41, 47].forEach((m, i) => s.n("pno", t + i * 0.03, 6, m, 0.35)));
  ost(120, 2, 40, 0.45);
  heart(120, 128, 1, 0.8);

  return {
    id: "tension",
    bpm: 104,
    len: 128,
    ev: s.ev,
    gain: 0.85,
    ch: {
      ost: { inst: "strs", pan: -0.15, rev: 0.25, fx: "body" },
      ostlo: { inst: "strs", pan: 0.15, rev: 0.2, gain: 0.9, bright: 0.6 },
      hb: { inst: "heart", rev: 0.2 },
      clk: { inst: "tick", pan: 0.45, rev: 0.35, gain: 0.8 },
      dis: { inst: "str", pan: 0.3, rev: 0.5, fx: "body", gain: 0.6, att: 3, prio: 0 },
      vc: { inst: "cello", pan: -0.3, rev: 0.35 },
      low: { inst: "pad", rev: 0.3, gain: 0.9, att: 3, rel: 2 },
      brass: { inst: "brass", pan: 0.2, rev: 0.45, gain: 0.8, bright: 0.6 },
      timp: { inst: "timp", rev: 0.4 },
      dr: { inst: "fdrum", pan: 0.1, rev: 0.25, gain: 0.7 },
      swell: { inst: "swell", rev: 0.5, prio: 0 },
      pno: { inst: "piano", rev: 0.5 },
      glass: { inst: "glass", pan: 0.5, rev: 0.7 },
    },
  };
}

// ================================================================ death 「식어 가는 손」 — a music box running down, 60 bpm
// Three times the box tries to play the dawn motif; each time it is slower,
// flatter, and stops sooner. The heartbeat slows with it.

export function death(): Track {
  const s = new Score(4202);
  const BPM = 60;
  const HEAD_NOTES = [78, 76, 74, 69, 71, 73, 74, 79, 78, 76, 76, 74]; // F#5 E5 D5 A4 | B4 C#5 D5 G5 | F#5 E5 E5 D5
  const HEAD_DURS = [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1];
  const CYCLE = 24;

  for (let k = 0; k < 3; k++) {
    const t0 = k * CYCLE;
    const count = HEAD_NOTES.length - k * 3; // plays fewer notes each time
    let t = t0 + 1;
    let stretch = 1.1 + k * 0.25;
    for (let i = 0; i < count; i++) {
      const detune = -0.08 * i - 0.3 * k; // sagging pitch (fractional semitones)
      const m = HEAD_NOTES[i] + detune;
      s.n("mb", t, 3, m, 0.55 - i * 0.02 - k * 0.05);
      // the comb's dyad under strong notes, slightly out of tune with itself
      if (HEAD_DURS[i] >= 1) s.n("mbLo", t + 0.02, 3, [62, 67, 62][Math.floor(i / 4) % 3] - 12 + detune * 1.3, 0.3 - k * 0.04);
      t += HEAD_DURS[i] * stretch;
      stretch *= 1.07; // the spring loses tension
    }
    // the heart slows and fades
    let ht = t0;
    let gap = 1.1 + k * 0.4;
    while (ht < t0 + CYCLE - 3) {
      s.n("hb", ht, 0.5, 60, 0.6 - (ht - t0) / 60);
      s.n("hb", ht + 0.35, 0.5, 57, 0.4 - (ht - t0) / 80);
      ht += gap;
      gap *= 1.18;
    }
    // a cold low cluster, and sand rising
    s.n("low", t0, CYCLE + 0.5, 38, 0.32);
    s.n("low", t0, CYCLE + 0.5, 39, 0.24);
    s.n("air", t0 + 4, CYCLE - 4, [74, 73, 72][k], 0.2, 1);
    rbell(s, "rb", t0 + CYCLE - 1, [86, 81, 74][k], 0.35, BPM);
  }
  // a clock that stops
  let ct = 0;
  let cg = 1;
  while (ct < 14) {
    s.n("clk", ct, 0.2, ct % 2 < 1 ? 64 : 58, 0.3);
    ct += cg;
    cg *= 1.09;
  }
  // last breath before the loop: a reversed swell in the pad
  s.n("air", 66, 6, 62, 0.22, 1);

  return {
    id: "death",
    bpm: BPM,
    len: CYCLE * 3,
    ev: s.ev,
    gain: 1.4,
    ch: {
      mb: { inst: "mbox", pan: 0.1, rev: 0.7, prio: 2, gain: 1.1 },
      mbLo: { inst: "mbox", pan: -0.2, rev: 0.7, gain: 0.8 },
      hb: { inst: "heart", rev: 0.3, gain: 0.9 },
      low: { inst: "pad", rev: 0.5, gain: 0.8, att: 4, rel: 3, prio: 0 },
      air: { inst: "str", pan: 0.35, rev: 0.8, gain: 0.45, bright: 0.5, att: 3, rel: 3, prio: 0 },
      rb: { inst: "rglass", pan: -0.35, rev: 0.8, gain: 0.9 },
      clk: { inst: "tick", pan: 0.5, rev: 0.5, gain: 0.7 },
    },
  };
}

// ================================================================ sorrow 「되돌릴 수 없는 것」 — strings elegy, B minor, 56 bpm

export function sorrow(): Track {
  const s = new Score(4303);
  const HA = "Bm:4 Bm/A:4 G:4 F#:4 Em:4 Bm/D:4 C#m7b5:2 F#7:2 Bm:4";
  const HT = "Bm:4 Gmaj7:4 Em7:4 F#7sus4:2 F#7:2 Bm:4 Bm/A:4 G:2 Gm6:2 A7sus4:1 A7:1 D:2";
  const EL = "B3:2 C#4:1 D4:1 | F#4:3 E4:1 | D4:1.5 C#4:.5 B3:1 G3:1 | A#3:3 F#3:1 | G3:1.5 A3:.5 B3:1 E4:1 | D4:2 C#4:1 B3:1 | E4:1.5 D4:.5 C#4:1 A#3:1 | B3:4";

  // A (0-32): solo cello over a hush of strings
  const ha = harm(HA, 0, 4);
  s.seq("vc", 0, EL, { v: 1.0, leg: 0.98 });
  s.pad("pad", ha, 54, 3, 0.2, { sh: 1 });
  s.bass("cb", ha, 35, 0.26);

  // B (32-64): the violins remember the dawn tune, and for a moment it's D major
  const ht = harm(HT, 32, 4);
  s.seq("vln", 32, MAIN.split("|").slice(0, 8).join("|"), { v: 0.95, dyn: (t) => (t < 16 ? 0.9 : 1.1) });
  s.seq("vc", 32, "B2:4 | G3:4 | E3:4 | F#3:4 | D3:4 | C#3:4 | B2:2 Bb2:2 | A2:2 D3:2", { v: 0.8, leg: 0.98 });
  s.pad("pad", ht, 54, 4, 0.22);
  s.bass("cb", ht, 35, 0.3);
  ht.forEach((seg) => seg.d >= 4 && voicing(seg.c, 62, 3).forEach((m, i) => s.n("harp", seg.t + i * 0.3, 3, m + 12, 0.16)));

  // A' (64-96): everyone sings the elegy; it cannot be taken back
  const ha2 = harm(HA, 64, 4);
  s.seq("vln", 64, EL, { v: 1.1, tr: 24, oct: [-12], dyn: (t) => (t < 12 ? 1 : t < 24 ? 1.2 : 0.95) });
  s.seq("vc", 64, "B2:4 | A2:4 | G2:4 | F#2:4 | E2:4 | D2:4 | C#3:2 F#2:2 | B2:4", { v: 0.9, leg: 0.98 });
  s.pad("pad", ha2, 54, 4, 0.26);
  s.bass("cb", ha2, 35, 0.34);
  s.n("timp", 80, 3, 35, 0.3);

  // coda (96-104): the head, one last time, unfinished
  const hc = harm("Gmaj7:4 F#7sus4:2 F#7:2", 96, 4);
  s.seq("vln", 96, "F#5:1.5 E5:.5 D5:1 A4:1 | B4:4", { v: 0.7 });
  s.pad("pad", hc, 54, 3, 0.18, { sh: 2 });
  s.bass("cb", hc, 35, 0.24);

  return {
    id: "sorrow",
    bpm: 56,
    len: 104,
    ev: s.ev,
    gain: 1.2,
    ch: {
      vc: { inst: "cello", pan: 0.2, rev: 0.45, prio: 2, gain: 1.1 },
      vln: { inst: "str", pan: -0.25, rev: 0.5, fx: "body", prio: 2, gain: 1.1 },
      pad: { inst: "str", pan: 0.3, rev: 0.55, fx: "body", gain: 0.65, bright: 0.6, att: 1.2, prio: 0 },
      cb: { inst: "str", pan: 0, rev: 0.3, gain: 0.7, bright: 0.45 },
      harp: { inst: "harp", pan: 0.45, rev: 0.5, gain: 0.7, prio: 0 },
      timp: { inst: "timp", rev: 0.5 },
    },
  };
}

