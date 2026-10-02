// One-shot sound effects, synthesized from noise, oscillators and the bank.

import type { Engine } from "./engine";
import { rng } from "./theory";

type P = { f?: number; f2?: number; q?: number; type?: BiquadFilterType; amp: number; att?: number; dur: number; pan?: number; pan2?: number; buf?: "noise" | "pink" | "brown"; curve?: number[]; wet?: number };

export function playSfx(e: Engine, id: string, dry: AudioNode, wet: AudioNode, t: number): void {
  const ctx = e.ctx;
  const r = rng(Math.floor(t * 1000) + id.length);

  const route = (node: AudioNode, pan = 0, wetAmt = 0.25, pan2?: number, dur = 1): AudioNode => {
    const p = e.panner(pan);
    const sp = p as Partial<StereoPannerNode>;
    if (pan2 !== undefined && sp.pan) {
      sp.pan.setValueAtTime(pan, t);
      sp.pan.linearRampToValueAtTime(pan2, t + dur);
    }
    node.connect(p);
    p.connect(dry);
    const s = ctx.createGain();
    s.gain.value = wetAmt;
    p.connect(s);
    s.connect(wet);
    return p;
  };

  /** filtered noise burst with an optional amplitude curve (values 0..1 spread over dur) */
  const noise = (at: number, o: P): void => {
    const s = ctx.createBufferSource();
    s.buffer = o.buf === "pink" ? e.pink : o.buf === "brown" ? e.brown : e.noise;
    s.loop = true;
    const b = ctx.createBiquadFilter();
    b.type = o.type ?? "bandpass";
    b.frequency.setValueAtTime(o.f ?? 1000, at);
    if (o.f2) b.frequency.exponentialRampToValueAtTime(o.f2, at + o.dur);
    b.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    if (o.curve) {
      o.curve.forEach((c, i) => g.gain.linearRampToValueAtTime(c * o.amp, at + (o.dur * (i + 1)) / o.curve!.length));
      g.gain.linearRampToValueAtTime(0, at + o.dur + 0.02);
    } else {
      g.gain.linearRampToValueAtTime(o.amp, at + (o.att ?? 0.002));
      g.gain.setTargetAtTime(0, at + (o.att ?? 0.002), o.dur / 4);
    }
    s.connect(b);
    b.connect(g);
    const p = route(g, o.pan ?? 0, o.wet ?? 0.25, o.pan2, o.dur);
    s.start(at, r() * 2);
    s.stop(at + o.dur + 0.3);
    s.onended = () => p.disconnect();
  };

  const tone = (at: number, f: number, amp: number, dur: number, o: { f2?: number; type?: OscillatorType; pan?: number; att?: number; wet?: number; glideT?: number } = {}): void => {
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(Math.min(f, 16000), at);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.min(o.f2, 16000), at + (o.glideT ?? dur));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(amp, at + (o.att ?? 0.003));
    g.gain.setTargetAtTime(0, at + (o.att ?? 0.003), dur / 5);
    osc.connect(g);
    const p = route(g, o.pan ?? 0, o.wet ?? 0.25);
    osc.start(at);
    osc.stop(at + dur + 0.1);
    osc.onended = () => p.disconnect();
  };

  const metal = (at: number, base: number, ratios: number[], amp: number, dur: number, pan = 0, wetAmt = 0.35): void => {
    ratios.forEach((k, i) => tone(at, base * k, amp / (1 + i * 0.5), dur * (1 - i * 0.08), { pan, wet: wetAmt }));
  };

  const sample = (inst: "cbell" | "glass" | "celesta" | "timp" | "bdrum" | "heart" | "harp" | "tick", at: number, m: number, v: number, d = 6, pan = 0, wetAmt = 0.4): void => {
    const g = ctx.createGain();
    route(g, pan, wetAmt);
    e.note(inst, g, at, d, m, v, 0, 3);
  };

  switch (id) {
    case "page":
      noise(t, { f: 2500, f2: 5000, q: 0.8, amp: 0.12, dur: 0.22, curve: [0.3, 1, 0.6, 0.9, 0.3], pan: -0.2, pan2: 0.2 });
      noise(t + 0.2, { f: 4000, f2: 1800, q: 0.7, amp: 0.16, dur: 0.16, curve: [1, 0.7, 0.2], pan: 0.2 });
      noise(t + 0.33, { f: 900, q: 1, amp: 0.08, dur: 0.05 });
      break;
    case "bell":
      sample("cbell", t, 55, 0.8, 8, 0.1, 0.6);
      break;
    case "door": {
      // creak then thud
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(95, t);
      for (let i = 1; i <= 10; i++) o.frequency.linearRampToValueAtTime(90 + r() * 60 + i * 4, t + i * 0.06);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.1);
      g.gain.linearRampToValueAtTime(0.035, t + 0.5);
      g.gain.linearRampToValueAtTime(0, t + 0.65);
      o.connect(bp);
      bp.connect(g);
      route(g, -0.2, 0.2);
      o.start(t);
      o.stop(t + 0.7);
      tone(t + 0.68, 70, 0.4, 0.3, { f2: 50 });
      noise(t + 0.68, { type: "lowpass", f: 500, amp: 0.3, dur: 0.12, buf: "brown" });
      break;
    }
    case "sword":
      noise(t, { f: 1800, f2: 7000, q: 2, amp: 0.1, dur: 0.45, curve: [0.4, 0.8, 1, 0.6], pan: -0.2, pan2: 0.3 });
      metal(t + 0.35, 3150, [1, 1.51, 1.97, 2.63], 0.035, 1.3, 0.2, 0.5);
      break;
    case "clash":
      noise(t, { type: "highpass", f: 1500, amp: 0.4, dur: 0.12 });
      metal(t, 1210, [1, 2.23, 3.21, 4.37, 6.1], 0.07, 0.9, 0, 0.5);
      tone(t, 110, 0.3, 0.2, { f2: 60 });
      break;
    case "heartbeat":
      sample("heart", t, 60, 0.9, 1, 0, 0.15);
      sample("heart", t + 0.28, 57, 0.65, 1, 0, 0.15);
      break;
    case "step":
      noise(t, { type: "lowpass", f: 1400, amp: 0.25, dur: 0.07, buf: "pink", wet: 0.3 });
      tone(t, 95, 0.18, 0.08, { f2: 70, wet: 0.3 });
      noise(t + 0.03, { f: 3000, q: 1.5, amp: 0.03, dur: 0.04 });
      break;
    case "thunder":
      noise(t, { type: "highpass", f: 1200, amp: 0.35, dur: 0.35 });
      noise(t + 0.02, { type: "lowpass", f: 900, f2: 180, amp: 0.8, dur: 4.5, buf: "brown", curve: [1, 0.7, 0.9, 0.5, 0.65, 0.35, 0.3, 0.15, 0.05], wet: 0.5 });
      tone(t, 45, 0.3, 2.5, { f2: 32, wet: 0.2 });
      break;
    case "glass":
      noise(t, { type: "highpass", f: 3000, amp: 0.3, dur: 0.1 });
      for (let i = 0; i < 16; i++) {
        const a = t + Math.pow(r(), 1.8) * 0.5;
        metal(a, 2800 + r() * 5000, [1, 2.76], 0.025 + r() * 0.025, 0.12 + r() * 0.2, r() * 1.2 - 0.6, 0.4);
      }
      break;
    case "whoosh":
      noise(t, { f: 400, f2: 2400, q: 1.2, amp: 0.2, dur: 0.45, curve: [0.1, 0.4, 1, 0.5, 0.1], pan: -0.6, pan2: 0.6, buf: "pink" });
      break;
    case "fire":
      noise(t, { type: "lowpass", f: 200, f2: 1800, amp: 0.35, dur: 0.6, curve: [0.5, 1, 0.7, 0.4, 0.15], buf: "brown", wet: 0.3 });
      for (let i = 0; i < 8; i++) noise(t + 0.1 + r() * 0.6, { type: "highpass", f: 3000, amp: 0.1 + r() * 0.1, dur: 0.008 });
      break;
    case "splash":
      noise(t, { f: 1500, f2: 700, q: 0.8, amp: 0.35, dur: 0.5, curve: [1, 0.6, 0.3, 0.1], buf: "pink", wet: 0.35 });
      for (let i = 0; i < 7; i++) {
        const f = 500 + r() * 900;
        tone(t + 0.05 + r() * 0.45, f, 0.05, 0.06, { f2: f * 1.8, glideT: 0.05 });
      }
      break;
    case "knock":
      for (let i = 0; i < 3; i++) {
        const a = t + i * 0.19;
        tone(a, 190 - i * 6, 0.35, 0.09, { f2: 150, wet: 0.2 });
        noise(a, { f: 1100, q: 1.5, amp: 0.25, dur: 0.035 });
      }
      break;
    case "magic": {
      const notes = [74, 77, 79, 81, 84, 86, 89, 91];
      notes.forEach((m, i) => sample("celesta", t + i * 0.06, m, 0.4 + i * 0.03, 1.5, -0.4 + i * 0.1, 0.7));
      noise(t, { f: 1200, f2: 6000, q: 4, amp: 0.05, dur: 0.9, curve: [0.2, 0.7, 1, 0.5, 0.1], wet: 0.7 });
      tone(t, 110, 0.12, 1.2, { f2: 220, att: 0.3, wet: 0.5 });
      break;
    }
    case "chime":
      sample("glass", t, 88, 0.5, 2.5, 0.2, 0.6);
      sample("glass", t + 0.12, 93, 0.35, 2.5, 0.3, 0.6);
      break;
    case "tick":
      sample("tick", t, 62, 1, 0.3, 0.1, 0.25);
      noise(t, { f: 1100, q: 4, amp: 0.25, dur: 0.02, wet: 0.2 });
      break;
    case "rewind": {
      // a reverse whoosh: swells up and is sucked away, with ticks racing backwards
      noise(t, { f: 3000, f2: 400, q: 1.4, amp: 0.26, dur: 1.4, curve: [0.05, 0.12, 0.25, 0.5, 0.85, 1, 0.2], buf: "pink", pan: 0.6, pan2: -0.6, wet: 0.5 });
      tone(t, 900, 0.05, 1.4, { f2: 140, att: 1.1, wet: 0.5 });
      let a = t;
      let gap = 0.24;
      for (let i = 0; i < 22 && a < t + 1.35; i++) {
        const v = 0.06 + 0.12 * (i / 22);
        noise(a, { f: 2600 - i * 40, q: 6, amp: v, dur: 0.01, pan: (i % 2 ? 0.3 : -0.3), wet: 0.3 });
        a += gap;
        gap *= 0.84;
      }
      sample("glass", t + 1.38, 86, 0.3, 1.5, 0, 0.7);
      break;
    }
    case "sand":
      noise(t, { f: 4500, q: 0.7, amp: 0.12, dur: 2.2, curve: [0.4, 1, 0.9, 0.95, 0.8, 0.6, 0.3, 0.1], buf: "noise", wet: 0.3 });
      noise(t, { type: "lowpass", f: 900, amp: 0.08, dur: 2.2, curve: [0.5, 1, 0.9, 0.7, 0.4, 0.1], buf: "pink", wet: 0.2 });
      for (let i = 0; i < 40; i++) noise(t + r() * 2, { type: "highpass", f: 5000 + r() * 4000, amp: 0.03 + r() * 0.04, dur: 0.003, pan: r() - 0.5, wet: 0.2 });
      break;
    case "stab":
      noise(t, { f: 1200, f2: 4000, q: 1, amp: 0.14, dur: 0.12, curve: [0.3, 1, 0.4], pan: -0.2, pan2: 0.1 });
      noise(t + 0.1, { type: "lowpass", f: 700, f2: 250, amp: 0.4, dur: 0.16, buf: "brown", wet: 0.1 });
      tone(t + 0.1, 120, 0.3, 0.14, { f2: 55, wet: 0.1 });
      noise(t + 0.13, { f: 450, q: 3, amp: 0.12, dur: 0.12, curve: [1, 0.6, 0.2], buf: "pink", wet: 0.1 });
      break;
    case "flatline": {
        // hold the tone flat for ~2.5 s rather than decaying
        const o = ctx.createOscillator();
        o.frequency.value = 960;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.07, t + 0.01);
        g.gain.setValueAtTime(0.07, t + 2.45);
        g.gain.linearRampToValueAtTime(0, t + 2.5);
        o.connect(g);
        const p = route(g, 0.3, 0.15);
        o.start(t);
        o.stop(t + 2.55);
        o.onended = () => p.disconnect();
      break;
    }
    case "monitor":
      tone(t, 960, 0.22, 0.14, { att: 0.004, pan: 0.3, wet: 0.15 });
      break;
    case "phone":
      for (let k = 0; k < 2; k++) {
        const a = t + k * 0.75;
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = 160;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, a);
        g.gain.linearRampToValueAtTime(0.09, a + 0.02);
        for (let i = 1; i < 10; i++) g.gain.setValueAtTime(0.09 * (i % 2 ? 0.75 : 1), a + i * 0.04);
        g.gain.setValueAtTime(0.09, a + 0.4);
        g.gain.linearRampToValueAtTime(0, a + 0.43);
        o.connect(lp);
        lp.connect(g);
        const p = route(g, 0, 0.05);
        o.start(a);
        o.stop(a + 0.45);
        o.onended = () => p.disconnect();
        noise(a, { f: 2200, q: 2, amp: 0.02, dur: 0.42, curve: [1, 1, 1, 1, 1, 0.5], wet: 0.05 });
      }
      break;
    case "crack": {
      let a = t;
      for (let i = 0; i < 9; i++) {
        noise(a, { type: "highpass", f: 2500 + r() * 3000, amp: 0.12 + r() * 0.12, dur: 0.006 + r() * 0.01, pan: r() * 0.4 - 0.2, wet: 0.3 });
        if (i % 3 === 0) metal(a, 2600 + r() * 2500, [1, 2.4], 0.02, 0.15, 0, 0.3);
        a += 0.015 + r() * 0.05;
      }
      break;
    }
    case "cup":
      noise(t, { type: "highpass", f: 2000, amp: 0.4, dur: 0.08 });
      tone(t, 1800, 0.08, 0.25, { f2: 1700, wet: 0.3 });
      for (let i = 0; i < 20; i++) {
        const a = t + 0.02 + Math.pow(r(), 1.6) * 0.7;
        metal(a, 2000 + r() * 3500, [1, 2.4, 3.1], 0.02 + r() * 0.03, 0.08 + r() * 0.18, r() * 1.2 - 0.6, 0.35);
        noise(a, { type: "highpass", f: 4000, amp: 0.04, dur: 0.01 });
      }
      noise(t + 0.25, { f: 3500, q: 1, amp: 0.05, dur: 0.4, curve: [1, 0.5, 0.3, 0.1] });
      break;
    case "hit":
      tone(t, 85, 0.5, 0.25, { f2: 40, wet: 0.2 });
      noise(t, { type: "lowpass", f: 2200, amp: 0.4, dur: 0.07, buf: "pink" });
      break;
    default:
      break; // unknown id: silence
  }
}

export const SE_IDS = [
  "page", "bell", "door", "step", "sword", "clash", "heartbeat", "glass", "whoosh", "fire", "splash", "knock",
  "magic", "chime", "hit", "thunder", "tick", "rewind", "sand", "stab", "flatline", "monitor", "phone", "crack", "cup",
];
