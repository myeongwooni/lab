// Music theory helpers + a tiny score DSL used by the compositions.
// Pure data / math: safe to import on the server.

export type Ev = {
  t: number; // start, in beats (loop-relative)
  d: number; // duration, in beats
  m: number; // midi note
  v: number; // velocity 0..1
  ch: string; // channel name (channel spec decides the instrument)
  sh?: number; // envelope shape: 0 normal, 1 swell, 2 fade, 3 sfz-swell
};

const LET: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** "C4" -> 60, "Bb3" -> 58, "F#5" -> 78 */
export function nm(s: string): number {
  const r = /^([A-Ga-g])(bb|b|#|x)?(-?\d)$/.exec(s);
  if (!r) throw new Error("bad note " + s);
  let n = LET[r[1].toLowerCase()];
  const a = r[2] || "";
  if (a === "#") n += 1;
  else if (a === "b") n -= 1;
  else if (a === "x") n += 2;
  else if (a === "bb") n -= 2;
  return n + (parseInt(r[3], 10) + 1) * 12;
}

export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const pc = (m: number): number => ((m % 12) + 12) % 12;

/** deterministic PRNG (mulberry32) */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DYN: Record<string, number> = { ppp: 0.16, pp: 0.25, p: 0.35, mp: 0.47, mf: 0.6, f: 0.74, ff: 0.88 };

export type Note = { t: number; d: number; m: number[]; v: number };

function parseDur(s: string): number {
  if (s.indexOf("/") >= 0) {
    const [a, b] = s.split("/");
    return parseFloat(a) / parseFloat(b);
  }
  return parseFloat(s);
}

/**
 * Melody DSL. Tokens separated by spaces; "|" is a visual bar line.
 *   A4:1.5   note with duration (beats). Duration is sticky.
 *   C4+E4:2  simultaneous notes
 *   r:1      rest          _:1  tie (extend previous note)
 *   p mf f   dynamics      >A4 accent   ~A4 soft
 */
export function parse(src: string, tr = 0): { notes: Note[]; len: number } {
  const notes: Note[] = [];
  let t = 0;
  let dur = 1;
  let vel = DYN.mp;
  for (const raw of src.split(/\s+/)) {
    if (!raw || raw === "|") continue;
    if (DYN[raw] !== undefined) {
      vel = DYN[raw];
      continue;
    }
    let tok = raw;
    let acc = 0;
    if (tok[0] === ">") {
      acc = 0.14;
      tok = tok.slice(1);
    } else if (tok[0] === "~") {
      acc = -0.12;
      tok = tok.slice(1);
    }
    const [body, ds] = tok.split(":");
    if (ds) dur = parseDur(ds);
    if (body === "r") {
      t += dur;
      continue;
    }
    if (body === "_") {
      const last = notes[notes.length - 1];
      if (last) last.d += dur;
      t += dur;
      continue;
    }
    const ms = body.split("+").map((x) => nm(x) + tr);
    notes.push({ t, d: dur, m: ms, v: Math.max(0.05, Math.min(1, vel + acc)) });
    t += dur;
  }
  return { notes, len: t };
}

// ---------------------------------------------------------------- chords

const Q: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "5": [0, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  mmaj7: [0, 3, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  "7sus4": [0, 5, 7, 10],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "69": [0, 4, 7, 9, 14],
  "9": [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  "7b9": [0, 4, 7, 10, 13],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  "maj7#11": [0, 4, 7, 11, 18],
  "add#11": [0, 4, 7, 18],
};

export type Chord = { root: number; pcs: number[]; bass: number; sym: string };

export function chord(sym: string): Chord {
  const r = /^([A-G])(#|b)?([^/]*)(?:\/([A-G])(#|b)?)?$/.exec(sym);
  if (!r) throw new Error("bad chord " + sym);
  const acc = (a?: string) => (a === "#" ? 1 : a === "b" ? -1 : 0);
  const root = pc(LET[r[1].toLowerCase()] + acc(r[2]));
  const q = Q[r[3]];
  if (!q) throw new Error("bad chord quality " + sym);
  const pcs: number[] = [];
  for (const x of q) {
    const p = pc(root + x);
    if (pcs.indexOf(p) < 0) pcs.push(p);
  }
  const bass = r[4] ? pc(LET[r[4].toLowerCase()] + acc(r[5])) : root;
  return { root, pcs, bass, sym };
}

/** lowest midi >= lo with pitch class p */
export function above(p: number, lo: number): number {
  let x = lo;
  while (pc(x) !== p) x++;
  return x;
}

/**
 * Close/drop voicing of n notes starting at or above `lo`, choosing the
 * inversion with the smoothest motion from `prev`.
 */
export function voicing(c: Chord, lo: number, n: number, prev?: number[], drop2 = false): number[] {
  let best: number[] = [];
  let bestCost = Infinity;
  const L = c.pcs.length;
  for (let r = 0; r < L; r++) {
    for (let oct = 0; oct < 2; oct++) {
      const notes = [above(c.pcs[r], lo + oct * 12)];
      let k = r;
      while (notes.length < n) {
        k = (k + 1) % L;
        notes.push(above(c.pcs[k], notes[notes.length - 1] + 1));
      }
      let v = notes;
      if (drop2 && n >= 4) {
        v = notes.slice();
        v[n - 2] -= 12;
        v.sort((a, b) => a - b);
        if (v[0] < lo - 5) continue;
      }
      let cost = 0;
      if (prev && prev.length === v.length) {
        for (let i = 0; i < v.length; i++) cost += Math.abs(v[i] - prev[i]);
      } else {
        cost = Math.abs(v[0] - lo) * 0.5 + (v[v.length - 1] - v[0]) * 0.1;
      }
      // avoid the root-position triad's 5th at the very bottom when possible
      if (cost < bestCost) {
        bestCost = cost;
        best = v;
      }
    }
  }
  return best;
}

export type Seg = { t: number; d: number; c: Chord };

/** "F:3 Dm:3 Bb:3 C:1 C7:2" -> segments (durations sticky, default 3) */
export function harm(src: string, t0 = 0, defDur = 3): Seg[] {
  const out: Seg[] = [];
  let t = t0;
  let d = defDur;
  for (const tok of src.split(/\s+/)) {
    if (!tok || tok === "|") continue;
    const [s, ds] = tok.split(":");
    if (ds) d = parseDur(ds);
    if (s !== "r" && s !== "-") out.push({ t, d, c: chord(s) });
    t += d;
  }
  return out;
}

export function transposeSegs(segs: Seg[], tr: number, dt = 0): Seg[] {
  return segs.map((s) => ({
    t: s.t + dt,
    d: s.d,
    c: {
      root: pc(s.c.root + tr),
      bass: pc(s.c.bass + tr),
      pcs: s.c.pcs.map((p) => pc(p + tr)),
      sym: s.c.sym,
    },
  }));
}

// ---------------------------------------------------------------- score builder

export class Score {
  ev: Ev[] = [];
  rnd: () => number;
  constructor(seed = 7) {
    this.rnd = rng(seed);
  }
  n(ch: string, t: number, d: number, m: number, v: number, sh?: number): void {
    if (d <= 0) return;
    this.ev.push({ ch, t, d, m, v: Math.max(0.03, Math.min(1, v)), sh });
  }
  /** place a DSL melody; returns the end beat */
  seq(
    ch: string,
    t0: number,
    src: string,
    o: { tr?: number; v?: number; leg?: number; hum?: number; sh?: number; oct?: number[]; dyn?: (t: number) => number } = {},
  ): number {
    const { notes, len } = parse(src, o.tr || 0);
    const vm = o.v ?? 1;
    const leg = o.leg ?? 1;
    for (const nt of notes) {
      const jit = o.hum ? (this.rnd() - 0.5) * o.hum : 0;
      const dv = o.dyn ? o.dyn(nt.t) : 1;
      for (const m of nt.m) {
        this.n(ch, t0 + nt.t + jit, nt.d * leg, m, nt.v * vm * dv, o.sh);
        if (o.oct) for (const k of o.oct) this.n(ch, t0 + nt.t + jit, nt.d * leg, m + k, nt.v * vm * dv * 0.8, o.sh);
      }
    }
    return t0 + len;
  }
  /** sustained chords (pads), voice-led */
  pad(ch: string, segs: Seg[], lo: number, n: number, v: number, o: { sh?: number; drop2?: boolean; over?: number } = {}): void {
    let prev: number[] | undefined;
    for (const s of segs) {
      const vs = voicing(s.c, lo, n, prev, o.drop2);
      prev = vs;
      for (const m of vs) this.n(ch, s.t, s.d + (o.over ?? 0.05), m, v, o.sh);
    }
  }
  /** bass notes on each segment */
  bass(ch: string, segs: Seg[], lo: number, v: number, o: { dur?: number; oct?: boolean } = {}): void {
    for (const s of segs) {
      const m = above(s.c.bass, lo);
      const d = o.dur ?? s.d;
      this.n(ch, s.t, d, m, v);
      if (o.oct) this.n(ch, s.t, d, m - 12, v * 0.7);
    }
  }
  /**
   * Arpeggiate: pattern indices into [bass, ...upper voicing]; step in beats.
   * Pattern restarts at every chord change.
   */
  arp(
    ch: string,
    segs: Seg[],
    pat: number[],
    step: number,
    o: { lo: number; up: number; n?: number; v?: number; ring?: number; acc?: number[]; hum?: number },
  ): void {
    let prev: number[] | undefined;
    for (const s of segs) {
      const bass = above(s.c.bass, o.lo);
      const upper = voicing(s.c, Math.max(o.up, bass + 3), o.n ?? 3, prev);
      prev = upper;
      const tones = [bass, ...upper];
      const steps = Math.round(s.d / step);
      for (let i = 0; i < steps; i++) {
        const idx = pat[i % pat.length];
        if (idx < 0) continue;
        const m = tones[Math.min(idx, tones.length - 1)] ?? bass;
        const t = s.t + i * step + (o.hum ? (this.rnd() - 0.5) * o.hum : 0);
        const accent = o.acc ? o.acc[i % o.acc.length] : i === 0 ? 1.25 : 1;
        const ring = o.ring ?? s.d - i * step;
        this.n(ch, Math.max(s.t, t), Math.max(step, ring), m, (o.v ?? 0.4) * accent * (0.92 + this.rnd() * 0.16));
      }
    }
  }
  /** add a harmony note below each melody note (3rds/6ths from the chord) */
  harmonize(ch: string, src: string, t0: number, segs: Seg[], o: { tr?: number; v?: number; min?: number; max?: number; minDur?: number } = {}): void {
    const { notes } = parse(src, o.tr || 0);
    for (const nt of notes) {
      if (nt.d < (o.minDur ?? 0.9)) continue;
      const t = t0 + nt.t;
      const seg = segs.find((s) => t >= s.t - 1e-6 && t < s.t + s.d - 1e-6);
      if (!seg) continue;
      const top = nt.m[0];
      for (let k = o.min ?? 3; k <= (o.max ?? 9); k++) {
        if (seg.c.pcs.indexOf(pc(top - k)) >= 0) {
          this.n(ch, t, nt.d, top - k, nt.v * (o.v ?? 0.7));
          break;
        }
      }
    }
  }
  /** fast scale run (harp gliss) */
  gliss(ch: string, t: number, dur: number, from: number, to: number, scalePcs: number[], v: number): void {
    const notes: number[] = [];
    const dir = to >= from ? 1 : -1;
    for (let m = from; dir > 0 ? m <= to : m >= to; m += dir) if (scalePcs.indexOf(pc(m)) >= 0) notes.push(m);
    const st = dur / Math.max(1, notes.length);
    notes.forEach((m, i) => this.n(ch, t + i * st, 1.5, m, v * (0.7 + 0.3 * (i / notes.length))));
  }
}

export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const scaleOf = (root: number, steps = MAJOR): number[] => steps.map((s) => pc(root + s));
