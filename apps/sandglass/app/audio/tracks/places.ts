// Place themes: seoul, solein, tavern, villa, court, festival.

import { Score, harm, voicing, above, Seg, pc } from "../theory";
import type { Track } from "../track";
import { MAIN, clock, drums, trans, tuneHarm } from "./common";

// ================================================================ seoul 「4시 44분」 — solo piano, A minor, 56 bpm
// Three repeated notes (four, four, four) and a lot of silence.

export function seoul(): Track {
  const s = new Score(2101);
  const HA = "Fmaj7:4 Em7:4 Dm7:4 Esus4:2 E:2 Fmaj7:4 C/G:4 Dm7:4 Esus4:2 E7:2";
  const HB = "Am:4 Fmaj7:4 G:4 C/E:4 Fmaj7:4 Em7:4 Dm7:4 Esus4:2 E:2";
  const HA2 = "Fmaj7:4 Em7:4 Dm7:4 Am/C:4 Fmaj7:4 Em7:4 Dm7:4 Esus4:4";
  const MA = "r:1 E5:1 E5:1 E5:1 | D5:3 r:1 | r:1 F5:1 E5:1 D5:1 | C5:2 B4:2 | r:1 E5:1 E5:1 E5:1 | G5:3 E5:1 | D5:1.5 C5:.5 A4:2 | B4:4";
  const MB = "r:2 A5:1 G5:1 | E5:3 C5:1 | D5:2 G5:2 | E5:4 | A5:2 G5:1 F5:1 | G5:2 E5:2 | F5:1 E5:1 D5:1 C5:1 | B4:2 G#4:2";
  const MA2 = "r:1 E5:1 E5:1 E5:1 | D5:4 | r:1 F5:1 E5:1 D5:1 | C5:4 | r:1 E5:1 r:1 E5:1 | r:4 | r:2 A4:2 | r:4";

  /** sparse left hand: bass, then the chord arriving late, one note at a time */
  const lh = (segs: Seg[], v: number, spread = 1): void => {
    for (const seg of segs) {
      const b = above(seg.c.bass, 33);
      s.n("pnoL", seg.t, seg.d + 0.6, b, v);
      const vs = voicing(seg.c, b + 10, 3);
      vs.forEach((m, i) => s.n("pnoL", seg.t + (0.5 + i * 0.75) * spread, seg.d - (0.5 + i * 0.75) * spread + 0.6, m, v * (0.62 - i * 0.05)));
    }
  };

  const h1 = harm(HA, 0, 4);
  s.seq("pnoR", 0, MA, { v: 0.8, hum: 0.04 });
  lh(h1, 0.3);

  const hb = harm(HB, 32, 4);
  s.seq("pnoR", 32, MB, { v: 0.9, hum: 0.04, dyn: (t) => (t < 16 ? 1 : 1.08 - (t - 16) / 60) });
  s.harmonize("pnoR", MB, 32, hb, { v: 0.45, min: 3, max: 9, minDur: 1.9 });
  lh(hb, 0.32, 0.8);
  hb.forEach((seg) => s.n("pnoL", seg.t, seg.d, above(seg.c.bass, 33) - 12, 0.16));

  const h2 = harm(HA2, 64, 4);
  s.seq("pnoR", 64, MA2, { v: 0.72, hum: 0.05, dyn: (t) => 1 - t / 70 });
  lh(h2, 0.26, 1.2);
  // the far-off high note, like a monitor in another room
  [70, 78, 86, 94].forEach((t, i) => s.n("pnoR", t + 0.5, 3, 88 - (i % 2) * 2, 0.16));

  return {
    id: "seoul",
    bpm: 56,
    len: 96,
    ev: s.ev,
    gain: 2.0,
    ch: {
      pnoR: { inst: "piano", pan: 0.05, rev: 0.5, prio: 2 },
      pnoL: { inst: "piano", pan: -0.1, rev: 0.45, gain: 0.9 },
    },
  };
}

// ================================================================ solein 「새벽의 도시」 — 4/4, G major, 112 bpm

export function solein(): Track {
  const s = new Score(2202);
  const HA = "G:4 C:2 D:2 Em:2 Bm:2 C:2 D:2 G:4 Am7:2 C:2 G/D:2 D7:2 G:4";
  const HB = "Em:4 C:4 Am:4 B7:4 Em:4 C:4 D:4 D7:4";
  const MA =
    "D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1 | E5:.5 F#5:.5 G5:1 A5:2 | B5:.5 A5:.5 G5:.5 E5:.5 D5:1 B4:1 | C5:1 E5:1 D5:2 | " +
    "D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D6:1 | C6:.5 B5:.5 A5:.5 G5:.5 E5:1 C6:1 | B5:1 A5:.5 G5:.5 F#5:1 A5:1 | G5:3 r:1";
  const MB =
    "B4:1 E5:1 G5:1.5 F#5:.5 | E5:1 G5:1 C6:2 | A5:1 C6:1 E6:1.5 D6:.5 | D#6:2 B5:2 | " +
    "B5:1 G5:1 E5:1.5 F#5:.5 | G5:1 A5:1 E6:2 | D6:1.5 C6:.5 B5:1 A5:1 | A5:2 F#5:1 A5:1";

  const band = (segs: Seg[], level: number, full: boolean): void => {
    s.arp("lute", segs, [0, 2, 3, 1, 2, 3, 1, 3], 0.5, { lo: 43, up: 55, v: 0.34 * level, hum: 0.01, acc: [1.3, 0.8, 1, 0.8, 1.15, 0.8, 1, 0.8] });
    for (const seg of segs) {
      for (let b = 0; b < seg.d; b++) {
        const t = seg.t + b;
        const onBeat = Math.round(t) % 2 === 0;
        s.n("pz", t, 0.6, above(onBeat ? seg.c.bass : pc(seg.c.root + 7), 38), 0.55 * level);
        if (full) voicing(seg.c, 60, 3).forEach((m) => s.n("sp", t + 0.5, 0.25, m, 0.36 * level));
      }
    }
  };
  const perc = (t0: number, bars: number, level: number): void =>
    drums(s, t0, bars, 4, { tb: { p: "x.o.x.o.x.o.x.oo", v: 0.4 }, sl: { p: "....x.......x...", v: 0.4 }, dr: { p: "x.......x.o.....", v: 0.55 } }, level);

  // intro (0-8)
  band(harm("G:4 D/F#:2 D7:2", 0, 4), 0.8, false);
  perc(4, 1, 0.7);
  s.n("bell", 0, 6, 55, 0.4);

  // A (8-40): flute
  s.seq("fl", 8, MA, { v: 1.0 });
  band(harm(HA, 8, 4), 1, false);
  perc(8, 8, 0.9);

  // A' (40-72): fiddle joins an octave below, strings on the offbeats
  s.seq("fl", 40, MA, { v: 1.0 });
  s.seq("fid", 40, MA, { v: 0.7, tr: -12 });
  band(harm(HA, 40, 4), 1, true);
  perc(40, 8, 1);

  // B (72-104): E minor, strings sing; harp sparkles
  const hb = harm(HB, 72, 4);
  s.seq("vln", 72, MB, { v: 1.0, dyn: (t) => (t < 16 ? 1 : 1.1) });
  s.seq("fl", 88, "B5:4 | C6:4 | A5:2 B5:2 | C6:2 A5:2", { v: 0.55 });
  band(hb, 0.9, true);
  perc(72, 8, 0.85);
  hb.forEach((seg) => [0, 1, 2].forEach((k, i) => s.n("harp", seg.t + 2 + i * 0.33, 1.5, voicing(seg.c, 74, 3)[k], 0.2)));

  // bridge (104-120): the fountain square — bell, strings, flute long tones
  const hq = harm("Cmaj7:4 D:4 Bm7:4 Em7:2 D7:2", 104, 4);
  s.pad("pad", hq, 55, 4, 0.26);
  s.seq("fl", 104, "E6:3 D6:1 | F#6:4 | D6:3 B5:1 | G5:2 A5:2", { v: 0.8 });
  s.arp("lute", hq, [0, 1, 2, 3], 1, { lo: 43, up: 55, v: 0.3 });
  s.n("bell", 104, 6, 55, 0.5);
  s.n("bell", 112, 6, 50, 0.35);
  hq.forEach((seg) => s.n("pz", seg.t, 1, above(seg.c.bass, 38), 0.5));

  // A'' (120-152): everyone; flute up the octave
  s.seq("fl", 120, MA, { v: 1.05, tr: 12, oct: [-12] });
  s.seq("fid", 120, MA, { v: 0.7, tr: -12 });
  band(harm(HA, 120, 4), 1.05, true);
  perc(120, 8, 1.05);
  s.pad("pad", harm(HA, 120, 4), 55, 3, 0.14);

  // tag (152-160)
  band(harm("C:4 D7sus4:2 D7:2", 152, 4), 0.85, false);
  s.seq("fl", 152, "E5:.5 G5:.5 C6:1 B5:.5 A5:.5 | F#5:2 A5:2", { v: 0.8 });
  perc(152, 2, 0.8);

  return {
    id: "solein",
    bpm: 112,
    len: 160,
    ev: s.ev,
    gain: 1.0,
    ch: {
      fl: { inst: "flute", pan: 0.15, rev: 0.32, prio: 2, att: 0.03 },
      fid: { inst: "cello", pan: -0.25, rev: 0.3, prio: 2, gain: 0.8, att: 0.03, rel: 0.15, bright: 1.1 },
      vln: { inst: "str", pan: -0.3, rev: 0.4, fx: "body", prio: 2, gain: 1.05 },
      lute: { inst: "lute", pan: -0.35, rev: 0.25, gain: 0.85 },
      pz: { inst: "pizz", pan: 0.1, rev: 0.2 },
      sp: { inst: "strs", pan: 0.3, rev: 0.25, gain: 0.6, prio: 0 },
      harp: { inst: "harp", pan: 0.45, rev: 0.4, gain: 0.8, prio: 0 },
      pad: { inst: "str", pan: 0.2, rev: 0.45, fx: "body", gain: 0.6, bright: 0.7, prio: 0 },
      bell: { inst: "cbell", pan: -0.3, rev: 0.7, gain: 0.6 },
      dr: { inst: "fdrum", pan: 0.05, rev: 0.2, gain: 0.8 },
      sl: { inst: "fslap", pan: -0.1, rev: 0.2 },
      tb: { inst: "tamb", pan: 0.4, rev: 0.25, prio: 0 },
    },
  };
}

// ================================================================ tavern 「늑대의 둥지」 — 6/8 jig, E dorian (beat = eighth)

export function tavern(): Track {
  const s = new Score(2303);
  const HA = "Em:6 D:6 Em:6 A:6 Em:6 D:6 Bm:3 A:3 Em:6";
  const HB = "G:6 D:6 C:6 D:6 G:6 D:6 C:3 D:3 Em:6";
  const HC = "Em:6 G:6 D:6 Bm:6 Em:6 C:6 D:6 Em:6";
  const JA = "E5:2 B4:1 E5:1 F#5:1 G5:1 | F#5:1 E5:1 D5:1 A4:2 D5:1 | E5:2 B4:1 E5:1 F#5:1 G5:1 | A5:1 G5:1 F#5:1 E5:2 C#5:1 | " +
    "B5:2 G5:1 E5:1 F#5:1 G5:1 | A5:2 F#5:1 D5:1 E5:1 F#5:1 | G5:1 F#5:1 E5:1 F#5:1 E5:1 C#5:1 | E5:2 D5:1 E5:3";
  const JB = "G5:1 A5:1 B5:1 D6:2 B5:1 | A5:2 F#5:1 D5:2 F#5:1 | G5:1 A5:1 B5:1 C6:2 B5:1 | A5:1 B5:1 A5:1 F#5:2 D5:1 | " +
    "G5:1 A5:1 B5:1 D6:2 E6:1 | F#6:1 E6:1 D6:1 A5:2 F#5:1 | E5:1 F#5:1 G5:1 F#5:1 E5:1 D5:1 | E5:3 B4:2 D5:1";
  const JC = "B5:3 A5:2 G5:1 | B5:3 D6:3 | A5:2 F#5:1 D5:2 E5:1 | F#5:3 E5:2 D5:1 | B5:3 A5:2 G5:1 | B5:2 D6:1 E6:3 | D6:1 B5:1 A5:1 F#5:1 E5:1 D5:1 | E5:6";

  const strum = (segs: Seg[], level: number, light = true): void => {
    for (const seg of segs) {
      for (let i = 0; i < seg.d; i++) {
        const t = seg.t + i;
        const pos = Math.round(t) % 6;
        const vs = voicing(seg.c, 52, 4);
        if (pos === 0 || pos === 3) {
          vs.forEach((m, k) => s.n("lute", t + k * 0.05, 2.5, m, (pos === 0 ? 0.5 : 0.4) * level));
          s.n("pz", t, 2, above(pos === 0 ? seg.c.bass : pc(seg.c.root + 7), 40), 0.6 * level);
        } else if (light && (pos === 2 || pos === 5)) vs.slice(2).forEach((m, k) => s.n("lute", t + k * 0.03, 1, m, 0.22 * level));
      }
    }
  };
  const kit = (t0: number, bars: number, level: number): void =>
    drums(s, t0, bars, 6, { dr: { p: "x..o..", v: 0.8 }, sl: { p: "..x..x", v: 0.35 }, tb: { p: "xoxxox", v: 0.35 } }, level);

  // intro (0-12): drum and drone, then a stamp
  kit(0, 2, 0.8);
  s.n("drone", 0, 12.5, 40, 0.3);
  s.n("drone", 0, 12.5, 47, 0.26);
  strum(harm("Em:6 Em:6", 0, 6).slice(1), 0.8, false);

  // A, A' (12-108)
  s.seq("fid", 12, JA, { v: 1.0 });
  strum(harm(HA, 12, 6), 1);
  kit(12, 8, 1);
  s.seq("fid", 60, JA, { v: 1.0 });
  s.seq("wh", 60, JA, { v: 0.55, tr: 12 });
  strum(harm(HA, 60, 6), 1);
  kit(60, 8, 1);

  // B, B' (108-204)
  s.seq("fid", 108, JB, { v: 1.0 });
  strum(harm(HB, 108, 6), 1);
  kit(108, 8, 1);
  s.seq("fid", 156, JB, { v: 1.0 });
  s.seq("wh", 156, JB, { v: 0.5 });
  strum(harm(HB, 156, 6), 1.05);
  kit(156, 8, 1.05);

  // C (204-252): the fiddle rests, the whistle sings, the room claps
  s.seq("wh", 204, JC, { v: 0.95 });
  strum(harm(HC, 204, 6), 0.85, false);
  drums(s, 204, 8, 6, { dr: { p: "x.....", v: 0.7 }, sl: { p: "x..x..", v: 0.5 } });
  s.pad("vc", harm(HC, 204, 6), 40, 1, 0.5);

  // C' (252-300): fiddle and whistle together, full kit
  s.seq("wh", 252, JC, { v: 0.8, tr: 12 });
  s.seq("fid", 252, JC, { v: 0.95 });
  strum(harm(HC, 252, 6), 1);
  kit(252, 8, 1.1);

  // A'' (300-348)
  s.seq("fid", 300, JA, { v: 1.05 });
  s.seq("wh", 300, JA, { v: 0.5, tr: 12 });
  strum(harm(HA, 300, 6), 1.05);
  kit(300, 8, 1.1);

  // tail (348-360): a stamp and a shout of the drone
  s.n("drone", 348, 12.5, 40, 0.3);
  s.n("drone", 348, 12.5, 47, 0.26);
  strum(harm("Em:6 D:3 Bm:3", 348, 6), 0.9, false);
  kit(348, 2, 0.9);

  return {
    id: "tavern",
    bpm: 312,
    len: 360,
    ev: s.ev,
    gain: 1.0,
    ch: {
      fid: { inst: "cello", pan: -0.15, rev: 0.28, prio: 2, att: 0.025, rel: 0.12, bright: 1.15 },
      wh: { inst: "whistle", pan: 0.3, rev: 0.3, prio: 2, gain: 0.8 },
      lute: { inst: "lute", pan: -0.4, rev: 0.22, gain: 0.8 },
      pz: { inst: "pizz", pan: 0.15, rev: 0.18 },
      vc: { inst: "cello", pan: 0.3, rev: 0.3, gain: 0.7 },
      drone: { inst: "str", pan: 0.3, rev: 0.3, gain: 0.5, bright: 0.5, prio: 0 },
      dr: { inst: "fdrum", pan: 0.05, rev: 0.18, gain: 0.9 },
      sl: { inst: "fslap", pan: -0.15, rev: 0.2 },
      tb: { inst: "tamb", pan: 0.4, rev: 0.22, prio: 0 },
    },
  };
}

// ================================================================ villa 「째깍이는 집」 — 4/4, F major, 96 bpm

export function villa(): Track {
  const s = new Score(2404);
  const HA = "F:4 C/E:2 C7:2 Dm:2 Bb:2 C:4 F:4 Bb:2 C7:2 F/C:2 C7:2 F:4";
  const HB = "Dm:4 Gm:2 A7:2 Gm:2 C7:2 F:2 A7:2 Dm:4 A7:2 Dm:2 Gm:2 Bb:2 C7:4";
  const HC = "Bbmaj7:4 Am7:4 Gm7:4 C7:4 Bbmaj7:4 A7:4 Dm7:2 G7:2 Gm7:2 C7:2";
  const MA =
    "C5:.5 F5:.5 A5:.5 F5:.5 C6:1 A5:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 G5:2 | A5:.5 Bb5:.5 C6:.5 A5:.5 F5:1 D5:1 | E5:.5 F5:.5 G5:.5 E5:.5 C5:2 | " +
    "C5:.5 F5:.5 A5:.5 F5:.5 C6:1 A5:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:1 E5:1 | F5:.5 A5:.5 G5:.5 E5:.5 C5:1 E5:1 | F5:3 r:1";
  const MB =
    "D4:.5 F4:.5 A4:.5 D5:.5 C5:1 A4:1 | Bb4:.5 A4:.5 G4:.5 Bb4:.5 A4:2 | G4:.5 A4:.5 Bb4:.5 D5:.5 C5:1 Bb4:1 | A4:.5 G4:.5 F4:.5 E4:.5 A4:2 | " +
    "D4:.5 F4:.5 A4:.5 D5:.5 F5:1 D5:1 | E5:.5 D5:.5 C#5:.5 E5:.5 D5:2 | Bb4:.5 C5:.5 D5:.5 Bb4:.5 G4:1 Bb4:1 | C5:2 E4:1 G4:1";
  const MC = "D4:2 F4:1 A4:1 | C5:3 A4:1 | Bb4:2 G4:1 E4:1 | G4:3 E4:1 | D4:2 F4:1 A4:1 | C#5:3 A4:1 | D5:1.5 C5:.5 B3:1 G4:1 | Bb4:2 G4:1 E4:1";

  /** pizzicato band: bass on 1 & 3, little chords on the offbeats */
  const pizz = (segs: Seg[], v: number): void => {
    for (const seg of segs) {
      for (let b = 0; b < seg.d; b++) {
        const t = seg.t + b;
        const on = Math.round(t) % 2 === 0;
        s.n("pzB", t, 0.8, above(on ? seg.c.bass : pc(seg.c.root + 7), 36), v);
        voicing(seg.c, 57, 2).forEach((m, i) => s.n("pz", t + 0.5 + i * 0.01, 0.4, m, v * 0.55));
      }
    }
  };

  // intro (0-8): only the clocks — one steady, one a little fast, one slow
  clock(s, "clk", 0, 160, 0.5, 0.42, { tick: 64, tock: 59, bar: 4 });
  clock(s, "clk2", 2, 8, 0.75, 0.25, { tick: 70, tock: 67 });
  s.n("cuckoo", 6, 0.8, 76, 0.35);
  s.n("cuckoo", 6.5, 1.2, 72, 0.3);

  // A (8-40): the music box melody
  const ha = harm(HA, 8, 4);
  s.seq("mb", 8, MA, { v: 0.95, hum: 0.01 });
  pizz(ha, 0.5);

  // B (40-72): D minor, the pizzicato takes the tune, bassoon-like cello answers
  const hb = harm(HB, 40, 4);
  s.seq("pzM", 40, MB, { v: 0.95 });
  s.seq("fl", 56, "A5:2 G5:2 | F5:4 | D5:2 E5:2 | C5:2 E5:2", { v: 0.55 });
  hb.forEach((seg) => s.n("pzB", seg.t, 1, above(seg.c.bass, 36), 0.55));
  hb.forEach((seg) => s.n("cel", seg.t + 1.5, 1, voicing(seg.c, 79, 1)[0], 0.28));
  clock(s, "clk2", 40, 72, 1.5, 0.2, { tick: 70, tock: 67 });

  // A' (72-104): flute + box in octaves, strings pad
  const ha2 = harm(HA, 72, 4);
  s.seq("fl", 72, MA, { v: 0.9 });
  s.seq("mb", 72, MA, { v: 0.6, tr: 12 });
  pizz(ha2, 0.5);
  s.pad("pad", ha2, 53, 3, 0.14);

  // C (104-136): warmth — the cello sings, the clocks hush
  const hc = harm(HC, 104, 4);
  s.seq("vc", 104, MC, { v: 1.0, leg: 0.97 });
  s.arp("harp", hc, [0, 1, 2, 3, 2, 1, 2, 3], 0.5, { lo: 34, up: 50, v: 0.25, hum: 0.02 });
  s.pad("pad", hc, 55, 3, 0.16);
  s.seq("mb", 120, "D6:4 | C#6:4 | F6:2 D6:2 | E6:4", { v: 0.4 });

  // A'' (136-160): the box again, and the cuckoo
  const ha3 = harm("F:4 C/E:2 C7:2 Dm:2 Bb:2 C:4 Bb:2 C7:2 F:4", 136, 4);
  s.seq("mb", 136, "C5:.5 F5:.5 A5:.5 F5:.5 C6:1 A5:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 G5:2 | A5:.5 Bb5:.5 C6:.5 A5:.5 F5:1 D5:1 | E5:.5 F5:.5 G5:.5 E5:.5 C5:2 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:1 E5:1 | F5:3 r:1", { v: 0.9 });
  pizz(ha3, 0.48);
  s.n("cuckoo", 157, 0.8, 76, 0.35);
  s.n("cuckoo", 157.5, 1.2, 72, 0.3);

  return {
    id: "villa",
    bpm: 96,
    len: 160,
    ev: s.ev,
    gain: 1.5,
    ch: {
      mb: { inst: "mbox", pan: 0.1, rev: 0.35, prio: 2, gain: 1.1 },
      pzM: { inst: "pizz", pan: -0.05, rev: 0.28, prio: 2, gain: 1.1 },
      pz: { inst: "pizz", pan: -0.3, rev: 0.25, gain: 0.8 },
      pzB: { inst: "pizz", pan: 0.1, rev: 0.22 },
      fl: { inst: "flute", pan: 0.25, rev: 0.4, prio: 2, gain: 0.85 },
      vc: { inst: "cello", pan: 0.25, rev: 0.36, prio: 2 },
      cel: { inst: "celesta", pan: 0.4, rev: 0.45, gain: 0.8 },
      harp: { inst: "harp", pan: -0.4, rev: 0.4, gain: 0.8 },
      pad: { inst: "str", pan: 0.3, rev: 0.45, fx: "body", gain: 0.55, bright: 0.6, att: 1, prio: 0 },
      clk: { inst: "tick", pan: 0.45, rev: 0.2, gain: 0.8, prio: 0 },
      clk2: { inst: "tick", pan: -0.5, rev: 0.25, gain: 0.7, prio: 0 },
      cuckoo: { inst: "flute", pan: -0.4, rev: 0.4, gain: 0.7, att: 0.02, rel: 0.1 },
    },
  };
}

// ================================================================ court 「왕궁」 — 4/4, C major, 84 bpm, brass & organ

export function court(): Track {
  const s = new Score(2505);
  const HA = "C:4 Em:2 G:2 C:2 F:2 G:4 C:2 C/E:2 F:2 Dm:2 C/G:2 G7:2 C:4";
  const HB = "Am:4 E/G#:4 G:4 D/F#:4 Fmaj7:4 Dm7:4 E7sus4:2 E7:2 Am:4";
  const MA = "C5:1.5 D5:.5 E5:1 C5:1 | G5:1.5 F5:.5 E5:1 D5:1 | E5:.75 F5:.25 G5:1 A5:1 F5:1 | D5:3 G4:1 | " +
    "C5:1.5 D5:.5 E5:1 G5:1 | A5:1.5 G5:.5 F5:1 A5:1 | G5:.75 F5:.25 E5:1 D5:1.5 C5:.5 | C5:3 r:1";
  const MB = "E5:2 A5:2 | B5:1.5 A5:.5 G#5:2 | G5:2 D5:2 | F#5:1.5 E5:.5 D5:2 | C5:2 E5:2 | F5:1.5 E5:.5 D5:2 | E5:2 D5:1 B4:1 | A4:4";

  const stiff = (segs: Seg[], v: number): void => {
    for (const seg of segs) {
      for (let b = 0; b < seg.d; b++) {
        const vs = voicing(seg.c, 55, 3);
        vs.forEach((m) => s.n("sp", seg.t + b, 0.3, m, v * (b === 0 ? 1.1 : 0.8)));
      }
    }
  };
  const march = (t0: number, bars: number, level: number): void =>
    drums(s, t0, bars, 4, { sn: { p: "x...x...x...x.oo", v: 0.38 }, dr: { p: "x.......x.......", v: 0.6 } }, level);

  // fanfare (0-8)
  s.seq("tpt", 0, "C4:.75 C4:.25 G4:1 E4:.75 G4:.25 C5:1 | C5:.75 B4:.25 A4:.75 B4:.25 G4:2", { v: 1.1, oct: [12] });
  s.pad("hn", harm("C:4 G:2 G7:2", 0, 4), 48, 3, 0.5);
  s.n("timp", 0, 1, 36, 0.7);
  s.n("timp", 4, 1, 43, 0.6);
  for (let i = 0; i < 8; i++) s.n("timp", 6 + i * 0.25, 0.3, 43, 0.25 + i * 0.05);

  // A (8-40): trumpet tune over organ, stiff string chords
  const ha = harm(HA, 8, 4);
  s.seq("tpt", 8, MA, { v: 1.05 });
  s.pad("org", ha, 52, 4, 0.4);
  s.bass("ped", ha, 36, 0.5);
  stiff(ha, 0.3);
  march(8, 8, 0.9);
  ha.forEach((seg) => seg.d >= 4 && s.n("timp", seg.t, 1, above(seg.c.root, 36), 0.55));

  // B (40-72): A minor — the organ alone with cold strings; whispers behind the pillars
  const hb = harm(HB, 40, 4);
  s.seq("orgM", 40, MB, { v: 1.0 });
  s.pad("org", hb, 48, 3, 0.35);
  s.bass("ped", hb, 33, 0.5);
  s.pad("pad", hb, 55, 3, 0.22);
  s.seq("vc", 40, "A2:4 | G#2:4 | G2:4 | F#2:4 | F2:4 | D2:4 | E2:4 | A2:4", { v: 0.7 });
  hb.forEach((seg) => s.n("timp", seg.t, 1.5, above(seg.c.root, 36), 0.3));

  // A' (72-104): full court, horns counter
  const ha2 = harm(HA, 72, 4);
  s.seq("tpt", 72, MA, { v: 1.1, oct: [-12] });
  s.seq("hn", 72, "E4:4 | E4:2 D4:2 | C4:2 A3:2 | B3:4 | E4:4 | F4:2 C4:2 | C4:2 B3:2 | C4:4", { v: 0.9 });
  s.pad("org", ha2, 52, 4, 0.42);
  s.bass("ped", ha2, 36, 0.55);
  stiff(ha2, 0.34);
  march(72, 8, 1);
  ha2.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 36), 0.6));
  s.n("cym", 72, 3, 60, 0.6, 0);

  // coda (104-112): cadence, then the drum leads back
  const hc = harm("F:2 G:2 C:4", 104, 4);
  s.seq("tpt", 104, "A4:.75 B4:.25 C5:1 D5:.75 B4:.25 G4:1 | C5:4", { v: 1.0, oct: [12] });
  s.pad("org", hc, 52, 4, 0.4);
  s.bass("ped", hc, 36, 0.5);
  march(108, 1, 0.8);

  return {
    id: "court",
    bpm: 84,
    len: 112,
    ev: s.ev,
    gain: 0.95,
    ch: {
      tpt: { inst: "brass", pan: 0.2, rev: 0.45, prio: 2, gain: 1.0, bright: 1.1 },
      hn: { inst: "brass", pan: -0.3, rev: 0.5, prio: 1, gain: 0.75, bright: 0.55 },
      org: { inst: "organ", pan: -0.15, rev: 0.6, gain: 0.8, prio: 1 },
      orgM: { inst: "organ", pan: 0.1, rev: 0.6, gain: 1.0, prio: 2 },
      ped: { inst: "organ", pan: 0, rev: 0.5, gain: 0.9, bright: 0.5 },
      sp: { inst: "strs", pan: 0.35, rev: 0.35, gain: 0.7, prio: 0 },
      pad: { inst: "str", pan: 0.3, rev: 0.5, gain: 0.6, bright: 0.55, prio: 0 },
      vc: { inst: "cello", pan: -0.3, rev: 0.4, gain: 0.8 },
      timp: { inst: "timp", rev: 0.45 },
      sn: { inst: "fslap", pan: 0.1, rev: 0.3, gain: 0.9 },
      dr: { inst: "fdrum", pan: -0.05, rev: 0.3 },
      cym: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

// ================================================================ festival 「새벽제」 — 4/4, A major, 132 bpm

export function festival(): Track {
  const s = new Score(2606);
  const HA = "A:4 D:4 E:4 E7:4 A:4 D:4 A/E:2 E7:2 A:4";
  const HC = "Fmaj7:4 G:4 Em7:4 Am:4 Dm7:4 G:4 Cmaj7:4 E7sus4:2 E7:2";
  const MA =
    "E5:.5 A5:.5 C#6:.5 A5:.5 B5:.5 A5:.5 G#5:.5 A5:.5 | F#5:1 D6:1 C#6:1 B5:1 | E5:.5 G#5:.5 B5:.5 G#5:.5 A5:.5 G#5:.5 F#5:.5 G#5:.5 | E5:1 B5:1 A5:1 G#5:1 | " +
    "E5:.5 A5:.5 C#6:.5 A5:.5 B5:.5 A5:.5 G#5:.5 A5:.5 | F#5:1 A5:1 D6:1 F#6:1 | E6:.5 D6:.5 C#6:.5 B5:.5 A5:1 G#5:1 | A5:2 E5:2";

  const polka = (segs: Seg[], level: number): void => {
    for (const seg of segs) {
      for (let b = 0; b < seg.d; b++) {
        const t = seg.t + b;
        const on = Math.round(t) % 2 === 0;
        if (on) s.n("pz", t, 0.8, above(Math.round(t) % 4 === 0 ? seg.c.bass : pc(seg.c.root + 7), 40), 0.62 * level);
        else voicing(seg.c, 57, 3).forEach((m, k) => s.n("lute", t + k * 0.02, 0.6, m, 0.4 * level));
        s.n("sp", t + 0.5, 0.2, voicing(seg.c, 64, 1)[0], 0.28 * level);
      }
    }
  };
  const kit = (t0: number, bars: number, level: number): void =>
    drums(s, t0, bars, 4, { dr: { p: "x...o...x...o.o.", v: 0.7 }, sl: { p: "....x.......x...", v: 0.5 }, tb: { p: "xoxoxoxoxoxoxoxx", v: 0.35 } }, level);
  const lanterns = (t0: number, t1: number, pool: number[], v: number): void => {
    for (let t = t0; t < t1; t += 1.5 + s.rnd() * 1.5) {
      const base = pool[Math.floor(s.rnd() * pool.length)];
      [0, 1, 2].forEach((k) => s.n("gl", t + k * 0.18, 2, base + [0, 7, 12][k], v * (0.8 + s.rnd() * 0.4)));
    }
  };

  // intro (0-8): drums and a bell from the tower
  kit(0, 2, 0.8);
  s.n("bell", 0, 8, 57, 0.5);
  polka(harm("A:4 E7:4", 0, 4), 0.8);

  // A (8-40), A' (40-72)
  s.seq("fl", 8, MA, { v: 1.0 });
  polka(harm(HA, 8, 4), 1);
  kit(8, 8, 1);
  s.seq("fl", 40, MA, { v: 1.0, tr: 12 });
  s.seq("fid", 40, MA, { v: 0.8 });
  polka(harm(HA, 40, 4), 1.05);
  kit(40, 8, 1.05);

  // B (72-104): the dawn theme itself, danced — in A
  const hb = tuneHarm(72, -5).filter((x) => x.t < 104);
  s.seq("fid", 72, trans(MAIN.split("|").slice(0, 8).join("|"), -5 + 12), { v: 1.0 });
  s.seq("fl", 88, trans(MAIN.split("|").slice(4, 8).join("|"), -5 + 12), { v: 0.6, tr: 12 });
  polka(hb, 1);
  kit(72, 8, 1);
  lanterns(88, 104, [81, 85, 88], 0.28);

  // C (104-136): lanterns rise — half time, bells and strings
  const hc = harm(HC, 104, 4);
  s.seq("fl", 104, "A5:4 | B5:4 | G5:4 | E5:2 C6:2 | A5:4 | B5:2 D6:2 | E6:4 | D6:2 B5:2", { v: 0.95 });
  s.pad("pad", hc, 55, 4, 0.3, { sh: 1 });
  s.arp("harp", hc, [0, 1, 2, 3, 4, 3, 2, 1], 0.5, { lo: 41, up: 55, n: 4, v: 0.3 });
  lanterns(104, 136, [76, 79, 84, 88], 0.34);
  hc.forEach((seg) => s.n("dr", seg.t, 1, 60, 0.6));
  s.n("swell", 132, 4, 60, 0.7, 1);

  // A'' (136-168): everyone
  s.seq("fl", 136, MA, { v: 1.05, tr: 12 });
  s.seq("fid", 136, MA, { v: 0.9 });
  polka(harm(HA, 136, 4), 1.1);
  kit(136, 8, 1.1);
  s.pad("pad", harm(HA, 136, 4), 57, 3, 0.16);
  lanterns(136, 168, [81, 85, 88], 0.22);

  // tag (168-176)
  s.seq("fl", 168, "A5:1 C#6:1 E6:2 | E6:.5 D6:.5 C#6:.5 B5:.5 A5:1 r:1", { v: 0.9 });
  polka(harm("D:4 E7:4", 168, 4), 0.95);
  kit(168, 2, 0.95);

  return {
    id: "festival",
    bpm: 132,
    len: 176,
    ev: s.ev,
    gain: 0.98,
    ch: {
      fl: { inst: "flute", pan: 0.15, rev: 0.3, prio: 2, att: 0.03 },
      fid: { inst: "cello", pan: -0.2, rev: 0.3, prio: 2, gain: 0.85, att: 0.03, rel: 0.15, bright: 1.1 },
      lute: { inst: "lute", pan: -0.35, rev: 0.25, gain: 0.8 },
      pz: { inst: "pizz", pan: 0.1, rev: 0.2 },
      sp: { inst: "strs", pan: 0.35, rev: 0.25, gain: 0.5, prio: 0 },
      harp: { inst: "harp", pan: -0.4, rev: 0.45, gain: 0.8 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", gain: 0.6, bright: 0.75, prio: 0 },
      gl: { inst: "glass", pan: 0.45, rev: 0.7, gain: 0.8, prio: 0 },
      bell: { inst: "cbell", pan: -0.3, rev: 0.7, gain: 0.6 },
      dr: { inst: "fdrum", pan: 0.05, rev: 0.2, gain: 0.85 },
      sl: { inst: "fslap", pan: -0.1, rev: 0.2 },
      tb: { inst: "tamb", pan: 0.4, rev: 0.25, prio: 0 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

