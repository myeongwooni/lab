"use client";

// 사망 회귀 연출: 사망(@death)과 되감기(@rewind).
//   사망 — 화면이 핏빛으로 식다가 검게 꺼지고, 심장 소리가 느려지다 멎고(flatline), 화면에 금이 간 뒤 사망 카드.
//   되감기 — 금빛 모래가 위로 쏟아지고, 거대한 시계가 거꾸로 돌고, 하얗게 바랜 뒤 "제 N회차" 카드.
import { useEffect, useMemo, useRef, useState } from "react";
import { audio } from "../audio/director";
import { chapterInfo, deathInfo } from "../engine/catalog";

type Timer = ReturnType<typeof setTimeout>;

function useTimeline(steps: [number, () => void][], deps: unknown[]) {
  const timers = useRef<Timer[]>([]);
  useEffect(() => {
    timers.current = steps.map(([ms, fn]) => setTimeout(fn, ms));
    return () => timers.current.forEach(clearTimeout);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return () => timers.current.forEach(clearTimeout);
}

// 화면을 가로지르는 금. 시드 고정이라 같은 사망은 같은 금이 갑니다.
function crackPath(seed: number): { main: string; branches: string[] } {
  let s = seed >>> 0 || 1;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pts: [number, number][] = [];
  let y = 300 + r() * 300;
  for (let x = -20; x <= 1620; x += 40 + r() * 70) {
    y += (r() - 0.5) * 120;
    y = Math.max(160, Math.min(740, y));
    pts.push([x, y]);
  }
  const main = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(0)} ${p[1].toFixed(0)}`).join(" ");
  const branches: string[] = [];
  for (let i = 2; i < pts.length - 1; i += 2 + Math.floor(r() * 2)) {
    let [x, by] = pts[i];
    const dir = r() < 0.5 ? -1 : 1;
    let d = `M${x.toFixed(0)} ${by.toFixed(0)}`;
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      x += 20 + r() * 50;
      by += dir * (20 + r() * 60);
      d += ` L${x.toFixed(0)} ${by.toFixed(0)}`;
    }
    branches.push(d);
  }
  return { main, branches };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function DeathSequence({ id, first, fast, nudge, onDone }: { id: string; first: boolean; fast: boolean; nudge: number; onDone: () => void }) {
  const info = deathInfo(id);
  const [phase, setPhase] = useState<"red" | "black" | "crack" | "card">("red");
  const crack = useMemo(() => crackPath(hash(id)), [id]);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const nudgeRef = useRef(nudge);

  const T = fast ? { b1: 0, b2: 0, b3: 0, b4: 0, flat: 150, black: 200, crack: 400, card: 800 } : { b1: 150, b2: 1050, b3: 2150, b4: 3550, flat: 4500, black: 2300, crack: 5300, card: 6200 };

  const stop = useTimeline(
    [
      ...(fast
        ? []
        : ([
            [T.b1, () => audio.playSe("heartbeat")],
            [T.b2, () => audio.playSe("heartbeat")],
            [T.b3, () => audio.playSe("heartbeat")],
            [T.b4, () => audio.playSe("heartbeat")],
          ] as [number, () => void][])),
      [T.flat, () => audio.playSe("flatline")],
      [T.black, () => setPhase("black")],
      [T.crack, () => (audio.playSe("crack"), setPhase("crack"))],
      [T.card, () => setPhase("card")],
      ...(fast ? ([[T.card + 1500, () => doneRef.current()]] as [number, () => void][]) : []),
    ],
    [id],
  );

  useEffect(() => {
    audio.duck(true);
    return () => audio.duck(false);
  }, []);

  const click = () => {
    if (phase !== "card") {
      stop();
      setPhase("card");
    } else {
      stop();
      doneRef.current();
    }
  };
  const clickRef = useRef(click);
  clickRef.current = click;
  useEffect(() => {
    if (nudge !== nudgeRef.current) {
      nudgeRef.current = nudge;
      clickRef.current();
    }
  }, [nudge]);

  const ch = info ? chapterInfo(info.chapter) : null;
  return (
    <div className={`death-seq ph-${phase}${fast ? " fast" : ""}`} onClick={(e) => (e.stopPropagation(), click())} role="alert" aria-label="사망">
      <div className="death-red" />
      <div className="death-black" />
      <svg className="death-crack" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden>
        <path className="crack-glow" d={crack.main} />
        <path className="crack-line" d={crack.main} pathLength={1} />
        {crack.branches.map((b, i) => (
          <path key={i} className="crack-branch" d={b} pathLength={1} style={{ animationDelay: `${120 + i * 40}ms` }} />
        ))}
      </svg>
      {phase === "card" && (
        <div className="death-card">
          <span className="death-en">DEAD END</span>
          <span className="death-label">사 망</span>
          <span className="death-rule" aria-hidden>
            <i />
            <b />
            <i />
          </span>
          <span className="death-title">{info?.title ?? "이름 없는 죽음"}</span>
          {ch && (
            <span className="death-ch">
              {ch.label} 「{ch.title}」
            </span>
          )}
          {first && <span className="death-new">사망 기록에 새겨졌습니다</span>}
          <span className="death-tap">눌러서 계속</span>
        </div>
      )}
    </div>
  );
}

// ── 되감기 ─────────────────────────────────────
function RushingSand({ run }: { run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const n = Math.round((w < 700 ? 180 : 340) * (reduced ? 0.3 : 1));
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h * 1.4, s: 0.6 + Math.random() * 2, v: 0.4 + Math.random() * 0.9, a: 0.4 + Math.random() * 0.6 }));
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const speed = 160 + Math.min(1, t / 2.2) ** 2 * 1900; // 점점 빨라집니다
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of ps) {
        p.y -= speed * p.v * (1 / 60);
        if (p.y < -30) {
          p.y = h + Math.random() * 60;
          p.x = Math.random() * w;
        }
        const len = Math.max(2, speed * p.v * 0.02);
        const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + len);
        g.addColorStop(0, `rgba(255,236,180,${p.a})`);
        g.addColorStop(1, "rgba(255,190,90,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = p.s;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + len);
        ctx.stroke();
      }
      if (run) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return <canvas ref={ref} className="rewind-sand" aria-hidden />;
}

function ClockFace() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg className="rewind-clock" viewBox="-500 -500 1000 1000" aria-hidden>
      <circle r="470" className="rc-ring" />
      <circle r="440" className="rc-ring thin" />
      <circle r="300" className="rc-ring thin" />
      <g className="rc-dial">
        {ticks.map((i) => (
          <line key={i} x1="0" y1={i % 5 ? -425 : -400} x2="0" y2="-440" transform={`rotate(${i * 6})`} className={i % 5 ? "rc-tick" : "rc-tick big"} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M0 -372 L10 -350 L0 -328 L-10 -350 Z" transform={`rotate(${i * 30})`} className="rc-mark" />
        ))}
        {/* 해와 달의 기호 */}
        <circle cy="-230" r="26" className="rc-sun" />
        <path d="M-18 230 A26 26 0 1 0 18 230 A20 20 0 1 1 -18 230Z" className="rc-moon" />
      </g>
      <g className="rc-hand-h">
        <path d="M-7 30 L0 -230 L7 30 Z" className="rc-hand" />
      </g>
      <g className="rc-hand-m">
        <path d="M-4 40 L0 -380 L4 40 Z" className="rc-hand" />
      </g>
      <circle r="12" className="rc-hub" />
    </svg>
  );
}

export function HourglassGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 64" aria-hidden>
      <path d="M6 3 H34 M6 61 H34" />
      <path d="M9 3 C9 22 31 22 31 32 C31 42 9 42 9 61 M31 3 C31 22 9 22 9 32 C9 42 31 42 31 61" />
      <path className="hg-sand" d="M14 56 Q20 50 26 56 Z M20 30 V44" />
    </svg>
  );
}

export function RewindSequence({ loop, fast, nudge, onDone }: { loop: number; fast: boolean; nudge: number; onDone: () => void }) {
  const [phase, setPhase] = useState<"rush" | "white" | "card">("rush");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const nudgeRef = useRef(nudge);
  const T = fast ? { sand: 0, white: 500, card: 800, done: 1900 } : { sand: 500, white: 2600, card: 3300, done: 6400 };
  const stop = useTimeline(
    [
      [0, () => audio.playSe("rewind")],
      ...(fast ? [] : ([[T.sand, () => audio.playSe("sand")]] as [number, () => void][])),
      [T.white, () => setPhase("white")],
      [T.card, () => setPhase("card")],
      [T.done, () => doneRef.current()],
    ],
    [loop],
  );
  const click = () => {
    stop();
    if (phase === "card") doneRef.current();
    else {
      setPhase("card");
      setTimeout(() => doneRef.current(), fast ? 600 : 1800);
    }
  };
  const clickRef = useRef(click);
  clickRef.current = click;
  useEffect(() => {
    if (nudge !== nudgeRef.current) {
      nudgeRef.current = nudge;
      clickRef.current();
    }
  }, [nudge]);

  return (
    <div className={`rewind-seq ph-${phase}${fast ? " fast" : ""}`} onClick={(e) => (e.stopPropagation(), click())} aria-label="되감기">
      <div className="rewind-bg" />
      <ClockFace />
      <RushingSand run={phase !== "card"} />
      <div className="rewind-white" />
      {phase === "card" && (
        <div className="rewind-card">
          <HourglassGlyph className="rewind-glyph" />
          <span className="rewind-n">
            제 <b>{loop}</b> 회차
          </span>
          <span className="rewind-sub">모래가 거꾸로 흐른다</span>
        </div>
      )}
    </div>
  );
}
