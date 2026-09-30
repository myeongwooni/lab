// Audio engine: works on any BaseAudioContext (realtime AudioContext in the
// app, OfflineAudioContext in tests).

import { Bank, SampleInst } from "./bank";
import { Host, Inst, Voice, WaveName, isSampleInst, makeWave, playNote } from "./synth";
import type { ChSpec, Track } from "./track";
import { getTrack } from "./tracks";
import { Amb, makeAmbience } from "./ambience";
import { playSfx } from "./sfx";

export type Kind = "bgm" | "se" | "amb";
const MAX_VOICES = 32;
const LOOKAHEAD = 0.15;

function loopNoise(ctx: BaseAudioContext, secs: number, color: "white" | "pink" | "brown", seed: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(secs * sr);
  const F = Math.floor(0.25 * sr);
  const tmp = new Float32Array(n + F);
  let s = seed >>> 0;
  const rnd = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
  let mx = 1e-9;
  for (let i = 0; i < n + F; i++) {
    const w = rnd() * 2 - 1;
    let x = w;
    if (color === "pink") {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      x = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      b6 = w * 0.115926;
    } else if (color === "brown") {
      br = (br + 0.02 * w) * 0.995;
      x = br * 3.5;
    }
    tmp[i] = x;
    if (Math.abs(x) > mx) mx = Math.abs(x);
  }
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = tmp[i] / mx;
  // crossfade the tail into the head so the loop point is seamless
  for (let i = 0; i < F; i++) {
    const a = i / F;
    d[i] = (tmp[i] * a + tmp[n + i] * (1 - a)) / mx;
  }
  return buf;
}

function makeImpulse(ctx: BaseAudioContext, secs: number, t60: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(secs * sr);
  const buf = ctx.createBuffer(2, n, sr);
  let s = 12345;
  const rnd = (): number => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  const pre = Math.floor(0.018 * sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / sr;
      const decay = Math.exp((-6.91 * t) / t60);
      const a = 0.85 - 0.7 * Math.min(1, t / (t60 * 0.8)); // darker as it decays
      lp += a * (rnd() * 2 - 1 - lp);
      const fadeIn = Math.min(1, t / 0.012);
      d[i] = lp * decay * fadeIn;
    }
    // a few early reflections
    const taps = [0.011, 0.019, 0.027, 0.036, 0.047, 0.061];
    taps.forEach((tt, k) => {
      const i = pre + Math.floor((tt + c * 0.0023 * (k % 3)) * sr);
      if (i < n) d[i] += (k % 2 ? -1 : 1) * 0.5 * Math.pow(0.8, k);
    });
    for (let i = n - Math.floor(0.05 * sr); i < n; i++) d[i] *= (n - i) / (0.05 * sr);
  }
  return buf;
}

type Chan = { input: GainNode; spec: ChSpec; inst: Inst };

class Player {
  dry: GainNode;
  wet: GainNode;
  chans: Record<string, Chan> = {};
  idx = 0;
  loop = 0;
  stopAt = Infinity;
  dead = false;
  start: number;
  spb: number;
  private nodes: AudioNode[] = [];

  constructor(private e: Engine, public track: Track, when: number, fade: number, offsetBeats: number) {
    const ctx = e.ctx;
    this.spb = 60 / track.bpm;
    this.start = when - offsetBeats * this.spb;
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    const g = track.gain ?? 1;
    this.dry.gain.setValueAtTime(fade > 0 ? 0 : g, when);
    this.wet.gain.setValueAtTime(fade > 0 ? 0 : g, when);
    if (fade > 0) {
      this.dry.gain.linearRampToValueAtTime(g, when + fade);
      this.wet.gain.linearRampToValueAtTime(g, when + fade);
    }
    this.dry.connect(e.buses.bgm.dry);
    this.wet.connect(e.buses.bgm.wet);
    for (const name of Object.keys(track.ch)) this.chans[name] = this.makeChan(track.ch[name]);
    // start index
    const off = ((offsetBeats % track.len) + track.len) % track.len;
    this.loop = Math.floor(offsetBeats / track.len);
    this.idx = 0;
    while (this.idx < track.ev.length && track.ev[this.idx].t < off - 1e-9) this.idx++;
    if (this.idx >= track.ev.length) {
      this.idx = 0;
      this.loop++;
    }
  }

  private makeChan(spec: ChSpec): Chan {
    const ctx = this.e.ctx;
    const input = ctx.createGain();
    input.gain.value = spec.gain ?? 1;
    let tail: AudioNode = input;
    const fx = spec.fx;
    if (fx === "ah" || fx === "oo") {
      const sum = ctx.createGain();
      const F = fx === "ah" ? [[730, 1, 6], [1150, 0.55, 7], [2750, 0.22, 9], [3400, 0.08, 9]] : [[380, 1, 6], [820, 0.4, 7], [2600, 0.08, 9]];
      for (const [f, a, q] of F) {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = f;
        bp.Q.value = q;
        const gg = ctx.createGain();
        gg.gain.value = a * 2.2;
        input.connect(bp);
        bp.connect(gg);
        gg.connect(sum);
        this.nodes.push(bp, gg);
      }
      tail = sum;
      this.nodes.push(sum);
    } else if (fx === "body") {
      const p1 = ctx.createBiquadFilter();
      p1.type = "peaking";
      p1.frequency.value = 300;
      p1.gain.value = 3;
      p1.Q.value = 1;
      const p2 = ctx.createBiquadFilter();
      p2.type = "peaking";
      p2.frequency.value = 2600;
      p2.gain.value = 2.5;
      p2.Q.value = 1.2;
      const hs = ctx.createBiquadFilter();
      hs.type = "highshelf";
      hs.frequency.value = 6500;
      hs.gain.value = -6;
      input.connect(p1);
      p1.connect(p2);
      p2.connect(hs);
      tail = hs;
      this.nodes.push(p1, p2, hs);
    } else if (fx === "dark" || fx === "air") {
      const f = ctx.createBiquadFilter();
      f.type = fx === "dark" ? "lowpass" : "highshelf";
      f.frequency.value = fx === "dark" ? 2200 : 5000;
      if (fx === "air") f.gain.value = 4;
      input.connect(f);
      tail = f;
      this.nodes.push(f);
    }
    const pan = this.e.panner(spec.pan ?? 0);
    tail.connect(pan);
    pan.connect(this.dry);
    const send = ctx.createGain();
    send.gain.value = spec.rev ?? 0.25;
    pan.connect(send);
    send.connect(this.wet);
    this.nodes.push(input, pan, send);
    return { input, spec, inst: spec.inst };
  }

  schedule(until: number, now: number): void {
    const tr = this.track;
    const evs = tr.ev;
    if (this.dead || evs.length === 0) return;
    let guard = 0;
    while (guard++ < 4000) {
      const ev = evs[this.idx];
      const at = this.start + (this.loop * tr.len + ev.t) * this.spb;
      if (at >= until || at >= this.stopAt) break;
      if (at >= now - 0.01) {
        const ch = this.chans[ev.ch];
        if (ch) {
          const t = Math.max(at, now);
          this.e.note(ch.inst, ch.input, t, ev.d * this.spb, ev.m, ev.v, ev.sh ?? 0, ch.spec.prio ?? 1, ch.spec);
        }
      }
      this.idx++;
      if (this.idx >= evs.length) {
        this.idx = 0;
        this.loop++;
      }
    }
    if (this.stopAt !== Infinity && until > this.stopAt + 0.5) this.dead = true;
  }

  fadeOut(t: number, secs: number): void {
    const f = Math.max(0.03, secs);
    for (const g of [this.dry.gain, this.wet.gain]) {
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + f);
    }
    this.stopAt = t + f;
  }

  dispose(): void {
    try {
      this.dry.disconnect();
      this.wet.disconnect();
      for (const n of this.nodes) n.disconnect();
    } catch {
      /* ignore */
    }
  }
}

export class Engine implements Host {
  ctx: BaseAudioContext;
  bank: Bank;
  noise: AudioBuffer;
  pink: AudioBuffer;
  brown: AudioBuffer;
  buses: Record<Kind, { dry: GainNode; wet: GainNode }>;
  reverbIn: GainNode;
  master: GainNode;
  private waves = new Map<WaveName, PeriodicWave>();
  private voices: Voice[] = [];
  private players: Player[] = [];
  private cur: string | null = null;
  private amb: Amb | null = null;
  private ambOld: Amb[] = [];
  private ambId: string | null = null;
  private vol: Record<Kind, number> = { bgm: 0.8, se: 0.8, amb: 0.8 };
  private ducked = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private pendingBgm = 0;

  constructor(ctx: BaseAudioContext, public realtime: boolean) {
    this.ctx = ctx;
    this.bank = new Bank(ctx);
    this.noise = loopNoise(ctx, 3, "white", 1);
    this.pink = loopNoise(ctx, 5, "pink", 2);
    this.brown = loopNoise(ctx, 5, "brown", 3);

    // master: comp -> limiter -> out
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.02;
    comp.release.value = 0.35;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.001;
    lim.release.value = 0.12;
    const out = ctx.createGain();
    out.gain.value = 1.35;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    // final safety: soft clip that can never exceed ~0.98 (linear below 0.6)
    const pre = ctx.createGain();
    pre.gain.value = 0.5;
    const shaper = ctx.createWaveShaper();
    const N = 2048;
    const curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = ((i / (N - 1)) * 2 - 1) * 2; // shaper input u in [-1,1] represents x in [-2,2]
      const ax = Math.abs(x);
      const y = ax <= 0.6 ? ax : 0.6 + 0.38 * Math.tanh((ax - 0.6) / 0.38);
      curve[i] = Math.sign(x) * y;
    }
    shaper.curve = curve;
    shaper.oversample = "2x";
    this.master.connect(comp);
    comp.connect(lim);
    lim.connect(out);
    out.connect(pre);
    pre.connect(shaper);
    shaper.connect(ctx.destination);

    // shared reverb
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 3.4, 2.9);
    this.reverbIn = ctx.createGain();
    this.reverbIn.gain.value = 1;
    const revHp = ctx.createBiquadFilter();
    revHp.type = "highpass";
    revHp.frequency.value = 180;
    const revOut = ctx.createGain();
    revOut.gain.value = 0.9;
    this.reverbIn.connect(revHp);
    revHp.connect(conv);
    conv.connect(revOut);
    revOut.connect(this.master);

    const mk = (): { dry: GainNode; wet: GainNode } => {
      const dry = ctx.createGain();
      const wet = ctx.createGain();
      dry.connect(this.master);
      wet.connect(this.reverbIn);
      return { dry, wet };
    };
    this.buses = { bgm: mk(), se: mk(), amb: mk() };
    (Object.keys(this.buses) as Kind[]).forEach((k) => this.applyVol(k, 0));

  }

  wave(name: WaveName): PeriodicWave {
    let w = this.waves.get(name);
    if (!w) {
      w = makeWave(this.ctx, name);
      this.waves.set(name, w);
    }
    return w;
  }

  panner(p: number): AudioNode {
    const c = this.ctx as BaseAudioContext & { createStereoPanner?: () => StereoPannerNode };
    if (typeof c.createStereoPanner === "function") {
      const sp = c.createStereoPanner();
      sp.pan.value = Math.max(-1, Math.min(1, p));
      return sp;
    }
    return this.ctx.createGain();
  }

  /** start one voice, respecting the voice cap */
  note(inst: Inst, dest: AudioNode, t: number, d: number, m: number, v: number, sh: number, prio: number, spec?: ChSpec): void {
    this.voices = this.voices.filter((x) => x.end > t);
    if (this.voices.length >= MAX_VOICES) {
      let vi = 0;
      for (let i = 1; i < this.voices.length; i++) {
        const a = this.voices[i];
        const b = this.voices[vi];
        if (a.prio < b.prio || (a.prio === b.prio && a.start < b.start)) vi = i;
      }
      if (this.voices[vi].prio > prio) return; // everything playing is more important
      this.voices[vi].kill(t);
      this.voices.splice(vi, 1);
    }
    try {
      const voice = playNote(this, inst, dest, t, d, m, v, sh, prio, spec ? { bright: spec.bright, att: spec.att, rel: spec.rel } : {});
      this.voices.push(voice);
    } catch {
      /* never let a single note break playback */
    }
  }

  addVoice(v: Voice): void {
    this.voices = this.voices.filter((x) => x.end > v.start);
    this.voices.push(v);
  }

  now(): number {
    return this.ctx.currentTime;
  }

  // ------------------------------------------------------------ bgm

  currentBgm(): string | null {
    return this.cur;
  }

  sampleNeeds(tr: Track): SampleInst[] {
    const out: SampleInst[] = [];
    for (const k of Object.keys(tr.ch)) {
      const i = tr.ch[k].inst;
      if (isSampleInst(i) && out.indexOf(i) < 0) out.push(i);
    }
    return out;
  }

  playBgm(id: string | null, fadeMs = 2000, offsetSec = 0): void {
    if (id === this.cur) return;
    this.cur = id;
    const token = ++this.pendingBgm;
    const t = this.now();
    const fade = Math.max(0, fadeMs) / 1000;
    for (const p of this.players) if (p.stopAt === Infinity) p.fadeOut(t, fade);
    if (!id) return;
    const tr = getTrack(id);
    if (!tr) return;
    const begin = (): void => {
      if (token !== this.pendingBgm) return;
      const when = this.now() + 0.06;
      // when crossfading, overlap: new track fades in over the same time
      const p = new Player(this, tr, when, fade > 0 ? Math.min(fade, 3) : 0, offsetSec / (60 / tr.bpm));
      this.players.push(p);
      this.schedule();
    };
    const need = this.sampleNeeds(tr);
    if (!this.realtime) {
      for (const i of need) this.bank.ensure(i);
      begin();
    } else if (need.every((i) => this.bank.has(i))) begin();
    else {
      this.bank.prioritize(need);
      this.bank.warm(need, begin);
    }
  }

  // ------------------------------------------------------------ ambience / se

  setAmbient(id: string | null): void {
    if (id === this.ambId) return;
    this.ambId = id;
    const t = this.now();
    if (this.amb) {
      this.amb.stop(t, 2.5);
      this.ambOld.push(this.amb);
      this.amb = null;
    }
    if (id) {
      this.amb = makeAmbience(this, id, this.buses.amb.dry, this.buses.amb.wet, t + 0.05);
      this.schedule();
    }
  }

  playSe(id: string, at?: number): void {
    try {
      playSfx(this, id, this.buses.se.dry, this.buses.se.wet, at ?? this.now() + 0.01);
    } catch {
      /* ignore */
    }
  }

  // ------------------------------------------------------------ mix

  private applyVol(k: Kind, ramp = 0.08): void {
    const v = this.vol[k];
    let g = v * v;
    if (k === "bgm" && this.ducked) g *= 0.45;
    const t = this.now();
    for (const n of [this.buses[k].dry, this.buses[k].wet]) {
      n.gain.cancelScheduledValues(t);
      if (ramp > 0) n.gain.setTargetAtTime(g, t, ramp);
      else n.gain.setValueAtTime(g, t);
    }
  }

  setVolume(k: Kind, v: number): void {
    this.vol[k] = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    this.applyVol(k);
  }

  duck(on: boolean): void {
    if (this.ducked === on) return;
    this.ducked = on;
    this.applyVol("bgm", 0.4);
  }

  // ------------------------------------------------------------ scheduling

  /** schedule everything up to `until` (offline) or now + lookahead */
  schedule(until?: number): void {
    const now = this.now();
    const end = until ?? now + LOOKAHEAD;
    for (const p of this.players) p.schedule(end, this.realtime ? now : 0);
    const alive: Player[] = [];
    for (const p of this.players) {
      if (p.dead) {
        const pp = p;
        if (this.realtime) setTimeout(() => pp.dispose(), 6000);
      } else alive.push(p);
    }
    this.players = alive;
    if (this.amb) this.amb.tick(end);
    this.ambOld = this.ambOld.filter((a) => {
      a.tick(end);
      return !a.done(now);
    });
  }

  startTimer(): void {
    if (!this.realtime || this.timer) return;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
