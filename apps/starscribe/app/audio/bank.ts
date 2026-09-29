// Struck / plucked instruments are rendered once in plain JS into AudioBuffers
// (additive synthesis with per-partial decay, Karplus-Strong, modal synthesis)
// and then played back with pitch shifting. Cheap at play time, rich in tone.

import { mtof } from "./theory";

export type SampleInst =
  | "piano"
  | "celesta"
  | "mbox"
  | "harp"
  | "pizz"
  | "lute"
  | "glass"
  | "cbell"
  | "timp"
  | "fdrum"
  | "fslap"
  | "tamb"
  | "bdrum"
  | "heart";

type Rendered = { data: Float32Array; f0: number };
type Spec = { sr: number; notes: number[]; render: (sr: number, midi: number, rnd: () => number) => Rendered };

const range = (a: number, b: number, s: number): number[] => {
  const o: number[] = [];
  for (let x = a; x <= b; x += s) o.push(x);
  return o;
};

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** one decaying sinusoid added by rotation (fast, no Math.sin per sample) */
function partial(out: Float64Array, sr: number, f: number, amp: number, t1: number, t2: number, mix: number, phase: number): void {
  if (f <= 0 || f >= sr * 0.46 || amp <= 0) return;
  const w = (2 * Math.PI * f) / sr;
  const cr = Math.cos(w);
  const si = Math.sin(w);
  let c = Math.cos(phase);
  let s = Math.sin(phase);
  const k1 = Math.exp(-1 / (t1 * sr));
  const k2 = Math.exp(-1 / (t2 * sr));
  let e1 = amp * mix;
  let e2 = amp * (1 - mix);
  const floor = amp * 2e-5;
  const n = out.length;
  for (let i = 0; i < n; i++) {
    out[i] += s * (e1 + e2);
    const nc = c * cr - s * si;
    s = c * si + s * cr;
    c = nc;
    e1 *= k1;
    e2 *= k2;
    if ((i & 1023) === 0 && e1 + e2 < floor) break;
  }
}

function finish(buf: Float64Array, sr: number, attackMs: number, peak = 0.9): Float32Array {
  const n = buf.length;
  const a = Math.max(1, Math.floor((attackMs / 1000) * sr));
  for (let i = 0; i < a && i < n; i++) buf[i] *= i / a;
  const fo = Math.min(n, Math.floor(0.04 * sr));
  for (let i = 0; i < fo; i++) buf[n - 1 - i] *= i / fo;
  let mx = 1e-9;
  let dc = 0;
  for (let i = 0; i < n; i++) dc += buf[i];
  dc /= n;
  for (let i = 0; i < n; i++) {
    buf[i] -= dc * Math.min(1, i / a);
    const x = Math.abs(buf[i]);
    if (x > mx) mx = x;
  }
  const g = peak / mx;
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) o[i] = buf[i] * g;
  return o;
}

function noiseBurst(out: Float64Array, sr: number, amp: number, decay: number, lpHz: number, rnd: () => number, hpHz = 0): void {
  const a = 1 - Math.exp((-2 * Math.PI * lpHz) / sr);
  const h = hpHz > 0 ? 1 - Math.exp((-2 * Math.PI * hpHz) / sr) : 0;
  let lp = 0;
  let lp2 = 0;
  let hl = 0;
  const n = Math.min(out.length, Math.floor(decay * 8 * sr));
  const k = Math.exp(-1 / (decay * sr));
  let e = amp;
  for (let i = 0; i < n; i++) {
    lp += a * (rnd() * 2 - 1 - lp);
    lp2 += a * (lp - lp2);
    let x = lp2;
    if (h) {
      hl += h * (x - hl);
      x -= hl;
    }
    out[i] += x * e * 3;
    e *= k;
  }
}

// ---------------------------------------------------------------- piano

function piano(sr: number, midi: number, rnd: () => number): Rendered {
  const f0 = mtof(midi);
  const dur = Math.max(1.5, Math.min(5.5, 5.5 - (midi - 36) * 0.07));
  const out = new Float64Array(Math.floor(dur * sr));
  const B = Math.min(0.004, 0.00012 * Math.pow(2, (midi - 33) / 14));
  const strings = midi < 35 ? 1 : midi < 47 ? 2 : 3;
  const det = [0, 0.85, -1.05];
  const pos = 1 / 8.3;
  const fmax = Math.min(sr * 0.45, 7500 + f0 * 2);
  for (let n = 1; n <= 44; n++) {
    const fn = n * f0 * Math.sqrt(1 + B * n * n);
    if (fn > fmax) break;
    let a = Math.pow(n, -0.85) * (0.3 + Math.abs(Math.sin(Math.PI * n * pos)));
    if (midi < 45 && n === 1) a *= 0.55;
    if (midi < 45 && n === 2) a *= 0.85;
    const ff = Math.max(fn, 110);
    const t1 = 1.25 * Math.pow(220 / ff, 0.6);
    const t2 = t1 * (midi > 84 ? 3 : 5.5);
    for (let s = 0; s < strings; s++) {
      const f = fn * Math.pow(2, det[s] / 1200);
      partial(out, sr, f, a / strings, t1, t2, 0.68, rnd() * 6.283);
    }
  }
  // hammer knock
  noiseBurst(out, sr, 0.05, 0.006, 1800 + f0 * 1.5, rnd, 120);
  noiseBurst(out, sr, 0.03, 0.02, 300, rnd);
  return { data: finish(out, sr, 1.2), f0 };
}

// ---------------------------------------------------------------- Karplus-Strong

function ks(sr: number, midi: number, rnd: () => number, o: { t60: number; bright: number; pos: number; damp: number; dur: number; tri: number }): Rendered {
  const target = mtof(midi);
  const g = o.damp; // loop lowpass coefficient (1 = none)
  const extra = g < 1 ? (1 - g) / g : 0;
  const N = Math.max(2, Math.round(sr / target - 0.5 - extra));
  const f0 = sr / (N + 0.5 + extra);
  const len = Math.floor(o.dur * sr);
  const y = new Float64Array(len);
  const exc = new Float64Array(N);
  const P = Math.max(1, Math.round(N * o.pos));
  for (let i = 0; i < N; i++) {
    const tri = i < P ? i / P : (N - i) / (N - P);
    exc[i] = o.tri * (tri - 0.5) + (1 - o.tri) * (rnd() * 2 - 1);
  }
  // soften the excitation
  const a = o.bright;
  for (let pass = 0; pass < 2; pass++) {
    let lp = exc[N - 1];
    for (let i = 0; i < N; i++) {
      lp += a * (exc[i] - lp);
      exc[i] = lp;
    }
  }
  let mean = 0;
  for (let i = 0; i < N; i++) mean += exc[i];
  mean /= N;
  for (let i = 0; i < N; i++) exc[i] -= mean;
  const rho = Math.pow(10, -3 / (o.t60 * f0));
  let lp = 0;
  for (let i = 0; i < len; i++) {
    if (i < N) {
      y[i] = exc[i];
      continue;
    }
    const x = rho * 0.5 * (y[i - N] + (i - N - 1 >= 0 ? y[i - N - 1] : 0));
    if (g < 1) {
      lp += g * (x - lp);
      y[i] = lp;
    } else y[i] = x;
  }
  // a touch of body warmth: gentle one-pole lowpass on output
  return { data: finish(y, sr, 0.6), f0 };
}

// ---------------------------------------------------------------- modal (bars, bells, drums)

type Mode = [number, number, number]; // ratio, amp, T60 (s)

function modal(
  sr: number,
  f0: number,
  modes: Mode[],
  dur: number,
  rnd: () => number,
  o: { glide?: number; glideT?: number; noise?: [number, number, number, number?]; attack?: number; t60scale?: number } = {},
): Float32Array {
  const out = new Float64Array(Math.floor(dur * sr));
  const sc = o.t60scale ?? 1;
  if (!o.glide) {
    for (const [r, a, t] of modes) {
      const tau = (t * sc) / 6.91;
      partial(out, sr, f0 * r, a, tau, tau, 1, rnd() * 6.283);
    }
  } else {
    const gt = o.glideT ?? 0.05;
    for (const [r, a, t] of modes) {
      const f = f0 * r;
      if (f >= sr * 0.45) continue;
      const k = Math.exp(-6.91 / (t * sc * sr));
      let e = a;
      let ph = rnd() * 6.283;
      for (let i = 0; i < out.length; i++) {
        const tt = i / sr;
        const fi = f * (1 + o.glide * Math.exp(-tt / gt));
        ph += (2 * Math.PI * fi) / sr;
        out[i] += Math.sin(ph) * e;
        e *= k;
        if (e < 1e-5) break;
      }
    }
  }
  if (o.noise) noiseBurst(out, sr, o.noise[0], o.noise[1], o.noise[2], rnd, o.noise[3] ?? 0);
  return finish(out, sr, o.attack ?? 0.5);
}

function tamb(sr: number, rnd: () => number): Float32Array {
  const out = new Float64Array(Math.floor(0.5 * sr));
  for (let j = 0; j < 14; j++) {
    const off = Math.floor(rnd() * 0.018 * sr);
    const sub = new Float64Array(out.length - off);
    const f = 5200 + rnd() * 5200;
    partial(sub, sr, Math.min(f, sr * 0.44), 0.25, 0.05 + rnd() * 0.05, 0.12, 0.7, rnd() * 6);
    noiseBurst(sub, sr, 0.12, 0.03 + rnd() * 0.04, 12000, rnd, 5000);
    for (let i = 0; i < sub.length; i++) out[i + off] += sub[i];
  }
  return finish(out, sr, 0.3, 0.8);
}

const SPECS: Record<SampleInst, Spec> = {
  piano: { sr: 32000, notes: range(28, 100, 4), render: piano },
  celesta: {
    sr: 32000,
    notes: range(55, 105, 5),
    render: (sr, m, r) => ({
      f0: mtof(m),
      data: modal(
        sr,
        mtof(m),
        [
          [1, 1, 2.6],
          [2.0, 0.1, 0.9],
          [3.0, 0.06, 0.5],
          [4.18, 0.09, 0.18],
          [7.1, 0.035, 0.06],
        ],
        2.4,
        r,
        { noise: [0.03, 0.002, 9000, 2000], t60scale: Math.pow(2, -(m - 72) / 30), attack: 0.8 },
      ),
    }),
  },
  mbox: {
    sr: 32000,
    notes: range(45, 105, 5),
    render: (sr, m, r) => ({
      f0: mtof(m),
      data: modal(
        sr,
        mtof(m),
        [
          [1, 1, 2.8],
          [1.0016, 0.45, 2.5],
          [2.0, 0.04, 0.8],
          [5.93, 0.26, 0.3],
          [13.7, 0.08, 0.07],
        ],
        2.2,
        r,
        { noise: [0.05, 0.0015, 10000, 3000], t60scale: Math.pow(2, -(m - 76) / 28), attack: 0.3 },
      ),
    }),
  },
  harp: {
    sr: 24000,
    notes: range(31, 103, 5),
    render: (sr, m, r) => ks(sr, m, r, { t60: 5.5 * Math.pow(2, -(m - 36) / 26), bright: 0.3, pos: 0.13, damp: 1, dur: Math.max(1.4, 4 - (m - 36) * 0.04), tri: 0.75 }),
  },
  pizz: {
    sr: 24000,
    notes: range(28, 93, 5),
    render: (sr, m, r) => ks(sr, m, r, { t60: 0.9 * Math.pow(2, -(m - 36) / 30), bright: 0.45, pos: 0.2, damp: 0.72, dur: 1.1, tri: 0.5 }),
  },
  lute: {
    sr: 24000,
    notes: range(40, 93, 5),
    render: (sr, m, r) => ks(sr, m, r, { t60: 2.6 * Math.pow(2, -(m - 45) / 26), bright: 0.62, pos: 0.17, damp: 1, dur: 2, tri: 0.35 }),
  },
  glass: {
    sr: 32000,
    notes: range(60, 100, 5),
    render: (sr, m, r) => ({
      f0: mtof(m),
      data: modal(
        sr,
        mtof(m),
        [
          [1, 1, 4.5],
          [1.0021, 0.35, 4],
          [2.756, 0.3, 1.6],
          [5.404, 0.12, 0.6],
          [8.93, 0.04, 0.25],
        ],
        3.6,
        r,
        { attack: 1.5, t60scale: Math.pow(2, -(m - 72) / 36) },
      ),
    }),
  },
  cbell: {
    sr: 24000,
    notes: [43, 55, 67],
    render: (sr, m, r) => ({
      f0: mtof(m),
      data: modal(
        sr,
        mtof(m),
        [
          [0.5, 0.5, 8],
          [1, 0.75, 6],
          [1.0035, 0.3, 6],
          [1.19, 0.5, 4.5],
          [1.5, 0.3, 3.5],
          [2.0, 0.55, 4],
          [2.52, 0.22, 2.2],
          [3.0, 0.18, 1.8],
          [4.07, 0.1, 1.1],
          [5.4, 0.05, 0.6],
        ],
        6.5,
        r,
        { noise: [0.08, 0.004, 5000, 400], attack: 0.8 },
      ),
    }),
  },
  timp: {
    sr: 24000,
    notes: [38, 43, 48, 53],
    render: (sr, m, r) => ({
      f0: mtof(m),
      data: modal(
        sr,
        mtof(m),
        [
          [0.62, 0.45, 0.25],
          [1, 1, 2.4],
          [1.5, 0.55, 1.8],
          [1.98, 0.35, 1.4],
          [2.44, 0.2, 1.0],
          [2.9, 0.1, 0.6],
        ],
        3.2,
        r,
        { glide: 0.035, glideT: 0.06, noise: [0.25, 0.012, 900, 60], attack: 1.5 },
      ),
    }),
  },
  fdrum: {
    sr: 24000,
    notes: [60],
    render: (sr, _m, r) => ({
      f0: mtof(60),
      data: modal(
        sr,
        92,
        [
          [1, 1, 0.55],
          [1.58, 0.35, 0.3],
          [2.3, 0.15, 0.18],
        ],
        0.8,
        r,
        { glide: 0.45, glideT: 0.03, noise: [0.3, 0.02, 1200, 150], attack: 1 },
      ),
    }),
  },
  fslap: {
    sr: 24000,
    notes: [60],
    render: (sr, _m, r) => ({
      f0: mtof(60),
      data: modal(
        sr,
        310,
        [
          [1, 0.5, 0.12],
          [1.47, 0.3, 0.08],
        ],
        0.35,
        r,
        { glide: 0.2, glideT: 0.01, noise: [0.7, 0.012, 3500, 500], attack: 0.5 },
      ),
    }),
  },
  tamb: { sr: 32000, notes: [60], render: (sr, _m, r) => ({ f0: mtof(60), data: tamb(sr, r) }) },
  bdrum: {
    sr: 24000,
    notes: [60],
    render: (sr, _m, r) => ({
      f0: mtof(60),
      data: modal(
        sr,
        48,
        [
          [1, 1, 1.4],
          [1.6, 0.35, 0.7],
          [2.4, 0.15, 0.3],
        ],
        1.8,
        r,
        { glide: 0.9, glideT: 0.045, noise: [0.35, 0.03, 700, 40], attack: 2 },
      ),
    }),
  },
  heart: {
    sr: 24000,
    notes: [60],
    render: (sr, _m, r) => ({
      f0: mtof(60),
      data: modal(
        sr,
        52,
        [
          [1, 1, 0.3],
          [2.1, 0.25, 0.12],
        ],
        0.45,
        r,
        { glide: 0.5, glideT: 0.02, noise: [0.08, 0.02, 250], attack: 4 },
      ),
    }),
  },
};

export type Sample = { buf: AudioBuffer; f0: number; midi: number };

export class Bank {
  private ready = new Map<SampleInst, Sample[]>();
  private queue: SampleInst[] = [];
  private partial = new Map<SampleInst, Sample[]>();
  constructor(private ctx: BaseAudioContext) {}

  has(i: SampleInst): boolean {
    return this.ready.has(i);
  }

  private renderOne(i: SampleInst, idx: number): Sample {
    const sp = SPECS[i];
    const midi = sp.notes[idx];
    const r = sp.render(sp.sr, midi, mulberry(midi * 131 + i.length * 7919));
    const buf = this.ctx.createBuffer(1, r.data.length, sp.sr);
    buf.getChannelData(0).set(r.data);
    return { buf, f0: r.f0, midi };
  }

  /** synchronous: render everything for this instrument now */
  ensure(i: SampleInst): Sample[] {
    const got = this.ready.get(i);
    if (got) return got;
    const sp = SPECS[i];
    const have = this.partial.get(i) || [];
    for (let k = have.length; k < sp.notes.length; k++) have.push(this.renderOne(i, k));
    this.partial.delete(i);
    this.ready.set(i, have);
    return have;
  }

  /** incremental: render one sample of the given instrument; true when complete */
  step(i: SampleInst): boolean {
    if (this.ready.has(i)) return true;
    const sp = SPECS[i];
    const have = this.partial.get(i) || [];
    have.push(this.renderOne(i, have.length));
    if (have.length >= sp.notes.length) {
      this.partial.delete(i);
      this.ready.set(i, have);
      return true;
    }
    this.partial.set(i, have);
    return false;
  }

  pick(i: SampleInst, midi: number): Sample {
    const list = this.ensure(i);
    let best = list[0];
    let bd = Infinity;
    for (const s of list) {
      const d = Math.abs(s.midi - midi) + (s.midi < midi ? 0.01 : 0); // prefer shifting down
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return best;
  }

  private running = false;
  private waiters: { need: SampleInst[]; cb: () => void }[] = [];

  /** background warm-up (realtime only): renders one sample per tick; cb once `list` is ready */
  warm(list: SampleInst[], cb?: () => void): void {
    for (const x of list) if (!this.ready.has(x) && this.queue.indexOf(x) < 0) this.queue.push(x);
    if (cb) this.waiters.push({ need: list.slice(), cb });
    this.flush();
    if (this.running) return;
    this.running = true;
    const tick = (): void => {
      const cur = this.queue[0];
      if (!cur) {
        this.running = false;
        this.flush();
        return;
      }
      const t0 = Date.now();
      // do a few samples per tick, but keep each tick short
      while (this.queue[0] === cur && Date.now() - t0 < 12) if (this.step(cur)) this.queue.shift();
      this.flush();
      setTimeout(tick, 0);
    };
    setTimeout(tick, 0);
  }

  /** move the given instruments to the front of the queue */
  prioritize(list: SampleInst[]): void {
    const front = list.filter((x) => !this.ready.has(x));
    this.queue = [...front, ...this.queue.filter((x) => front.indexOf(x) < 0)];
  }

  private flush(): void {
    const still: { need: SampleInst[]; cb: () => void }[] = [];
    for (const w of this.waiters) {
      if (w.need.every((x) => this.ready.has(x))) w.cb();
      else still.push(w);
    }
    this.waiters = still;
  }
}

export const ALL_SAMPLE_INSTS = Object.keys(SPECS) as SampleInst[];
