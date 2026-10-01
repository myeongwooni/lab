// Character themes: elios (clockwork waltz), razel (grey wolf), sian (blue tower star).

import { Score, harm, voicing, Seg } from "../theory";
import type { Track } from "../track";
import { MAIN3_A, PICKUP, arch3, clock, drums, harm3, oompah, MAIN_HARM } from "./common";

// ================================================================ elios 「태엽 왈츠」 — 3/4, D major, 120 bpm

export function elios(): Track {
  const s = new Score(3101);
  // his own melody: B minor, precise and a little shy
  const MB =
    "F#5:2 B5:1 | A#5:2 B5:1 | C#6:1 E6:1 C#6:1 | B5:3 | G5:2 B5:1 | F#5:2 B5:1 | E5:1 F#5:1 G5:1 | F#5:3 | " +
    "D5:2 F#5:1 | A5:2 D6:1 | C#6:1 B5:1 A5:1 | G5:3 | E5:2 G5:1 | B5:2 A5:1 | G5:1 F#5:1 E5:1 | A5:3";
  const HB = "Bm:3 F#/A#:3 F#7:3 Bm:3 Em:3 Bm/D:3 A7:3 D:3 D:3 Bm7:3 A:3 G:3 Em:3 G:3 A7sus4:1.5 A7:1.5 A:3";
  // the first half of the tune's harmony (8 bars of 4/4 -> 16 waltz bars)
  const HA = MAIN_HARM.split("|").slice(0, 2).join("|");

  // intro (0-12): winding — clock ticks, the box turns over
  const hi = harm("Gmaj7:3 Gmaj7:3 A7sus4:3 A7:3", 0, 3);
  clock(s, "clk", 0, 12, 1, 0.4, { bar: 3 });
  oompah(s, "pzB", "harp", hi, { lo: 43, up: 62, v: 0.35, n: 2 });
  s.seq("mb", 0, "D6:1 A5:1 D6:1 | E6:1 A5:1 E6:1 | F#6:1 A5:1 F#6:1 | G6:2 A5:.5 D6:.5", { v: 0.45 });

  // A (12-60): the dawn tune, as a waltz, on piano
  const ha = harm3(HA, 12);
  s.seq("pnoR", 11, PICKUP, { v: 0.75 });
  s.seq("pnoR", 12, MAIN3_A, { v: 0.95, dyn: arch3, hum: 0.02 });
  oompah(s, "pzB", "harp", ha, { lo: 38, up: 57, v: 0.42, n: 3 });
  clock(s, "clk", 12, 60, 1, 0.22, { bar: 3 });
  s.pad("pad", ha.filter((x) => x.t >= 36), 55, 3, 0.13);

  // B (60-108): his own waltz; cello first, the violin answers
  const hb = harm(HB, 60, 3);
  s.seq("vc", 60, MB.split("|").slice(0, 8).join("|").replace(/([A-G]#?)([56])/g, (_m, n, o) => n + (Number(o) - 1)), { v: 1.0, leg: 0.98 });
  s.seq("vln", 84, MB.split("|").slice(8).join("|"), { v: 0.95 });
  s.seq("vc", 84, "D3:3 | F#3:3 | A3:3 | B3:3 | G3:3 | E3:3 | A3:3 | A2:3", { v: 0.7, leg: 0.98 });
  oompah(s, "pzB", "harp", hb, { lo: 38, up: 59, v: 0.38, n: 3 });
  s.pad("pad", hb, 55, 3, 0.15);
  hb.forEach((seg, i) => i % 2 === 0 && s.n("cel", seg.t + 2, 1, voicing(seg.c, 84, 1)[0], 0.25));

  // A' (108-156): strings take the tune; the box doubles it high, like a memory
  const ha2 = harm3(HA, 108);
  s.seq("vln", 107, PICKUP, { v: 0.75 });
  s.seq("vln", 108, MAIN3_A, { v: 1.0, dyn: arch3 });
  s.seq("mb", 132, MAIN3_A.split("|").slice(7).join("|").replace(/([A-G]#?)([45])/g, (_m, n, o) => n + (Number(o) + 1)), { v: 0.4 });
  s.arp("pnoL", ha2, [0, 1, 2, 3, 2, 1], 0.5, { lo: 38, up: 50, v: 0.24, hum: 0.02 });
  oompah(s, "pzB", "harp", ha2, { lo: 38, up: 60, v: 0.3, n: 2, skip2: true });
  s.pad("pad", ha2, 55, 3, 0.18);

  // coda (156-168): the spring runs down — the head, slowing
  const slow = [
    [156, "F#6"],
    [157.1, "E6"],
    [158.4, "D6"],
    [160, "A5"],
    [162, "B5"],
    [164.4, "C#6"],
  ] as const;
  const MIDI: Record<string, number> = { "F#6": 90, E6: 88, D6: 86, A5: 81, B5: 83, "C#6": 85 };
  slow.forEach(([t, n], i) => s.n("mb", t, 2.5, MIDI[n], 0.5 - i * 0.04));
  s.pad("pad", harm("Gmaj7:6 A7sus4:6", 156, 6), 55, 3, 0.12, { sh: 2 });
  s.n("pzB", 156, 2, 43, 0.35);
  s.n("pzB", 162, 2, 45, 0.3);

  return {
    id: "elios",
    bpm: 120,
    len: 168,
    ev: s.ev,
    gain: 1.4,
    ch: {
      pnoR: { inst: "piano", pan: -0.05, rev: 0.35, prio: 2 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.32, gain: 0.8 },
      vln: { inst: "str", pan: -0.3, rev: 0.42, fx: "body", prio: 2, gain: 1.1 },
      vc: { inst: "cello", pan: 0.3, rev: 0.36, prio: 2 },
      pzB: { inst: "pizz", pan: 0.1, rev: 0.25 },
      harp: { inst: "harp", pan: -0.35, rev: 0.35, gain: 0.75 },
      mb: { inst: "mbox", pan: 0.3, rev: 0.45, prio: 1, gain: 0.9 },
      cel: { inst: "celesta", pan: 0.4, rev: 0.5, gain: 0.8 },
      clk: { inst: "tick", pan: 0.5, rev: 0.2, gain: 0.7, prio: 0 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", gain: 0.6, bright: 0.65, prio: 0 },
    },
  };
}

// ================================================================ razel 「잿빛 늑대의 노래」 — 4/4, G mixolydian, 76 bpm

export function razel(): Track {
  const s = new Score(3202);
  const HA = "G:4 G/B:2 Am7:2 Em:2 F:2 G:4 C:4 G/B:2 C:2 Am7:2 D7:2 G:4";
  const HB = "Em:4 C:4 G:4 D:4 Em:4 C:4 Am7:2 Bm7:2 C:2 D:2";
  const MA = "D4:1 G4:1 A4:1 B4:1 | D5:2 C5:1 A4:1 | B4:1.5 A4:.5 G4:1 F4:1 | G4:3 D4:1 | E4:1 G4:1 A4:1 C5:1 | D5:2 E5:1 D5:1 | C5:1.5 B4:.5 A4:1 F#4:1 | G4:4";
  const MB = "B3:2 E4:1 G4:1 | G4:2 E4:2 | D4:1.5 E4:.5 G4:1 B4:1 | A4:4 | B4:2 G4:1 E4:1 | C5:2 B4:1 G4:1 | A4:1.5 G4:.5 F#4:1 D4:1 | E4:2 F#4:2";
  const pick = (segs: Seg[], v: number): void => s.arp("lute", segs, [0, 2, 1, 3, 2, 1, 3, 2], 0.5, { lo: 40, up: 52, v, hum: 0.02, ring: 1.5 });
  const camp = (t0: number, bars: number, v: number): void => drums(s, t0, bars, 4, { dr: { p: "x.....o.x.......", v } });

  // intro (0-8): fire, a drone, the lute
  s.n("drone", 0, 8.5, 31, 0.4);
  s.n("drone", 0, 8.5, 38, 0.32);
  pick(harm("G:4 F/G:4", 0, 4), 0.28);

  // A (8-40): the horn — broad, warm, a little tired
  const ha = harm(HA, 8, 4);
  s.seq("hn", 8, MA, { v: 1.05, leg: 0.97 });
  pick(ha, 0.3);
  s.bass("cb", ha, 31, 0.36);
  s.pad("pad", ha, 50, 3, 0.18);
  camp(8, 8, 0.4);

  // B (40-72): the cello remembers Leben; a whistle answers like a child
  const hb = harm(HB, 40, 4);
  s.seq("vc", 40, MB, { v: 1.05, leg: 0.97 });
  s.seq("wh", 52, "r:1 F#5:.5 A5:.5 D6:2", { v: 0.6 });
  s.seq("wh", 68, "r:1 E5:.5 G5:.5 F#5:2", { v: 0.55 });
  pick(hb, 0.28);
  s.bass("cb", hb, 28, 0.34);
  s.pad("pad", hb, 52, 3, 0.2);
  camp(40, 8, 0.35);

  // A' (72-104): low strings sing it, the horn holds the fifths beneath
  const ha2 = harm(HA, 72, 4);
  s.seq("vln", 72, MA, { v: 1.0, tr: 12, oct: [-12] });
  s.seq("hn", 72, "G3:4 | B3:2 C4:2 | B3:2 A3:2 | B3:4 | C4:4 | B3:2 C4:2 | C4:2 A3:2 | B3:4", { v: 0.75 });
  pick(ha2, 0.3);
  s.bass("cb", ha2, 31, 0.4);
  s.pad("pad", ha2, 50, 4, 0.2);
  s.arp("harp", ha2, [0, 1, 2, 3], 1, { lo: 43, up: 67, v: 0.2 });
  camp(72, 8, 0.45);

  // outro (104-112)
  const ho = harm("C:4 D7sus4:2 D7:2", 104, 4);
  s.seq("hn", 104, "E4:2 D4:2 | C4:2 A3:2", { v: 0.8 });
  pick(ho, 0.26);
  s.bass("cb", ho, 31, 0.32);

  return {
    id: "razel",
    bpm: 76,
    len: 112,
    ev: s.ev,
    gain: 1.1,
    ch: {
      hn: { inst: "brass", pan: 0.15, rev: 0.45, prio: 2, gain: 1.1, bright: 0.55, att: 0.18 },
      vc: { inst: "cello", pan: 0.25, rev: 0.38, prio: 2, gain: 1.1 },
      vln: { inst: "str", pan: -0.25, rev: 0.42, fx: "body", prio: 2, gain: 1.05, bright: 0.8 },
      wh: { inst: "whistle", pan: -0.4, rev: 0.55, prio: 1, gain: 0.7 },
      lute: { inst: "lute", pan: -0.35, rev: 0.3, gain: 0.85 },
      harp: { inst: "harp", pan: 0.4, rev: 0.4, gain: 0.7, prio: 0 },
      cb: { inst: "str", pan: 0, rev: 0.25, gain: 0.8, bright: 0.45 },
      drone: { inst: "str", pan: 0.2, rev: 0.4, gain: 0.6, bright: 0.45, att: 2, prio: 0 },
      pad: { inst: "str", pan: 0.3, rev: 0.45, fx: "body", gain: 0.55, bright: 0.55, prio: 0 },
      dr: { inst: "fdrum", pan: 0.1, rev: 0.35, gain: 0.7 },
    },
  };
}

// ================================================================ sian 「청탑의 별」 — 4/4, E lydian, 66 bpm

export function sian(): Track {
  const s = new Score(3303);
  const HA = "Emaj7:4 F#/E:4 C#m7:4 Amaj7#11:4 Emaj7:4 F#/E:4 G#m7:4 Bsus4:2 B:2";
  const HB = "C#m9:4 Amaj7:4 F#m9:4 G#7sus4:2 G#7:2 C#m9:4 Amaj7#11:4 Bsus4:4 B:4";
  const MA = "B5:2 D#6:1 F#6:1 | E6:3 C#6:1 | G#5:2 B5:1 E6:1 | D#6:4 | B5:2 D#6:1 F#6:1 | A#6:3 G#6:1 | F#6:2 D#6:1 B5:1 | E6:2 D#6:2";
  const MB = "E5:2 G#5:2 | G#5:3 C#6:1 | A5:2 G#5:1 E5:1 | D#5:4 | E5:2 G#5:2 | B5:3 G#5:1 | F#5:2 E5:1 D#5:1 | D#5:4";
  const flow = (segs: Seg[], v: number): void => s.arp("harp", segs, [0, 1, 2, 3, 4, 3, 2, 1], 0.5, { lo: 40, up: 52, n: 4, v, ring: 2, hum: 0.02 });
  const stars = (t0: number, t1: number, pool: number[], v: number): void => {
    for (let t = t0 + 0.5; t < t1; t += 1 + s.rnd() * 2.5) s.n("gl", t, 3, pool[Math.floor(s.rnd() * pool.length)], v * (0.7 + s.rnd() * 0.5));
  };

  // intro (0-8)
  s.gliss("harp", 0, 2, 52, 88, [4, 6, 8, 10, 11, 1, 3], 0.28);
  s.pad("choir", harm("Emaj7:4 F#/E:4", 0, 4), 56, 3, 0.18, { sh: 1 });
  stars(0, 8, [88, 92, 95, 99], 0.3);

  // A (8-40): celesta
  const ha = harm(HA, 8, 4);
  s.seq("cel", 8, MA, { v: 1.0, hum: 0.015 });
  flow(ha, 0.26);
  s.pad("pad", ha, 56, 3, 0.16);
  stars(8, 40, [88, 90, 92, 95, 99], 0.2);

  // B (40-72): C# minor — a flute in the dark, the choir breathes
  const hb = harm(HB, 40, 4);
  s.seq("fl", 40, MB, { v: 0.9 });
  flow(hb, 0.24);
  s.pad("choir", hb, 56, 3, 0.26, { sh: 1 });
  s.bass("cb", hb, 37, 0.25);
  s.seq("mb", 60, "C#6:1 E6:1 G#6:2 | F#6:1 E6:1 D#6:2", { v: 0.35 });

  // A' (72-104): celesta and music box in octaves (a child's box in a kept room)
  const ha2 = harm(HA, 72, 4);
  s.seq("cel", 72, MA, { v: 0.95 });
  s.seq("mb", 72, MA, { v: 0.45, tr: -12 });
  flow(ha2, 0.26);
  s.pad("pad", ha2, 56, 3, 0.18);
  s.pad("choir", ha2.filter((x) => x.t >= 88), 60, 2, 0.18);
  stars(72, 104, [90, 92, 95, 99, 102], 0.2);

  // outro (104-112)
  const ho = harm("Amaj7#11:4 Bsus4:4", 104, 4);
  flow(ho, 0.22);
  s.pad("pad", ho, 56, 3, 0.14, { sh: 2 });
  s.seq("cel", 105, "D#6:1 G#6:2 r:1 | F#6:4", { v: 0.6 });

  return {
    id: "sian",
    bpm: 66,
    len: 112,
    ev: s.ev,
    gain: 1.65,
    ch: {
      cel: { inst: "celesta", pan: 0.1, rev: 0.55, prio: 2, gain: 1.15 },
      fl: { inst: "flute", pan: 0.2, rev: 0.55, prio: 2, gain: 0.9 },
      mb: { inst: "mbox", pan: -0.25, rev: 0.6, gain: 0.8 },
      harp: { inst: "harp", pan: -0.35, rev: 0.5, gain: 0.85 },
      gl: { inst: "glass", pan: 0.45, rev: 0.8, gain: 0.7, prio: 0 },
      pad: { inst: "str", pan: 0.3, rev: 0.6, gain: 0.55, bright: 0.6, att: 1.4, prio: 0 },
      choir: { inst: "choir", fx: "oo", pan: -0.2, rev: 0.7, gain: 0.6, att: 1.5, prio: 0 },
      cb: { inst: "str", pan: 0, rev: 0.3, gain: 0.6, bright: 0.45 },
    },
  };
}
