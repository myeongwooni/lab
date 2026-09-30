"use client";

// 모래·재·불씨·비·등불 같은 입자를 캔버스 한 장에 그립니다. 효과가 바뀌면 이전 효과는 서서히 사라집니다.
import { useEffect, useRef } from "react";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number; // 크기
  a: number; // 기본 투명도
  ph: number; // 위상
  r: number; // 회전
  vr: number;
  life?: number;
};

type Emitter = { kind: string; ps: P[]; alpha: number; target: number };

const COUNTS: Record<string, number> = {
  sand: 120,
  ash: 110,
  embers: 70,
  rain: 220,
  lanterns: 26,
  dust: 60,
  sparks: 60,
  petals: 28,
  stars: 70,
  leaves: 26,
};

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function spawn(kind: string, w: number, h: number, initial: boolean): P {
  const y0 = initial ? rnd(0, h) : undefined;
  switch (kind) {
    case "sand": {
      // 위로 떠오르는 금빛 모래. 가끔 큰 알갱이.
      const big = Math.random() < 0.1;
      const s = big ? rnd(1.8, 2.8) : rnd(0.6, 1.6);
      return { x: rnd(0, w), y: y0 ?? rnd(h, h + 40), vx: rnd(-6, 6), vy: -rnd(18, 46) * (big ? 1.3 : 1), s, a: rnd(0.45, 1), ph: rnd(0, 6.28), r: 0, vr: rnd(1.5, 4) };
    }
    case "ash": {
      const s = Math.random() < 0.15 ? rnd(3, 5.5) : rnd(1.2, 3);
      return { x: rnd(-w * 0.1, w * 1.05), y: y0 ?? rnd(-40, -5), vx: rnd(4, 18), vy: s * rnd(7, 12), s, a: rnd(0.35, 0.8), ph: rnd(0, 6.28), r: rnd(0, 6.28), vr: rnd(-1.4, 1.4) };
    }
    case "rain":
      return { x: rnd(-w * 0.1, w * 1.1), y: y0 ?? rnd(-h * 0.3, -10), vx: -120, vy: rnd(900, 1400), s: rnd(12, 26), a: rnd(0.12, 0.32), ph: 0, r: 0, vr: 0 };
    case "petals":
      return { x: rnd(-w * 0.2, w), y: y0 ?? rnd(-60, -10), vx: rnd(18, 50), vy: rnd(22, 48), s: rnd(5, 11), a: rnd(0.55, 0.95), ph: rnd(0, 6.28), r: rnd(0, 6.28), vr: rnd(-1.2, 1.2) };
    case "leaves":
      return { x: rnd(-w * 0.2, w), y: y0 ?? rnd(-60, -10), vx: rnd(24, 70), vy: rnd(30, 60), s: rnd(7, 13), a: rnd(0.7, 1), ph: rnd(0, 6.28), r: rnd(0, 6.28), vr: rnd(-2, 2) };
    case "stars":
      return { x: rnd(0, w), y: rnd(0, h * 0.85), vx: 0, vy: rnd(-6, -2), s: rnd(1.5, 4.2), a: rnd(0.35, 1), ph: rnd(0, 6.28), r: 0, vr: rnd(0.8, 2.4) };
    case "embers":
      return { x: rnd(0, w), y: y0 ?? rnd(h, h + 40), vx: rnd(-10, 10), vy: -rnd(30, 90), s: rnd(1, 3), a: rnd(0.4, 1), ph: rnd(0, 6.28), r: 0, vr: rnd(2, 6) };
    case "sparks": {
      // 술식 불꽃: 화면 가운데 아래쪽에서 튀어 오르며 금방 사라집니다.
      const ang = rnd(-Math.PI * 0.95, -Math.PI * 0.05);
      const sp = rnd(80, 260);
      return { x: rnd(w * 0.2, w * 0.8), y: initial ? rnd(h * 0.2, h * 0.8) : rnd(h * 0.45, h * 0.8), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, s: rnd(1, 2.4), a: rnd(0.6, 1), ph: rnd(0, 6.28), r: 0, vr: 0, life: rnd(0.5, 1.6) };
    }
    case "lanterns": {
      const s = rnd(6, 20);
      return { x: rnd(0, w), y: y0 ?? rnd(h, h + 80), vx: rnd(-4, 4), vy: -s * rnd(1.4, 2.4), s, a: rnd(0.6, 1), ph: rnd(0, 6.28), r: 0, vr: rnd(0.5, 1.2) };
    }
    case "dust":
      return { x: rnd(0, w), y: rnd(0, h), vx: rnd(-6, 6), vy: rnd(-5, 3), s: rnd(0.8, 2.2), a: rnd(0.2, 0.7), ph: rnd(0, 6.28), r: 0, vr: rnd(0.3, 1) };
    default:
      return { x: 0, y: 0, vx: 0, vy: 0, s: 0, a: 0, ph: 0, r: 0, vr: 0 };
  }
}

function draw(ctx: CanvasRenderingContext2D, kind: string, p: P, t: number, k: number) {
  switch (kind) {
    case "sand": {
      const tw = 0.55 + 0.45 * Math.sin(t * p.vr + p.ph);
      ctx.globalAlpha = p.a * tw * k;
      ctx.fillStyle = tw > 0.85 ? "#fff1c4" : "#ffd27a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      if (p.s > 1.8) {
        ctx.globalAlpha = p.a * tw * k * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "ash": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = p.a * k;
      ctx.fillStyle = p.s > 3 ? "#8a8784" : "#c9c4bc";
      ctx.beginPath();
      // 부서진 잿조각: 찌그러진 사각형
      ctx.moveTo(-p.s, -p.s * 0.5);
      ctx.lineTo(p.s * 0.7, -p.s * 0.8);
      ctx.lineTo(p.s, p.s * 0.4);
      ctx.lineTo(-p.s * 0.4, p.s * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "rain": {
      ctx.globalAlpha = p.a * k;
      ctx.strokeStyle = "#c8d6f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.012, p.y - p.s);
      ctx.stroke();
      break;
    }
    case "petals": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(1, Math.abs(Math.cos(t * p.vr + p.ph)) * 0.8 + 0.2);
      ctx.globalAlpha = p.a * k;
      ctx.fillStyle = "#f7f3ea";
      ctx.shadowColor = "rgba(255,240,220,0.8)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "leaves": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(Math.abs(Math.cos(t * 1.3 + p.ph)) * 0.7 + 0.3, 1);
      ctx.globalAlpha = p.a * k;
      const hue = p.ph % 3;
      ctx.fillStyle = hue < 1 ? "#d9772f" : hue < 2 ? "#c9542a" : "#e0a53a";
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.quadraticCurveTo(p.s * 0.8, 0, 0, p.s);
      ctx.quadraticCurveTo(-p.s * 0.8, 0, 0, -p.s);
      ctx.fill();
      ctx.strokeStyle = "rgba(90,40,10,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.lineTo(0, p.s * 1.25);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "stars": {
      const tw = 0.5 + 0.5 * Math.sin(t * p.vr + p.ph);
      ctx.globalAlpha = p.a * tw * k;
      ctx.fillStyle = "#fff4dc";
      const s = p.s * (0.7 + tw * 0.5);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s * 2.2);
      ctx.quadraticCurveTo(p.x, p.y, p.x + s * 2.2, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s * 2.2);
      ctx.quadraticCurveTo(p.x, p.y, p.x - s * 2.2, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s * 2.2);
      ctx.fill();
      ctx.globalAlpha = p.a * tw * k * 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 2.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "embers": {
      const fl = 0.6 + 0.4 * Math.sin(t * p.vr + p.ph);
      ctx.globalAlpha = p.a * fl * k;
      ctx.fillStyle = "#ffb45c";
      ctx.shadowColor = "#ff8a2a";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case "sparks": {
      const life = Math.max(0, Math.min(1, p.life ?? 0));
      ctx.globalAlpha = p.a * life * k;
      ctx.strokeStyle = "#bfe0ff";
      ctx.lineWidth = p.s;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "lanterns": {
      const fl = 0.85 + 0.15 * Math.sin(t * 3 * p.vr + p.ph);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 2.6);
      g.addColorStop(0, `rgba(255,214,140,${0.55 * fl})`);
      g.addColorStop(1, "rgba(255,170,80,0)");
      ctx.globalAlpha = p.a * k;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,${200 + 30 * fl},${130 + 40 * fl},1)`;
      const w = p.s * 0.8;
      const h = p.s;
      ctx.beginPath();
      ctx.moveTo(p.x - w * 0.6, p.y - h * 0.55);
      ctx.lineTo(p.x + w * 0.6, p.y - h * 0.55);
      ctx.lineTo(p.x + w * 0.45, p.y + h * 0.55);
      ctx.lineTo(p.x - w * 0.45, p.y + h * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "dust": {
      const tw = 0.5 + 0.5 * Math.sin(t * p.vr + p.ph);
      ctx.globalAlpha = p.a * tw * k;
      ctx.fillStyle = "#ffe7b8";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

function step(kind: string, p: P, dt: number, t: number) {
  switch (kind) {
    case "sand":
      p.x += (p.vx + Math.sin(t * 0.9 + p.ph) * 10) * dt;
      p.y += p.vy * dt;
      break;
    case "ash":
      p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 12) * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      break;
    case "petals":
      p.x += (p.vx + Math.sin(t * 0.8 + p.ph) * 20) * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      break;
    case "leaves":
      p.x += (p.vx + Math.sin(t * 1.1 + p.ph) * 34) * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      break;
    case "lanterns":
      p.x += (p.vx + Math.sin(t * p.vr + p.ph) * 5) * dt;
      p.y += p.vy * dt;
      break;
    case "sparks":
      p.vy += 160 * dt;
      p.vx *= 1 - dt * 0.8;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life = (p.life ?? 0) - dt;
      break;
    default:
      p.x += p.vx * dt;
      p.y += p.vy * dt;
  }
}

function dead(kind: string, p: P, w: number, h: number) {
  if (kind === "sparks") return (p.life ?? 0) <= 0;
  if (kind === "stars" || kind === "dust") return p.y < -20 || p.x < -20 || p.x > w + 20 || p.y > h + 20;
  return p.y > h + 40 || p.y < -120 || p.x < -w * 0.3 || p.x > w * 1.3;
}

export function Particles({ kind }: { kind: string | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const emitters = useRef<Emitter[]>([]);
  const size = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const list = emitters.current;
    for (const e of list) e.target = e.kind === kind ? 1 : 0;
    if (kind && !list.some((e) => e.kind === kind)) {
      const { w, h } = size.current;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const mobile = w < 700;
      const n = Math.round((COUNTS[kind] ?? 40) * (mobile ? 0.55 : 1) * (reduced ? 0.3 : 1));
      list.push({ kind, ps: Array.from({ length: n }, () => spawn(kind, w || 1600, h || 900, true)), alpha: 0, target: 1 });
    }
  }, [kind]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      size.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const { w, h } = size.current;
      ctx.clearRect(0, 0, w, h);
      const list = emitters.current;
      for (let ei = list.length - 1; ei >= 0; ei--) {
        const e = list[ei];
        e.alpha += (e.target - e.alpha) * Math.min(1, dt * 1.6);
        if (e.target === 0 && e.alpha < 0.01) {
          list.splice(ei, 1);
          continue;
        }
        const kindName = e.kind;
        ctx.globalCompositeOperation = e.kind === "rain" || e.kind === "ash" || e.kind === "leaves" ? "source-over" : "lighter";
        for (let i = e.ps.length - 1; i >= 0; i--) {
          const p = e.ps[i];
          step(kindName, p, dt, t);
          if (dead(kindName, p, w, h)) {
            e.ps[i] = spawn(kindName, w, h, false);
            continue;
          }
          draw(ctx, kindName, p, t, e.alpha);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const vis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return <canvas ref={ref} className="particles" aria-hidden />;
}
