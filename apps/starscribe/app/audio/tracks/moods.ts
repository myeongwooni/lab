// Mood themes: warm, lucien, tension, sorrow, villain.

import { Score, harm, voicing, above, Seg } from "../theory";
import type { Track } from "../track";

// ================================================================ warm — 4/4, D major

export function warm(): Track {
  const s = new Score(606);
  const HA = "D:4 A/C#:4 Bm7:4 F#m7:4 Gmaj7:4 D/F#:4 Em7:4 A7sus4:2 A7:2";
  const HA2 = "D:4 A/C#:4 Bm7:4 F#m7:4 Gmaj7:4 A/G:4 F#m7:2 B7:2 Em7:2 A7:2";
  const HB = "Gmaj7:4 A:4 F#m7:4 Bm7:4 Em7:4 A/C#:4 Bm7:2 E7:2 G/A:2 A7:2";
  const HA3 = "D:4 A/C#:4 Bm7:4 F#m7:4 Gmaj7:4 D/F#:4 Em7:2 A7sus4:2 G/A:4";
  const MA = "A4:1 F#5:2 E5:.5 D5:.5 | E5:2 C#5:1 D5:.5 E5:.5 | F#5:2 D5:1 B4:1 | C#5:3 r:1 | B4:1 G5:2 F#5:.5 E5:.5 | F#5:2 A5:1 F#5:1 | G5:1.5 F#5:.5 E5:1 D5:1 | D5:2 C#5:2";
  const MA2 = "A4:1 F#5:2 E5:.5 D5:.5 | E5:2 A5:2 | A5:1.5 G5:.5 F#5:1 D5:1 | E5:1 C#5:1 A4:2 | B4:1 G5:2 A5:.5 B5:.5 | C#6:1.5 B5:.5 A5:2 | A5:1 F#5:1 D#5:1 F#5:1 | G5:2 E5:1 C#5:1";
  const MB = "B4:1 D5:1 G5:1.5 F#5:.5 | E5:2 C#5:1 E5:1 | A5:1.5 G#5:.5 F#5:2 | F#5:1 D5:1 B4:2 | G5:1 B5:1 E6:2 | E6:1.5 D6:.5 C#6:1 A5:1 | D6:2 B5:1 G#5:1 | A5:2 G5:1 E5:1";
  const MA3 = "A4:1 F#5:2 E5:.5 D5:.5 | E5:2 C#5:1 D5:.5 E5:.5 | F#5:2 D5:1 B4:1 | C#5:3 r:1 | B4:1 G5:2 F#5:.5 E5:.5 | F#5:2 A5:1 F#5:1 | G5:1.5 F#5:.5 E5:2 | D5:4";
  const PAT = [0, 1, 2, 3, 4, 3, 2, 1];
  const rolls = (segs: Seg[], v: number): void => s.arp("pnoL", segs, PAT, 0.5, { lo: 38, up: 50, n: 4, v, ring: 1.6, hum: 0.02 });

  const h1 = harm(HA, 0, 4);
  s.seq("fl", 0, MA, { v: 1.0 });
  rolls(h1, 0.28);
  s.pad("pad", h1, 54, 3, 0.14);

  const h2 = harm(HA2, 32, 4);
  s.seq("fl", 32, MA2, { v: 1.05 });
  s.seq("vln", 32, MA2, { v: 0.6, tr: -12 });
  rolls(h2, 0.3);
  s.pad("pad", h2, 54, 4, 0.18);
  s.pad("vc", h2, 45, 1, 0.5);

  const hb = harm(HB, 64, 4);
  s.seq("vln", 64, MB, { v: 1.1, dyn: (t) => (t < 16 ? 1 + t / 30 : 1.4 - (t - 16) / 40), oct: [-12] });
  s.seq("fl", 80, "B5:4 | A5:4 | F#5:2 G#5:2 | E5:4", { v: 0.55 });
  rolls(hb, 0.32);
  s.pad("pad", hb, 54, 4, 0.22);
  s.bass("cb", hb, 33, 0.3);
  hb.forEach((seg) => {
    const vs = voicing(seg.c, 66, 3);
    [0, 1, 2, 1].forEach((k, i) => s.n("harp", seg.t + 2 + i * 0.5, 1.5, vs[k] + 12, 0.2));
  });

  const h3 = harm(HA3, 96, 4);
  s.seq("pnoR", 96, MA3, { tr: 12, v: 0.95, hum: 0.02 });
  s.seq("fl", 112, "r:2 A5:.5 B5:.5 A5:1 | F#5:4 | E5:2 G5:2 | F#5:4", { v: 0.5 });
  rolls(h3, 0.26);
  s.pad("pad", h3, 54, 3, 0.15);
  s.pad("vc", h3, 45, 1, 0.45);

  return {
    id: "warm",
    bpm: 80,
    len: 128,
    ev: s.ev,
    ch: {
      fl: { inst: "flute", pan: 0.2, rev: 0.45, prio: 2 },
      vln: { inst: "str", pan: -0.3, rev: 0.4, fx: "body", prio: 2, gain: 1.05 },
      vc: { inst: "cello", pan: 0.35, rev: 0.35, gain: 0.8 },
      pnoL: { inst: "piano", pan: -0.1, rev: 0.32, gain: 0.85 },
      pnoR: { inst: "piano", pan: 0, rev: 0.35, prio: 2 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", gain: 0.6, bright: 0.7, prio: 0 },
      cb: { inst: "str", pan: 0, rev: 0.25, gain: 0.7, bright: 0.45 },
      harp: { inst: "harp", pan: -0.45, rev: 0.45, gain: 0.8 },
    },
  };
}

// ================================================================ lucien — 4/4, B-flat major

export function lucien(): Track {
  const s = new Score(707);
  const HA = "Bbmaj7:4 Gm7:4 Ebmaj7:4 F7sus4:2 F7:2 Bbmaj7:4 Dm7:2 G7:2 Cm7:4 Ebm6:2 F7:2";
  const HB = "Gm:4 Gm/F#:4 Gm/F:4 Ebmaj7:4 Cm7:4 Am7b5:2 D7:2 Gm7:2 C7:2 Ebm6:2 F7sus4:2";
  const HA2 = "Bbmaj7:4 Gm7:4 Ebmaj7:4 F7sus4:2 F7:2 Bbmaj7:4 Dm7:2 G7:2 Cm7:4 Ebm6:2 F7sus4:2";
  const MA = "F4:1.5 D4:.5 C4:1 D4:1 | G4:3 F4:1 | Eb4:1.5 D4:.5 Bb3:2 | Bb3:2 A3:2 | F4:1.5 D4:.5 C4:1 D4:1 | A4:2 B4:2 | C5:2 Bb4:1 G4:1 | Gb4:1.5 F4:.5 Eb4:1 C4:1";
  const MB = "G5:2 F5:1 D5:1 | D5:3 C5:1 | Bb4:1 C5:1 D5:1 F5:1 | G5:3 F5:1 | Eb5:1.5 D5:.5 C5:1 Bb4:1 | C5:1 A4:1 F#4:1 A4:1 | D5:2 E5:1 G5:1 | Gb5:2 F5:2";
  const PAT = [0, 2, 1, 3, 1, 2, 1, 3];
  const lh = (segs: Seg[], v: number): void => s.arp("pnoL", segs, PAT, 0.5, { lo: 34, up: 50, v, ring: 1.4, hum: 0.025 });

  const h1 = harm(HA, 0, 4);
  s.seq("vc", 0, MA, { v: 1.0, leg: 0.97 });
  lh(h1, 0.26);

  const hb = harm(HB, 32, 4);
  s.seq("pnoR", 32, MB, { v: 0.95, hum: 0.025 });
  s.harmonize("pnoR", MB, 32, hb, { v: 0.5, min: 3, max: 8, minDur: 1.9 });
  s.pad("vc", hb, 46, 1, 0.75);
  lh(hb, 0.24);
  s.pad("pad", hb, 55, 3, 0.12);

  const h2 = harm(HA2, 64, 4);
  s.seq("pnoR", 64, MA, { tr: 12, v: 0.95, hum: 0.025 });
  s.seq("vc", 64, "D3:4 | Bb3:4 | G3:4 | C4:2 Eb4:2 | D4:4 | F4:2 F4:2 | Eb4:4 | Gb3:2 A3:2", { v: 0.8, leg: 0.97 });
  lh(h2, 0.24);
  s.pad("pad", h2, 55, 3, 0.12);

  return {
    id: "lucien",
    bpm: 66,
    len: 96,
    ev: s.ev,
    ch: {
      vc: { inst: "cello", pan: 0.25, rev: 0.35, prio: 2, gain: 1.1 },
      pnoR: { inst: "piano", pan: -0.05, rev: 0.33, prio: 2 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.3, gain: 0.85 },
      pad: { inst: "str", pan: -0.35, rev: 0.45, gain: 0.55, bright: 0.55, att: 1.2, prio: 0 },
    },
  };
}

// ================================================================ tension — 4/4, D phrygian

export function tension(): Track {
  const s = new Score(808);
  const OST = [0, 0, 1, 0, 0, 0, -2, 0];
  const ost = (t0: number, bars: number, root: number, v: number, sixteenth = false): void => {
    for (let b = 0; b < bars; b++) {
      const t = t0 + b * 4;
      for (let i = 0; i < 8; i++) {
        const acc = i === 0 || i === 3 || i === 6;
        s.n("ost", t + i * 0.5, 0.4, root + OST[i], v * (acc ? 1.2 : 0.75));
        if (sixteenth) s.n("ost", t + i * 0.5 + 0.25, 0.2, root + OST[i], v * 0.5);
        if (acc) s.n("ostlo", t + i * 0.5, 0.45, root - 12 + OST[i], v * 0.8);
      }
    }
  };
  const heart = (t0: number, beats: number, every: number, v: number): void => {
    for (let t = t0; t < t0 + beats; t += every) {
      s.n("hb", t, 0.5, 60, v);
      s.n("hb", t + 0.42, 0.5, 57, v * 0.7);
    }
  };
  const tick = (t0: number, bars: number, notes: number[], v: number): void => {
    for (let i = 0; i < bars * 4; i++) s.n("tick", t0 + i + 0.5, 0.3, notes[i % notes.length], v);
  };

  // A (0-32)
  ost(0, 8, 38, 0.55);
  heart(0, 32, 2, 0.8);
  tick(16, 4, [81], 0.3);
  s.n("dis", 16, 16, 69, 0.35, 1);
  s.n("dis", 16, 16, 70, 0.3, 1);
  s.n("low", 0, 16.5, 26, 0.4);
  s.n("low", 16, 16.5, 26, 0.4);

  // B (32-64)
  ost(32, 4, 43, 0.6);
  ost(48, 4, 38, 0.62);
  heart(32, 32, 2, 0.85);
  tick(32, 8, [81, 82], 0.32);
  s.n("dis", 32, 16, 68, 0.38, 1);
  s.n("dis", 32, 16, 74, 0.32, 1);
  s.n("dis", 48, 16, 63, 0.35, 1);
  s.n("dis", 48, 16, 69, 0.35, 1);
  s.seq("vc", 32, "Bb2:8 | A2:8 | Bb2:4 Ab2:4 | A2:8", { v: 0.8 });
  s.n("timp", 32, 2, 38, 0.6);
  s.n("timp", 48, 2, 38, 0.6);

  // C (64-96): tighten
  ost(64, 8, 38, 0.66, true);
  heart(64, 32, 1, 0.9);
  tick(64, 8, [81, 82, 81, 80], 0.34);
  s.n("dis", 64, 16, 72, 0.35, 1);
  s.n("dis", 64, 16, 73, 0.32, 1);
  s.n("dis", 64, 16, 75, 0.28, 1);
  s.n("dis", 80, 16, 74, 0.42, 1);
  s.n("dis", 80, 16, 75, 0.4, 1);
  s.n("dis", 80, 16, 80, 0.3, 1);
  for (let b = 0; b < 8; b++) s.n("timp", 64 + b * 4, 1.5, 38, 0.55 + b * 0.04);
  s.n("swell", 88, 8, 60, 0.6, 1);
  s.n("low", 64, 32.5, 26, 0.5);

  // D (96-128): drop out — only the heart, a drone, a low cluster; then the pulse creeps back
  heart(96, 24, 2, 0.75);
  s.n("low", 96, 24.5, 26, 0.45);
  [96, 108].forEach((t) => [38, 39, 45].forEach((m, i) => s.n("pno", t + i * 0.03, 6, m, 0.35)));
  s.seq("glass", 100, "Bb6:1 r:5 A6:1 r:3 Eb7:1", { v: 0.4 });
  ost(120, 2, 38, 0.4);
  heart(120, 8, 2, 0.8);

  return {
    id: "tension",
    bpm: 92,
    len: 128,
    ev: s.ev,
    ch: {
      ost: { inst: "strs", pan: -0.15, rev: 0.25, fx: "body" },
      ostlo: { inst: "strs", pan: 0.15, rev: 0.2, gain: 0.9, bright: 0.6 },
      hb: { inst: "heart", pan: 0, rev: 0.2, gain: 1 },
      tick: { inst: "pizz", pan: 0.4, rev: 0.35, gain: 0.8 },
      dis: { inst: "str", pan: 0.3, rev: 0.5, fx: "body", gain: 0.6, att: 3, prio: 0 },
      vc: { inst: "cello", pan: -0.3, rev: 0.35, gain: 1 },
      low: { inst: "pad", pan: 0, rev: 0.3, gain: 0.9, att: 3, rel: 2 },
      timp: { inst: "timp", rev: 0.4 },
      swell: { inst: "swell", rev: 0.5, prio: 0 },
      pno: { inst: "piano", pan: 0, rev: 0.5 },
      glass: { inst: "glass", pan: 0.5, rev: 0.7 },
    },
  };
}

// ================================================================ sorrow — solo piano, C minor

export function sorrow(): Track {
  const s = new Score(909);
  const HA = "Cm:4 Abmaj7:4 Fm7:4 G7sus4:2 G7:2 Cm/Eb:4 Abmaj7:4 Dm7b5:2 G7:2 Cmadd9:4";
  const HB = "Abmaj7:4 Bb:4 Gm7:4 Cm:4 Fm7:4 Bb7:4 Ebmaj7:2 Abmaj7:2 Dm7b5:2 G7:2";
  const HA2 = "Cm:4 Abmaj7:4 Fm7:4 G7sus4:2 G7:2 Cm:4 Abmaj7:4 Fmadd9:4 G7sus4:4";
  const MA = "G4:1 C5:1 Eb5:1.5 D5:.5 | C5:2 Eb5:1 G5:1 | Ab5:3 G5:.5 F5:.5 | C5:2 B4:2 | G4:1 C5:1 Eb5:1.5 D5:.5 | Eb5:1 G5:1 C6:2 | Ab5:2 G5:1 F5:1 | Eb5:2 D5:2";
  const MB = "Eb5:1 Ab5:1 C6:2 | Bb5:1.5 Ab5:.5 F5:2 | G5:1 Bb5:1 D6:2 | C6:1.5 Bb5:.5 G5:2 | Ab5:1 C6:1 F6:2 | Eb6:2 D6:2 | G6:2 Eb6:1 C6:1 | D6:1.5 C6:.5 B5:2";
  // the melody, erasing itself
  const MA2 = "G4:1 C5:1 Eb5:1.5 D5:.5 | C5:4 | Ab4:1 C5:1 F5:1.5 Eb5:.5 | C5:2 B4:2 | G4:1 C5:1 Eb5:2 | r:2 D5:2 | r:4 | r:2 G5:1 r:1";

  const h1 = harm(HA, 0, 4);
  s.seq("pnoR", 0, MA, { v: 0.95, hum: 0.03, dyn: (t) => (t < 16 ? 1 : 1.1) });
  s.arp("pnoL", h1, [0, 1, 2, 1], 1, { lo: 31, up: 48, v: 0.26, ring: 3, hum: 0.03 });

  const hb = harm(HB, 32, 4);
  s.seq("pnoR", 32, MB, { v: 1.05, hum: 0.03, dyn: (t) => 1 + t / 40, oct: [] });
  s.seq("pnoR", 48, "Ab4:1 C5:1 F5:2 | Eb5:2 D5:2 | G5:2 Eb5:1 C5:1 | D5:1.5 C5:.5 B4:2", { v: 0.75, hum: 0.03 });
  s.harmonize("pnoR", MB, 32, hb.slice(0, 4), { v: 0.5, min: 3, max: 9, minDur: 1.9 });
  s.arp("pnoL", hb, [0, 1, 2, 3, 2, 1, 2, 3], 0.5, { lo: 29, up: 46, v: 0.27, ring: 2, hum: 0.03 });
  hb.forEach((seg) => s.n("pnoL", seg.t, seg.d, above(seg.c.bass, 29) - 12, 0.3));

  const h2 = harm(HA2, 64, 4);
  s.seq("pnoR", 64, MA2, { v: 0.85, hum: 0.035, dyn: (t) => 1 - t / 60 });
  s.arp("pnoL", h2, [0, -1, 2, -1], 1, { lo: 31, up: 48, v: 0.22, ring: 3.5, hum: 0.03 });

  return {
    id: "sorrow",
    bpm: 56,
    len: 96,
    ev: s.ev,
    ch: {
      pnoR: { inst: "piano", pan: 0.05, rev: 0.42, prio: 2 },
      pnoL: { inst: "piano", pan: -0.1, rev: 0.4, gain: 0.9 },
    },
  };
}

// ================================================================ villain — organ + low choir, C minor

export function villain(): Track {
  const s = new Score(1010);
  const HA = "Cm:8 Abm:8 Fm:8 G:8";
  const HB = "Ab:4 Fm:4 Db:4 Bbm:4 Ebm:4 B:4 Gsus4:4 G:4";
  const HA2 = "Cm:8 Abm:8 Fm:4 Db:4 Gsus4:4 G7:4";
  const CH_A = "C3:2 D3:1 Eb3:1 | D3:2 C3:2 | Eb3:2 Cb3:1 Bb2:1 | Ab2:4 | C3:2 F3:2 | Eb3:1 Db3:1 C3:2 | D3:2 B2:2 | G2:4";
  const CH_B = "Eb3:2 C3:2 | C3:2 Ab2:2 | F3:2 Db3:2 | Db3:2 Bb2:2 | Gb3:2 Eb3:2 | F#3:2 D#3:2 | D3:2 C3:2 | B2:4";

  const organ = (segs: Seg[], v: number): void => {
    s.pad("org", segs, 48, 4, v);
    s.bass("ped", segs, 36, v * 1.1);
  };
  const h1 = harm(HA, 0, 8);
  organ(h1, 0.5);
  s.seq("choir", 0, CH_A, { v: 1.05, leg: 0.98 });
  s.n("bell", 0, 8, 36, 0.8);
  s.n("bell", 16, 8, 32, 0.6);
  for (let i = 0; i < 16; i++) s.n("timp", 28 + i * 0.25, 0.3, 43, 0.15 + i * 0.025);

  const hb = harm(HB, 32, 4);
  organ(hb, 0.55);
  s.seq("choir", 32, CH_B, { v: 1.15, leg: 0.98, oct: [7] });
  s.seq("choirHi", 40, "Ab4:4 | Bb4:4 | Bb4:4 | B4:4 | D5:4 | D5:4", { v: 0.8, leg: 0.98 });
  s.bass("cb", hb, 31, 0.35);
  s.n("timp", 32, 2, 44, 0.6);
  s.n("timp", 48, 2, 39, 0.6);
  s.n("bell", 56, 8, 43, 0.5);

  const h2 = harm(HA2, 64, 8);
  organ(h2, 0.5);
  s.seq("choir", 64, CH_A.replace("D3:2 B2:2 | G2:4", "D3:2 B2:2 | G2:2 F2:2"), { v: 1.0, leg: 0.98 });
  s.n("bell", 64, 8, 36, 0.7);
  s.n("timp", 64, 2, 38, 0.5);
  for (let i = 0; i < 16; i++) s.n("timp", 92 + i * 0.25, 0.3, 43, 0.12 + i * 0.03);

  return {
    id: "villain",
    bpm: 56,
    len: 96,
    ev: s.ev,
    ch: {
      org: { inst: "organ", pan: -0.15, rev: 0.6, gain: 0.9, prio: 1 },
      ped: { inst: "organ", pan: 0, rev: 0.5, gain: 1.0, bright: 0.5 },
      choir: { inst: "choir", fx: "oo", pan: 0.2, rev: 0.6, gain: 1.2, prio: 2 },
      choirHi: { inst: "choir", fx: "ah", pan: 0.35, rev: 0.65, gain: 0.6, prio: 1 },
      cb: { inst: "str", pan: 0.1, rev: 0.35, gain: 0.7, bright: 0.45 },
      bell: { inst: "cbell", pan: -0.3, rev: 0.7, gain: 0.7 },
      timp: { inst: "timp", pan: 0.1, rev: 0.5 },
    },
  };
}
