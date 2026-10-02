// Public audio API for the visual novel.
// SSR-safe: nothing touches `window` or creates an AudioContext at import time.
// Calls made before unlock() are remembered and applied once audio is unlocked.

import { Engine } from "./engine";
import { TRACK_INFO, TrackInfo } from "./tracks/info";

export type { TrackInfo };
export const TRACKS: TrackInfo[] = TRACK_INFO;

type Kind = "bgm" | "se" | "amb";

const state = {
  bgm: null as string | null,
  bgmFade: 2000,
  amb: null as string | null,
  vol: { bgm: 0.8, se: 0.8, amb: 0.8 } as Record<Kind, number>,
  duck: false,
};

let engine: Engine | null = null;
let ctx: AudioContext | null = null;
let listening = false;
let hidden = false;

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const C = w.AudioContext || w.webkitAudioContext;
  if (!C) return null;
  try {
    return new C({ latencyHint: "interactive" });
  } catch {
    try {
      return new C();
    } catch {
      return null;
    }
  }
}

function onVisibility(): void {
  if (!ctx || !engine) return;
  if (document.visibilityState === "hidden") {
    hidden = true;
    engine.stopTimer();
    ctx.suspend().catch(() => undefined);
  } else {
    hidden = false;
    ctx
      .resume()
      .catch(() => undefined)
      .then(() => engine && engine.startTimer());
  }
}

function listen(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("visibilitychange", onVisibility);
  // iOS may "interrupt" the context; a later gesture resumes it
  const kick = (): void => {
    if (ctx && ctx.state !== "running" && !hidden) ctx.resume().catch(() => undefined);
  };
  window.addEventListener("pointerdown", kick, { passive: true });
  window.addEventListener("keydown", kick);
}

function safe(fn: () => void): void {
  try {
    fn();
  } catch {
    /* audio must never break the game */
  }
}

export const audio = {
  /** call from a user gesture: creates/resumes the AudioContext (iOS-safe) */
  unlock(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    try {
      if (!ctx) {
        ctx = createContext();
        if (!ctx) return Promise.resolve();
        // play one silent sample inside the gesture (iOS unlock)
        const b = ctx.createBuffer(1, 1, 22050);
        const s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start(0);
      }
      const p = ctx.state === "running" ? Promise.resolve() : ctx.resume();
      if (!engine) {
        engine = new Engine(ctx, true);
        (Object.keys(state.vol) as Kind[]).forEach((k) => engine!.setVolume(k, state.vol[k]));
        if (state.duck) engine.duck(true);
        listen();
        engine.startTimer();
        // warm up the most common instruments in the background
        engine.bank.warm(["piano", "mbox", "tick", "celesta", "pizz", "harp", "glass", "rglass", "lute", "timp", "heart", "cbell", "fdrum", "fslap", "tamb", "bdrum"]);
        const e = engine;
        p.catch(() => undefined).then(() => {
          if (state.bgm) e.playBgm(state.bgm, 1200);
          if (state.amb) e.setAmbient(state.amb);
        });
      }
      return p.then(
        () => undefined,
        () => undefined,
      );
    } catch {
      return Promise.resolve();
    }
  },

  /** crossfade to a track (null = stop); same id = no-op */
  playBgm(id: string | null, fadeMs = 2000): void {
    if (id === state.bgm) return;
    state.bgm = id;
    state.bgmFade = fadeMs;
    if (engine) safe(() => engine!.playBgm(id, fadeMs));
  },

  currentBgm(): string | null {
    return state.bgm;
  },

  /** looping ambience, crossfaded (null = none) */
  setAmbient(id: string | null): void {
    const v = id === "none" ? null : id;
    if (v === state.amb) return;
    state.amb = v;
    if (engine) safe(() => engine!.setAmbient(v));
  },

  /** one-shot sound effect (ignored before unlock) */
  playSe(id: string): void {
    if (engine && ctx && ctx.state === "running") safe(() => engine!.playSe(id));
  },

  /** 0..1, applied immediately */
  setVolume(kind: Kind, v: number): void {
    if (!(kind in state.vol)) return;
    state.vol[kind] = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    if (engine) safe(() => engine!.setVolume(kind, state.vol[kind]));
  },

  /** lower bgm slightly (e.g. while a letter is shown) */
  duck(on: boolean): void {
    state.duck = on;
    if (engine) safe(() => engine!.duck(on));
  },
};

export default audio;
