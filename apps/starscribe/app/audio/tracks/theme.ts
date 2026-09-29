// The main theme 「새벽별의 노래」 and its arrangements:
// title, lullaby, climax (augmentation), ending (major, full).

import { Score, harm, transposeSegs, voicing, Seg, parse, above } from "../theory";
import type { Track } from "../track";

/**
 * MAIN MELODY (F major, 3/4). Starts with a one-beat pickup; bar 1 at beat 1.
 *   잠들어라 작은 별아, 밤바다를 건너 / 달빛 배에 실려 가도 길을 잃지 않게
 *   (아스텔리아), 새벽의 별아 / 네 이름을 부르는 이가 여기 있으니
 * a (1-4, half cadence) a' (5-8, full) b (9-12, climax F5 on the name) a'' (13-16)
 */
export const MAIN =
  "C4:.5 F4 | A4:1.5 G4:.5 F4 G4 | D5:2 C5:1 | Bb4:.5 A4 G4:1 F4 | E4 G4 C4:.5 F4 | " +
  "A4:1.5 G4:.5 F4 G4 | C5:2 A4:1 | Bb4:.5 A4 G4:1 E4 | G4 F4 C5:.5 D5 | " +
  "F5:1.5 E5:.5 D5:1 | C5:2 A4:.5 Bb4 | D5:1.5 C5:.5 Bb4:1 | A4 G4 C4:.5 F4 | " +
  "A4:1.5 G4:.5 F4 G4 | D5:2 C5:1 | D5:.5 C5 Bb4 A4 G4:1 | F4:3";
export const MAIN_LEN = 49; // pickup + 16 bars

/** harmony of the tune, bar 1 at beat 0 */
export const MAIN_HARM =
  "F:3 Dm:3 Bb:3 C:1 C7:2 | F:3 Am7:3 Gm7:2 C7:1 F:2 F7:1 | " +
  "Bbmaj7:3 Am7:2 D7:1 Gm7:3 F/C:1 C7:2 | F:3 Dm:3 Bb:1 Gm7:1 C7:1 F:3";

/** cello counter-melody against the tune (F major, bar 1 at beat 0) */
export const COUNTER =
  "C4:2 A3:1 | D4:2 E4:1 | F4:1.5 E4:.5 D4:1 | C4:2 Bb3:1 | A3:2 C4:1 | E4:3 | D4:2 Bb3:1 | A3:2 Eb4:1 | " +
  "D4:3 | E4:2 F#4:1 | G4:1.5 F4:.5 D4:1 | C4:1 Bb3:2 | A3:3 | F4:2 E4:1 | D4:2 E4:1 | F4:3";

/** the name motif (bars 8-9 of the tune): 아스-텔리아 */
export const NAME = "C5:.5 D5 | F5:1.5 E5:.5 D5:1 | C5:3";

/** melody dynamics: an arch that peaks on the name (bar 9) */
export const arch = (rel: number): number => {
  const bar = Math.floor((rel - 1) / 3) + 1;
  if (rel >= 23.5 && bar <= 8) return 1.22;
  if (bar <= 4) return 1;
  if (bar <= 8) return 1.08;
  if (bar <= 10) return 1.35;
  if (bar <= 12) return 1.2;
  if (bar <= 15) return 1.06;
  return 0.9;
};

export const tuneHarm = (bar1: number, tr = 0): Seg[] => transposeSegs(harm(MAIN_HARM), tr, bar1);

/** augment a DSL phrase by factor k */
function augmented(s: Score, ch: string, t0: number, src: string, k: number, o: { tr?: number; v?: number; upto?: number; extendLast?: number; oct?: number[] } = {}): void {
  const { notes } = parse(src, o.tr || 0);
  const list = notes.filter((n) => o.upto === undefined || n.t < o.upto);
  list.forEach((n, i) => {
    let d = n.d * k;
    if (i === list.length - 1 && o.extendLast) d += o.extendLast;
    const dv = arch(n.t);
    for (const m of n.m) {
      s.n(ch, t0 + n.t * k, d * 0.97, m, n.v * (o.v ?? 1) * dv, 0);
      if (o.oct) for (const x of o.oct) s.n(ch, t0 + n.t * k, d * 0.97, m + x, n.v * (o.v ?? 1) * dv * 0.8, 0);
    }
  });
}

/** 3/4 piano left-hand: bass + rolling eighths */
const LH34 = [0, 1, 2, 3, 2, 1];

// ================================================================ title

export function title(): Track {
  const s = new Score(11);
  // written in F, transposed to E-flat at the end
  const intro = harm("Dm7:3 Bbmaj7:3 F/A:3 Csus4:2 C:1", 0);
  s.arp("pnoL", intro, LH34, 0.5, { lo: 38, up: 53, v: 0.3, hum: 0.02 });
  s.seq("cel", 2, "C6:.5 D6 | F6:1.5 E6:.5 D6:1 | C6:3", { v: 0.8, hum: 0.01 });
  s.pad("pad", intro, 53, 3, 0.16, { sh: 1 });

  // tune 1: solo piano
  const h1 = tuneHarm(12);
  s.seq("pnoR", 11, MAIN, { tr: 12, v: 1.05, dyn: arch, hum: 0.025 });
  s.harmonize("pnoR", MAIN, 11, h1.filter((x) => x.t >= 36), { tr: 12, v: 0.55, min: 3, max: 9 });
  s.arp("pnoL", h1, LH34, 0.5, { lo: 36, up: 52, v: 0.3, hum: 0.02 });
  s.pad("pad", h1.filter((x) => x.t >= 36), 53, 4, 0.2, { sh: 0 });
  s.seq("cel", 57.5, "A5:.5 C6:.5 F6:1.5", { v: 0.6 });

  // bridge: cello sings in D minor
  const hb = harm("Dm:3 Bb:3 Gm7:3 A7sus4:2 A7:1 Dm:3 Bbmaj7:3 Gm7:3 C7sus4:2 C7:1", 60);
  s.seq("vc", 60, "A3:1 D4 E4 | F4:2 E4:.5 D4 | D4:1.5 C4:.5 Bb3:1 | D4:2 C#4:1 | A3:1 D4 F4 | A4:2 G4:.5 F4 | Bb4:1.5 A4:.5 G4:1 | F4:1 E4:1", {
    v: 1.1,
    leg: 0.98,
    dyn: (t) => (t < 12 ? 1 : t < 21 ? 1.2 : 1.05),
  });
  s.arp("pnoL", hb, LH34, 0.5, { lo: 38, up: 53, v: 0.26, hum: 0.02 });
  s.pad("pad", hb, 57, 3, 0.2);
  for (const seg of hb) {
    const vs = voicing(seg.c, 65, 4);
    if (seg.d >= 3) vs.forEach((m, i) => s.n("harp", seg.t + i * 0.12, 2.5, m, 0.34));
  }
  s.gliss("harp", 81.8, 1.1, 60, 84, [0, 2, 4, 5, 7, 9, 10], 0.34);
  for (let i = 0; i < 8; i++) s.n("timp", 81 + i * 0.25, 0.3, 36, 0.12 + i * 0.03);

  // tune 2: strings take the melody, cello counter, piano rolls
  const h2 = tuneHarm(84);
  s.seq("vln", 83, MAIN, { tr: 12, v: 1.0, dyn: arch, leg: 1.0 });
  s.seq("fl", 107, "C5:.5 D5 | F5:1.5 E5:.5 D5:1 | C5:2 A4:.5 Bb4 | D5:1.5 C5:.5 Bb4:1 | A4 G4:2", { tr: 12, v: 0.8 });
  s.seq("vc", 84, COUNTER, { v: 0.95, leg: 0.98 });
  s.arp("pnoL", h2, LH34, 0.5, { lo: 36, up: 52, v: 0.3, hum: 0.02 });
  s.arp("pnoR", h2.filter((x) => x.t >= 108), [-1, 1, 2, 3, 2, 3], 0.5, { lo: 60, up: 67, v: 0.2, hum: 0.02 });
  s.pad("pad", h2, 53, 4, 0.24);
  s.bass("cb", h2, 36, 0.32);
  h2.filter((x) => x.t >= 108 && x.d >= 2).forEach((seg) => {
    const vs = voicing(seg.c, 60, 3);
    [0, 1, 2, 0, 1, 2].forEach((k, i) => s.n("harp", seg.t + i * 0.5, 1.5, vs[k] + (i >= 3 ? 12 : 0), 0.26));
  });
  s.n("timp", 84, 2, 41, 0.45);
  s.n("swell", 105, 3, 60, 0.5, 1);
  for (let i = 0; i < 8; i++) s.n("timp", 106 + i * 0.25, 0.3, 36, 0.1 + i * 0.035);
  s.n("timp", 108, 2, 46, 0.6);
  s.n("timp", 129, 2, 41, 0.3);

  // outro: the name motif over the minor iv, back to the intro
  const ho = harm("Bbmaj7:3 Bbm6:3 F/A:3 Gm7:2 C7sus4:1", 132);
  s.arp("pnoL", ho, LH34, 0.5, { lo: 34, up: 50, v: 0.26, hum: 0.02 });
  s.seq("pnoR", 131, "C5:.5 D5 | F5:1.5 E5:.5 D5:1 | Db5:2 C5:1 | A4:3 | G4:2", { tr: 12, v: 0.8, hum: 0.02 });
  s.pad("pad", ho, 53, 3, 0.16, { sh: 2 });

  for (const e of s.ev) e.m -= 2; // -> E-flat major
  return {
    id: "title",
    bpm: 72,
    len: 144,
    ev: s.ev,
    ch: {
      pnoR: { inst: "piano", pan: -0.05, rev: 0.32, prio: 2 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.32, gain: 0.85 },
      cel: { inst: "celesta", pan: 0.3, rev: 0.5 },
      vln: { inst: "str", pan: -0.3, rev: 0.4, fx: "body", prio: 2, gain: 1.1 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", gain: 0.75, prio: 0, bright: 0.7 },
      vc: { inst: "cello", pan: 0.3, rev: 0.35, prio: 2, gain: 1.05 },
      cb: { inst: "str", pan: 0.1, rev: 0.2, gain: 0.8, bright: 0.5, prio: 1 },
      fl: { inst: "flute", pan: 0.15, rev: 0.45, prio: 2, gain: 0.8 },
      harp: { inst: "harp", pan: -0.45, rev: 0.45, gain: 0.9 },
      timp: { inst: "timp", pan: 0.05, rev: 0.4 },
      swell: { inst: "swell", pan: 0, rev: 0.6, prio: 0 },
    },
  };
}

// ================================================================ lullaby

/** music-box comb accompaniment: bass on 1, dyads on 2 and 3 */
function comb(s: Score, ch: string, segs: Seg[], lo: number, up: number, v: number, skip = 1): void {
  let k = 0;
  for (const seg of segs) {
    for (let b = 0; b < seg.d; b++) {
      const t = seg.t + b;
      if (b === 0) s.n(ch, t, 2.5, above(seg.c.bass, lo), v);
      else if (k++ % skip === 0) {
        const vs = voicing(seg.c, up, 2);
        vs.forEach((m) => s.n(ch, t + 0.01, 1.2, m, v * 0.62));
      }
    }
  }
}

export function lullaby(): Track {
  const s = new Score(23);
  // intro: the box is wound
  s.seq("mb", 0, "F5:1 A5 C6 | A5:2", { v: 0.75 });
  s.n("mb", 0, 3, 53, 0.4);
  s.n("mb", 3, 2, 48, 0.35);

  // tune 1: music box alone
  const h1 = tuneHarm(6);
  s.seq("mb", 5, MAIN, { tr: 12, v: 1.0, dyn: arch, hum: 0.03 });
  comb(s, "mbacc", h1, 48, 60, 0.42);

  // tune 2: celesta, with the box sparkling above; a breath of strings and voices
  const h2 = tuneHarm(54);
  s.seq("cel", 53, MAIN, { tr: 12, v: 1.0, dyn: arch, hum: 0.02 });
  comb(s, "mbacc", h2, 48, 60, 0.3, 2);
  h2.forEach((seg, i) => {
    if (i % 2 === 1 && seg.d >= 3) {
      const vs = voicing(seg.c, 77, 3);
      [2, 1, 0].forEach((k, j) => s.n("mbhi", seg.t + 1 + j * 0.5, 1, vs[k], 0.2));
    }
  });
  s.pad("pad", h2, 53, 3, 0.13);
  s.pad("choir", h2.filter((x) => x.t >= 78 && x.t < 90), 60, 3, 0.2, { sh: 1 });
  h2.forEach((seg) => s.n("harp", seg.t, 2, above(seg.c.bass, 41), 0.28));

  // coda: the name, slowing like a spring running down
  const c = [
    [102, 0.6, "C6"],
    [102.6, 0.8, "D6"],
    [103.4, 1.5, "F6"],
    [104.95, 0.95, "E6"],
    [105.95, 1.7, "D6"],
    [107.7, 3.2, "C6"],
  ] as const;
  const { notes } = parse(c.map(([, d, n]) => `${n}:${d}`).join(" "));
  notes.forEach((n, i) => s.n("mb", c[i][0], c[i][1] + 0.4, n.m[0], 0.42 - i * 0.02));
  s.n("mbacc", 102, 3, 53, 0.3);
  s.n("mbacc", 104.95, 3, 58, 0.26);
  s.n("mbacc", 107.7, 4, 53, 0.24);
  s.n("mbacc", 107.75, 4, 60, 0.16);
  s.n("mbacc", 110.6, 3, 65, 0.1);

  return {
    id: "lullaby",
    bpm: 63,
    len: 114,
    ev: s.ev,
    ch: {
      mb: { inst: "mbox", pan: 0.05, rev: 0.4, prio: 2 },
      mbacc: { inst: "mbox", pan: -0.15, rev: 0.4, gain: 0.8 },
      mbhi: { inst: "mbox", pan: 0.35, rev: 0.55, gain: 0.7 },
      cel: { inst: "celesta", pan: 0.1, rev: 0.45, prio: 2, gain: 1.1 },
      pad: { inst: "str", pan: 0.2, rev: 0.5, gain: 0.6, bright: 0.6, att: 1.2, prio: 0 },
      choir: { inst: "choir", fx: "oo", pan: -0.2, rev: 0.6, gain: 0.7, prio: 0 },
      harp: { inst: "harp", pan: -0.35, rev: 0.4, gain: 0.8 },
    },
  };
}

// ================================================================ climax

const OST = [0, 0, 7, 0, 0, 7, 12, 7];

function ostinato(s: Score, segs: Seg[], lo: number, v: number, hi = false): void {
  for (const seg of segs) {
    const root = above(seg.c.bass, lo);
    const n = Math.round(seg.d * 2);
    for (let i = 0; i < n; i++) {
      const acc = i % 8 === 0 || i % 8 === 3 || i % 8 === 6;
      s.n("ost", seg.t + i * 0.5, 0.4, root + OST[i % 8], v * (acc ? 1.2 : 0.78));
      if (acc) s.n("ostlo", seg.t + i * 0.5, 0.45, root - 12, v * 0.9);
    }
    if (hi) {
      const vs = voicing(seg.c, 69, 3);
      const pat = [0, 1, 2, 1];
      for (let i = 0; i < seg.d * 4; i++) s.n("vhi", seg.t + i * 0.25, 0.2, vs[pat[i % 4]], v * (i % 4 === 0 ? 0.75 : 0.5));
    }
  }
}

export function climax(): Track {
  const s = new Score(37);
  // intro (0-16): ostinato + timpani, brass swell
  const hi = harm("Dm:4 Dm:4 Bb/D:4 Dm:4", 0, 4);
  ostinato(s, hi, 50, 0.55);
  hi.forEach((seg) => {
    s.n("timp", seg.t, 1, 38, 0.7);
    s.n("timp", seg.t + 2.5, 1, 38, 0.4);
  });
  s.pad("brass", harm("Dm:8", 8, 8), 50, 3, 0.55, { sh: 1 });
  s.n("bd", 0, 2, 60, 0.8);
  s.n("bd", 8, 2, 60, 0.7);

  // A (16-48)
  const ha = harm("Dm:4 Bb:4 Gm:4 A:4 Dm:4 Bb:4 C:4 A7:4", 16, 4);
  ostinato(s, ha, 50, 0.6, true);
  s.seq("brass", 16, "D4:1.5 A4:.5 D5:2 | C5:1 Bb4:1 F4:2 | G4:1.5 Bb4:.5 D5:1.5 C5:.5 | C#5:2 A4:2 | D5:1.5 E5:.5 F5:2 | F5:1 D5:1 Bb4:2 | C5:1 E5:1 G5:2 | E5:2 C#5:2", {
    v: 1.25,
    oct: [-12],
    leg: 0.95,
  });
  s.pad("choir", ha, 57, 3, 0.4);
  s.pad("pad", ha, 50, 4, 0.35);
  ha.forEach((seg, i) => {
    s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.8);
    s.n("timp", seg.t + 2.5, 1, above(seg.c.root, 38), 0.45);
    if (i % 2 === 0) s.n("bd", seg.t, 2, 60, 0.8);
  });

  // B (48-80): rising sequence
  const hb = harm("Gm:4 A:4 Bb:4 C:4 Dm:4 Bb:4 Gm7:4 C7:2", 48, 4);
  ostinato(s, hb, 50, 0.65, true);
  s.seq("vln", 48, "G4:1 Bb4:1 D5:2 | C#5:1 E5:1 A5:2 | D5:1 F5:1 Bb5:2 | E5:1 G5:1 C6:2 | D6:3 C6:.5 Bb5:.5 | Bb5:2 F5:2 | G5:2 Bb5:1 D6:1 | C6:2", {
    v: 1.2,
    oct: [-12],
    dyn: (t) => 0.9 + t / 60,
  });
  s.pad("choir", hb, 57, 3, 0.45, { sh: 1 });
  s.pad("brass", hb.slice(4), 53, 3, 0.5, { sh: 1 });
  hb.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.8));
  s.n("swell", 72, 8, 60, 0.9, 1);
  for (let i = 0; i < 16; i++) s.n("timp", 76 + i * 0.25, 0.3, 45, 0.3 + i * 0.03);

  // PEAK (78-152): the lullaby in augmentation, in F major, over the drive
  augmented(s, "vln", 78, MAIN, 2, { tr: 12, v: 1.25, upto: 36, extendLast: 2, oct: [-12] });
  augmented(s, "brass", 78, MAIN, 2, { tr: 0, v: 1.0, upto: 36, extendLast: 2 });
  augmented(s, "choirM", 78, MAIN, 2, { tr: 0, v: 0.9, upto: 36, extendLast: 2 });
  const hp = transposeSegs(harm(MAIN_HARM.split("| F:3 Dm:3 Bb:1")[0]), 0).map((x) => ({ ...x, t: 80 + x.t * 2, d: x.d * 2 }));
  ostinato(s, hp, 41, 0.7, true);
  s.pad("choir", hp, 53, 3, 0.45);
  s.pad("pad", hp, 48, 4, 0.4);
  hp.forEach((seg) => {
    s.n("timp", seg.t, 1.5, above(seg.c.root, 38), 0.9);
    s.n("bd", seg.t, 2, 60, 0.7);
  });
  for (let i = 0; i < 8; i++) s.n("timp", 126 + i * 0.25, 0.3, 45, 0.4 + i * 0.05);
  s.n("swell", 128, 4, 60, 1, 0);
  s.n("bd", 128, 3, 60, 1);

  // outro (152-168): deceptive turn back to D minor
  const hz = harm("Dm:4 Bb:4 Gm:4 A7:4", 152, 4);
  ostinato(s, hz, 50, 0.6);
  s.seq("brass", 152, "D4:1.5 A4:.5 D5:2 | r:4 | G4:1.5 Bb4:.5 D5:2 | C#5:4", { v: 1.1, oct: [-12] });
  s.pad("choir", hz, 57, 3, 0.35, { sh: 2 });
  hz.forEach((seg) => s.n("timp", seg.t, 1, above(seg.c.root, 38), 0.75));

  return {
    id: "climax",
    bpm: 138,
    len: 168,
    ev: s.ev,
    gain: 0.9,
    ch: {
      ost: { inst: "strs", pan: -0.1, rev: 0.25, fx: "body", gain: 1 },
      ostlo: { inst: "strs", pan: 0.1, rev: 0.2, gain: 0.9, bright: 0.7 },
      vhi: { inst: "strs", pan: -0.4, rev: 0.35, gain: 0.5, prio: 0 },
      vln: { inst: "str", pan: -0.25, rev: 0.4, fx: "body", prio: 2, gain: 1.1 },
      brass: { inst: "brass", pan: 0.25, rev: 0.4, prio: 2, gain: 1 },
      choir: { inst: "choir", fx: "ah", pan: 0.35, rev: 0.55, prio: 0, gain: 0.8 },
      choirM: { inst: "choir", fx: "ah", pan: -0.1, rev: 0.55, prio: 1, gain: 0.9 },
      pad: { inst: "str", pan: 0.2, rev: 0.4, prio: 0, gain: 0.6, bright: 0.7 },
      timp: { inst: "timp", pan: 0, rev: 0.35, gain: 1 },
      bd: { inst: "bdrum", pan: 0, rev: 0.3, gain: 0.9 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

// ================================================================ ending

export function ending(): Track {
  const s = new Score(51);
  const D = -3; // F -> D
  const E = -1; // F -> E

  // intro (0-12): fanfare swell on the name motif
  const hi = transposeSegs(harm("F:3 Bb/F:3 F:3 C7sus4:2 C7:1", 0), D);
  s.pad("brassP", hi, 50, 3, 0.4, { sh: 1 });
  s.seq("brass", 2, NAME, { tr: D, v: 1.1, oct: [-12] });
  s.pad("pad", hi, 57, 4, 0.3, { sh: 1 });
  for (let i = 0; i < 12; i++) s.n("timp", i * 0.25, 0.3, 38, 0.1 + i * 0.03);
  s.n("timp", 3, 2, 38, 0.6);
  s.gliss("harp", 9.5, 1.4, 50, 86, [2, 4, 6, 7, 9, 11, 1], 0.35);
  s.bass("cb", hi, 33, 0.35);

  // tune 1 (11-60) in D: full strings, flute, piano rolls
  const h1 = tuneHarm(12, D);
  s.seq("vln", 11, MAIN, { tr: D + 12, v: 1.1, dyn: arch });
  s.seq("fl", 35, "C5:.5 D5 | F5:1.5 E5:.5 D5:1 | C5:2 A4:.5 Bb4 | D5:1.5 C5:.5 Bb4:1 | A4 G4 C4:.5 F4 | A4:1.5 G4:.5 F4 G4 | D5:2 C5:1 | D5:.5 C5 Bb4 A4 G4:1 | F4:3", { tr: D + 24, v: 0.7 });
  s.seq("vc", 12, COUNTER, { tr: D, v: 1.0 });
  s.arp("pnoL", h1, LH34, 0.5, { lo: 33, up: 50, v: 0.32, hum: 0.02 });
  s.arp("pnoR", h1, [-1, 1, 2, 3, 2, 3], 0.5, { lo: 57, up: 64, v: 0.2, hum: 0.02 });
  s.pad("pad", h1, 50, 4, 0.28);
  s.pad("brassP", h1.filter((x) => x.t >= 36), 50, 3, 0.3);
  s.pad("choir", h1.filter((x) => x.t >= 36 && x.t < 48), 57, 3, 0.3);
  s.bass("cb", h1, 33, 0.35);
  [12, 24, 36, 48].forEach((t) => s.n("timp", t, 2, t === 36 ? 43 : 38, 0.55));

  // bridge (60-84): 「눈을 뜨면 아침이 와」, turning toward E
  const hb = harm("Gmaj7:3 A:3 F#m7:3 Bm7:3 Gmaj7:3 A/G:3 F#m7:2 B7:1 B7sus4:2 B7:1", 60);
  s.seq("vln", 60, "D5:1 G5:1.5 F#5:.5 | E5:1.5 D5:.5 C#5:1 | A5:2 F#5:1 | D5:3 | D5:1 G5:1.5 A5:.5 | C#6:2 B5:1 | A5:1.5 F#5:.5 D#5:1 | E5:1 D#5:1", {
    v: 1.1,
    dyn: (t) => 0.95 + t / 60,
  });
  s.seq("fl", 72, "B5:3 | A5:3 | F#5:3 | B5:2", { v: 0.6 });
  s.arp("pnoL", hb, LH34, 0.5, { lo: 31, up: 50, v: 0.3, hum: 0.02 });
  s.pad("pad", hb, 52, 4, 0.3, { sh: 1 });
  s.bass("cb", hb, 33, 0.35);
  s.n("swell", 78, 6, 60, 0.8, 1);
  for (let i = 0; i < 12; i++) s.n("timp", 81 + i * 0.25, 0.3, 47, 0.2 + i * 0.04);

  // tune 2 (83-132) in E: everything
  const h2 = tuneHarm(84, E);
  s.seq("vln", 83, MAIN, { tr: E + 12, v: 1.2, dyn: arch, oct: [-12] });
  s.seq("brass", 83, MAIN, { tr: E, v: 0.9, dyn: arch });
  s.seq("fl", 83, MAIN, { tr: E + 24, v: 0.6, dyn: arch });
  s.seq("vc", 84, COUNTER, { tr: E, v: 1.1 });
  s.arp("pnoL", h2, LH34, 0.5, { lo: 35, up: 52, v: 0.34, hum: 0.02 });
  s.pad("choir", h2, 56, 3, 0.4);
  s.pad("pad", h2, 52, 4, 0.3);
  s.bass("cb", h2, 33, 0.4);
  h2.forEach((seg) => {
    const vs = voicing(seg.c, 64, 3);
    [0, 1, 2, 0, 1, 2].slice(0, Math.round(seg.d * 2)).forEach((k, i) => s.n("harp", seg.t + i * 0.5, 1.4, vs[k] + (i >= 3 ? 12 : 0), 0.25));
  });
  [84, 96, 108, 120].forEach((t) => {
    s.n("timp", t, 2, t === 108 ? 45 : 40, 0.7);
    s.n("bd", t, 2, 60, t === 108 ? 0.9 : 0.5);
  });
  s.n("swell", 105, 3, 60, 0.9, 1);
  s.n("timp", 129, 3, 40, 0.5);

  // tender close (132-156): piano alone, turning home to D
  const ht = harm("E:3 C#m:3 Amaj7:3 A:3 G:3 F#m7:3 Em7:3 A7sus4:2 A7:1", 132);
  s.seq("pnoR", 132, "G#5:1.5 F#5:.5 E5 F#5 | C#6:2 B5:1 | A5:.5 G#5 F#5:1 E5:1 | E5:1 C#5:1 A4:.5 B4 | D5:1.5 C#5:.5 B4:1 | A4:3 | G4:1.5 F#4:.5 E4:1 | E4:3", {
    v: 0.85,
    hum: 0.03,
  });
  s.arp("pnoL", ht, LH34, 0.5, { lo: 33, up: 50, v: 0.24, hum: 0.02 });
  s.seq("cel", 146, "F#6:.5 A6:.5 D7:2 | r:3 | B6:.5 A6:.5 E6:2", { v: 0.5 });
  s.pad("pad", ht, 52, 3, 0.16, { sh: 2 });

  return {
    id: "ending",
    bpm: 80,
    len: 156,
    ev: s.ev,
    gain: 0.95,
    ch: {
      vln: { inst: "str", pan: -0.3, rev: 0.4, fx: "body", prio: 2, gain: 1.1 },
      fl: { inst: "flute", pan: 0.2, rev: 0.45, prio: 2, gain: 0.75 },
      vc: { inst: "cello", pan: 0.3, rev: 0.35, prio: 2 },
      brass: { inst: "brass", pan: 0.2, rev: 0.45, prio: 1, gain: 0.8 },
      brassP: { inst: "brass", pan: 0.35, rev: 0.45, prio: 0, gain: 0.6, bright: 0.7 },
      pad: { inst: "str", pan: 0.25, rev: 0.45, fx: "body", prio: 0, gain: 0.7, bright: 0.75 },
      choir: { inst: "choir", fx: "ah", pan: -0.15, rev: 0.55, prio: 0, gain: 0.75 },
      cb: { inst: "str", pan: 0.05, rev: 0.2, gain: 0.8, bright: 0.5 },
      pnoL: { inst: "piano", pan: -0.15, rev: 0.3, gain: 0.8 },
      pnoR: { inst: "piano", pan: -0.05, rev: 0.32, prio: 2 },
      cel: { inst: "celesta", pan: 0.3, rev: 0.5 },
      harp: { inst: "harp", pan: -0.45, rev: 0.4, gain: 0.8 },
      timp: { inst: "timp", rev: 0.4 },
      bd: { inst: "bdrum", rev: 0.35, gain: 0.7 },
      swell: { inst: "swell", rev: 0.6, prio: 0 },
    },
  };
}

