// 도시(루멘하임·성서관·황궁) 배경 15장. 모두 코드로 그린 SVG 문자열입니다.
// 규칙은 docs/art-direction.md 4절을 따릅니다: id·클래스 접두어 `bg-<id>-`, 필터 2개 이하,
// 움직이는 요소 40개 이하(opacity/transform만), 시드 고정 난수, <text> 없음.

type Stop = [number, string, number?];
type Rnd = () => number;

// ───────────────────────── 기본 도구 ─────────────────────────

function mulberry32(seed: number): Rnd {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 숫자를 짧게: 소수 한 자리, 앞의 0 생략 */
function f(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return "0";
  const s = String(r);
  return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? "-" + s.slice(2) : s;
}

/** 0~1 값: 소수 둘째 자리 */
function f2(v: number): string {
  const s = String(Math.round(v * 100) / 100);
  return s.startsWith("0.") ? s.slice(1) : s;
}

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
/** 두 색 사이 보간 */
function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
}
const i0 = (v: number) => String(Math.round(v));
/** 경로 문자열에서 " -" 를 "-" 로 줄이기 */
const rel = (d: string) => d.replace(/ -/g, "-");
const gauss = (r: Rnd) => (r() + r() + r() - 1.5) / 1.5;
const pick = <T,>(r: Rnd, a: readonly T[]): T => a[Math.floor(r() * a.length)];
const pts = (p: [number, number][]) => "M" + p.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join("L") + "Z";

/** 위가 뾰족한 아치(고딕) 창 경로. x=왼쪽, yb=아래, w=폭, yt=꼭대기, k=뾰족함(0.5=반원) */
function arch(x: number, yb: number, w: number, yt: number, k = 0.8): string {
  const r = w * k;
  const rise = Math.sqrt(r * r - (r - w / 2) * (r - w / 2));
  const ys = yt + rise;
  return `M${f(x)} ${f(yb)}V${f(ys)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w / 2)} ${f(yt)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(ys)}V${f(yb)}Z`;
}

class Art {
  defs: string[] = [];
  out: string[] = [];
  moving = 0;
  readonly p: string;
  constructor(p: string) {
    this.p = p;
  }
  id(n: string) {
    return `${this.p}-${n}`;
  }
  u(n: string) {
    return `url(#${this.p}-${n})`;
  }
  private stops(s: Stop[]) {
    return s
      .map(([o, c, a]) => `<stop offset="${f2(o)}" stop-color="${c}"${a === undefined || a === 1 ? "" : ` stop-opacity="${f2(a)}"`}/>`)
      .join("");
  }
  lin(n: string, x1: number, y1: number, x2: number, y2: number, s: Stop[], user = false) {
    const un = user ? ' gradientUnits="userSpaceOnUse"' : "";
    this.defs.push(`<linearGradient id="${this.id(n)}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${un}>${this.stops(s)}</linearGradient>`);
    return this.u(n);
  }
  rad(n: string, s: Stop[], extra = "") {
    this.defs.push(`<radialGradient id="${this.id(n)}"${extra ? " " + extra : ""}>${this.stops(s)}</radialGradient>`);
    return this.u(n);
  }
  /** 가운데 불투명 → 가장자리 투명인 빛번짐 그라데이션 */
  glowG(n: string, c: string, core = "") {
    const s: Stop[] = [[0, core || c, 1], [0.14, c, 0.7], [0.4, c, 0.26], [0.7, c, 0.06], [1, c, 0]];
    return this.rad(n, s);
  }
  blur(n: string, sd: number) {
    this.defs.push(`<filter id="${this.id(n)}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    return this.u(n);
  }
  clip(n: string, d: string) {
    this.defs.push(`<clipPath id="${this.id(n)}"><path d="${d}"/></clipPath>`);
    return this.u(n);
  }
  add(...s: string[]) {
    this.out.push(...s);
  }
  /** 움직이는 요소용 속성 문자열 */
  a(cls: "tw" | "fl" | "dr" | "sh" | "br", delay: number, dur?: number) {
    this.moving++;
    return `class="${this.p}-${cls}" style="animation-delay:${f(-delay)}s${dur ? `;animation-duration:${f(dur)}s` : ""}"`;
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string, op = 1, extra = "") {
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${op !== 1 ? ` opacity="${f2(op)}"` : ""}${extra ? " " + extra : ""}/>`;
  }
  rect(x: number, y: number, w: number, h: number, fill: string, extra = "") {
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra ? " " + extra : ""}/>`;
  }
  path(d: string, fill: string, extra = "") {
    return `<path d="${d}" fill="${fill}"${extra ? " " + extra : ""}/>`;
  }
  svg() {
    const p = this.p;
    const css =
      `.${p}-tw,.${p}-fl,.${p}-dr,.${p}-sh,.${p}-br{transform-box:fill-box;transform-origin:center}` +
      `.${p}-tw{animation:${p}-tw 5s ease-in-out infinite}` +
      `.${p}-fl{animation:${p}-fl 2.8s ease-in-out infinite}` +
      `.${p}-dr{animation:${p}-dr 14s linear infinite}` +
      `.${p}-sh{animation:${p}-sh 7s ease-in-out infinite}` +
      `.${p}-br{animation:${p}-br 9s ease-in-out infinite}` +
      `@keyframes ${p}-tw{0%,100%{opacity:1}50%{opacity:.2}}` +
      `@keyframes ${p}-fl{0%,100%{opacity:1;transform:scale(1)}18%{opacity:.8;transform:scale(.95)}42%{opacity:.96;transform:scale(1.03)}66%{opacity:.84;transform:scale(.97)}}` +
      `@keyframes ${p}-dr{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}80%{opacity:.85}100%{opacity:0;transform:translate(10px,-110px)}}` +
      `@keyframes ${p}-sh{0%,100%{opacity:.3;transform:translateX(0)}50%{opacity:1;transform:translateX(12px)}}` +
      `@keyframes ${p}-br{0%,100%{opacity:.6}50%{opacity:1}}` +
      `@media (prefers-reduced-motion:reduce){.${p}-tw,.${p}-fl,.${p}-dr,.${p}-sh,.${p}-br{animation:none}}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${this.defs.join("")}</defs><style>${css}</style>${this.out.join("")}</svg>`;
  }
}

// ───────────────────────── 공용 모티프 ─────────────────────────

/** 점 여러 개를 한 경로로 (둥근 끝 0길이 선분 = 점) */
function dots(list: [number, number][], color: string, size: number, op = 1) {
  if (!list.length) return "";
  const d = list.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h0`).join("");
  return `<path d="${d}" stroke="${color}" stroke-width="${f(size)}" stroke-linecap="round" fill="none"${op !== 1 ? ` opacity="${op}"` : ""}/>`;
}

/** 세로 선분 목록 [x, y0, y1]을 상대 좌표 경로로 짧게 */
function vsegs(list: [number, number, number][]): string {
  let d = "", px = 0, py = 0;
  list.forEach(([x, y0, y1], i) => {
    d += i ? `m${f(x - px)} ${f(y0 - py)}` : `M${f(x)} ${f(y0)}`;
    d += `v${f(y1 - y0)}`;
    px = x; py = y1;
  });
  return d.replace(/ -/g, "-");
}

/** 흩어진 별밭. region 안에서, 아래로 갈수록 드물게 */
function starField(r: Rnd, n: number, x0: number, y0: number, x1: number, y1: number, color = "#dfe6ff", op = 1) {
  const s: [number, number][][] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.6);
    const x = x0 + r() * (x1 - x0), y = y0 + t * (y1 - y0);
    const k = r();
    s[k < 0.72 ? 0 : k < 0.94 ? 1 : 2].push([x, y]);
  }
  return dots(s[0], color, 1.3, 0.55 * op) + dots(s[1], color, 2, 0.8 * op) + dots(s[2], "#ffffff", 2.8, op);
}

interface RingOpt {
  cx: number; cy: number; R: number; a0: number; a1: number; w: number; n: number; op?: number; twinkle?: number; seed?: number; box?: [number, number, number, number]; dense?: number;
}
/** 천환: 비스듬한 은빛 별의 띠 (원호) */
function ring(A: Art, o: RingOpt, blurUrl: string) {
  const r = mulberry32(o.seed ?? 77);
  const op = o.op ?? 1;
  const P = (t: number) => o.a0 + (o.a1 - o.a0) * t;
  const xy = (a: number, d: number): [number, number] => [o.cx + (o.R + d) * Math.cos(a), o.cy + (o.R + d) * Math.sin(a)];
  const arcD = (d: number) => {
    const [x0, y0] = xy(o.a0, d), [x1, y1] = xy(o.a1, d);
    return `M${f(x0)} ${f(y0)}A${f(o.R + d)} ${f(o.R + d)} 0 0 ${o.a1 > o.a0 ? 1 : 0} ${f(x1)} ${f(y1)}`;
  };
  const g = A.lin("ringband", 0, 0, 1, 0, [[0, "#b9c6f2", 0], [0.2, "#c8d4ff", 1], [0.55, "#e4e8ff", 1], [0.85, "#b9c6f2", 1], [1, "#b9c6f2", 0]]);
  let s = `<g opacity="${op}">`;
  s += `<g filter="${blurUrl}" fill="none" stroke-linecap="round">`;
  s += `<path d="${arcD(0)}" stroke="${g}" stroke-width="${f(o.w * 2.6)}" opacity=".1"/>`;
  s += `<path d="${arcD(0)}" stroke="${g}" stroke-width="${f(o.w * 1.3)}" opacity=".17"/>`;
  s += `<path d="${arcD(o.w * 0.05)}" stroke="${g}" stroke-width="${f(o.w * 0.45)}" opacity=".26"/>`;
  s += `<path d="${arcD(-o.w * 0.18)}" stroke="#070a1c" stroke-width="${f(o.w * 0.12)}" opacity=".35"/>`;
  s += `</g>`;
  // 별 무늬 타일 세 벌을 굵은 호의 선 채우기로: 수천 개의 별을 싸게
  const tiles: [number, number, string][] = [[97, 70, "a"], [131, 110, "b"], [173, 150, "c"]];
  for (const [sz, n, k] of tiles) {
    if (A.defs.some((d) => d.includes(`id="${A.id("st" + k)}"`))) continue;
    const L: [number, number][][] = [[], [], []];
    for (let i = 0; i < n * (o.dense ?? 1); i++) L[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0].push([r() * sz, r() * sz]);
    A.defs.push(`<pattern id="${A.id("st" + k)}" width="${sz}" height="${sz}" patternUnits="userSpaceOnUse">${dots(L[0], "#c8d4ff", 1.1, 0.7)}${dots(L[1], "#e4eaff", 1.6, 0.85)}${dots(L[2], "#ffffff", 2.2)}</pattern>`);
  }
  const kn = A.glowG("knot", "#c8d4ff", "#eef2ff");
  for (let i = 0; i < (o.box ? 0 : 7); i++) {
    const t = 0.12 + 0.76 * ((i + r() * 0.6) / 7);
    const [x, y] = xy(P(t), gauss(r) * o.w * 0.15);
    const rr = o.w * (0.5 + r() * 0.6);
    s += A.ell(x, y, rr * 1.4, rr * 0.8, kn, 0.1 + r() * 0.08, `transform="rotate(${f((P(t) * 180) / Math.PI + 90)} ${f(x)} ${f(y)})"`);
  }
  s += `<g fill="none">`;
  s += `<path d="${arcD(0)}" stroke="${A.u("sta")}" stroke-width="${f(o.w * 1.5)}" opacity=".45"/>`;
  s += `<path d="${arcD(o.w * 0.05)}" stroke="${A.u("stb")}" stroke-width="${f(o.w * 0.95)}" opacity=".75"/>`;
  s += `<path d="${arcD(-o.w * 0.04)}" stroke="${A.u("stc")}" stroke-width="${f(o.w * 0.55)}"/>`;
  s += `<path d="${arcD(o.w * 0.12)}" stroke="${A.u("sta")}" stroke-width="${f(o.w * 0.3)}"/>`;
  s += `</g>`;
  const L: [number, number][][] = [[], [], [], []];
  for (let i = 0; i < o.n; i++) {
    const t = r();
    const edge = Math.min(t, 1 - t);
    if (edge < 0.12 && r() > edge / 0.12) continue;
    const d = gauss(r) * o.w * 0.55;
    const [x, y] = xy(P(t), d);
    const k = r();
    const bx = o.box ?? [0, 0, 1600, 900];
    if (x < bx[0] || y < bx[1] || x > bx[2] || y > bx[3]) continue;
    L[k < 0.6 ? 0 : k < 0.88 ? 1 : k < 0.97 ? 2 : 3].push([x, y]);
  }
  s += dots(L[0], "#c8d4ff", 1.1, 0.6) + dots(L[1], "#dfe6ff", 1.6, 0.75) + dots(L[2], "#f4f6ff", 2.3, 0.9) + dots(L[3], "#fff", 3, 1);
  const gl = A.glowG("ringstar", "#dfe8ff", "#ffffff");
  const tw = o.twinkle ?? 9;
  for (let i = 0; i < tw; i++) {
    const t = 0.1 + 0.8 * (i + r() * 0.8) / tw;
    const [x, y] = xy(P(t), gauss(r) * o.w * 0.3);
    const rr = 7 + r() * 9;
    s += `<g ${A.a("tw", r() * 5, 3.5 + r() * 4)}>${A.ell(x, y, rr, rr, gl)}<path d="M${f(x - rr * 0.9)} ${f(y)}H${f(x + rr * 0.9)}M${f(x)} ${f(y - rr * 1.3)}V${f(y + rr * 1.3)}" stroke="#fff" stroke-width=".7" opacity=".7"/></g>`;
  }
  s += `</g>`;
  return s;
}

/** 촛불: 몸통 + 불꽃 + 흔들리는 빛번짐 */
function candle(A: Art, x: number, y: number, h: number, sc: number, glowUrl: string, r: Rnd, glowR = 90) {
  const w = 7 * sc;
  let s = A.ell(x, y - h - 10 * sc, glowR * sc, glowR * sc * 0.9, glowUrl, 0.55, A.a("fl", r() * 3, 2.2 + r() * 1.6));
  s += `<rect x="${f(x - w / 2)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="#e9dcc3"/>`;
  s += `<rect x="${f(x - w / 2)}" y="${f(y - h)}" width="${f(w * 0.35)}" height="${f(h)}" fill="#fff6e0" opacity=".7"/>`;
  const fh = 15 * sc, fw = 4.2 * sc, fy = y - h - 2 * sc;
  s += `<path d="M${f(x)} ${f(fy - fh)}C${f(x + fw)} ${f(fy - fh * 0.45)} ${f(x + fw)} ${f(fy)} ${f(x)} ${f(fy)}C${f(x - fw)} ${f(fy)} ${f(x - fw)} ${f(fy - fh * 0.45)} ${f(x)} ${f(fy - fh)}Z" fill="#ffe7a8"/>`;
  s += A.ell(x, fy - fh * 0.28, fw * 0.45, fh * 0.26, "#fffdf2");
  return s;
}

// ───────────────────────── 성서관 대열람실 ─────────────────────────

function archive(night: boolean): string {
  const A = new Art(night ? "bg-archive_night" : "bg-archive");
  const r = mulberry32(night ? 202 : 101);
  const VX = 800, VY = 440, F = 620;
  const X = (x: number, z: number) => VX + (x * F) / z;
  const Y = (y: number, z: number) => VY + (y * F) / z;
  const W = 3.1, FLOOR = 1.7, ZF = 10.5;
  const C = night
    ? {
        haze: "#1c2a64", far: "#18214d", lit: "#3c4c92", shade: "#0b1030", wood: "#0a0d24", floorN: "#060919", floorF: "#1a2456",
        light: "#b8cdff", lightCore: "#eef3ff", books: ["#2a2350", "#1c2a4f", "#2c2440", "#18304a", "#322a4e", "#1f2045"], top: "#05081a",
      }
    : {
        haze: "#ead8b6", far: "#e7dcc6", lit: "#dccdb6", shade: "#675c68", wood: "#2a1f22", floorN: "#4a403f", floorF: "#dcc9a6",
        light: "#ffe9b8", lightCore: "#fffbef", books: ["#6e3230", "#34425f", "#5f4e30", "#2a463f", "#7a5c3e", "#4e2b40"], top: "#6d6270",
      };
  const hz = (c: string, z: number, k = 1) => mix(c, C.haze, Math.min(0.92, Math.pow((z - 2) / (ZF - 2), 1.1) * 0.8 * k));
  const blur = A.blur("soft", 14);

  // 뒷벽 + 창 너머 하늘
  const fx0 = X(-W, ZF), fx1 = X(W, ZF), fyb = Y(FLOOR, ZF);
  A.add(A.rect(0, 0, 1600, 900, A.lin("bgv", 0, 0, 0, 1, [[0, C.top], [0.5, hz(C.far, 9)], [1, C.floorN]])));
  const farG = A.lin("farw", 0, 0, 0, 1, night ? [[0, "#0f1640"], [0.6, "#1d2a60"], [1, "#27336e"]] : [[0, "#c9c0b8"], [0.55, "#ece2cc"], [1, "#f4ead6"]]);
  A.add(A.rect(fx0 - 2, -2, fx1 - fx0 + 4, fyb + 2, farG));

  // 창 세 개 (가운데 큰 창)
  const wins: { x0: number; x1: number; yb: number; yt: number }[] = [
    { x0: X(-0.95, ZF), x1: X(0.95, ZF), yb: Y(0.55, ZF), yt: 36 },
    { x0: X(-2.45, ZF), x1: X(-1.55, ZF), yb: Y(0.7, ZF), yt: 150 },
    { x0: X(1.55, ZF), x1: X(2.45, ZF), yb: Y(0.7, ZF), yt: 150 },
  ];
  const skyG = night
    ? A.lin("wsky", 0, 0, 0, 1, [[0, "#0a1236"], [0.55, "#1d2d6e"], [1, "#3a4f9a"]])
    : A.lin("wsky", 0, 0, 0, 1, [[0, "#fff6dc"], [0.6, "#fffaf0"], [1, "#fff1cf"]]);
  const winClip = A.clip("win", wins.map((w) => arch(w.x0, w.yb, w.x1 - w.x0, w.yt, 0.75)).join(""));
  let inside = A.rect(fx0, 0, fx1 - fx0, fyb, skyG);
  if (night) {
    inside += ring(A, { cx: 1500, cy: 1100, R: 1080, a0: Math.PI * 1.12, a1: Math.PI * 1.5, w: 70, n: 60, op: 1, twinkle: 2, seed: 9, dense: 0.45, box: [700, 30, 900, 500] }, blur);
    inside += starField(r, 60, fx0, 0, fx1, fyb, "#dfe6ff", 0.8);
    const mg = A.glowG("moon", "#dfe8ff", "#ffffff");
    inside += A.ell(800, 131, 130, 130, mg, 0.6) + `<circle cx="800" cy="131" r="24" fill="#f4f6ff"/>`;
  }
  A.add(`<g clip-path="${winClip}">${inside}</g>`);
  // 창살(트레이서리)
  const mull = night ? "#0e1538" : "#cdbfa8";
  for (const w of wins) {
    const ww = w.x1 - w.x0;
    const n = ww > 100 ? 3 : 1;
    let d = "";
    for (let i = 1; i <= n; i++) {
      const x = w.x0 + (ww * i) / (n + 1);
      d += `M${f(x)} ${f(w.yb)}V${f(w.yt + ww * 0.55)}`;
    }
    for (let yy = w.yb - 40; yy > w.yt + ww * 0.6; yy -= ww > 100 ? 62 : 48) d += `M${f(w.x0)} ${f(yy)}H${f(w.x1)}`;
    A.add(`<path d="${d}" stroke="${mull}" stroke-width="${ww > 100 ? 3.5 : 2.5}" opacity="${night ? 0.95 : 0.55}"/>`);
    if (ww > 100) {
      const cx = w.x0 + ww / 2, cy = w.yt + ww * 0.42;
      A.add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(ww * 0.2)}" fill="none" stroke="${mull}" stroke-width="3" opacity="${night ? 0.95 : 0.55}"/>`);
      A.add(`<path d="M${f(cx - ww * 0.2)} ${f(cy)}H${f(cx + ww * 0.2)}M${f(cx)} ${f(cy - ww * 0.2)}V${f(cy + ww * 0.2)}" stroke="${mull}" stroke-width="2" opacity="${night ? 0.9 : 0.5}"/>`);
    }
    A.add(`<path d="${arch(w.x0 - 6, w.yb + 4, ww + 12, w.yt - 8, 0.75)}" fill="none" stroke="${night ? "#2a3977" : "#fff8ea"}" stroke-width="5" opacity=".6"/>`);
  }

  // 창 빛번짐
  const lg = A.glowG("wlight", C.light, C.lightCore);
  A.add(A.ell(800, 250, 420, 330, lg, night ? 0.35 : 0.85));

  // 바닥
  const floorG = A.lin("floor", 0, 0, 0, 1, [[0, C.floorF], [0.35, mix(C.floorF, C.floorN, 0.5)], [1, C.floorN]]);
  A.add(A.path(pts([[X(-W, ZF), fyb], [X(W, ZF), fyb], [X(W, 1.2), Y(FLOOR, 1.2)], [X(-W, 1.2), Y(FLOOR, 1.2)]]), floorG));
  // 바닥 타일선
  let tl = "";
  for (let i = -6; i <= 6; i++) tl += `M${Math.round(X(i * 0.5, ZF))} ${Math.round(fyb)}L${Math.round(X(i * 0.5, 1.4))} ${Math.round(Y(FLOOR, 1.4))}`;
  for (let z = ZF; z > 1.5; z /= 1.16) tl += `M${Math.round(X(-W, z))} ${Math.round(Y(FLOOR, z))}H${Math.round(X(W, z))}`;
  if (!night) A.add(`<path d="${tl}" stroke="${night ? "#3a4c96" : "#fff6e2"}" stroke-width="1.2" fill="none" opacity="${night ? 0.25 : 0.35}"/>`);
  // 창의 반사 (바닥에 길게)
  const reflG = A.lin("refl", 0, 0, 0, 1, [[0, C.lightCore, 0.8], [0.4, C.light, 0.35], [1, C.light, 0]]);
  A.add(`<path d="${pts([[X(-0.9, ZF), fyb], [X(0.9, ZF), fyb], [X(1.5, 3), Y(FLOOR, 3)], [X(-1.5, 3), Y(FLOOR, 3)]])}" fill="${reflG}" opacity="${night ? 0.35 : 0.55}" filter="${blur}"/>`);

  // 옆벽: 서가 칸. 책 세 줄짜리 기둥 틀을 만들어 깊이마다 늘여 붙입니다.
  const ZS = [2.05, 2.75, 3.6, 4.7, 6.1, 7.9, ZF];
  const shelfH = 0.46;
  const topY = -8.2;
  const nT = 3;
  for (let t = 0; t < nT + 2; t++) {
    const nc = t < nT ? 3 : 1;
    const groups: [number, number, number][][] = C.books.map(() => []);
    for (let c = 0; c < nc; c++) {
      for (let y = FLOOR - 0.06; y - shelfH > topY; y -= shelfH) {
        if (r() < 0.07) continue;
        const bh = shelfH * (0.6 + r() * 0.32);
        groups[Math.floor(r() * groups.length)].push([c + 0.5, Math.round(y * 100), Math.round((y - bh) * 100)]);
      }
    }
    A.defs.push(`<g id="${A.id("bc" + t)}" stroke-width=".86">${groups.map((g, i) => `<path d="${vsegs(g)}" stroke="${C.books[i]}"/>`).join("")}</g>`);
  }
  const hzAmt = (z: number) => Math.min(0.9, Math.pow((z - 2) / (ZF - 2), 1.1) * 0.82);
  const pw = 0.2, pd = 0.3;
  for (const side of [-1, 1]) {
    for (let b = ZS.length - 2; b >= 0; b--) {
      const z0 = ZS[b], z1 = ZS[b + 1];
      const zm = (z0 + z1) / 2;
      const xa = X(side * W, z0), xb = X(side * W, z1);
      const bay = pts([[xa, Y(topY, z0)], [xb, Y(topY, z1)], [xb, Y(FLOOR, z1)], [xa, Y(FLOOR, z0)]]);
      A.add(A.path(bay, C.wood));
      let uses = "";
      const near = z0 < 3.5;
      for (let z = z0 + pw; z < z1 - pw * 0.5; z += near ? 0.12 : 0.36) {
        const cw = ((W * F) / (z * z)) * 0.12;
        uses += `<use href="#${A.id("bc" + (near ? nT + Math.floor(r() * 2) : Math.floor(r() * nT)))}" transform="matrix(${f(-side * cw)} 0 0 ${(F / z / 100).toFixed(3).replace(/^0/, "")} ${i0(X(side * W, z))} ${VY})"/>`;
      }
      A.add(uses);
      let sh = "";
      for (let y = FLOOR - 0.06; y > topY; y -= shelfH) if (Y(y, z1) > 0) sh += `M${Math.round(xa)} ${Math.round(Y(y, z0))}L${Math.round(xb)} ${Math.round(Y(y, z1))}`;
      A.add(`<path d="${sh}" stroke="${night ? "#2b376e" : "#e2d6c0"}" stroke-width="${f(Math.max(1, (0.05 * F) / zm))}" fill="none"/>`);
      // 칸마다 대기 원근 (멀수록 안개색)
      A.add(A.path(bay, C.haze, `opacity="${Math.round(hzAmt(zm) * 100) / 100}"`));
      if (zm < 4.2) A.add(A.path(bay, night ? "#03040e" : "#231a22", `opacity="${f((4.2 - zm) * 0.32)}"`));
      // 기둥 (대리석): 정면은 창을 등져 그늘, 복도 쪽 면은 창빛을 받음
      const zf = z0 - pw;
      const px0 = X(side * W, zf), px1 = X(side * (W - pd), zf);
      const yb = Y(FLOOR, zf);
      A.add(A.rect(Math.min(px0, px1), -2, Math.abs(px1 - px0), yb + 2, hz(C.shade, zf)));
      const ix1 = X(side * (W - pd), z0 + pw);
      A.add(A.path(pts([[px1, -2], [ix1, -2], [ix1, Y(FLOOR, z0 + pw)], [px1, yb]]), hz(C.lit, zf)));
      const fw = Math.abs(px1 - px0);
      let fl = "";
      for (const k of [0.35, 0.7]) fl += `M${f(px0 + (px1 - px0) * k)} -2V${f(yb)}`;
      if (zf < 4) A.add(A.path(pts([[px0, -2], [ix1, -2], [ix1, Y(FLOOR, z0 + pw)], [px0, yb]]), night ? "#03040e" : "#231a22", `opacity="${f((4 - zf) * 0.3)}"`));
      A.add(`<path d="${fl}" stroke="${hz(night ? "#27336e" : "#b3adb5", zf)}" stroke-width="${f(Math.max(1, fw * 0.05))}" opacity=".6"/>`);
      A.add(`<path d="M${f(px1)} -2V${f(yb)}" stroke="${night ? "#9fb4ff" : "#fffaf0"}" stroke-width="${f(Math.max(1.2, 12 / z0))}" opacity="${night ? 0.5 : 0.85}"/>`);
      const baseY = Y(FLOOR - 0.4, zf);
      A.add(A.rect(Math.min(px0, px1) - fw * 0.08, baseY, fw * 1.16, yb - baseY, hz(night ? "#1a2356" : "#a8a2a8", zf)));
      A.add(A.rect(Math.min(px0, px1) - fw * 0.08, baseY, fw * 1.16, Math.max(1, 6 / zf), hz(night ? "#4a5ca8" : "#f4ecdf", zf)));
    }
    // 회랑(발코니) 난간
    for (const gy of [-1.6, -4.4]) {
      const za = 2.0, zb = ZF;
      const ex = side * (W - 0.55);
      A.add(A.path(pts([[X(side * W, za), Y(gy, za)], [X(ex, za), Y(gy, za)], [X(ex, zb), Y(gy, zb)], [X(side * W, zb), Y(gy, zb)]]), night ? "#080c26" : "#6a5f68"));
      A.add(A.path(pts([[X(ex, za), Y(gy, za)], [X(ex, zb), Y(gy, zb)], [X(ex, zb), Y(gy + 0.18, zb)], [X(ex, za), Y(gy + 0.18, za)]]), night ? "#3b4a8a" : "#e6d6bc"));
      let bl = "";
      for (let z = za; z < zb; z *= 1.1) if (Y(gy, z) > 0) bl += `M${Math.round(X(ex, z))} ${Math.round(Y(gy, z))}V${Math.round(Y(gy - 0.55, z))}`;
      bl += `M${f(X(ex, za))} ${f(Y(gy - 0.55, za))}L${f(X(ex, zb))} ${f(Y(gy - 0.55, zb))}`;
      A.add(`<path d="${bl}" stroke="${night ? "#34427f" : "#efe5d2"}" stroke-width="2.2" fill="none" opacity=".85"/>`);
    }
  }

  // 열람 탁자
  const tables: [number, number, number, number][] = [
    [-2.25, -0.85, 4.2, 6.2], [0.85, 2.25, 4.2, 6.2], [-2.25, -0.85, 7.0, 8.8], [0.85, 2.25, 7.0, 8.8],
  ];
  const cg = A.glowG("cand", "#f6c878", "#fff1c4");
  const tops = A.lin("ttop", 0, 0, 0, 1, night ? [[0, "#3a2c3a"], [1, "#1a1426"]] : [[0, "#8a6a52"], [1, "#5a4034"]]);
  for (const [x0, x1, z0, z1] of tables.slice().sort((a, b) => b[2] - a[2])) {
    const ty = 0.95;
    const zm = (z0 + z1) / 2;
    const top = pts([[X(x0, z1), Y(ty, z1)], [X(x1, z1), Y(ty, z1)], [X(x1, z0), Y(ty, z0)], [X(x0, z0), Y(ty, z0)]]);
    const fr = hz(night ? "#0b0a1a" : "#3a2a26", zm, 0.7);
    // 다리
    let legs = "";
    for (const [lx, lz] of [[x0 + 0.1, z0], [x1 - 0.1, z0], [x0 + 0.1, z1], [x1 - 0.1, z1]] as [number, number][])
      legs += `M${f(X(lx, lz))} ${f(Y(ty, lz))}V${f(Y(FLOOR, lz))}`;
    A.add(`<path d="${legs}" stroke="${fr}" stroke-width="${f(60 / zm)}"/>`);
    // 그림자
    A.add(A.path(pts([[X(x0, z1), Y(FLOOR, z1)], [X(x1, z1), Y(FLOOR, z1)], [X(x1 + 0.2, z0), Y(FLOOR, z0)], [X(x0 - 0.2, z0), Y(FLOOR, z0)]]), "#000", `opacity="${night ? 0.35 : 0.18}"`));
    A.add(A.path(top, tops));
    A.add(A.path(pts([[X(x0, z0), Y(ty, z0)], [X(x1, z0), Y(ty, z0)], [X(x1, z0), Y(ty + 0.1, z0)], [X(x0, z0), Y(ty + 0.1, z0)]]), fr));
    A.add(`<path d="M${f(X(x0, z0))} ${f(Y(ty, z0))}H${f(X(x1, z0))}" stroke="${night ? "#f0c070" : "#fff0d2"}" stroke-width="1.2" opacity="${night ? 0.4 : 0.6}"/>`);
    // 책더미·펼친 책
    const bz = z0 + 0.4, bx = (x0 + x1) / 2 + (r() - 0.5) * 0.4;
    A.add(A.path(pts([[X(bx - 0.25, bz + 0.2), Y(ty - 0.01, bz + 0.2)], [X(bx + 0.25, bz + 0.2), Y(ty - 0.01, bz + 0.2)], [X(bx + 0.28, bz), Y(ty - 0.01, bz)], [X(bx - 0.28, bz), Y(ty - 0.01, bz)]]), night ? "#8a8fb8" : "#f7f0e0"));
    if (night) {
      const cx = X(x0 + (x1 - x0) * (x0 < 0 ? 0.8 : 0.2), zm), cy = Y(ty, zm);
      A.add(A.ell(cx, cy + 2, 700 / zm, 150 / zm, cg, 0.75));
      A.add(candle(A, cx, cy, 90 / zm, 3.2 / zm, cg, r, 260));
    } else {
      let st = "";
      const sx = X(x0 + (x1 - x0) * 0.8, z0 + 0.3), sy = Y(ty, z0 + 0.3);
      for (let i = 0; i < 4; i++) st += A.rect(sx - 20 / zm * 3 + r() * 4, sy - (i + 1) * 12 / zm * 2.2, 40 / zm * 3, 11 / zm * 2.2, pick(r, C.books));
      A.add(st);
    }
  }

  // 실내 음영: 창을 중심으로 바깥이 어두워지게 (빛줄기가 보이도록)
  A.add(A.rect(0, 0, 1600, 900, A.rad("dim", [[0, "#000", 0], [0.28, "#000", 0], [1, night ? "#02030c" : "#2b2130", night ? 0.7 : 0.6]], 'cx=".5" cy=".3" r=".62" fx=".5" fy=".26"')));
  // 빛줄기 (갓빛)
  const rayG = A.lin("ray", 0, 0, 0, 1, [[0, C.lightCore, 0.9], [0.5, C.light, 0.45], [1, C.light, 0]]);
  let rays = "";
  const sunDX = night ? 0.9 : -0.7;
  for (const w of wins) {
    const ww = w.x1 - w.x0;
    const cx = (w.x0 + w.x1) / 2;
    const Xc = ((cx - VX) * ZF) / F;
    const hw = ((ww / 2) * ZF) / F;
    const zn = ww > 100 ? 3.3 : 4.6;
    const a = [w.x0 + 4, w.yt + ww * 0.4], b = [w.x1 - 4, w.yt + ww * 0.4];
    const c2 = [X(Xc + hw * 1.3 + sunDX, zn), Y(FLOOR, zn)], d2 = [X(Xc - hw * 1.3 + sunDX, zn), Y(FLOOR, zn)];
    rays += `<path d="${pts([a as [number, number], b as [number, number], c2 as [number, number], d2 as [number, number]])}" fill="${rayG}" opacity="${(ww > 100 ? 0.5 : 0.36) * (night ? 0.8 : 1)}"/>`;
    // 바닥 빛 웅덩이
    const pz0 = ZF * 0.62;
    rays += `<path d="${pts([[X(Xc - hw + sunDX * 0.6, pz0), Y(FLOOR, pz0)], [X(Xc + hw + sunDX * 0.6, pz0), Y(FLOOR, pz0)], c2 as [number, number], d2 as [number, number]])}" fill="${C.lightCore}" opacity="${night ? 0.2 : 0.5}"/>`;
  }
  A.add(`<g filter="${blur}">${rays}</g>`);

  A.add(A.ell(800, 250, 300, 260, lg, night ? 0.25 : 0.6));
  // 공중 먼지 (정적 + 반짝임 몇 개)
  const dust: [number, number][] = [];
  for (let i = 0; i < (night ? 36 : 110); i++) dust.push([640 + gauss(r) * 260, 180 + r() * 480]);
  A.add(dots(dust, C.lightCore, 1.6, night ? 0.35 : 0.6));
  const dg = A.glowG("dust", C.lightCore, "#ffffff");
  for (let i = 0; i < (night ? 8 : 14); i++) {
    const x = 600 + gauss(r) * 260, y = 200 + r() * 380, rr = 3 + r() * 4;
    A.add(A.ell(x, y, rr, rr, dg, 1, A.a(i % 3 ? "tw" : "dr", r() * 12, i % 3 ? 3 + r() * 4 : 16 + r() * 8)));
  }

  // 전경: 가장 가까운 기둥 테두리 어둡게 + 비네트 + 아래 30% 가라앉히기
  const vg = A.rad("vig", [[0, "#000", 0], [0.6, "#000", 0], [1, night ? "#02030c" : "#2a2230", night ? 0.75 : 0.45]], 'cx=".5" cy=".42" r=".75"');
  A.add(A.rect(0, 0, 1600, 900, vg));
  A.add(A.rect(0, 560, 1600, 340, A.lin("low", 0, 0, 0, 1, [[0, C.floorN, 0], [1, night ? "#03050f" : "#2a2230", night ? 0.7 : 0.45]])));
  return A.svg();
}

// ───────────────────────── 도시 도구 ─────────────────────────

interface RowOpt {
  name: string; seed: number; x0: number; x1: number; base: (x: number) => number;
  hMin: number; hMax: number; wMin: number; wMax: number;
  top: string; bottom: string; win?: number; ws?: number; spire?: number; rim?: string; rimOp?: number;
  winC?: string; snow?: string; lights?: [number, number][];
}
/** 지붕 줄 하나: 박공지붕·첨탑·굴뚝 + 불 켜진 창 + 달빛 테두리 */
function cityRow(A: Art, o: RowOpt): string {
  const r = mulberry32(o.seed);
  let body = "", rim = "", snow = "", w1 = "", w2 = "";
  let yMin = 900, yMax = 0;
  const ws = o.ws ?? 3;
  for (let x = o.x0; x < o.x1; ) {
    const w = o.wMin + r() * (o.wMax - o.wMin);
    const b = o.base(x + w / 2) + 4;
    let h = o.hMin + r() * (o.hMax - o.hMin);
    const kind = r();
    const tower = kind < (o.spire ?? 0.08);
    const tw = tower ? w * 0.45 : w;
    const tx = tower ? x + (w - tw) / 2 : x;
    if (tower) h *= 1.5;
    const yt = b - h;
    const rh = tower ? tw * (2.2 + r() * 1.2) : w * (0.35 + r() * 0.5);
    const apex = yt - rh;
    yMin = Math.min(yMin, apex);
    yMax = Math.max(yMax, b);
    if (tower) {
      body += rel(`M${i0(tx)} ${i0(b)}v${i0(-h)}h${i0(-tw * 0.12)}l${i0(tw * 0.62)} ${i0(-rh)}l${i0(tw * 0.62)} ${i0(rh)}h${i0(-tw * 0.12)}v${i0(h)}z`);
      rim += `M${i0(tx - tw * 0.12)} ${i0(yt)}L${i0(tx + tw / 2)} ${i0(apex)}`;
    } else {
      const ov = w * 0.06;
      body += rel(`M${i0(x)} ${i0(b)}v${i0(-h)}h${i0(-ov)}l${i0(w / 2 + ov)} ${i0(-rh)}l${i0(w / 2 + ov)} ${i0(rh)}h${i0(-ov)}v${i0(h)}z`);
      rim += `M${i0(x - ov)} ${i0(yt)}L${i0(x + w / 2)} ${i0(apex)}`;
      if (o.snow) snow += `M${i0(x - ov)} ${i0(yt + 1)}L${i0(x + w / 2)} ${i0(apex)}L${i0(x + w + ov)} ${i0(yt + 1)}L${i0(x + w * 0.8)} ${i0(yt - rh * 0.12)}L${i0(x + w / 2)} ${i0(apex + rh * 0.35)}L${i0(x + w * 0.2)} ${i0(yt - rh * 0.1)}Z`;
      if (r() < 0.3) {
        const cx = x + w * (0.2 + r() * 0.5), cw = Math.max(3, w * 0.08);
        const cy = apex + (Math.abs(cx - (x + w / 2)) / (w / 2)) * rh;
        body += `M${i0(cx)} ${i0(cy + 2)}V${i0(cy - rh * 0.4)}h${i0(cw)}V${i0(cy + 4)}Z`;
      }
    }
    // 창
    if (o.win) {
      const cols = Math.max(1, Math.floor(tw / (ws * 3.2)));
      const rows = Math.max(1, Math.floor(h / (ws * 3.8)));
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          if (r() > o.win) continue;
          const wx = tx + ((i + 0.5) * tw) / cols, wy = b - ((j + 0.75) * h) / rows;
          if (wy < yt + ws) continue;
          const seg = `M${i0(wx)} ${i0(wy)}v${i0(-ws * 1.5)}`;
          if (r() < 0.55) w1 += seg; else w2 += seg;
          if (o.lights && r() < 0.5) o.lights.push([wx, wy]);
        }
    }
    x += w * (0.78 + r() * 0.3);
  }
  const g = A.lin(o.name, 0, yMin, 0, yMax, [[0, o.top], [0.55, mix(o.top, o.bottom, 0.4)], [1, o.bottom]], true);
  let s = `<path d="${body}" fill="${g}"/>`;
  if (o.snow) s += `<path d="${snow}" fill="${o.snow}"/>`;
  if (o.rim) s += `<path d="${rim}" stroke="${o.rim}" stroke-width="1.4" fill="none" opacity="${o.rimOp ?? 0.6}"/>`;
  const wc = o.winC ?? "#f6d48f";
  if (w1) s += `<path d="${w1}" stroke="${wc}" stroke-width="${i0(ws)}"/>`;
  if (w2) s += `<path d="${w2}" stroke="${mix(wc, "#b8742e", 0.5)}" stroke-width="${i0(ws)}" opacity=".8"/>`;
  return s;
}

/** 성서관의 흰 탑. 왼쪽이 달빛을 받는다. */
function whiteTower(A: Art, cx: number, baseY: number, topY: number, lit: string, shade: string, glow: string, sc = 1): string {
  let s = "";
  const H = baseY - topY;
  const L = A.lin("twl", 0, topY, 0, baseY, [[0, "#ffffff"], [0.5, lit], [1, mix(lit, shade, 0.6)]], true);
  const S = A.lin("tws", 0, topY, 0, baseY, [[0, mix(shade, lit, 0.3)], [0.6, shade], [1, mix(shade, "#141a40", 0.6)]], true);
  const stages: [number, number][] = [[150, 0.3], [118, 0.22], [92, 0.16], [70, 0.1]];
  let y = baseY;
  const winL: string[] = [];
  let lines = "", bands = "", pins = "", pinsS = "";
  for (const [w0, hf] of stages) {
    const w = w0 * sc, h = H * hf;
    s += A.rect(cx - w / 2, y - h, w / 2, h, L) + A.rect(cx, y - h, w / 2, h, S);
    bands += `M${f(cx - w / 2 - 4 * sc)} ${f(y - h + 2 * sc)}H${f(cx + w / 2 + 4 * sc)}`;
    for (const k of [0.16, 0.84]) lines += `M${f(cx - w / 2 + w * k)} ${f(y)}V${f(y - h)}`;
    for (const px of [cx - w / 2 - 3 * sc, cx + w / 2 - 7 * sc]) {
      const d = `M${f(px)} ${f(y - h)}l${f(5 * sc)} ${f(-30 * sc)}l${f(5 * sc)} ${f(30 * sc)}Z`;
      if (px < cx) pins += d; else pinsS += d;
    }
    const n = w0 > 100 ? 3 : 2;
    const aw = (w / n) * 0.34;
    for (let i = 0; i < n; i++) {
      const ax = cx - w / 2 + ((i + 0.5) * w) / n - aw / 2;
      winL.push(arch(ax, y - h * 0.16, aw, y - h * 0.82, 0.75));
    }
    y -= h;
  }
  const sw = 56 * sc;
  s += `<path d="M${f(cx - sw / 2)} ${f(y)}L${f(cx)} ${f(topY)}V${f(y)}Z${pins}" fill="${L}"/><path d="M${f(cx + sw / 2)} ${f(y)}L${f(cx)} ${f(topY)}V${f(y)}Z${pinsS}" fill="${S}"/>`;
  s += `<path d="${lines}" stroke="${shade}" stroke-width="${f(2 * sc)}" opacity=".5"/>`;
  s += `<path d="${bands}" stroke="#f4f6ff" stroke-width="${f(4 * sc)}"/>`;
  s += `<path d="M${f(cx - sw / 2)} ${f(y)}L${f(cx)} ${f(topY)}M${f(cx - 75 * sc)} ${f(baseY)}V${f(baseY - H * 0.3)}" stroke="#ffffff" stroke-width="${f(1.6 * sc)}" opacity=".8"/>`;
  s += `<path d="${winL.join("")}" fill="${glow}"/>`;
  return s;
}

/** 하늘 등불(풍등): 사다리꼴 몸통 + 빛번짐 */
function skyLantern(A: Art, x: number, y: number, s: number, glowUrl: string, body: string, anim = ""): string {
  const w = 10 * s, h = 13 * s;
  return `<g${anim ? " " + anim : ""}>${A.ell(x, y, w * 2.6, w * 2.6, glowUrl, 0.55)}<path d="M${f(x - w * 0.6)} ${f(y - h / 2)}h${f(w * 1.2)}l${f(w * 0.25)} ${f(h)}h${f(-w * 1.7)}Z" fill="${body}"/>${A.ell(x, y + h * 0.35, w * 0.5, h * 0.18, "#fff6d8")}</g>`;
}

// ───────────────────────── 루멘하임의 밤 ─────────────────────────

function capitalNight(): string {
  const A = new Art("bg-capital_night");
  const r = mulberry32(303);
  const blur = A.blur("soft", 16);
  A.add(A.rect(0, 0, 1600, 900, A.lin("sky", 0, 0, 0, 1, [[0, "#050818"], [0.3, "#0d1438"], [0.55, "#1d2660"], [0.68, "#3a3a78"], [0.78, "#5a4a7c"], [1, "#1a1a3a"]])));
  A.add(starField(r, 100, 0, 0, 1600, 560, "#dfe6ff", 0.9));
  // 달 (왼쪽 위)
  const mg = A.glowG("moon", "#c9d6ff", "#ffffff");
  A.add(A.ell(300, 150, 260, 260, mg, 0.45), `<circle cx="300" cy="150" r="34" fill="#f4f6ff"/>`, `<circle cx="292" cy="158" r="9" fill="#c9d3f0" opacity=".5"/><circle cx="312" cy="138" r="6" fill="#c9d3f0" opacity=".4"/>`);
  // 천환
  const cx = 1900, cy = 1500, R = 1650;
  A.add(ring(A, { cx, cy, R, a0: -Math.acos((330 - cx) / R), a1: -Math.acos((1760 - cx) / R), w: 150, n: 120, twinkle: 8, seed: 31 }, blur));
  // 지평선 도시 불빛 안개
  const hg = A.glowG("haze", "#e8a0a0");
  A.add(A.ell(800, 560, 1000, 150, hg, 0.25));
  // 먼 언덕
  let hill = "M0 900V540";
  for (let x = 0; x <= 1600; x += 40) hill += `L${x} ${f(545 - 40 * Math.sin(x / 260) - 70 * Math.exp(-(((x - 800) / 500) ** 2)) + gauss(r) * 4)}`;
  hill += "V900Z";
  A.add(A.path(hill, A.lin("hill", 0, 0, 0, 1, [[0, "#2c3574"], [1, "#1a2050"]])));
  const hillB = (x: number) => 560 - 150 * Math.exp(-(((x - 800) / 380) ** 2));
  A.add(cityRow(A, { name: "r1", seed: 1, x0: 230, x1: 1370, base: hillB, hMin: 18, hMax: 40, wMin: 20, wMax: 36, top: "#3a4588", bottom: "#4a4a86", win: 0.22, ws: 2, spire: 0.12, rim: "#b9c6f2", rimOp: 0.5 }));
  // 성서관 탑
  const tg = A.glowG("tglow", "#b8cdff", "#e8eeff");
  A.add(A.ell(800, 260, 190, 300, tg, 0.28));
  A.add(`<g>${whiteTower(A, 800, 470, 70, "#dfe4f6", "#8a93c4", "#bcd2ff", 0.8)}</g>`);
  A.add(A.ell(800, 250, 36, 36, tg, 0.9, A.a("br", 2, 6)));
  const hillC = (x: number) => 610 - 95 * Math.exp(-(((x - 800) / 420) ** 2));
  A.add(cityRow(A, { name: "r2", seed: 2, x0: -20, x1: 1620, base: hillC, hMin: 28, hMax: 60, wMin: 32, wMax: 56, top: "#27306a", bottom: "#353a72", win: 0.25, ws: 2.6, spire: 0.1, rim: "#aebde8", rimOp: 0.55 }));
  A.add(cityRow(A, { name: "r3", seed: 3, x0: -30, x1: 1630, base: (x) => 668 - 40 * Math.exp(-(((x - 800) / 500) ** 2)), hMin: 40, hMax: 85, wMin: 40, wMax: 74, top: "#1a2152", bottom: "#262b5a", win: 0.28, ws: 3.2, spire: 0.07, rim: "#9fb0e0", rimOp: 0.5 }));
  // 골목의 따뜻한 불빛
  const sg = A.glowG("street", "#e5a654", "#f6d48f");
  for (let i = 0; i < 14; i++) {
    const x = 60 + i * 115 + gauss(r) * 30;
    const y = i % 2 ? hillC(x) + 4 : 670 - 40 * Math.exp(-(((x - 800) / 500) ** 2));
    A.add(A.ell(x, y, 60 + r() * 50, 16 + r() * 10, sg, 0.5));
  }
  // 안개 띠
  A.add(A.rect(0, 600, 1600, 110, A.lin("mist", 0, 0, 0, 1, [[0, "#6a5a8a", 0], [0.6, "#6a5a8a", 0.3], [1, "#6a5a8a", 0]])));
  A.add(`<g id="${A.id("front")}">` + cityRow(A, { name: "r4", seed: 4, x0: -40, x1: 1640, base: () => 724, hMin: 60, hMax: 120, wMin: 60, wMax: 110, top: "#0e1334", bottom: "#141a3e", win: 0.22, ws: 4, spire: 0.05, rim: "#8fa2d8", rimOp: 0.45 }) + "</g>");
  // 운하
  A.add(A.rect(0, 722, 1600, 178, A.lin("water", 0, 0, 0, 1, [[0, "#1b2150"], [0.4, "#0e1234"], [1, "#05070f"]])));
  A.add(`<use href="#${A.id("front")}" transform="matrix(1 0 0 -1 0 1448)" opacity=".2"/>`);
  const rg = A.lin("rstreak", 0, 0, 1, 0, [[0, "#f6d48f", 0], [0.5, "#f6d48f", 0.9], [1, "#f6d48f", 0]]);
  for (let i = 0; i < 8; i++) {
    const x = 160 + i * 180 + gauss(r) * 30, y = 740 + r() * 90;
    A.add(A.rect(x, y, 40 + r() * 60, 2, rg, A.a("sh", r() * 7, 5 + r() * 4)));
  }
  // 달빛 물결
  const mw = A.lin("mwave", 0, 0, 1, 0, [[0, "#dfe6ff", 0], [0.5, "#dfe6ff", 0.8], [1, "#dfe6ff", 0]]);
  for (let i = 0; i < 4; i++) A.add(A.rect(740 + gauss(r) * 50, 745 + i * 16, 60 + r() * 60, 1.6, mw, A.a("sh", r() * 7, 6 + r() * 3)));
  // 제방
  A.add(A.rect(0, 718, 1600, 8, "#070a1c"));
  A.add(A.rect(0, 0, 1600, 900, A.rad("vig", [[0, "#000", 0], [0.65, "#000", 0], [1, "#02030a", 0.6]], 'cx=".5" cy=".4" r=".8"')));
  A.add(A.rect(0, 640, 1600, 260, A.lin("low", 0, 0, 0, 1, [[0, "#02030a", 0], [1, "#02030a", 0.6]])));
  return A.svg();
}

export const CITY_BACKGROUNDS: Record<string, string> = {
  archive: archive(false),
  archive_night: archive(true),
  capital_night: capitalNight(),
};
