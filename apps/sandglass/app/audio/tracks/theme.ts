// 「천 번째 새벽」 and its arrangements: title, between (Ash King, minor
// waltz), climax (augmentation), ending (full major).

import { Score, harm, voicing, above, Seg, transposeSegs } from "../theory";
import type { Track } from "../track";
import {
  MAIN,
  MAIN3,
  MAIN_HARM,
  MAIN_HARM2,
  MINOR_HARM,
  PICKUP,
  HEAD,
  arch,
  arch3,
  augment,
  clock,
  harm3,
  rbell,
  remode,
  tickTock,
  trans,
  tuneHarm,
} from "./common";

/** cello counter-melody against the tune (D major, bar 1 at beat 0) */
export const COUNTER =
  "A3:2 F#3:2 | G3:2 B3:2 | B3:2 G3:2 | A3:2 C#4:2 | A3:2 C4:2 | B3:2 D4:2 | G4:2 E4:2 | D4:1 C#4:1 D4:2 | " +
  "D4:2 C#4:2 | B3:2 A#3:2 | B3:2 D4:2 | E4:2 C#4:2 | C#4:2 D4:2 | D4:2 Bb3:2 | A3:2 G3:2 | F#3:4";

const LH = [0, 2, 1, 3, 2, 1, 3, 2];

// ================================================================ title — 4/4, D major, 72 bpm

export function title(): Track {
  const s = new Score(1101);

  // intro (0-8): the clocks, then the music box winds the dawn motif
  const hi = harm("Gmaj7:4 A7sus4:4", 0, 4);
  clock(s, "clk", 0, 8, 1, 0.5);
  tickTock(s, "mb", hi, 62, 0.28);
  s.pad("pad", hi, 55, 3, 0.12, { sh: 1 });
  s.seq("cel", 0, "F#6:1.5 E6:.5 D6:1 A5:1", { v: 0.5 });

  // A1 (8-72): solo piano sings the tune; the box keeps time for four bars
  const h1 = tuneHarm(8);
  s.seq("pnoR", 7, PICKUP, { v: 0.8 });
  s.seq("pnoR", 8, MAIN, { v: 1.0, dyn: arch, hum: 0.025 });
  s.harmonize("pnoR", MAIN, 8, h1.filter((x) => x.t >= 40), { v: 0.5, min: 3, max: 9, minDur: 0.9 });
  s.arp("pnoL", h1, LH, 0.5, { lo: 38, up: 50, v: 0.27, hum: 0.02 });
  tickTock(s, "mb", h1.filter((x) => x.t < 24), 62, 0.18);
  clock(s, "clk", 8, 40, 1, 0.3);
  s.pad("pad", h1.filter((x) => x.t >= 40), 55, 3, 0.16);
  s.bass("cb", h1.filter((x) => x.t >= 56), 38, 0.26);

  // A2 (72-136): strings take the tune over a richer harmony; cello answers
  const h2 = tuneHarm(72, 0, MAIN_HARM2);
  s.seq("vln", 71, PICKUP, { v: 0.8 });
  s.seq("vln", 72, MAIN, { v: 1.0, dyn: arch, leg: 1.0 });
  s.seq("vc", 72, COUNTER, { v: 0.9, leg: 0.98 });
  s.arp("pnoL", h2, LH, 0.5, { lo: 38, up: 50, v: 0.26, hum: 0.02 });
  s.arp("pnoR", h2.filter((x) => x.t >= 104), [-1, 1, 2, 3, 2, 3, 1, 2], 0.5, { lo: 62, up: 69, v: 0.16, hum: 0.02 });
  s.pad("pad", h2, 55, 3, 0.2);
  s.bass("cb", h2, 38, 0.3);
  h2.forEach((seg) => {
    if (seg.t < 104 || seg.d < 2) return;
    const vs = voicing(seg.c, 62, 3);
    [0, 1, 2, 1].forEach((k, i) => s.n("harp", seg.t + i * 0.5, 1.4, vs[k] + 12, 0.22));
  });
  s.seq("mbHi", 120, trans("D6:1.5 C#6:.5 B5:1 F#5:1 | B5:1.5 A5:.5 G5:1 Bb5:1 | A5:2 F#5:1 E5:1 | D5:4", 12), { v: 0.45 });
  s.n("swell", 110, 2, 60, 0.5, 1);
  s.n("timp", 112, 2, 40, 0.45);
  s.n("timp", 72, 2, 38, 0.35);

  // outro (136-152): the head motif over the minor iv; the clocks return
  const ho = harm("Gmaj7:4 Gm6:4 D/F#:4 Em7:2 A7sus4:2", 136, 4);
  s.seq("pnoR", 136, "F#5:1.5 E5:.5 D5:1 A4:1 | Bb4:1.5 C5:.5 D5:1 G5:1 | F#5:4 | E5:2 r:2", { v: 0.75, hum: 0.02 });
  s.arp("pnoL", ho, LH, 0.5, { lo: 38, up: 50, v: 0.22, hum: 0.02 });
  s.pad("pad", ho, 55, 3, 0.13, { sh: 2 });
  clock(s, "clk", 144, 152, 1, 0.4);

  return {
    id: "title",
    bpm: 72,
    len: 152,
    ev: s.ev,
    gain: 1.05,
    ch: {
      pnoR: { inst: "piano", pan: -0.05, rev: 0.34, prio: 2 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.32, gain: 0.85 },
      cel: { inst: "celesta", pan: 0.3, rev: 0.5 },
      mb: { inst: "mbox", pan: 0.35, rev: 0.45, gain: 0.8, prio: 0 },
      mbHi: { inst: "mbox", pan: 0.3, rev: 0.5, gain: 0.8 },
      clk: { inst: "tick", pan: 0.5, rev: 0.25, gain: 0.7, prio: 0 },
      vln: { inst: "str", pan: -0.3, rev: 0.42, fx: "body", prio: 2, gain: 1.1 },
      vc: { inst: "cello", pan: 0.3, rev: 0.36, prio: 2, gain: 1.0 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", gain: 0.7, prio: 0, bright: 0.7 },
      cb: { inst: "str", pan: 0.1, rev: 0.2, gain: 0.75, bright: 0.5 },
      harp: { inst: "harp", pan: -0.45, rev: 0.45, gain: 0.85 },
      timp: { inst: "timp", rev: 0.45 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

// ================================================================ between — 3/4, D minor, 60 bpm
// The room where sand falls upward. The tune in minor, as a slow waltz whose
// every note seems to arrive backwards: swelling strings, reversed bells.

export function between(): Track {
  const s = new Score(1202);
  const BPM = 60;
  const MIN3 = remode(MAIN3, 2, [0, 2, 3, 5, 7, 8, 11]);
  const MINPICK = remode(PICKUP, 2, [0, 2, 3, 5, 7, 8, 11]);

  // intro (0-12): a low drone and reversed bells like sand rising
  const hi = harm("Dm:6 Bb/D:6", 0, 6);
  s.pad("pad", hi, 50, 3, 0.2, { sh: 1 });
  s.n("low", 0, 12.5, 38, 0.35);
  [2, 5, 8, 11].forEach((t, i) => rbell(s, "rb", t, [81, 77, 74, 69][i], 0.45, BPM));

  // A (12-108): the tune, first half in reversed bells over swelling strings
  const h = harm3(MINOR_HARM, 12);
  s.seq("rbM", 11, MINPICK, { v: 0.5 });
  s.seq("glassM", 12, MIN3, { v: 0.95, dyn: arch3 });
  s.seq("vla", 12, MIN3, { v: 0.55, tr: -12, sh: 1, leg: 1.02, dyn: arch3 });
  // "backwards" waltz: the chord swells on 2 and 3 and is cut on 1
  for (const seg of h) {
    for (let b = 0; b < seg.d - 1e-6; b += 1) {
      const t = seg.t + b;
      const pos = Math.round(t) % 3;
      if (pos === 0) s.n("bass", t, 2.9, above(seg.c.bass, 38), 0.4, 1);
      else if (pos === 1) voicing(seg.c, 57, 3).forEach((m) => s.n("sw", t, 1.95, m, 0.3, 1));
    }
  }
  s.pad("pad", h, 50, 2, 0.12, { sh: 1 });
  // the sand: rising reversed-bell arpeggios every other bar
  h.forEach((seg, i) => {
    if (i % 2 === 1) return;
    const vs = voicing(seg.c, 74, 3);
    vs.forEach((m, k) => rbell(s, "rb", seg.t + 1 + k, m + 12 * (k === 2 ? 1 : 0), 0.3, BPM));
  });

  // coda (108-120): the head once more, alone, in the music box, then gone
  const hc = harm("Bbmaj7:6 A7sus4:3 A7:3", 108, 6);
  s.seq("mb", 108, remode("F#5:2 E5:1 | D5:2 A4:1 | B4:2 C#5:1 | D5:3", 2, [0, 2, 3, 5, 7, 8, 11]), { v: 0.5, hum: 0.04 });
  s.pad("pad", hc, 50, 3, 0.16, { sh: 2 });
  s.n("low", 108, 12.5, 33, 0.3);
  rbell(s, "rb", 120, 74, 0.4, BPM);

  return {
    id: "between",
    bpm: BPM,
    len: 120,
    ev: s.ev,
    gain: 1.8,
    ch: {
      glassM: { inst: "glass", pan: 0.05, rev: 0.75, prio: 2, gain: 1.05 },
      rbM: { inst: "rglass", pan: 0.05, rev: 0.7, prio: 2 },
      rb: { inst: "rglass", pan: 0.4, rev: 0.8, gain: 0.9, prio: 1 },
      vla: { inst: "str", pan: -0.25, rev: 0.6, fx: "body", gain: 0.85, att: 0.9, prio: 2, bright: 0.7 },
      sw: { inst: "str", pan: 0.3, rev: 0.65, gain: 0.55, att: 0.8, rel: 0.25, bright: 0.6, prio: 0 },
      bass: { inst: "cello", pan: -0.1, rev: 0.5, gain: 0.8, att: 0.6, rel: 0.3 },
      pad: { inst: "pad", pan: 0.2, rev: 0.7, gain: 0.7, prio: 0 },
      low: { inst: "pad", pan: 0, rev: 0.4, gain: 0.8, att: 3, rel: 3, prio: 0 },
      mb: { inst: "mbox", pan: 0.2, rev: 0.7, prio: 2, gain: 1.1 },
    },
  };
}

// ================================================================ climax — 4/4, D minor -> D major, 144 bpm

function drive(s: Score, segs: Seg[], v: number, hi = false): void {
  const OST = [0, 0, 12, 0, 7, 0, 12, 7];
  for (const seg of segs) {
    const root = above(seg.c.bass, 38);
    for (let i = 0; i < Math.round(seg.d * 2); i++) {
      const acc = i % 8 === 0 || i % 8 === 3 || i % 8 === 6;
      s.n("ost", seg.t + i * 0.5, 0.4, root + OST[i % 8], v * (acc ? 1.2 : 0.75));
      if (acc) s.n("ostlo", seg.t + i * 0.5, 0.45, root - 12, v * 0.9);
    }
    if (hi) {
      const vs = voicing(seg.c, 69, 3);
      for (let i = 0; i < seg.d * 2; i++) s.n("vhi", seg.t + i * 0.5, 0.3, vs[[0, 1, 2, 1][i % 4]], v * (i % 4 === 0 ? 0.7 : 0.5));
    }
  }
}

function battle(s: Score, t0: number, bars: number, level: number): void {
  for (let b = 0; b < bars; b++) {
    const t = t0 + b * 4;
    s.n("bd", t, 1, 60, 0.85 * level);
    s.n("bd", t + 1.5, 1, 60, 0.55 * level);
    s.n("bd", t + 2.5, 1, 60, 0.6 * level);
    s.n("dr", t + 1, 0.5, 60, 0.6 * level);
    s.n("dr", t + 3, 0.5, 60, 0.7 * level);
    s.n("dr", t + 3.5, 0.5, 60, 0.35 * level);
    if (b % 4 === 3) for (let k = 0; k < 4; k++) s.n("dr", t + 2 + k * 0.5, 0.5, 60, (0.4 + k * 0.12) * level);
  }
}

export function climax(): Track {
  const s = new Score(1303);
  const MIN = remode(MAIN, 2, [0, 2, 3, 5, 7, 8, 11]);

  // intro (0-16): ash wind; the choir states the head in minor, drums gather
  const hi = harm("Dm:4 Bb:4 Gm:4 A7:4", 0, 4);
  drive(s, hi, 0.5);
  s.pad("choir", hi, 57, 3, 0.35, { sh: 1 });
  s.seq("brass", 0, remode(HEAD, 2, [0, 2, 3, 5, 7, 8, 11]), { v: 0.9, tr: -12 });
  hi.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.65));
  for (let i = 0; i < 16; i++) s.n("timp", 12 + i * 0.25, 0.3, 45, 0.25 + i * 0.03);
  s.n("swell", 12, 4, 60, 0.7, 1);

  // A (16-48): the battle theme — a new, angular line that grows from the head
  const ha = harm("Dm:4 Bb:4 C:4 A7:4 Dm:4 F/C:4 Gm:2 A7:2 Dm:4", 16, 4);
  drive(s, ha, 0.6, true);
  s.seq("vln", 16, "D5:1.5 A4:.5 D5:1 F5:1 | E5:1.5 D5:.5 Bb4:2 | C5:1.5 G4:.5 C5:1 E5:1 | C#5:3 A4:1 | " +
    "D5:1.5 E5:.5 F5:1 A5:1 | G5:1.5 F5:.5 E5:1 C5:1 | D5:1 Bb4:1 C#5:1 E5:1 | D5:4", { v: 1.15, oct: [-12] });
  s.pad("brassP", ha, 50, 3, 0.4);
  s.pad("choir", ha, 57, 3, 0.35);
  battle(s, 16, 8, 1);
  ha.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.75));

  // B (48-80): the theme augmented, in minor — the Ash King's sorrow as a war cry
  const hb = harm(MINOR_HARM, 0, 4)
    .filter((x) => x.t < 16)
    .map((x) => ({ ...x, t: 48 + x.t * 2, d: x.d * 2 }));
  augment(s, "brass", 48, MIN.split("|").slice(0, 4).join("|"), 2, { v: 1.1, tr: -12, oct: [12] });
  augment(s, "choirM", 48, MIN.split("|").slice(0, 4).join("|"), 2, { v: 0.9 });
  drive(s, hb, 0.62, true);
  s.pad("pad", hb, 50, 4, 0.35);
  battle(s, 48, 8, 1.05);
  hb.forEach((seg) => s.n("timp", seg.t, 1.5, above(seg.c.root, 38), 0.8));
  s.n("swell", 76, 4, 60, 0.9, 1);
  for (let i = 0; i < 16; i++) s.n("timp", 76 + i * 0.25, 0.3, 45, 0.3 + i * 0.035);

  // PEAK (80-144): the tune augmented in D MAJOR — the dawn breaking through
  const hp = harm(MAIN_HARM, 0, 4)
    .filter((x) => x.t >= 32)
    .map((x) => ({ ...x, t: 80 + (x.t - 32) * 2, d: x.d * 2 }));
  const B2 = MAIN.split("|").slice(8).join("|");
  augment(s, "vln", 80, B2, 2, { v: 1.2, oct: [-12], dyn: (t) => (t < 8 ? 1.1 : t < 16 ? 1.25 : 1.05) });
  augment(s, "brass", 80, B2, 2, { v: 0.95, tr: -12, dyn: (t) => (t < 16 ? 1.1 : 1) });
  augment(s, "choirM", 80, B2, 2, { v: 0.85, tr: -12 });
  drive(s, hp, 0.66, true);
  s.pad("choir", hp, 57, 3, 0.42);
  s.pad("pad", hp, 50, 4, 0.36);
  s.bass("cb", hp, 38, 0.4);
  battle(s, 80, 16, 1.1);
  hp.forEach((seg) => s.n("timp", seg.t, 1.5, above(seg.c.root, 38), 0.85));
  s.n("swell", 80, 3, 60, 1, 0);
  s.n("swell", 112, 3, 60, 0.8, 0);

  // turn (144-160): back into D minor — the fight isn't over
  const hz = harm("Bb:4 Gm:4 Em7b5:4 A7:4", 144, 4);
  drive(s, hz, 0.58, true);
  s.seq("brass", 144, "D4:1.5 A3:.5 D4:1 F4:1 | G4:2 D4:2 | E4:1.5 G4:.5 Bb4:2 | A4:4", { v: 1.05, oct: [12] });
  s.pad("choir", hz, 57, 3, 0.38, { sh: 1 });
  battle(s, 144, 4, 0.95);
  hz.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.75));

  return {
    id: "climax",
    bpm: 144,
    len: 160,
    ev: s.ev,
    gain: 0.6,
    ch: {
      ost: { inst: "strs", pan: -0.1, rev: 0.25, fx: "body" },
      ostlo: { inst: "strs", pan: 0.1, rev: 0.2, gain: 0.9, bright: 0.7 },
      vhi: { inst: "strs", pan: -0.4, rev: 0.35, gain: 0.45, prio: 0 },
      vln: { inst: "str", pan: -0.25, rev: 0.4, fx: "body", prio: 2, gain: 1.1 },
      brass: { inst: "brass", pan: 0.25, rev: 0.4, prio: 2, gain: 1 },
      brassP: { inst: "brass", pan: 0.35, rev: 0.45, prio: 0, gain: 0.6, bright: 0.7 },
      choir: { inst: "choir", fx: "ah", pan: 0.35, rev: 0.55, prio: 0, gain: 0.8 },
      choirM: { inst: "choir", fx: "ah", pan: -0.1, rev: 0.55, prio: 1, gain: 0.9 },
      pad: { inst: "str", pan: 0.2, rev: 0.4, prio: 0, gain: 0.6, bright: 0.7 },
      cb: { inst: "str", pan: 0, rev: 0.2, gain: 0.7, bright: 0.5 },
      timp: { inst: "timp", rev: 0.35 },
      bd: { inst: "bdrum", rev: 0.3, gain: 0.85 },
      dr: { inst: "fdrum", pan: 0.15, rev: 0.25, gain: 0.8 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

// ================================================================ ending — 4/4, D major -> E-flat, 76 bpm

export function ending(): Track {
  const s = new Score(1404);

  // intro (0-8): dawn — the box winds once more, then the strings open
  const hi = harm("Gmaj7:4 A7sus4:2 A7:2", 0, 4);
  tickTock(s, "mb", hi, 62, 0.25);
  clock(s, "clk", 0, 4, 1, 0.35);
  s.pad("pad", hi, 55, 4, 0.22, { sh: 1 });
  s.gliss("harp", 6, 1.6, 50, 86, [2, 4, 6, 7, 9, 11, 1], 0.32);
  s.n("swell", 5, 3, 60, 0.5, 1);

  // tune 1 (8-72), D: flute + piano, strings breathing underneath
  const h1 = tuneHarm(8);
  s.seq("fl", 7, PICKUP, { v: 0.8 });
  s.seq("fl", 8, MAIN, { v: 1.0, dyn: arch });
  s.seq("vc", 40, COUNTER.split("|").slice(8).join("|"), { v: 0.9, leg: 0.98 });
  s.arp("pnoL", h1, LH, 0.5, { lo: 38, up: 50, v: 0.28, hum: 0.02 });
  s.arp("pnoR", h1, [-1, 1, 2, 3, 2, 3, 1, 2], 0.5, { lo: 62, up: 66, v: 0.16, hum: 0.02 });
  s.pad("pad", h1, 55, 4, 0.2);
  s.bass("cb", h1, 38, 0.3);
  [8, 24, 40, 56].forEach((t) => s.n("timp", t, 2, 38, 0.4));

  // tune 2 (72-136), E-flat: everyone. choir and brass, harp rolling
  const E = 1;
  const h2 = tuneHarm(72, E, MAIN_HARM2);
  s.seq("vln", 71, trans(PICKUP, E), { v: 0.8 });
  s.seq("vln", 72, trans(MAIN, E), { v: 1.15, dyn: arch, oct: [-12] });
  s.seq("brass", 104, trans(MAIN.split("|").slice(8).join("|"), E - 12), { v: 0.85, dyn: arch });
  s.seq("fl", 104, trans(MAIN.split("|").slice(8).join("|"), E + 12), { v: 0.55 });
  s.seq("vc", 72, trans(COUNTER, E), { v: 1.05, leg: 0.98 });
  s.arp("pnoL", h2, LH, 0.5, { lo: 39, up: 51, v: 0.3, hum: 0.02 });
  s.pad("choir", h2, 58, 3, 0.36);
  s.pad("pad", h2, 55, 4, 0.26);
  s.bass("cb", h2, 39, 0.36);
  h2.forEach((seg) => {
    const vs = voicing(seg.c, 63, 3);
    [0, 1, 2, 1].slice(0, Math.round(seg.d)).forEach((k, i) => s.n("harp", seg.t + i * 0.5, 1.3, vs[k] + 12, 0.22));
  });
  [72, 88, 104, 120].forEach((t) => {
    s.n("timp", t, 2, t === 104 ? 46 : 39, 0.6);
    s.n("bd", t, 2, 60, t === 104 ? 0.7 : 0.4);
  });
  s.n("swell", 101, 3, 60, 0.8, 1);

  // close (136-156): piano alone — "to you, on the thousandth dawn" — and the clocks stop
  const hc = transposeSegs(harm("Gmaj7:4 A/G:4 F#m7:4 Bm7:4 Em7:2 A7:2 Dmaj7:4", 136, 4), E);
  s.seq("pnoR", 136, trans("F#5:1.5 E5:.5 D5:1 A4:1 | B4:1.5 C#5:.5 D5:1 G5:1 | F#5:1.5 E5:.5 E5:1 D5:1 | D5:4 | E5:2 C#5:2 | D5:4", E), { v: 0.75, hum: 0.025 });
  s.arp("pnoL", hc, LH, 0.5, { lo: 39, up: 51, v: 0.22, hum: 0.02 });
  s.pad("pad", hc, 55, 3, 0.14, { sh: 2 });
  s.seq("cel", 150, trans("A6:.5 D7:.5 F#7:3", E), { v: 0.4 });
  clock(s, "clk", 136, 142, 1, 0.25);

  return {
    id: "ending",
    bpm: 76,
    len: 160,
    ev: s.ev,
    gain: 0.85,
    ch: {
      vln: { inst: "str", pan: -0.3, rev: 0.4, fx: "body", prio: 2, gain: 1.1 },
      fl: { inst: "flute", pan: 0.2, rev: 0.45, prio: 2, gain: 0.8 },
      vc: { inst: "cello", pan: 0.3, rev: 0.35, prio: 2 },
      brass: { inst: "brass", pan: 0.2, rev: 0.45, prio: 1, gain: 0.8, bright: 0.8 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", prio: 0, gain: 0.7, bright: 0.75 },
      choir: { inst: "choir", fx: "ah", pan: -0.15, rev: 0.55, prio: 0, gain: 0.75 },
      cb: { inst: "str", pan: 0.05, rev: 0.2, gain: 0.75, bright: 0.5 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.3, gain: 0.8 },
      pnoR: { inst: "piano", pan: -0.05, rev: 0.34, prio: 2 },
      cel: { inst: "celesta", pan: 0.3, rev: 0.55 },
      mb: { inst: "mbox", pan: 0.35, rev: 0.45, gain: 0.8, prio: 0 },
      clk: { inst: "tick", pan: 0.5, rev: 0.25, gain: 0.7, prio: 0 },
      harp: { inst: "harp", pan: -0.45, rev: 0.4, gain: 0.8 },
      timp: { inst: "timp", rev: 0.4 },
      bd: { inst: "bdrum", rev: 0.35, gain: 0.7 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}
