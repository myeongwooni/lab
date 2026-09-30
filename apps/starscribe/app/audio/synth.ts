// Instrument voices. Sample instruments play from the Bank; sustained
// instruments (strings, cello, flute, choir, organ, brass, pads) are live
// oscillator voices. Every voice returns a handle so the engine can cap and
// steal voices.

import { Bank, SampleInst } from "./bank";
import { mtof } from "./theory";

export type LiveInst = "str" | "strs" | "cello" | "flute" | "whistle" | "choir" | "organ" | "brass" | "pad" | "bass" | "swell";
export type Inst = SampleInst | LiveInst;

export type Voice = { start: number; end: number; prio: number; kill: (t: number) => void };

export interface Host {
  ctx: BaseAudioContext;
  bank: Bank;
  wave(name: WaveName): PeriodicWave;
  noise: AudioBuffer; // white, looped-safe
  pink: AudioBuffer;
  brown: AudioBuffer;
}

export type WaveName = "saw" | "bow" | "flute" | "organ" | "pad" | "bass" | "reed";

export function makeWave(ctx: BaseAudioContext, name: WaveName): PeriodicWave {
  const N = 48;
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  for (let n = 1; n < N; n++) {
    let a = 0;
    switch (name) {
      case "saw":
        a = 1 / n;
        break;
      case "bow":
        // bowed string: saw-like with body resonance bumps and softer top
        a = (1 / Math.pow(n, 1.05)) * (1 + 0.6 * Math.exp(-Math.pow((n - 4) / 2.2, 2)) + 0.3 * Math.exp(-Math.pow((n - 11) / 3, 2)));
        break;
      case "flute":
        a = [0, 1, 0.22, 0.08, 0.035, 0.015, 0.008][n] || 0;
        break;
      case "organ": {
        const d: Record<number, number> = { 1: 1, 2: 0.62, 3: 0.4, 4: 0.42, 5: 0.12, 6: 0.26, 8: 0.24, 10: 0.07, 12: 0.1, 16: 0.08 };
        a = d[n] || 0;
        break;
      }
      case "pad":
        a = n <= 8 ? 1 / (n * n * 0.7 + 0.3) : 0;
        break;
      case "bass":
        a = [0, 1, 0.4, 0.14, 0.05, 0.02][n] || 0;
        break;
      case "reed":
        a = n % 2 === 1 ? 1 / n : 0.25 / n;
        break;
    }
    im[n] = a;
  }
  return ctx.createPeriodicWave(re, im);
}

function stopAll(nodes: (AudioScheduledSourceNode | null)[], t: number): void {
  for (const n of nodes) {
    if (!n) continue;
    try {
      n.stop(t);
    } catch {
      /* already stopped */
    }
  }
}

/**
 * Per-voice vibrato written as a detune automation curve (no LFO nodes, so
 * nothing stays connected after the voice ends).
 */
function vibrato(p: AudioParam, t: number, dur: number, o: { base?: number; depth: number; rate: number; delay: number; scoop?: number; phase?: number }): void {
  const d = Math.max(0.05, dur);
  const n = Math.max(2, Math.min(4000, Math.ceil(d * 60)));
  const c = new Float32Array(n);
  const ph = o.phase ?? 0;
  for (let i = 0; i < n; i++) {
    const tt = (i / (n - 1)) * d;
    const ramp = Math.max(0, Math.min(1, (tt - o.delay) / 0.45));
    let x = (o.base ?? 0) + o.depth * ramp * Math.sin(2 * Math.PI * o.rate * tt + ph);
    if (o.scoop && tt < 0.07) x += o.scoop * (1 - tt / 0.07);
    c[i] = x;
  }
  try {
    p.setValueCurveAtTime(c, t, d);
  } catch {
    p.value = o.base ?? 0;
  }
}

/** attack-sustain-release envelope with optional swell/fade shapes */
function env(g: AudioParam, t: number, d: number, peak: number, att: number, rel: number, sh = 0): number {
  const a = Math.max(0.005, Math.min(att, d * 0.8));
  g.setValueAtTime(0, t);
  if (sh === 1) {
    g.linearRampToValueAtTime(peak * 0.2, t + a);
    g.linearRampToValueAtTime(peak, t + Math.max(a + 0.02, d * 0.9));
  } else if (sh === 2) {
    g.linearRampToValueAtTime(peak, t + a);
    g.linearRampToValueAtTime(peak * 0.15, t + Math.max(a + 0.02, d));
  } else if (sh === 3) {
    g.linearRampToValueAtTime(peak * 0.8, t + Math.min(a, 0.04));
    g.linearRampToValueAtTime(peak * 0.25, t + Math.max(0.06, d * 0.3));
    g.linearRampToValueAtTime(peak, t + Math.max(0.1, d * 0.95));
  } else {
    g.linearRampToValueAtTime(peak, t + a);
  }
  g.setTargetAtTime(0, t + d, rel / 4);
  return t + d + rel * 1.6;
}

function killer(g: GainNode, srcs: (AudioScheduledSourceNode | null)[]): (t: number) => void {
  return (t: number) => {
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0, t, 0.012);
    } catch {
      /* ignore */
    }
    stopAll(srcs, t + 0.08);
  };
}

// ---------------------------------------------------------------- sample voices

const SAMPLE_GAIN: Partial<Record<SampleInst, number>> = {
  piano: 0.55,
  celesta: 0.34,
  mbox: 0.3,
  harp: 0.5,
  pizz: 0.6,
  lute: 0.42,
  glass: 0.22,
  cbell: 0.5,
  timp: 0.75,
  fdrum: 0.75,
  fslap: 0.35,
  tamb: 0.22,
  bdrum: 0.9,
  heart: 1.0,
};

export function playSample(h: Host, inst: SampleInst, dest: AudioNode, t: number, d: number, m: number, v: number, prio: number): Voice {
  const ctx = h.ctx;
  const s = h.bank.pick(inst, m);
  const src = ctx.createBufferSource();
  src.buffer = s.buf;
  const rate = mtof(m) / s.f0;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  const amp = Math.pow(v, 1.5) * (SAMPLE_GAIN[inst] ?? 0.5);
  let out: AudioNode = src;
  if (inst === "piano" || inst === "harp" || inst === "lute") {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    const f0 = mtof(m);
    f.frequency.value = Math.min(15000, inst === "piano" ? 350 + f0 * 3 + 9500 * v * v : 600 + f0 * 4 + 6000 * v * v);
    f.Q.value = 0.5;
    src.connect(f);
    out = f;
  }
  out.connect(g);
  g.connect(dest);
  const bufDur = s.buf.duration / rate;
  const rel = inst === "piano" ? 0.35 : inst === "pizz" ? 0.12 : inst === "timp" || inst === "cbell" || inst === "glass" ? 1.2 : 0.5;
  g.gain.setValueAtTime(amp, t);
  let end = t + bufDur;
  if (t + d < end) {
    g.gain.setTargetAtTime(0, t + d, rel / 4);
    end = Math.min(end, t + d + rel * 1.6);
  }
  src.start(t);
  src.stop(end + 0.02);
  src.onended = () => {
    g.disconnect();
  };
  return { start: t, end, prio, kill: killer(g, [src]) };
}

// ---------------------------------------------------------------- live voices

type LiveOpt = { bright?: number; att?: number; rel?: number };

function lowpass(ctx: BaseAudioContext, f: number, q = 0.7): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = "lowpass";
  b.frequency.value = Math.min(16000, f);
  b.Q.value = q;
  return b;
}

/** ensemble strings (sustained). strs = short spiccato variant */
function strings(h: Host, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, short: boolean, o: LiveOpt): Voice {
  const ctx = h.ctx;
  const f = mtof(m);
  const g = ctx.createGain();
  const lp = lowpass(ctx, 1, 0.6);
  const bright = o.bright ?? 1;
  const cut = Math.min(9000, (320 + f * (2.2 + 3.5 * v)) * bright);
  const oscs: OscillatorNode[] = [];
  const dets = short ? [-5, 6] : [-7, 7.5];
  dets.forEach((c, i) => {
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(h.wave("bow"));
    osc.frequency.value = f;
    osc.detune.value = c;
    osc.connect(lp);
    oscs.push(osc);
  });
  lp.connect(g);
  g.connect(dest);
  const amp = (short ? 0.16 : 0.115) * Math.pow(v, 1.2);
  let end: number;
  if (short) {
    const dd = Math.min(d, 0.35);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.012);
    g.gain.setTargetAtTime(amp * 0.35, t + 0.02, 0.06);
    g.gain.setTargetAtTime(0, t + dd, 0.04);
    lp.frequency.setValueAtTime(cut * 1.6, t);
    lp.frequency.setTargetAtTime(cut * 0.8, t + 0.02, 0.08);
    end = t + dd + 0.25;
  } else {
    const att = o.att ?? (d > 3 ? 0.5 : 0.18);
    end = env(g.gain, t, d, amp, att, o.rel ?? 0.7, sh);
    lp.frequency.setValueAtTime(cut * 0.55, t);
    lp.frequency.linearRampToValueAtTime(cut, t + Math.min(d, att * 1.5 + 0.05));
    if (sh === 1 || sh === 3) {
      lp.frequency.setValueAtTime(cut * 0.4, t);
      lp.frequency.linearRampToValueAtTime(cut * 1.2, t + Math.max(0.1, d * 0.9));
    }
  }
  oscs.forEach((osc, i) => {
    if (!short) vibrato(osc.detune, t, end - t, { base: dets[i], depth: 7 + i * 2, rate: 4.9 + i * 0.55 + (m % 3) * 0.07, delay: 0.15, phase: i * 1.7 });
    osc.start(t);
    osc.stop(end);
  });
  oscs[0].onended = () => g.disconnect();
  return { start: t, end, prio, kill: killer(g, oscs) };
}

/** solo bowed voice (cello) with its own delayed vibrato and bow noise */
function cello(h: Host, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, o: LiveOpt): Voice {
  const ctx = h.ctx;
  const f = mtof(m);
  const g = ctx.createGain();
  const lp = lowpass(ctx, Math.min(7000, (500 + f * (3 + 4 * v)) * (o.bright ?? 1)), 0.8);
  const a = ctx.createOscillator();
  const b = ctx.createOscillator();
  a.setPeriodicWave(h.wave("bow"));
  b.setPeriodicWave(h.wave("bow"));
  a.frequency.value = f;
  b.frequency.value = f;
  const vrate = 5.1 + ((m * 7) % 5) * 0.08;
  a.connect(lp);
  b.connect(lp);
  lp.connect(g);
  // bow noise
  const nz = ctx.createBufferSource();
  nz.buffer = h.noise;
  nz.loop = true;
  const nbp = ctx.createBiquadFilter();
  nbp.type = "bandpass";
  nbp.frequency.value = Math.min(6000, f * 3);
  nbp.Q.value = 1.2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.025 * v, t + 0.03);
  ng.gain.setTargetAtTime(0.004 * v, t + 0.05, 0.1);
  nz.connect(nbp);
  nbp.connect(ng);
  ng.connect(g);
  g.connect(dest);
  const amp = 0.16 * Math.pow(v, 1.1);
  const end = env(g.gain, t, d, amp, o.att ?? 0.13, o.rel ?? 0.45, sh);
  const srcs = [a, b, nz];
  // delayed vibrato; a slight pitch settle at the bow change
  vibrato(a.detune, t, end - t, { depth: 14, rate: vrate, delay: Math.min(0.3, d * 0.4), scoop: -12 });
  vibrato(b.detune, t, end - t, { base: 3, depth: 14, rate: vrate, delay: Math.min(0.3, d * 0.4), phase: 0.3 });
  a.start(t);
  b.start(t);
  nz.start(t, Math.random() * 1.5);
  stopAll(srcs, end);
  a.onended = () => g.disconnect();
  return { start: t, end, prio, kill: killer(g, srcs) };
}

/** flute / whistle: near-sine + breath + vibrato */
function flute(h: Host, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, whistle: boolean, o: LiveOpt): Voice {
  const ctx = h.ctx;
  const f = mtof(m);
  const g = ctx.createGain();
  const osc = ctx.createOscillator();
  if (whistle) osc.type = "sine";
  else osc.setPeriodicWave(h.wave("flute"));
  osc.frequency.value = f;
  const tone = ctx.createGain();
  tone.gain.value = 1;
  osc.connect(tone);
  tone.connect(g);
  // breath
  const nz = ctx.createBufferSource();
  nz.buffer = h.noise;
  nz.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = Math.min(9000, f * (whistle ? 1 : 2));
  bp.Q.value = whistle ? 6 : 2.5;
  const ng = ctx.createGain();
  const breath = (whistle ? 0.08 : 0.13) * v;
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(breath * 2.2, t + 0.025);
  ng.gain.setTargetAtTime(breath, t + 0.04, 0.08);
  ng.gain.setTargetAtTime(0, t + d, 0.05);
  nz.connect(bp);
  bp.connect(ng);
  ng.connect(g);
  g.connect(dest);
  const amp = (whistle ? 0.11 : 0.14) * Math.pow(v, 0.9);
  const end = env(g.gain, t, d, amp, o.att ?? 0.06, o.rel ?? 0.25, sh);
  const srcs = [osc, nz];
  vibrato(osc.detune, t, end - t, { depth: whistle ? 16 : 11, rate: whistle ? 5.6 : 4.9, delay: Math.min(0.28, d * 0.4), scoop: whistle ? -40 : 0 });
  osc.start(t);
  nz.start(t, Math.random() * 1.5);
  stopAll(srcs, end);
  osc.onended = () => g.disconnect();
  return { start: t, end, prio, kill: killer(g, srcs) };
}

/** choir / organ / brass / pad / bass: oscillator stacks */
function stack(h: Host, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, kind: LiveInst, o: LiveOpt): Voice {
  const ctx = h.ctx;
  const f = mtof(m);
  const g = ctx.createGain();
  let wave: WaveName = "saw";
  let dets = [-8, 8];
  let amp = 0.1;
  let att = 0.4;
  let rel = 0.8;
  let cut = 4000;
  let useVib = true;
  switch (kind) {
    case "choir":
      wave = "saw";
      dets = [-9, 9];
      amp = 0.11;
      att = 0.45;
      rel = 0.9;
      cut = Math.min(5000, 1800 + f * 2);
      break;
    case "organ":
      wave = "organ";
      dets = [0, 2];
      amp = 0.075;
      att = 0.07;
      rel = 0.3;
      cut = 5000;
      useVib = false;
      break;
    case "brass":
      wave = "saw";
      dets = [-4, 4];
      amp = 0.09;
      att = 0.12;
      rel = 0.35;
      cut = 400 + f * (1.5 + 5 * v);
      break;
    case "pad":
      wave = "pad";
      dets = [-6, 6];
      amp = 0.09;
      att = 1.2;
      rel = 1.6;
      cut = 800 + f * 2;
      break;
    case "bass":
      wave = "bass";
      dets = [0];
      amp = 0.22;
      att = 0.02;
      rel = 0.25;
      cut = 900;
      useVib = false;
      break;
  }
  const lp = lowpass(ctx, cut * (o.bright ?? 1), kind === "brass" ? 1.1 : 0.7);
  const oscs: OscillatorNode[] = [];
  dets.forEach((c, i) => {
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(h.wave(wave));
    osc.frequency.value = f;
    osc.detune.value = c;
    osc.connect(lp);
    oscs.push(osc);
  });
  lp.connect(g);
  g.connect(dest);
  const peak = amp * Math.pow(v, 1.15);
  const end = env(g.gain, t, d, peak, o.att ?? att, o.rel ?? rel, sh);
  if (kind === "brass") {
    // brightness follows loudness
    const c = cut * (o.bright ?? 1);
    lp.frequency.setValueAtTime(c * 0.35, t);
    if (sh === 1 || sh === 3) lp.frequency.linearRampToValueAtTime(c * 1.2, t + Math.max(0.1, d * 0.9));
    else {
      lp.frequency.linearRampToValueAtTime(c, t + 0.12);
      lp.frequency.setTargetAtTime(c * 0.7, t + 0.2, 0.4);
    }
  }
  oscs.forEach((osc, i) => {
    if (useVib) vibrato(osc.detune, t, end - t, { base: dets[i], depth: kind === "choir" ? 10 : kind === "brass" ? 5 : 6, rate: (kind === "choir" ? 4.6 : 5.2) + i * 0.4, delay: 0.25, phase: i * 2.1 });
    osc.start(t);
    osc.stop(end);
  });
  oscs[0].onended = () => g.disconnect();
  return { start: t, end, prio, kill: killer(g, oscs) };
}

/** cymbal-like noise swell (sh 1) or crash (sh 0) */
function swell(h: Host, dest: AudioNode, t: number, d: number, v: number, sh: number, prio: number): Voice {
  const ctx = h.ctx;
  const nz = ctx.createBufferSource();
  nz.buffer = h.noise;
  nz.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  const bp = ctx.createBiquadFilter();
  bp.type = "peaking";
  bp.frequency.value = 6500;
  bp.gain.value = 6;
  const g = ctx.createGain();
  const amp = 0.09 * v;
  let end: number;
  g.gain.setValueAtTime(0, t);
  if (sh === 1) {
    g.gain.linearRampToValueAtTime(amp * 0.05, t + d * 0.3);
    g.gain.exponentialRampToValueAtTime(amp, t + d);
    g.gain.setTargetAtTime(0, t + d, 0.5);
    end = t + d + 3;
  } else {
    g.gain.linearRampToValueAtTime(amp, t + 0.005);
    g.gain.setTargetAtTime(amp * 0.3, t + 0.01, 0.2);
    g.gain.setTargetAtTime(0, t + 0.3, Math.max(0.3, d / 3));
    end = t + 0.3 + Math.max(1, d * 1.5);
  }
  nz.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  g.connect(dest);
  nz.start(t, Math.random());
  nz.stop(end);
  nz.onended = () => g.disconnect();
  return { start: t, end, prio, kill: killer(g, [nz]) };
}

const SAMPLE_SET = new Set<string>(["piano", "celesta", "mbox", "harp", "pizz", "lute", "glass", "cbell", "timp", "fdrum", "fslap", "tamb", "bdrum", "heart"]);
export const isSampleInst = (i: Inst): i is SampleInst => SAMPLE_SET.has(i);

export function playNote(h: Host, inst: Inst, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, o: LiveOpt = {}): Voice {
  if (isSampleInst(inst)) return playSample(h, inst, dest, t, d, m, v, prio);
  switch (inst) {
    case "str":
      return strings(h, dest, t, d, m, v, sh, prio, false, o);
    case "strs":
      return strings(h, dest, t, d, m, v, sh, prio, true, o);
    case "cello":
      return cello(h, dest, t, d, m, v, sh, prio, o);
    case "flute":
      return flute(h, dest, t, d, m, v, sh, prio, false, o);
    case "whistle":
      return flute(h, dest, t, d, m, v, sh, prio, true, o);
    case "swell":
      return swell(h, dest, t, d, v, sh, prio);
    default:
      return stack(h, dest, t, d, m, v, sh, prio, inst, o);
  }
}
