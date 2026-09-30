// Looping ambiences: filtered noise beds with slow modulation plus sparse
// randomized events (drops, crackles, crickets, distant laughs...).

import type { Engine } from "./engine";
import { rng } from "./theory";

export type Amb = { tick(until: number): void; stop(t: number, fade: number): void; done(now: number): boolean };

type Ctx = BaseAudioContext;

function src(ctx: Ctx, buf: AudioBuffer, t: number): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.start(t, Math.random() * (buf.duration - 0.5));
  return s;
}

function filt(ctx: Ctx, type: BiquadFilterType, f: number, q = 0.7, gain = 0): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  b.gain.value = gain;
  return b;
}

/** slow LFO driving a param: value = base + depth * sin */
function lfo(ctx: Ctx, param: AudioParam, base: number, depth: number, hz: number, t: number, nodes: AudioScheduledSourceNode[]): void {
  if (base !== 0) param.value = base;
  const o = ctx.createOscillator();
  o.frequency.value = hz;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g);
  g.connect(param);
  o.start(t);
  nodes.push(o);
}

function chain(...n: AudioNode[]): void {
  for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]);
}

export function makeAmbience(e: Engine, id: string, dry: AudioNode, wet: AudioNode, t: number): Amb | null {
  const ctx = e.ctx;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(1, t + 2.5);
  out.connect(dry);
  const send = ctx.createGain();
  send.gain.value = 0.25;
  out.connect(send);
  send.connect(wet);
  const srcs: AudioScheduledSourceNode[] = [];
  const r = rng(id.length * 977 + 13);
  let next = t + 0.2; // next random event time
  let stopAt = Infinity;
  let event: ((at: number) => number) | null = null; // returns gap to next event

  const bed = (buf: AudioBuffer, nodes: AudioNode[], gain: number): GainNode => {
    const s = src(ctx, buf, t);
    srcs.push(s);
    const g = ctx.createGain();
    g.gain.value = gain;
    chain(s, ...nodes, g, out);
    return g;
  };

  const blip = (at: number, buf: AudioBuffer, f: number, q: number, type: BiquadFilterType, amp: number, dur: number, pan: number, att = 0.001): void => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const b = filt(ctx, type, f, q);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(amp, at + att);
    g.gain.setTargetAtTime(0, at + att, dur / 3);
    const p = e.panner(pan);
    chain(s, b, g, p, out);
    s.start(at, Math.random() * 2);
    s.stop(at + dur * 2 + 0.05);
    s.onended = () => p.disconnect();
  };

  const tone = (at: number, f: number, amp: number, dur: number, pan: number, type: OscillatorType = "sine", f2?: number): void => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(amp, at + Math.min(0.02, dur / 4));
    g.gain.setTargetAtTime(0, at + dur * 0.5, dur / 4);
    const p = e.panner(pan);
    chain(o, g, p, out);
    o.start(at);
    o.stop(at + dur * 1.6 + 0.05);
    o.onended = () => p.disconnect();
  };

  switch (id) {
    case "rain": {
      const g1 = bed(e.pink, [filt(ctx, "highpass", 500), filt(ctx, "lowpass", 7500), filt(ctx, "peaking", 3200, 0.8, 4)], 0.16);
      lfo(ctx, g1.gain, 0.16, 0.035, 0.07, t, srcs);
      bed(e.brown, [filt(ctx, "lowpass", 700)], 0.14);
      event = (at) => {
        blip(at, e.noise, 1800 + r() * 5000, 3 + r() * 5, "bandpass", 0.05 + r() * 0.12, 0.012 + r() * 0.02, r() * 1.6 - 0.8);
        return 0.03 + r() * 0.12;
      };
      break;
    }
    case "wind": {
      const bp = filt(ctx, "bandpass", 520, 0.9);
      const g1 = bed(e.pink, [bp], 0.35);
      lfo(ctx, bp.frequency, 520, 260, 0.053, t, srcs);
      lfo(ctx, g1.gain, 0.3, 0.14, 0.081, t, srcs);
      const bp2 = filt(ctx, "bandpass", 1100, 9);
      const g2 = bed(e.pink, [bp2], 0.12);
      lfo(ctx, bp2.frequency, 1100, 350, 0.113, t, srcs);
      lfo(ctx, g2.gain, 0.06, 0.06, 0.071, t, srcs);
      bed(e.brown, [filt(ctx, "lowpass", 300)], 0.12);
      break;
    }
    case "fire": {
      const g1 = bed(e.brown, [filt(ctx, "lowpass", 480), filt(ctx, "peaking", 180, 1, 4)], 0.35);
      lfo(ctx, g1.gain, 0.32, 0.08, 0.37, t, srcs);
      bed(e.pink, [filt(ctx, "bandpass", 1200, 0.6)], 0.03);
      event = (at) => {
        const big = r() < 0.12;
        if (big) blip(at, e.noise, 900 + r() * 600, 1.5, "bandpass", 0.25, 0.03, r() - 0.5);
        else blip(at, e.noise, 2500 + r() * 5000, 1.2, "highpass", 0.05 + Math.pow(r(), 3) * 0.3, 0.004 + r() * 0.006, r() * 1.2 - 0.6);
        return r() < 0.3 ? 0.02 + r() * 0.05 : 0.08 + r() * 0.35;
      };
      break;
    }
    case "sea": {
      const lp = filt(ctx, "lowpass", 700, 0.5);
      const g1 = bed(e.brown, [lp], 0.4);
      lfo(ctx, lp.frequency, 800, 550, 0.105, t, srcs);
      lfo(ctx, g1.gain, 0.3, 0.18, 0.105, t, srcs);
      const hp = filt(ctx, "highpass", 1800);
      const g2 = bed(e.pink, [hp, filt(ctx, "lowpass", 8000)], 0.05);
      lfo(ctx, g2.gain, 0.045, 0.04, 0.105, t + 1.2, srcs);
      const g3 = bed(e.pink, [filt(ctx, "bandpass", 400, 0.7)], 0.06);
      lfo(ctx, g3.gain, 0.06, 0.03, 0.061, t, srcs);
      break;
    }
    case "crowd": {
      for (const [f, hz1, hz2] of [
        [480, 3.1, 4.7],
        [1050, 4.3, 5.9],
        [2300, 5.3, 3.7],
      ]) {
        const g = bed(e.pink, [filt(ctx, "bandpass", f, 2.5)], 0.14);
        lfo(ctx, g.gain, 0.12, 0.05, hz1, t, srcs);
        lfo(ctx, g.gain, 0, 0.04, hz2, t, srcs);
        lfo(ctx, g.gain, 0, 0.03, 0.13 + f / 20000, t, srcs);
      }
      bed(e.brown, [filt(ctx, "lowpass", 350)], 0.12);
      event = (at) => {
        const k = r();
        if (k < 0.45) {
          // glass / cutlery clink
          const f = 2400 + r() * 2200;
          tone(at, f, 0.02 + r() * 0.02, 0.18, r() * 1.6 - 0.8);
          tone(at, f * 2.71, 0.008, 0.08, r() * 1.6 - 0.8);
        } else if (k < 0.75) {
          // distant laugh: a few formant-filtered "ha"s
          const n = 3 + Math.floor(r() * 3);
          const f0 = 180 + r() * 140;
          const pan = r() * 1.4 - 0.7;
          for (let i = 0; i < n; i++) {
            const a = at + i * (0.13 + r() * 0.03);
            const o = ctx.createOscillator();
            o.type = "sawtooth";
            o.frequency.setValueAtTime(f0 * (1.08 - i * 0.03), a);
            o.frequency.linearRampToValueAtTime(f0 * (0.95 - i * 0.03), a + 0.09);
            const bp = filt(ctx, "bandpass", 850 + r() * 200, 4);
            const lp = filt(ctx, "lowpass", 1800);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, a);
            g.gain.linearRampToValueAtTime(0.028 * (1 - i * 0.12), a + 0.02);
            g.gain.setTargetAtTime(0, a + 0.05, 0.03);
            const p = e.panner(pan);
            chain(o, bp, lp, g, p, out);
            o.start(a);
            o.stop(a + 0.25);
            o.onended = () => p.disconnect();
          }
        } else {
          blip(at, e.noise, 1500, 0.8, "bandpass", 0.04, 0.05, r() - 0.5);
        }
        return 0.6 + r() * 2.2;
      };
      break;
    }
    case "night": {
      const g1 = bed(e.brown, [filt(ctx, "lowpass", 380)], 0.14);
      lfo(ctx, g1.gain, 0.12, 0.05, 0.06, t, srcs);
      bed(e.pink, [filt(ctx, "bandpass", 2600, 0.6)], 0.012);
      let owl = t + 9 + r() * 10;
      event = (at) => {
        if (at > owl) {
          owl = at + 22 + r() * 20;
          tone(at, 390, 0.025, 0.35, -0.6, "sine", 360);
          tone(at + 0.55, 395, 0.02, 0.5, -0.6, "sine", 350);
          return 0.4;
        }
        // cricket chirp: 3-4 pulses of a ~4.5kHz tone
        const f = r() < 0.5 ? 4400 + r() * 150 : 4900 + r() * 150;
        const pan = f < 4700 ? -0.45 : 0.5;
        const o = ctx.createOscillator();
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        const n = 3 + Math.floor(r() * 2);
        const amp = 0.012 + r() * 0.01;
        for (let i = 0; i < n; i++) {
          const a = at + i * 0.032;
          g.gain.setValueAtTime(0, a);
          g.gain.linearRampToValueAtTime(amp, a + 0.006);
          g.gain.linearRampToValueAtTime(0, a + 0.02);
        }
        const p = e.panner(pan);
        chain(o, g, p, out);
        o.start(at);
        o.stop(at + n * 0.032 + 0.05);
        o.onended = () => p.disconnect();
        return 0.35 + r() * 0.7;
      };
      break;
    }
    default:
      out.disconnect();
      send.disconnect();
      return null;
  }

  return {
    tick(until: number) {
      if (!event) return;
      const now = ctx.currentTime;
      let guard = 0;
      while (next < until && next < stopAt && guard++ < 200) {
        if (next >= now - 0.01) next += event(Math.max(next, now));
        else next = now + 0.05;
      }
    },
    stop(at: number, fade: number) {
      stopAt = at + fade;
      out.gain.cancelScheduledValues(at);
      out.gain.setValueAtTime(out.gain.value, at);
      out.gain.linearRampToValueAtTime(0, at + fade);
      for (const s of srcs) {
        try {
          s.stop(at + fade + 0.1);
        } catch {
          /* ignore */
        }
      }
      if (typeof setTimeout !== "undefined" && e.realtime)
        setTimeout(() => {
          out.disconnect();
          send.disconnect();
        }, (fade + 1.5) * 1000);
    },
    done(now: number) {
      return now > stopAt + 1;
    },
  };
}
