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

/** 같은 빛번짐 그라데이션을 쓰는 원 여러 개를 한 묶음으로 */
function glows(fill: string, op: number, list: [number, number, number][]): string {
  if (!list.length) return "";
  return `<g fill="${fill}" opacity="${f2(op)}">${list.map(([x, y, rr]) => `<circle cx="${i0(x)}" cy="${i0(y)}" r="${i0(Math.max(1, rr))}"/>`).join("")}</g>`;
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
/** 원 중심 cx, 반지름 R인 호의 윗부분에서 화면 x에 해당하는 각 */
const arcA = (cx: number, R: number, x: number) => -Math.acos(Math.max(-1, Math.min(1, (x - cx) / R)));

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
  A.add(ring(A, { cx, cy, R, a0: arcA(cx, R, 330), a1: arcA(cx, R, 1760), w: 150, n: 120, twinkle: 8, seed: 31 }, blur));
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

/** 비네트 + 아래 30% 가라앉히기 */
function finish(A: Art, c: string, vig: number, low: number, cy = 0.42) {
  A.add(A.rect(0, 0, 1600, 900, A.rad("vig", [[0, c, 0], [0.62, c, 0], [1, c, vig]], `cx=".5" cy="${cy}" r=".78"`)));
  if (low) A.add(A.rect(0, 620, 1600, 280, A.lin("low", 0, 0, 0, 1, [[0, c, 0], [1, c, low]])));
}

/** 하늘 등불 떼: 작은 것은 점, 중간 것은 몸통 경로 하나 + 빛번짐, 몇 개는 숨쉬듯 */
function lanternSky(A: Art, r: Rnd, n: number, x0: number, x1: number, y0: number, y1: number, anim: number, big = 1): string {
  const gl = A.glowG("lglow", "#f0a04a", "#ffe2a0");
  const far: [number, number][] = [], mid: [number, number][] = [];
  const gs: [number, number, number][] = [];
  let bodies = "", s = "";
  for (let i = 0; i < n; i++) {
    const t = r();
    const x = x0 + r() * (x1 - x0), y = y1 - t * (y1 - y0);
    const sc = (0.22 + t * t * 1.3 * r()) * big;
    if (sc < 0.42) { (sc < 0.3 ? far : mid).push([x, y]); continue; }
    const w = 9 * sc, h = 12 * sc;
    bodies += rel(`M${i0(x - w * 0.55)} ${i0(y - h / 2)}h${i0(w * 1.1)}l${f(w * 0.25)} ${i0(h)}h${f(-w * 1.6)}z`);
    if (anim > 0 && sc > 0.6) { s += A.ell(x, y, w * 3, w * 3, gl, 0.7, A.a("br", r() * 9, 4 + r() * 5)); anim--; }
    else gs.push([x, y, w * 3]);
  }
  s = glows(gl, 0.6, gs) + s;
  s += dots(far, "#f6c878", 2.6, 0.8) + dots(mid, "#ffd89a", 3.8, 0.9);
  s += `<path d="${bodies}" fill="${A.lin("lbody", 0, 0, 0, 1, [[0, "#ffe7b0"], [0.6, "#f2a24e"], [1, "#c8662a"]])}"/>`;
  return s;
}

// ───────────────────────── 별등제의 다리 ─────────────────────────

function bridge(): string {
  const A = new Art("bg-bridge");
  const r = mulberry32(505);
  const blur = A.blur("soft", 16);
  const WL = 585;
  let up = A.rect(0, 0, 1600, WL, A.lin("sky", 0, 0, 0, 1, [[0, "#060a20"], [0.35, "#141c4c"], [0.7, "#3a2f66"], [0.9, "#7a4a6a"], [1, "#9a5a60"]]));
  up += starField(r, 110, 0, 0, 1600, 420, "#dfe6ff", 0.8);
  const cx = 500, cy = 1600, R = 1550;
  up += ring(A, { cx, cy, R, a0: arcA(cx, R, -150), a1: arcA(cx, R, 1750), w: 130, n: 60, twinkle: 4, seed: 51 }, blur);
  // 먼 강둑 도시
  up += A.ell(800, WL - 40, 900, 110, A.glowG("hglow", "#f0a060"), 0.45);
  up += cityRow(A, { name: "far", seed: 7, x0: -20, x1: 1620, base: () => WL - 4, hMin: 16, hMax: 44, wMin: 22, wMax: 40, top: "#2a2656", bottom: "#4a3160", win: 0.3, ws: 2, spire: 0.12, rim: "#e0a0a0", rimOp: 0.35 });
  up += lanternSky(A, r, 230, -20, 1620, 20, WL - 30, 5);
  { const q: [number, number][] = []; for (let i = 0; i < 110; i++) q.push([r() * 1600, 250 + Math.pow(r(), 0.6) * 300]); up += dots(q, "#ffc070", 3, 0.85); }
  // 다리
  const DY = 455, span = [150, 1450];
  const stone = A.lin("stone", 0, DY - 30, 0, WL, [[0, "#3a3050"], [0.5, "#241f3e"], [1, "#15132a"]], true);
  let arches = "";
  const piers = [150, 420, 640, 960, 1180, 1450];
  for (let i = 0; i < piers.length - 1; i++) {
    const a0 = piers[i] + 22, a1 = piers[i + 1] - 22;
    const w = a1 - a0, mid = i === 2;
    const top = mid ? DY + 22 : DY + 44;
    arches += `M${a0} ${WL}V${top + w * 0.28}A${f(w / 2)} ${f(w * 0.3)} 0 0 1 ${a1} ${top + w * 0.28}V${WL}Z`;
  }
  // 다리 몸통 (아치 구멍은 evenodd)
  up += `<path d="M${span[0] - 120} ${WL}L${span[0]} ${DY + 8}Q800 ${DY - 36} ${span[1]} ${DY + 8}L${span[1] + 120} ${WL}Z${arches}" fill="${stone}" fill-rule="evenodd"/>`;
  // 아치 안쪽 테두리광 (등불빛)
  // 아치 둘레 돌띠
  up += `<path d="${arches}" fill="none" stroke="#17142c" stroke-width="16" opacity=".7" stroke-dasharray="14 3"/>`;
  // 난간 아래 돌림띠와 등불빛
  up += `<path d="${arches}" fill="none" stroke="#f0a060" stroke-width="2" opacity=".4"/>`;
  up += `<path d="M${span[0]} ${DY + 8}Q800 ${DY - 36} ${span[1]} ${DY + 8}" stroke="#6a5078" stroke-width="7" fill="none"/>`;
  up += A.ell(800, DY + 10, 700, 60, A.glowG("wash", "#f0a060"), 0.35);
  // 난간
  let rail = "", posts = "";
  for (let x = span[0] - 60; x <= span[1] + 60; x += 14) {
    const t = (x - 800) / 650;
    const y = DY - 36 * (1 - t * t) + 8 + (Math.abs(t) > 1 ? (Math.abs(t) - 1) * 150 : 0);
    rail += `${rail ? "L" : "M"}${x} ${i0(y - 24)}`;
    posts += `M${x} ${i0(y)}v-24`;
  }
  up += `<path d="${rail}" stroke="#2a2444" stroke-width="5" fill="none"/><path d="${posts}" stroke="#2a2444" stroke-width="3"/>`;
  up += `<path d="${rail}" stroke="#f3b878" stroke-width="1.2" fill="none" opacity=".45"/>`;
  // 다리 위 가로등과 사람 그림자
  const lg = A.glowG("lamp", "#f6c070", "#fff0c8");
  for (const x of [260, 560, 1040, 1340]) {
    const t = (x - 800) / 650, y = DY - 36 * (1 - t * t) + 8;
    up += `<path d="M${x} ${f(y)}v-70" stroke="#1a1630" stroke-width="4"/>` + A.ell(x, y - 74, 60, 60, lg, 0.7) + A.ell(x, y - 74, 6, 8, "#fff1c8");
  }
  let ppl = "";
  for (let i = 0; i < 26; i++) {
    const x = 200 + r() * 1200;
    if (Math.abs(x - 800) < 60) continue;
    const t = (x - 800) / 650, y = DY - 36 * (1 - t * t) + 6, h = 28 + r() * 10;
    ppl += rel(`M${i0(x - 5)} ${i0(y)}l2 ${i0(-h * 0.7)}h6l2 ${i0(h * 0.7)}zM${i0(x)} ${i0(y - h * 0.72)}m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0`);
  }
  up += `<path d="${ppl}" fill="#120f22"/>`;
  // 한가운데의 두 사람 (약속의 자리)
  up += A.ell(800, DY - 50, 90, 70, lg, 0.55);
  up += `<path d="M788 ${DY - 26}l2-26h7l2 26zM803 ${DY - 26}l2-24h6l2 24zM793 ${DY - 55}m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M808 ${DY - 51}m-4 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0" fill="#0c0a18"/>`;
  A.add(`<g id="${A.id("up")}">${up}</g>`);
  // 강물
  A.add(A.rect(0, WL, 1600, 900 - WL, A.lin("water", 0, 0, 0, 1, [[0, "#3a2a50"], [0.3, "#141638"], [1, "#05060f"]])));
  A.add(`<use href="#${A.id("up")}" transform="matrix(1 0 0 -1 0 ${WL * 2})" opacity=".38"/>`);
  A.add(A.rect(0, WL, 1600, 900 - WL, A.lin("wdim", 0, 0, 0, 1, [[0, "#0a0a20", 0], [0.5, "#070818", 0.45], [1, "#03040c", 0.85]])));
  // 물 위의 등불과 반짝임
  const sg = A.lin("sheen", 0, 0, 1, 0, [[0, "#ffd08a", 0], [0.5, "#ffd08a", 0.9], [1, "#ffd08a", 0]]);
  for (let i = 0; i < 12; i++) {
    const y = WL + 8 + Math.pow(r(), 1.4) * 200;
    A.add(A.rect(80 + r() * 1440, y, 30 + r() * 80, 1.6, sg, A.a("sh", r() * 7, 5 + r() * 4)));
  }
  const fl = A.glowG("float", "#f0a050", "#fff0c0");
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 170 + gauss(r) * 40, y = WL + 30 + r() * 90;
    A.add(A.ell(x, y, 30, 10, fl, 0.8), A.ell(x, y - 2, 5, 3.5, "#ffe2a0"));
  }
  A.add(A.rect(0, WL - 1, 1600, 3, "#f3b878", 'opacity=".25"'));
  finish(A, "#03030c", 0.55, 0.45);
  return A.svg();
}

// ───────────────────────── 별등제 거리 ─────────────────────────

function festival(): string {
  const A = new Art("bg-festival");
  const r = mulberry32(606);
  const blur = A.blur("soft", 14);
  const VX = 800, VY = 485, F = 600, W = 3;
  const X = (x: number, z: number) => VX + (x * F) / z, Y = (y: number, z: number) => VY + (y * F) / z;
  A.add(A.rect(0, 0, 1600, 900, A.lin("sky", 0, 0, 0, 1, [[0, "#070a22"], [0.35, "#1c1f52"], [0.55, "#6a3e62"], [1, "#2a1a2a"]])));
  A.add(starField(r, 40, 380, 0, 1220, 320, "#dfe6ff", 0.8));
  A.add(ring(A, { cx: 1300, cy: 1500, R: 1500, a0: arcA(1300, 1500, 300), a1: arcA(1300, 1500, 1300), w: 100, n: 30, twinkle: 4, seed: 61, dense: 0.6, box: [380, 0, 1220, 420] }, blur));
  const warm = A.glowG("warm", "#f09848", "#ffe0a0");
  // 거리 끝: 흰 탑과 먼 불빛
  A.add(A.ell(VX, VY - 40, 420, 160, warm, 0.45));
  A.add(A.ell(VX, VY - 110, 130, 190, A.glowG("tg", "#c0ccff"), 0.35));
  A.add(whiteTower(A, VX, VY + 6, 230, "#dcdff2", "#7c84b8", "#f6d48f", 0.36));
  A.add(lanternSky(A, r, 80, 380, 1220, 20, 360, 8, 0.9));
  // 양쪽 건물
  const facade = ["#3a2a4e", "#2e2444", "#443052", "#342848"];
  const zs = [2.1, 2.9, 3.9, 5.1, 6.6, 8.5, 11, 15];
  const glass = A.lin("glass", 0, 0, 0, 1, [[0, "#ffe3a8"], [1, "#e89a4a"]]);
  for (const side of [-1, 1]) {
    for (let i = zs.length - 2; i >= 0; i--) {
      const z0 = zs[i], z1 = zs[i + 1], zm = (z0 + z1) / 2;
      const fog = Math.min(0.7, (zm - 2) / 14);
      const H = -(4.2 + r() * 2.2), gab = H - 1 - r() * 0.9;
      const col = mix(mix(facade[i % 4], "#7a4a6a", fog), "#120c1a", Math.max(0, (3.6 - zm) * 0.45));
      const xa = X(side * W, z0), xb = X(side * W, z1);
      A.add(A.path(pts([[xa, Y(1.6, z0)], [xa, Y(H, z0)], [(xa + xb) / 2, Y(gab, zm)], [xb, Y(H, z1)], [xb, Y(1.6, z1)]]), col));
      // 목조 뼈대
      let tim = `M${i0(xa)} ${i0(Y(H, z0))}L${i0((xa + xb) / 2)} ${i0(Y(gab, zm))}L${i0(xb)} ${i0(Y(H, z1))}`;
      for (const yy of [-0.2, -1.6, -3]) if (yy > H) tim += `M${i0(xa)} ${i0(Y(yy, z0))}L${i0(xb)} ${i0(Y(yy, z1))}`;
      A.add(`<path d="${tim}" stroke="${mix("#1a1224", col, fog)}" stroke-width="${f(Math.max(1.5, 16 / zm))}" fill="none"/>`);
      // 창
      let w = "";
      for (const yy of [-1.3, -2.7, -4.1]) {
        if (yy - 0.5 < H) continue;
        for (const k of [0.25, 0.5, 0.75]) {
          if (r() < 0.3) continue;
          const z = z0 + (z1 - z0) * k, dz = 0.11;
          w += pts([[X(side * W, z - dz), Y(yy, z - dz)], [X(side * W, z + dz), Y(yy, z + dz)], [X(side * W, z + dz), Y(yy + 0.55, z + dz)], [X(side * W, z - dz), Y(yy + 0.55, z - dz)]]);
        }
      }
      if (w) A.add(A.path(w, glass, `opacity="${f2((0.95 - fog * 0.4) * (zm < 3.6 ? 0.35 : 1))}"`));
      // 노점: 차양 + 빛나는 진열대
      const ex = side * (W - 0.9);
      const aw = [[X(side * W, z0 + 0.1), Y(-0.35, z0 + 0.1)], [X(side * W, z1 - 0.1), Y(-0.35, z1 - 0.1)], [X(ex, z1 - 0.1), Y(0.05, z1 - 0.1)], [X(ex, z0 + 0.1), Y(0.05, z0 + 0.1)]] as [number, number][];
      A.add(A.ell(X(side * (W - 0.5), zm), Y(0.6, zm), 260 / zm, 150 / zm, warm, 0.85));
      A.add(A.path(pts([[X(side * W, z0 + 0.15), Y(0.75, z0 + 0.15)], [X(side * W, z1 - 0.15), Y(0.75, z1 - 0.15)], [X(side * (W - 0.55), z1 - 0.15), Y(0.75, z1 - 0.15)], [X(side * (W - 0.55), z0 + 0.15), Y(0.75, z0 + 0.15)]]), "#e8a060", `opacity="${f2(0.55 - fog * 0.3)}"`));
      A.add(A.path(pts(aw), mix(i % 2 ? "#8a2a3e" : "#b89a80", col, fog + Math.max(0, (3.6 - zm) * 0.3))));
      let st = "";
      for (let j = 1; j < 4; j++) {
        const t = j / 4;
        st += `M${i0(aw[0][0] + (aw[1][0] - aw[0][0]) * t)} ${i0(aw[0][1] + (aw[1][1] - aw[0][1]) * t)}L${i0(aw[3][0] + (aw[2][0] - aw[3][0]) * t)} ${i0(aw[3][1] + (aw[2][1] - aw[3][1]) * t)}`;
      }
      A.add(`<path d="${st}" stroke="${i % 2 ? "#e8d0b0" : "#8a2a3a"}" stroke-width="${f(Math.max(1, 30 / zm))}" opacity="${f2(0.4 - fog * 0.25)}"/>`);
      A.add(`<path d="M${i0(aw[3][0])} ${i0(aw[3][1])}L${i0(aw[2][0])} ${i0(aw[2][1])}" stroke="#ffd690" stroke-width="${f(Math.max(1, 5 / zm))}" opacity=".7"/>`);
    }
  }
  // 바닥 (돌길)
  A.add(A.path(pts([[X(-W, 15), Y(1.6, 15)], [X(W, 15), Y(1.6, 15)], [X(W, 1.3), 900], [X(-W, 1.3), 900]]), A.lin("gr", 0, 0, 0, 1, [[0, "#8a5a60"], [0.25, "#4a2e40"], [1, "#120c16"]])));
  A.add(A.ell(VX, 620, 520, 90, warm, 0.35));
  // 등불 줄
  let cords = "", bodies = "", anim = "";
  const gls: [number, number, number][] = [];
  let left = 16;
  for (const z of [2.4, 3.1, 4, 5.3, 7, 9.5, 13]) {
    const y0 = -1.55 - z * 0.12;
    const xa = X(-W, z), xb = X(W, z), ya = Y(y0, z), sag = 90 / z + 14;
    cords += `M${i0(xa)} ${i0(ya)}Q${VX} ${i0(ya + sag * 2)} ${i0(xb)} ${i0(ya)}`;
    const n = Math.round(8 + z * 1.4);
    let caps = "", hi = "";
    for (let j = 1; j < n; j++) {
      const t = j / n, x = xa + (xb - xa) * t, y = ya + 4 * sag * t * (1 - t);
      const s = 16 / z;
      caps += `M${i0(x)} ${i0(y + s * 0.9)}v${f(s * 0.6)}`;
      hi += `M${i0(x - s * 0.2)} ${i0(y + s * 0.9)}h0`;
      if (left > 0 && z < 4.5 && j % 3 === 1) { anim += A.ell(x, y + s * 1.2, s * 4.5, s * 4.5, warm, 0.5, A.a("fl", r() * 3, 2.4 + r() * 2)); left--; }
      else if (z < 8) gls.push([x, y + s * 1.2, s * 4.5]);
    }
    const sw = (16 / z) * 1.5;
    bodies += `<path d="${caps}" stroke="#f2a04c" stroke-width="${f(sw)}"/><path d="${hi}" stroke="#fff0c0" stroke-width="${f(sw * 0.45)}"/>`;
  }
  A.add(glows(warm, 0.5, gls) + anim, `<path d="${cords}" stroke="#1a1020" stroke-width="1.5" fill="none"/>`, `<g stroke-linecap="round">${bodies}</g>`);
  // 군중: 멀리 작게, 가까이 크게, 등불 테두리광
  let crowd = "", rim = "";
  const person = (x: number, base: number, h: number) => {
    const w = h * 0.4, hy = base - h, hr = h * 0.075;
    crowd += rel(`M${i0(x - w / 2)} ${i0(base)}C${i0(x - w / 2)} ${i0(hy + h * 0.3)} ${i0(x - w * 0.4)} ${i0(hy + h * 0.2)} ${i0(x)} ${i0(hy + h * 0.2)}C${i0(x + w * 0.4)} ${i0(hy + h * 0.2)} ${i0(x + w / 2)} ${i0(hy + h * 0.3)} ${i0(x + w / 2)} ${i0(base)}ZM${i0(x - hr)} ${i0(hy + h * 0.1)}a${i0(hr)} ${i0(hr * 1.2)} 0 1 0 ${i0(hr * 2)} 0a${i0(hr)} ${i0(hr * 1.2)} 0 1 0 ${i0(-hr * 2)} 0`);
    rim += `M${i0(x - w * 0.46)} ${i0(hy + h * 0.28)}Q${i0(x - w * 0.4)} ${i0(hy + h * 0.2)} ${i0(x - w * 0.1)} ${i0(hy + h * 0.2)}`;
  };
  for (let i = 0; i < 22; i++) {
    const z = 5.5 + Math.pow(r(), 0.7) * 9;
    const x = X((r() * 2 - 1) * (W - 0.5), z);
    person(x, Y(1.6, z), ((1.35 + r() * 0.3) * F) / z);
  }
  A.add(`<path d="${crowd}" fill="#2e1e38"/><path d="${rim}" stroke="#f6b870" stroke-width="1.6" fill="none" opacity=".55"/>`);
  crowd = ""; rim = "";
  for (let i = 0; i < 6; i++) person(90 + i * 284 + gauss(r) * 40, 940 + r() * 30, 280 + r() * 60);
  A.add(`<path d="${crowd}" fill="#0a0610"/><path d="${rim}" stroke="#f6b870" stroke-width="2.4" fill="none" opacity=".3"/>`);
  finish(A, "#050308", 0.55, 0.35);
  return A.svg();
}

// ───────────────────────── 침묵탑 ─────────────────────────

function tower(): string {
  const A = new Art("bg-tower");
  const r = mulberry32(707);
  const blur = A.blur("soft", 16);
  A.add(A.rect(0, 0, 1600, 900, A.lin("sky", 0, 0, 0, 1, [[0, "#04061a"], [0.4, "#0e1640"], [0.75, "#23306b"], [1, "#101630"]])));
  A.add(starField(r, 160, 0, 0, 1600, 600, "#dfe6ff", 0.9));
  A.add(ring(A, { cx: 1850, cy: 1350, R: 1500, a0: arcA(1850, 1500, 250) + 0.08, a1: arcA(1850, 1500, 1700), w: 120, n: 120, twinkle: 7, seed: 71 }, blur));
  // 큰 달 (탑 뒤 왼쪽)
  const mg = A.glowG("moon", "#c9d6ff", "#ffffff");
  A.add(A.ell(640, 250, 380, 380, mg, 0.5), `<circle cx="640" cy="250" r="92" fill="#eef2ff"/>`, `<circle cx="615" cy="232" r="22" fill="#cfd8f2" opacity=".6"/><circle cx="668" cy="282" r="14" fill="#cfd8f2" opacity=".5"/><circle cx="660" cy="215" r="9" fill="#cfd8f2" opacity=".5"/>`);
  // 안개 산등성이
  const ridge = (y0: number, amp: number, seed: number, c1: string, c2: string, n: string) => {
    const q = mulberry32(seed);
    let d = `M0 900V${y0}`;
    for (let x = 0; x <= 1600; x += 50) d += `L${x} ${i0(y0 - amp * (0.5 + 0.5 * Math.sin(x / 190 + seed)) - q() * amp * 0.4)}`;
    return A.path(d + "V900Z", A.lin(n, 0, 0, 0, 1, [[0, c1], [1, c2]]));
  };
  A.add(ridge(640, 60, 3, "#2a3674", "#1a2250", "rg1"));
  A.add(A.rect(0, 560, 1600, 160, A.lin("mist", 0, 0, 0, 1, [[0, "#6a78b8", 0], [0.5, "#6a78b8", 0.25], [1, "#6a78b8", 0]])));
  A.add(cityRow(A, { name: "town", seed: 9, x0: -20, x1: 1620, base: () => 720, hMin: 14, hMax: 30, wMin: 16, wMax: 30, top: "#141b44", bottom: "#101634", win: 0.25, ws: 2, spire: 0.08 }));
  // 바위 언덕
  A.add(A.path(`M380 900C420 780 560 700 690 670L910 668C1040 700 1170 790 1220 900Z`, A.lin("crag", 0, 0, 1, 0, [[0, "#39447e"], [0.35, "#1c2250"], [1, "#0a0d24"]])));
  // 탑 몸통
  const cx = 800, top = 200, bot = 700, w0 = 104, w1 = 84;
  const body = `M${cx - w0} ${bot}L${cx - w1} ${top}H${cx + w1}L${cx + w0} ${bot}Z`;
  const tb = A.lin("tbody", 0, 0, 1, 0, [[0, "#6a78b0"], [0.12, "#39447c"], [0.45, "#1c2350"], [1, "#0a0d24"]]);
  A.add(A.path(body, tb));
  const tclip = A.clip("tc", body);
  let courses = "", blocks = "";
  for (let y = top + 14; y < bot; y += 18) {
    courses += `M${cx - 110} ${y}H${cx + 110}`;
    for (let k = 0; k < 3; k++) { const bx = cx - 90 + r() * 180; blocks += `M${i0(bx)} ${y}v-18`; }
  }
  A.add(`<g clip-path="${tclip}"><path d="${courses}" stroke="#05071a" stroke-width="1.4" opacity=".45"/><path d="${blocks}" stroke="#05071a" stroke-width="1.2" opacity=".35"/>`);
  // 나선 계단 (앞면만 보이는 사선 띠)
  let stair = "", stairLit = "", steps = "";
  for (let k = 0; k < 5; k++) {
    const y0 = bot - 30 - k * 92;
    stair += `M${cx - 120} ${y0}L${cx + 120} ${y0 - 44}l0 12L${cx - 120} ${y0 + 12}Z`;
    stairLit += `M${cx - 120} ${y0}L${cx + 120} ${y0 - 44}`;
    for (let j = 0; j < 12; j++) { const x = cx - 100 + j * 17; steps += `M${x} ${f(y0 - ((x - cx + 120) / 240) * 44)}v-14`; }
  }
  A.add(`<path d="${stair}" fill="#0c0f2c"/><path d="${stairLit}" stroke="#9fb4e8" stroke-width="1.6" opacity=".55"/><path d="${steps}" stroke="#2c3668" stroke-width="1.5" opacity=".7"/></g>`);
  // 달빛 테두리
  A.add(`<path d="M${cx - w0} ${bot}L${cx - w1} ${top}" stroke="#c9d6ff" stroke-width="3" opacity=".8"/>`);
  // 꼭대기 흉벽과 지붕
  A.add(A.path(`M${cx - 98} ${top + 4}V${top - 26}H${cx + 98}V${top + 4}Z`, "#1a2150"));
  let cren = "";
  for (let x = cx - 98; x < cx + 98; x += 28) cren += `M${x} ${top - 26}h16v-16h-16z`;
  A.add(A.path(cren, "#1a2150"), A.path(`M${cx - 70} ${top - 26}L${cx} ${top - 150}L${cx + 70} ${top - 26}Z`, A.lin("roof", 0, 0, 1, 0, [[0, "#5a68a8"], [0.4, "#232b5c"], [1, "#0b0e26"]])));
  A.add(`<path d="M${cx - 98} ${top - 26}H${cx - 60}M${cx - 70} ${top - 26}L${cx} ${top - 150}" stroke="#dfe6ff" stroke-width="2" opacity=".7"/>`);
  // 하나 켜진 창
  const wg = A.glowG("win", "#f6c070", "#fff2c8");
  A.add(A.ell(cx + 12, top + 60, 120, 120, wg, 0.55, A.a("fl", 1, 4)));
  A.add(A.path(arch(cx + 2, top + 84, 22, top + 40, 0.7), "#ffd88a"), A.path(arch(cx + 2, top + 84, 22, top + 40, 0.7), "none", 'stroke="#2a2040" stroke-width="3"'), `<path d="M${cx + 13} ${top + 44}V${top + 84}" stroke="#6a4020" stroke-width="2"/>`);
  // 좁은 창들 (어둡게)
  let slits = "";
  for (const [x, y] of [[cx - 30, 320], [cx + 40, 450], [cx - 10, 580]] as [number, number][]) slits += `M${x} ${y}h7v-26h-7z`;
  A.add(A.path(slits, "#05071a"));
  // 앙상한 나무
  let tree = "";
  const branch = (x: number, y: number, a: number, l: number, d: number) => {
    const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
    tree += `M${i0(x)} ${i0(y)}L${i0(x2)} ${i0(y2)}`;
    if (d > 0) { branch(x2, y2, a - 0.4 - r() * 0.3, l * 0.72, d - 1); branch(x2, y2, a + 0.3 + r() * 0.3, l * 0.68, d - 1); }
  };
  branch(560, 760, -1.75, 60, 5);
  branch(1080, 770, -1.35, 50, 4);
  A.add(`<path d="${tree}" stroke="#070a1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  // 전경 바위 그림자
  A.add(A.path("M0 900V760C160 730 300 760 420 820L520 900ZM1600 900V740C1440 720 1300 770 1180 840L1100 900Z", "#05071a"));
  finish(A, "#02030c", 0.6, 0.5);
  return A.svg();
}

// ───────────────────────── 루멘하임 거리 (낮 겨울 / 비 오는 새벽) ─────────────────────────

function streetScene(rain: boolean): string {
  const A = new Art(rain ? "bg-rain_street" : "bg-street");
  const r = mulberry32(rain ? 909 : 808);
  const blur = A.blur("soft", 14);
  const VX = 800, VY = 450, F = 560, W = 2.9;
  const X = (x: number, z: number) => VX + (x * F) / z, Y = (y: number, z: number) => VY + (y * F) / z;
  const C = rain
    ? { sky: [["#1a2238", 0], ["#34405a", 0.55], ["#6a7288", 1]] as [string, number][], haze: "#5a6480", facade: ["#2e3650", "#353d58", "#2a3148", "#3a4058"], timber: "#161b2c", roof: "#1c2234", win: "#0f1424", frame: "#4a5470", ground: ["#4a5268", "#1a1e2c", "#07090f"], sign: "#141a2a" }
    : { sky: [["#b8c6dc", 0], ["#dfe5ee", 0.55], ["#f2efe8", 1]] as [string, number][], haze: "#e6e8ee", facade: ["#e4d8c4", "#c9d0da", "#dcc4bc", "#d6d0c0"], timber: "#5a4a48", roof: "#4a5064", win: "#3a4660", frame: "#f4f0e8", ground: ["#c8ccd6", "#8a8e9c", "#3a3c48"], sign: "#3a3238" };
  A.add(A.rect(0, 0, 1600, 900, A.lin("sky", 0, 0, 0, 1, C.sky.map(([c, o]) => [o * 0.6, c] as Stop).concat([[1, C.haze]]))));
  if (!rain) {
    A.add(ring(A, { cx: 1500, cy: 1300, R: 1300, a0: arcA(1500, 1300, 250), a1: arcA(1500, 1300, 1500), w: 110, n: 20, twinkle: 0, seed: 81, op: 0.28, dense: 0.5, box: [300, 0, 1300, 450] }, blur));
    A.add(A.ell(420, 90, 340, 240, A.glowG("sun", "#fff6e0", "#ffffff"), 0.7));
  } else {
    A.add(A.ell(VX, VY - 30, 700, 200, A.glowG("dawn", "#8a90b0"), 0.4));
  }
  // 거리 끝: 흰 탑 (안개 속)
  A.add(`<g opacity="${rain ? 0.45 : 0.6}">${whiteTower(A, VX + 20, VY + 20, 150, rain ? "#8a94b4" : "#f4f2ec", rain ? "#4a5474" : "#b4bccc", rain ? "#f6d48f" : "#9aa8c4", 0.5)}</g>`);
  const lampG = A.glowG("lamp", "#f6c070", "#fff1c8");
  if (!rain) A.lin("wref", 0, 0, 1, 1, [[0, "#ffffff", 0], [0.45, "#e8eef8", 0.9], [0.55, "#e8eef8", 0.1], [1, "#ffffff", 0]]);
  const zs = [1.9, 2.6, 3.4, 4.4, 5.7, 7.3, 9.4, 12, 16];
  const lamps: [number, number, number][] = [];
  const shopRefl: [number, number, number, number][] = [];
  for (const side of [-1, 1]) {
    for (let i = zs.length - 2; i >= 0; i--) {
      const z0 = zs[i], z1 = zs[i + 1], zm = (z0 + z1) / 2;
      const fog = Math.min(0.85, Math.pow((zm - 1.8) / 14, 0.8) * (rain ? 1 : 0.85));
      const hz = (c: string) => mix(c, C.haze, fog);
      const H = -(3.4 + r() * 2.2), gab = H - 0.9 - r() * 0.7;
      const xa = X(side * W, z0), xb = X(side * W, z1);
      const face = pts([[xa, Y(1.6, z0)], [xa, Y(H, z0)], [xb, Y(H, z1)], [xb, Y(1.6, z1)]]);
      const lit = rain ? 0 : side > 0 ? 0.14 : -0.36;
      const base = lit > 0 ? mix(C.facade[i % 4], "#fff4de", lit) : mix(C.facade[i % 4], "#6a7090", -lit);
      A.add(A.path(face, hz(base)));
      if (!rain && side > 0) A.add(A.path(pts([[xa, Y(H, z0)], [xb, Y(H, z1)], [xb, Y(-1.2 + r() * 0.8, z1)], [xa, Y(-2 + r() * 0.6, z0)]]), "#fff2d6", `opacity="${f2(0.35 * (1 - fog))}"`));
      // 지붕 (박공 + 눈)
      const rp: [number, number][] = [[xa, Y(H, z0)], [(xa + xb) / 2, Y(gab, zm)], [xb, Y(H, z1)]];
      A.add(A.path(pts([[xa, Y(H + 0.25, z0)], ...rp, [xb, Y(H + 0.25, z1)]]), hz(C.roof)));
      if (!rain) A.add(`<path d="M${i0(rp[0][0])} ${i0(rp[0][1])}L${i0(rp[1][0])} ${i0(rp[1][1])}L${i0(rp[2][0])} ${i0(rp[2][1])}" stroke="#f8faff" stroke-width="${f(Math.max(2, 70 / zm))}" stroke-linejoin="round" fill="none"/>`);
      // 목조 띠
      let tim = "";
      for (const yy of [-0.35, -1.75, -3.15]) if (yy > H) tim += `M${i0(xa)} ${i0(Y(yy, z0))}L${i0(xb)} ${i0(Y(yy, z1))}`;
      tim += `M${i0(xa)} ${i0(Y(1.6, z0))}V${i0(Y(H, z0))}`;
      A.add(`<path d="${tim}" stroke="${hz(C.timber)}" stroke-width="${f(Math.max(1.2, 22 / zm))}" fill="none"/>`);
      // 창
      let wd = "", wl = "", sill = "";
      for (const yy of [-1.1, -2.5, -3.9]) {
        if (yy - 0.4 < H) continue;
        for (const k of [0.28, 0.72]) {
          const z = z0 + (z1 - z0) * k, dz = 0.13;
          const q = pts([[X(side * W, z - dz), Y(yy, z - dz)], [X(side * W, z + dz), Y(yy, z + dz)], [X(side * W, z + dz), Y(yy + 0.62, z + dz)], [X(side * W, z - dz), Y(yy + 0.62, z - dz)]]);
          if (rain ? r() < 0.16 : false) wl += q; else wd += q;
          sill += `M${i0(X(side * W, z - dz * 1.3))} ${i0(Y(yy + 0.64, z - dz))}L${i0(X(side * W, z + dz * 1.3))} ${i0(Y(yy + 0.64, z + dz))}`;
        }
      }
      A.add(A.path(wd, hz(C.win)), rain ? "" : A.path(wd, A.u("wref"), `opacity="${f2(0.5 * (1 - fog))}"`), `<path d="${sill}" stroke="${rain ? hz("#5a6480") : "#fbfcff"}" stroke-width="${f(Math.max(1.2, 18 / zm))}"/>`);
      if (wl) A.add(A.path(wl, "#f2c070", `opacity="${f2(1 - fog * 0.6)}"`));
      // 1층 진열창
      const zA = z0 + (z1 - z0) * 0.2, zB = z0 + (z1 - z0) * 0.8;
      const shop = pts([[X(side * W, zA), Y(0.2, zA)], [X(side * W, zB), Y(0.2, zB)], [X(side * W, zB), Y(1.25, zB)], [X(side * W, zA), Y(1.25, zA)]]);
      const litShop = rain ? r() < 0.45 : r() < 0.4;
      A.add(A.path(shop, litShop ? mix("#c88e58", C.haze, fog * 0.7) : hz(rain ? C.win : "#8a9ab4")));
      const zc = (zA + zB) / 2;
      A.add(`<path d="M${i0(X(side * W, zc))} ${i0(Y(0.2, zc))}V${i0(Y(1.25, zc))}M${i0(X(side * W, zA))} ${i0(Y(0.5, zA))}L${i0(X(side * W, zB))} ${i0(Y(0.5, zB))}M${i0(X(side * W, zA))} ${i0(Y(0.2, zA))}L${i0(X(side * W, zB))} ${i0(Y(0.2, zB))}" stroke="${hz(C.timber)}" stroke-width="${f(Math.max(1, 14 / zm))}" fill="none"/>`);
      if (litShop && !rain) A.add(A.ell(X(side * (W - 0.3), zc), Y(0.9, zc), 150 / zm, 110 / zm, lampG, 0.5));
      if (litShop) shopRefl.push([X(side * (W - 0.1), zm), Y(1.6, zm), (0.6 * F) / zm, fog]);
      // 매달린 간판 (정면을 향한 모양)
      if (zm < 11 && r() < 0.75) {
        const zz = z0 + 0.15, bx = X(side * W, zz), by = Y(-0.55, zz), ex = X(side * (W - 0.55), zz);
        const s = F / zz / 100;
        const sx = (bx + ex) / 2;
        let d = "";
        const kind = Math.floor(r() * 4);
        if (kind === 0) d = `M${f(sx - 18 * s)} ${f(by + 6 * s)}h${f(36 * s)}v${f(30 * s)}l${f(-18 * s)} ${f(10 * s)}l${f(-18 * s)} ${f(-10 * s)}z`;
        else if (kind === 1) d = `M${f(sx - 17 * s)} ${f(by + 24 * s)}a${f(17 * s)} ${f(17 * s)} 0 1 0 ${f(34 * s)} 0a${f(17 * s)} ${f(17 * s)} 0 1 0 ${f(-34 * s)} 0`;
        else if (kind === 2) d = `M${f(sx - 20 * s)} ${f(by + 8 * s)}h${f(40 * s)}v${f(24 * s)}h${f(-40 * s)}z`;
        else d = `M${f(sx - 14 * s)} ${f(by + 10 * s)}h${f(22 * s)}v${f(6 * s)}a${f(6 * s)} ${f(6 * s)} 0 0 1 0 ${f(12 * s)}v${f(4 * s)}h${f(-22 * s)}z`;
        A.add(`<path d="M${i0(bx)} ${i0(by)}H${i0(ex)}M${i0(sx - 10 * s)} ${i0(by)}v${f(8 * s)}M${i0(sx + 10 * s)} ${i0(by)}v${f(8 * s)}" stroke="${hz(C.sign)}" stroke-width="${f(Math.max(1, 3 * s))}"/>`, A.path(d, hz(kind % 2 ? "#7c1f33" : C.sign)));
        if (!rain) A.add(`<path d="M${f(sx - 18 * s)} ${f(by + 6 * s)}h${f(36 * s)}" stroke="#fbfcff" stroke-width="${f(Math.max(1, 3 * s))}"/>`);
      }
      if (i % 2 === 0 && z0 > 3) lamps.push([side, z0 + 0.1, fog]);
    }
  }
  // 길: 인도 + 돌길
  const road = pts([[X(-W, 16), Y(1.6, 16)], [X(W, 16), Y(1.6, 16)], [X(W, 1.25), 900], [X(-W, 1.25), 900]]);
  A.add(A.path(road, A.lin("road", 0, 0, 0, 1, [[0, C.ground[0]], [0.4, C.ground[1]], [1, C.ground[2]]])));
  let rows = "";
  const cw = W - 0.45;
  for (let z = 14, k = 0; z > 1.3; z /= 1.045, k++) {
    const y = Y(1.6, z), sw = (0.075 * F) / z;
    rows += `<path d="M${i0(X(-cw, z))} ${f(y)}H${i0(X(cw, z))}" stroke-width="${f(sw * 0.75)}" stroke-dasharray="${f((0.15 * F) / z)} ${f((0.05 * F) / z)}" stroke-dashoffset="${k % 2 ? f((0.1 * F) / z) : 0}"/>`;
  }
  A.add(`<g stroke="${rain ? "#3a4258" : "#c4c8d2"}" opacity="${rain ? 0.55 : 0.45}" fill="none">${rows}</g>`);
  if (!rain) {
    // 왼쪽 건물이 드리운 그림자 (낮은 겨울 해)
    A.add(A.path(pts([[X(-cw, 16), Y(1.6, 16)], [X(0.2, 16), Y(1.6, 16)], [X(-0.6, 5), Y(1.6, 5)], [X(0.4, 3), Y(1.6, 3)], [X(-0.3, 1.3), 900], [X(-cw, 1.3), 900]]), "#4a5478", 'opacity=".35"'));
  }
  // 연석
  A.add(`<path d="M${i0(X(-cw, 16))} ${i0(Y(1.6, 16))}L${i0(X(-cw, 1.25))} 900M${i0(X(cw, 16))} ${i0(Y(1.6, 16))}L${i0(X(cw, 1.25))} 900" stroke="${rain ? "#6a7390" : "#f4f6fa"}" stroke-width="5" opacity=".6"/>`);
  if (!rain) {
    // 길가에 쌓인 눈
    for (const side of [-1, 1]) A.add(A.path(pts([[X(side * W, 16), Y(1.6, 16)], [X(side * (cw - 0.1), 16), Y(1.6, 16)], [X(side * (cw - 0.15), 1.25), 900], [X(side * W, 1.25), 900]]), "#f2f5fb", 'opacity=".9"'));
    // 길 위 눈 자국과 먼 행인
    let sn = "";
    for (let i = 0; i < 26; i++) {
      const z = 1.6 + Math.pow(r(), 1.5) * 12, sd = r() < 0.5 ? -1 : 1;
      const x = X(sd * (cw - 0.2 - r() * 0.25), z), y = Y(1.6, z), w = (0.4 + r() * 0.6) * F / z, h = w * 0.05;
      sn += `M${i0(x - w / 2)} ${i0(y)}q${i0(w / 2)} ${i0(-h * 2)} ${i0(w)} 0q${i0(-w / 2)} ${i0(h)} ${i0(-w)} 0z`;
    }
    A.add(A.path(sn, "#f4f7fc", 'opacity=".85"'));
    A.add(A.rect(0, 0, 1600, 900, A.lin("coolair", 0, 0, 0, 1, [[0, "#ffffff", 0], [0.45, "#eef2fa", 0.25], [1, "#3a3c48", 0]])));
  }
  // 가로등
  let posts = "";
  const gl: [number, number, number][] = [];
  let refl = "";
  for (const [side, z, fog] of lamps) {
    const x = X(side * (cw + 0.05), z), yb = Y(1.6, z), yt = Y(-1.4, z), s = F / z / 100;
    posts += `<path d="M${i0(x)} ${i0(yb)}V${i0(yt)}" stroke-width="${f(Math.max(1.5, 5 * s))}"/><path d="M${f(x - 6 * s)} ${i0(yt)}h${f(12 * s)}l${f(-2 * s)} ${f(-16 * s)}h${f(-8 * s)}z"/>`;
    if (rain) {
      gl.push([x, yt - 9 * s, 90 * s]);
      refl += `<path d="M${i0(x - 5 * s)} ${i0(yb + 4)}h${i0(10 * s)}l${i0(8 * s)} ${i0(160 * s)}h${i0(-26 * s)}z" opacity="${f2(0.75 - fog * 0.5)}"/>`;
    }
  }
  A.add(`<g fill="${rain ? "#0c101c" : "#2a2c38"}" stroke="${rain ? "#0c101c" : "#2a2c38"}">${posts}</g>`);
  if (rain) {
    const rg = A.lin("rf", 0, 0, 0, 1, [[0, "#f6c070", 0.85], [1, "#f6c070", 0]]);
    for (const [x, y, w, fog] of shopRefl) refl += `<path d="M${i0(x - w / 2)} ${i0(y)}h${i0(w)}l${i0(w * 0.2)} ${i0(w * 1.4)}h${i0(-w * 1.4)}z" opacity="${f2(0.5 - fog * 0.4)}"/>`;
    A.add(`<g fill="${rg}" filter="${blur}">${refl}</g>`, glows(lampG, 0.85, gl));
    for (const [x, y, rr] of gl.slice(0, 4)) A.add(A.ell(x, y, rr * 0.5, rr * 0.5, lampG, 0.6, A.a("fl", r() * 3, 3 + r() * 2)));
    let cores = "";
    for (const [x, y, rr] of gl) cores += `M${i0(x)} ${i0(y)}h0`;
    A.add(`<path d="${cores}" stroke="#fff4d0" stroke-width="7" stroke-linecap="round"/>`);
    // 젖은 길의 번들거림
    const wet = A.lin("wet", 0, 0, 1, 0, [[0, "#9aa8cc", 0], [0.5, "#9aa8cc", 0.5], [1, "#9aa8cc", 0]]);
    for (let i = 0; i < 10; i++) {
      const z = 1.5 + r() * 6, y = Y(1.6, z) + 2;
      A.add(A.rect(X((r() * 2 - 1) * 1.6, z) - 40, y, 80 + r() * 60, Math.max(1, 5 / z), wet, A.a("sh", r() * 7, 6 + r() * 4)));
    }
    // 가운데 물웅덩이: 탑과 하늘이 비친다
    A.add(A.ell(VX, 700, 260, 26, A.glowG("pud", "#8a96b8"), 0.55));
    // 빗줄기 결 (잔잔하게)
    A.defs.push(`<pattern id="${A.id("rain")}" width="60" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><path d="M8 0v34M31 50v28M47 12v22M19 86v26" stroke="#c8d4f0" stroke-width="1"/></pattern>`);
    A.add(A.rect(0, 0, 1600, 900, A.u("rain"), 'opacity=".16"'));
    A.add(A.rect(0, 0, 1600, 900, A.lin("mist", 0, 0, 0, 1, [[0, "#8a94b0", 0.12], [0.5, "#8a94b0", 0.28], [1, "#8a94b0", 0]])));
    finish(A, "#04060e", 0.6, 0.45);
  } else {
    finish(A, "#2a2e40", 0.3, 0.3);
  }
  return A.svg();
}

// ───────────────────────── 실내 도구 ─────────────────────────

/** 원근 사각면 (4점) 경로 */
type P3 = [number, number, number];
function persp(VX: number, VY: number, F: number) {
  const X = (x: number, z: number) => VX + (x * F) / z;
  const Y = (y: number, z: number) => VY + (y * F) / z;
  const q = (...p: P3[]) => pts(p.map(([x, y, z]) => [X(x, z), Y(y, z)] as [number, number]));
  return { X, Y, q };
}

/** 쌓인 책 더미 (정면) */
function bookStack(r: Rnd, x: number, yb: number, s: number, n: number, cols: string[]): string {
  let out = "";
  let y = yb;
  for (let i = 0; i < n; i++) {
    const w = (60 + r() * 30) * s, h = (9 + r() * 7) * s, dx = (r() - 0.5) * 12 * s;
    y -= h;
    const c = pick(r, cols);
    out += `<rect x="${i0(x - w / 2 + dx)}" y="${i0(y)}" width="${i0(w)}" height="${f(h)}" fill="${c}"/><rect x="${i0(x - w / 2 + dx + 2 * s)}" y="${f(y + h * 0.3)}" width="${i0(w - 5 * s)}" height="${f(h * 0.35)}" fill="#e8dcc0" opacity=".25"/>`;
  }
  return out;
}

// ───────────────────────── 다락방 ─────────────────────────

function room(): string {
  const A = new Art("bg-room");
  const r = mulberry32(1111);
  const blur = A.blur("soft", 14);
  const { X, Y, q } = persp(800, 430, 600);
  const Zb = 6, Wd = 3.2, FL = 3.1, KN = -0.1, AP = -3.4;
  const zN = 1.4;
  A.add(A.rect(0, 0, 1600, 900, "#140e1a"));
  // 뒷벽 (박공)
  const back = pts([[X(-Wd, Zb), Y(FL, Zb)], [X(-Wd, Zb), Y(KN, Zb)], [X(0, Zb), Y(AP, Zb)], [X(Wd, Zb), Y(KN, Zb)], [X(Wd, Zb), Y(FL, Zb)]]);
  A.add(A.path(back, A.lin("back", 0, 0, 0, 1, [[0, "#2a2238"], [0.5, "#4a3444"], [1, "#5a3c3c"]])));
  // 둥근 창과 밤하늘
  const wx = 800, wy = 300, wr = 104;
  const wc = A.clip("win", `M${wx - wr} ${wy}a${wr} ${wr} 0 1 0 ${wr * 2} 0a${wr} ${wr} 0 1 0 ${-wr * 2} 0`);
  let sky = A.rect(wx - wr, wy - wr, wr * 2, wr * 2, A.lin("sky", 0, 0, 0, 1, [[0, "#0a1236"], [0.6, "#1d2a6a"], [1, "#3a3f80"]]));
  sky += ring(A, { cx: 1300, cy: 900, R: 800, a0: arcA(1300, 800, 600), a1: arcA(1300, 800, 1100), w: 90, n: 200, twinkle: 3, seed: 13, dense: 1, box: [wx - wr, wy - wr, wx + wr, wy + wr] }, blur);
  sky += starField(r, 40, wx - wr, wy - wr, wx + wr, wy + wr, "#dfe6ff", 0.9);
  sky += `<path d="M${wx - wr} ${wy + 70}q40-30 70-10t60-20 70 16 50-10V${wy + wr}H${wx - wr}z" fill="#141a3c"/>`;
  A.add(A.ell(wx, wy, 230, 230, A.glowG("wglow", "#9fb4ff"), 0.35));
  A.add(`<g clip-path="${wc}">${sky}</g>`);
  A.add(`<circle cx="${wx}" cy="${wy}" r="${wr}" fill="none" stroke="#3a2a2a" stroke-width="16"/><circle cx="${wx}" cy="${wy}" r="${wr + 8}" fill="none" stroke="#8a6a58" stroke-width="3" opacity=".6"/><path d="M${wx - wr} ${wy}H${wx + wr}M${wx} ${wy - wr}V${wy + wr}" stroke="#3a2a2a" stroke-width="7"/>`);
  A.add(`<path d="M${wx - wr - 20} ${wy + wr + 8}h${wr * 2 + 40}v12h${-wr * 2 - 40}z" fill="#5a4034"/>`);
  // 경사 천장 (좌우) + 무릎벽
  for (const s of [-1, 1]) {
    A.add(A.path(q([s * Wd, KN, Zb], [0, AP, Zb], [0, AP, zN], [s * Wd, KN, zN]), A.lin("ceil" + s, s < 0 ? 1 : 0, 0, s < 0 ? 0 : 1, 0, [[0, "#3a2c3c"], [1, "#120c18"]])));
    A.add(A.path(q([s * Wd, KN, Zb], [s * Wd, FL, Zb], [s * Wd, FL, zN], [s * Wd, KN, zN]), A.lin("knee" + s, s < 0 ? 1 : 0, 0, s < 0 ? 0 : 1, 0, [[0, "#4a3440"], [1, "#160e16"]])));
    // 서까래
    let raf = "", hi = "";
    for (let z = Zb; z > zN; z /= 1.32) {
      raf += `M${i0(X(s * Wd, z))} ${i0(Y(KN, z))}L${i0(X(0, z))} ${i0(Y(AP, z))}`;
      hi += `M${i0(X(s * Wd, z) - s * 0)} ${i0(Y(KN, z) + 3)}L${i0(X(0, z))} ${i0(Y(AP, z) + 3)}`;
    }
    A.add(`<path d="${raf}" stroke="#1a1016" stroke-width="16" fill="none"/><path d="${hi}" stroke="#a8745a" stroke-width="2" opacity=".4" fill="none"/>`);
  }
  A.add(`<path d="M${X(0, Zb)} ${i0(Y(AP, Zb))}V-10" stroke="#1a1016" stroke-width="18"/>`);
  // 바닥
  A.add(A.path(q([-Wd, FL, Zb], [Wd, FL, Zb], [Wd, FL, 1.2], [-Wd, FL, 1.2]), A.lin("floor", 0, 0, 0, 1, [[0, "#4a3030"], [0.5, "#2a1a1e"], [1, "#0e080a"]])));
  let pl = "";
  for (let i = -6; i <= 6; i++) pl += `M${i0(X(i * 0.53, Zb))} ${i0(Y(FL, Zb))}L${i0(X(i * 0.53, 1.2))} ${i0(Y(FL, 1.2))}`;
  A.add(`<path d="${pl}" stroke="#120a0c" stroke-width="1.5" opacity=".6"/>`);
  // 달빛 웅덩이
  A.add(`<path d="${q([-0.9, FL, 5.5], [0.9, FL, 5.5], [1.3, FL, 2.8], [-1.3, FL, 2.8])}" fill="#9fb4ff" opacity=".16" filter="${blur}"/>`);
  A.add(`<path d="M700 ${wy + 20}L900 ${wy + 20}L${X(1.3, 2.8)} ${i0(Y(FL, 2.8))}L${X(-1.3, 2.8)} ${i0(Y(FL, 2.8))}Z" fill="${A.lin("beam", 0, 0, 0, 1, [[0, "#b8c8ff", 0.2], [1, "#b8c8ff", 0]])}" filter="${blur}"/>`);
  // 침대 둘
  const quilt = [A.lin("q1", 0, 0, 1, 1, [[0, "#8a3a3a"], [1, "#4a1e2a"]]), A.lin("q2", 0, 0, 1, 1, [[0, "#3a4a7a"], [1, "#1e2446"]])];
  for (const s of [-1, 1]) {
    const x0 = s * Wd, x1 = s * 1.45, za = 2.0, zb = 4.8, top = 2.05;
    A.add(A.path(q([x0, FL, zb], [x0, 1.25, zb], [x1, 1.25, zb], [x1, FL, zb]), "#3a2420"), `<path d="M${i0(X(x0, zb))} ${i0(Y(1.25, zb))}H${i0(X(x1, zb))}" stroke="#b07a58" stroke-width="3" opacity=".5"/>`);
    // 무릎벽 선반과 책
    const sy = Y(0.55, 5.6);
    A.add(A.path(q([x0, 0.55, 5.4], [x0 * 0.62, 0.55, 5.4], [x0 * 0.62, 0.62, 5.4], [x0, 0.62, 5.4]), "#5a3c2c"));
    A.add(bookStack(r, X(x0 * 0.8, 5.4), sy - 2, 0.5, 4, ["#7c3a36", "#3d4d6e", "#6d5a38", "#2f5249"]));
    A.add(A.path(q([x0, top, za], [x0, top, zb], [x1, top, zb], [x1, top, za]), s < 0 ? quilt[0] : quilt[1]));
    A.add(A.path(q([x1, top, za], [x1, top, zb], [x1, FL - 0.2, zb], [x1, FL - 0.2, za]), s < 0 ? "#5a2426" : "#262c52"));
    A.add(A.path(q([x0, top, za], [x1, top, za], [x1, FL, za], [x0, FL, za]), "#1a0e10"));
    A.add(A.path(q([x0 * 0.95 + x1 * 0.05, top - 0.25, zb - 0.1], [x1 * 0.9 + x0 * 0.1, top - 0.25, zb - 0.1], [x1 * 0.9 + x0 * 0.1, top, zb - 0.7], [x0 * 0.95 + x1 * 0.05, top, zb - 0.7]), "#e8dcc8"));
    let patch = "";
    for (let k = 1; k < 5; k++) { const z = za + ((zb - za) * k) / 5; patch += `M${i0(X(x0, z))} ${i0(Y(top, z))}L${i0(X(x1, z))} ${i0(Y(top, z))}`; }
    patch += `M${i0(X((x0 + x1) / 2, za))} ${i0(Y(top, za))}L${i0(X((x0 + x1) / 2, zb))} ${i0(Y(top, zb))}`;
    A.add(`<path d="${patch}" stroke="#f0d8a8" stroke-width="1.5" stroke-dasharray="5 4" opacity=".4"/>`);
  }
  // 협탁 + 촛불 + 책
  const cg = A.glowG("cand", "#f6c070", "#fff1c4");
  A.add(A.ell(820, 540, 700, 460, cg, 0.45));
  A.add(A.path(q([-0.6, 1.95, 5.6], [0.6, 1.95, 5.6], [0.6, 1.95, 5.0], [-0.6, 1.95, 5.0]), "#6a4634"), A.path(q([-0.6, 1.95, 5.0], [0.6, 1.95, 5.0], [0.6, FL, 5.0], [-0.6, FL, 5.0]), "#2e1c1a"));
  const ty = Y(1.95, 5.0);
  A.add(bookStack(r, 750, ty, 0.55, 3, ["#7c3a36", "#3d4d6e", "#6d5a38"]));
  A.add(candle(A, 830, ty, 26, 1.1, cg, r, 170));
  // 바닥의 책더미
  const bc = ["#6e3230", "#34425f", "#5f4e30", "#2a463f", "#7a5c3e"];
  A.add(bookStack(r, 470, Y(FL, 3.3), 1, 6, bc), bookStack(r, 1150, Y(FL, 3.0), 1.1, 4, bc), bookStack(r, 1215, Y(FL, 3.0), 0.9, 7, bc));
  // 따뜻한 빛이 닿는 가장자리
  A.add(A.ell(830, ty - 30, 90, 90, cg, 0.6, A.a("fl", 0.6, 3.1)));
  A.add(A.rect(0, 0, 1600, 900, A.rad("warm", [[0, "#f6a860", 0.22], [0.5, "#f6a860", 0.07], [1, "#f6a860", 0]], 'cx=".52" cy=".62" r=".55"')));
  finish(A, "#06030a", 0.7, 0.5);
  return A.svg();
}

// ───────────────────────── 루시엔의 집무실 ─────────────────────────

function study(): string {
  const A = new Art("bg-study");
  const r = mulberry32(1212);
  const blur = A.blur("soft", 12);
  A.add(A.rect(0, 0, 1600, 900, A.lin("wall", 0, 0, 0, 1, [[0, "#141a34"], [0.6, "#242a48"], [1, "#161826"]])));
  // 키 큰 창
  const wx0 = 640, wx1 = 960, wyb = 560, wyt = 70;
  const wd = arch(wx0, wyb, wx1 - wx0, wyt, 0.5);
  const wc = A.clip("win", wd);
  let out = A.rect(wx0, wyt, wx1 - wx0, wyb - wyt, A.lin("sky", 0, 0, 0, 1, [[0, "#0c1440"], [0.55, "#2a3a80"], [1, "#6a6a9c"]]));
  out += ring(A, { cx: 1500, cy: 1200, R: 1200, a0: arcA(1500, 1200, 500), a1: arcA(1500, 1200, 1100), w: 80, n: 60, twinkle: 3, seed: 21, dense: 0.6, box: [wx0, wyt, wx1, wyb] }, blur);
  out += starField(r, 30, wx0, wyt, wx1, 380, "#dfe6ff", 0.8);
  out += cityRow(A, { name: "c1", seed: 22, x0: wx0 - 20, x1: wx1 + 20, base: () => wyb - 30, hMin: 20, hMax: 60, wMin: 18, wMax: 34, top: "#2a3470", bottom: "#3a3a70", win: 0.3, ws: 2, spire: 0.25, rim: "#b9c6f2", rimOp: 0.5 });
  out += cityRow(A, { name: "c2", seed: 23, x0: wx0 - 20, x1: wx1 + 20, base: () => wyb + 4, hMin: 20, hMax: 50, wMin: 30, wMax: 50, top: "#141a44", bottom: "#1a1e44", win: 0.35, ws: 3, spire: 0.1 });
  A.add(A.ell(800, 330, 360, 330, A.glowG("wglow", "#8fa6ff"), 0.3));
  A.add(`<g clip-path="${wc}">${out}</g>`);
  A.add(`<path d="${wd}" fill="none" stroke="#0e1024" stroke-width="18"/><path d="M800 ${wyb}V${wyt}M${wx0} 330H${wx1}M${wx0} 200H${wx1}M${wx0} 450H${wx1}" stroke="#0e1024" stroke-width="6"/>`);
  A.add(`<path d="${arch(wx0 - 14, wyb + 6, wx1 - wx0 + 28, wyt - 14, 0.5)}" fill="none" stroke="#6a78b0" stroke-width="2" opacity=".5"/>`);
  // 커튼
  for (const s of [-1, 1]) {
    const x = s < 0 ? wx0 - 60 : wx1 + 60;
    A.add(`<path d="M${x - 50} 20C${x - 30} 260 ${x - 60} 520 ${x - 40} 700H${x + 50}C${x + 30} 520 ${x + 60} 260 ${x + 50} 20Z" fill="${A.lin("cur" + s, 0, 0, 1, 0, s < 0 ? [[0, "#1a1430"], [0.7, "#3a2a50"], [1, "#6a5a90"]] : [[0, "#6a5a90"], [0.3, "#3a2a50"], [1, "#1a1430"]])}"/>`);
  }
  // 책장 (양쪽 벽, 정면 평면 두 겹)
  const books = ["#5a2c2e", "#2a3654", "#4e4028", "#233a35", "#62482e", "#3e2436"];
  for (const s of [-1, 1]) {
    for (const [x0, x1, dim] of [[160, 520, 0.35], [-60, 180, 0.0]] as [number, number, number][]) {
      const a = s < 0 ? x0 : 1600 - x1, b = s < 0 ? x1 : 1600 - x0;
      A.add(A.rect(a, 0, b - a, 760, mix("#1a1016", "#242a48", dim)));
      let d: string[] = books.map(() => "");
      for (let y = 740; y > 20; y -= 88) {
        for (let x = a + 10; x < b - 10; ) {
          const w = 8 + r() * 10, h = 50 + r() * 26;
          d[Math.floor(r() * books.length)] += `M${i0(x)} ${y}h${i0(w)}v${i0(-h)}h${i0(-w)}z`;
          x += w + 1;
        }
      }
      A.add(d.map((p, i) => A.path(p, mix(books[i], "#242a48", dim))).join(""));
      let sh = "";
      for (let y = 744; y > 20; y -= 88) sh += `M${a} ${y}H${b}`;
      A.add(`<path d="${sh}" stroke="${mix("#3a2620", "#242a48", dim)}" stroke-width="8"/>`, A.rect(a, 0, 14, 760, mix("#2a1a16", "#242a48", dim)), A.rect(b - 14, 0, 14, 760, mix("#2a1a16", "#242a48", dim)));
      if (dim) A.add(A.rect(a, 0, b - a, 760, "#141a34", 'opacity=".35"'));
    }
  }
  // 바닥 탑처럼 쌓인 책
  A.add(bookStack(r, 560, 760, 1.1, 14, books), bookStack(r, 1060, 760, 1.2, 11, books), bookStack(r, 1140, 760, 0.9, 7, books));
  // 바닥
  A.add(A.rect(0, 740, 1600, 160, A.lin("floor", 0, 0, 0, 1, [[0, "#2a1c20"], [1, "#0a0608"]])));
  // 램프 빛 (왼쪽, 따뜻하게)
  const lg = A.glowG("lamp", "#f6c070", "#fff1c8");
  A.add(A.ell(620, 520, 520, 380, lg, 0.35));
  // 책상 (정면)
  A.add(A.path("M430 600H1170L1210 632H390Z", A.lin("dtop", 0, 0, 0, 1, [[0, "#6a4636"], [1, "#3a241e"]])));
  A.add(A.rect(410, 632, 780, 130, A.lin("dfront", 0, 0, 1, 0, [[0, "#3a2420"], [0.35, "#2a1816"], [1, "#140c0e"]])));
  A.add(`<path d="M390 632H1210" stroke="#d8a070" stroke-width="2" opacity=".5"/><path d="M470 660h200v70h-200zM930 660h200v70h-200z" fill="none" stroke="#5a3a2c" stroke-width="3"/>`);
  // 의자 등받이
  A.add(`<path d="M720 600V470Q800 430 880 470V600Z" fill="#140c14"/><path d="M720 470Q800 430 880 470" stroke="#8a6a8a" stroke-width="2" fill="none" opacity=".4"/>`);
  // 램프
  A.add(`<path d="M600 600h40l-6-10h-28zM617 590V520" stroke="#2a1a14" stroke-width="3" fill="#3a2a1c"/><path d="M588 530h64l-14-40h-36z" fill="#e8b068"/>`);
  A.add(A.ell(620, 520, 90, 90, lg, 0.85, A.a("fl", 0.4, 4.5)));
  A.add(A.ell(620, 600, 160, 18, lg, 0.6));
  // 찻잔
  A.add(`<ellipse cx="930" cy="604" rx="30" ry="6" fill="#dcd6cb"/><path d="M912 580h36l-4 20q-14 6-28 0z" fill="#f4f1ea"/><path d="M948 584q12 2 6 12" stroke="#f4f1ea" stroke-width="3" fill="none"/><ellipse cx="930" cy="580" rx="18" ry="3.5" fill="#8a5a34"/>`);
  A.add(`<path d="M924 572q-6-10 2-18M934 570q6-12-2-20" stroke="#dfe6ff" stroke-width="1.5" fill="none" opacity=".35"/>`);
  // 작은 액자 속 종이
  A.add(`<path d="M1010 600l6-58h54l6 58z" fill="#6a4a2a"/><path d="M1020 594l4-44h40l4 44z" fill="#f4f1ea"/><path d="M1030 562h26M1030 570h22M1030 578h26" stroke="#5e8fe8" stroke-width="1.4" opacity=".6"/>`);
  // 서류와 깃펜
  A.add(`<path d="M700 596l110-4 10 10-112 4z" fill="#e8e2d4"/><path d="M790 560q20 10 26 34" stroke="#f4f1ea" stroke-width="3" fill="none"/><ellipse cx="820" cy="598" rx="10" ry="4" fill="#0d1330"/>`);
  // 창빛이 책상 위에
  A.add(`<path d="M${wx0} ${wyb}H${wx1}L1060 610H540Z" fill="#9fb4ff" opacity=".12" filter="${blur}"/>`);
  finish(A, "#04040c", 0.65, 0.45);
  return A.svg();
}

// ───────────────────────── 천명록의 방 ─────────────────────────

/** 성묵 글자처럼 보이는 곡선 획 (path d) */
function glyph(r: Rnd, x: number, y: number, s: number): string {
  let d = `M${f(x)} ${f(y)}`;
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const kind = r();
    if (kind < 0.4) d += `q${f((r() - 0.3) * 14 * s)} ${f(-(4 + r() * 8) * s)} ${f((4 + r() * 8) * s)} ${f((r() - 0.5) * 10 * s)}`;
    else if (kind < 0.7) d += `m${f(-6 * s)} ${f(-4 * s)}v${f((6 + r() * 8) * s)}`;
    else d += `a${f(4 * s)} ${f(4 * s)} 0 1 1 ${f(3 * s)} ${f(5 * s)}`;
  }
  return d;
}

function register(): string {
  const A = new Art("bg-register");
  const r = mulberry32(1313);
  const blur = A.blur("soft", 18);
  A.add(A.rect(0, 0, 1600, 900, A.lin("bg", 0, 0, 0, 1, [[0, "#05081c"], [0.5, "#0e1638"], [1, "#070a1c"]])));
  // 돔: 오쿨루스를 향해 모이는 늑골
  const OX = 800, OY = 78, orx = 190, ory = 58;
  let ribs = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    if (Math.sin(a) > 0.5) continue;
    const sx = OX + Math.cos(a) * orx, sy = OY + Math.sin(a) * ory;
    const ex = OX + Math.cos(a) * 1250, ey = 470 + Math.sin(a) * 60;
    ribs += `M${i0(sx)} ${i0(sy)}Q${i0(OX + Math.cos(a) * 820)} ${i0(OY + Math.sin(a) * ory * 2)} ${i0(ex)} ${i0(ey)}`;
  }
  A.add(A.ell(OX, OY + 120, 900, 420, A.lin("dome", 0, 0, 0, 1, [[0, "#1e2a60"], [1, "#0b1030"]])));
  A.add(`<g fill="none" stroke="#2c3a7a" stroke-width="6" opacity=".6"><ellipse cx="${OX}" cy="${OY + 14}" rx="360" ry="100"/><ellipse cx="${OX}" cy="${OY + 40}" rx="620" ry="190"/></g>`);
  A.add(`<path d="${ribs}" stroke="#2c3a7a" stroke-width="10" fill="none" opacity=".7"/><path d="${ribs}" stroke="#8fb8ff" stroke-width="1.5" fill="none" opacity=".25"/>`);
  // 오쿨루스와 천환
  const oc = A.clip("oc", `M${OX - orx} ${OY}a${orx} ${ory} 0 1 0 ${orx * 2} 0a${orx} ${ory} 0 1 0 ${-orx * 2} 0`);
  let sky = A.rect(OX - orx, OY - ory, orx * 2, ory * 2, "#0a1236");
  sky += ring(A, { cx: 1100, cy: 600, R: 600, a0: arcA(1100, 600, 580), a1: arcA(1100, 600, 1020), w: 60, n: 160, twinkle: 2, seed: 41, dense: 1, box: [OX - orx, OY - ory, OX + orx, OY + ory] }, blur);
  A.add(`<g clip-path="${oc}">${sky}</g>`, `<ellipse cx="${OX}" cy="${OY}" rx="${orx}" ry="${ory}" fill="none" stroke="#b9c6f2" stroke-width="4" opacity=".6"/>`);
  // 별빛 기둥 (오쿨루스 → 책)
  const bg = A.lin("shaft", 0, 0, 0, 1, [[0, "#dfe8ff", 0.55], [0.6, "#8fb8ff", 0.25], [1, "#8fb8ff", 0.05]]);
  A.add(`<path d="M${OX - orx + 30} ${OY + 40}H${OX + orx - 30}L${OX + 250} 560H${OX - 250}Z" fill="${bg}" filter="${blur}"/>`);
  // 원형 열주: 뒤쪽 (작게, 흐리게)
  const ring3 = (back: boolean) => {
    let s = "";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.11;
      const sn = Math.sin(a);
      if (back ? sn > 0 : sn <= 0.25) continue;
      const depth = (1 - sn) / 2; // 0 가까이, 1 멀리
      const x = OX + Math.cos(a) * 760 * (1 - depth * 0.35), sc = 1.5 - depth * 1.0;
      if (!back && Math.abs(x - OX) < 420) continue;
      const yb = 560 + (1 - depth) * 250, h = 520 * sc, w = 48 * sc;
      const lit = mix("#34448a", "#0b1030", depth * 0.4), dk = mix("#0e1434", "#0b1030", depth * 0.4);
      s += A.rect(x - w / 2, yb - h, w / 2, h, back ? mix(lit, "#1a2456", 0.5) : lit) + A.rect(x, yb - h, w / 2, h, dk);
      s += A.rect(x - w * 0.7, yb - h, w * 1.4, 12 * sc, back ? "#2a3670" : "#3c4c92") + A.rect(x - w * 0.65, yb - 16 * sc, w * 1.3, 16 * sc, back ? "#1a2456" : "#24306a");
      s += `<path d="M${i0(x - w / 2)} ${i0(yb - h)}V${i0(yb)}" stroke="#8fb8ff" stroke-width="${f(1.5 * sc)}" opacity="${back ? 0.3 : 0.5}"/>`;
    }
    return s;
  };
  A.add(ring3(true));
  // 바닥: 동심원 문양
  A.add(A.ell(OX, 640, 900, 220, A.lin("floor", 0, 0, 0, 1, [[0, "#18225a"], [1, "#070a1c"]])));
  let circ = "";
  for (const k of [0.25, 0.45, 0.7, 0.95]) circ += `<ellipse cx="${OX}" cy="640" rx="${i0(820 * k)}" ry="${i0(200 * k)}"/>`;
  A.add(`<g fill="none" stroke="#5e8fe8" stroke-width="2" opacity=".35">${circ}</g>`);
  let ticks = "";
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; ticks += `M${i0(OX + Math.cos(a) * 574)} ${i0(640 + Math.sin(a) * 140)}L${i0(OX + Math.cos(a) * 610)} ${i0(640 + Math.sin(a) * 149)}`; }
  A.add(`<path d="${ticks}" stroke="#8fb8ff" stroke-width="2" opacity=".4"/>`);
  A.add(A.ell(OX, 610, 520, 130, A.glowG("fglow", "#5e8fe8", "#8fb8ff"), 0.5));
  // 독서대와 천명록
  A.add(`<path d="M770 700L790 560H810L830 700Z" fill="#141c48"/><path d="M740 710h120v14h-120z" fill="#1c2658"/><path d="M790 560h20" stroke="#8fb8ff" stroke-width="2" opacity=".6"/>`);
  A.add(`<path d="M660 548L790 520L800 560L680 580Z" fill="#26306a"/><path d="M940 548L810 520L800 560L920 580Z" fill="#1a2256"/>`);
  A.add(`<path d="M672 540Q735 505 800 520V556Q735 548 684 572Z" fill="#dfe6ff"/><path d="M928 540Q865 505 800 520V556Q865 548 916 572Z" fill="#b9c6f2"/>`);
  let lines = "";
  for (let i = 0; i < 6; i++) { lines += `M${690 + i * 3} ${538 + i * 5}q50-14 98-6M${812} ${528 + i * 5}q50-6 ${96 - i * 3} ${8 + i}`; }
  A.add(`<path d="${lines}" stroke="#5e8fe8" stroke-width="1.6" fill="none" opacity=".75"/>`);
  const bk = A.glowG("book", "#8fb8ff", "#eef4ff");
  A.add(A.ell(800, 530, 420, 220, bk, 0.75), A.ell(800, 535, 150, 60, bk, 0.9, A.a("br", 1, 5)));
  // 떠오르는 성묵 글자
  let gl = "";
  const gd: string[] = [];
  for (let i = 0; i < 18; i++) {
    const x = 800 + gauss(r) * 170, y = 470 - r() * 330, s = 1.1 + r() * 1.3;
    const d = glyph(r, x, y, s);
    if (i < 16) gl += `<path d="${d}" ${A.a("dr", r() * 14, 11 + r() * 8)}/>`;
    else gd.push(d);
  }
  A.add(`<g fill="none" stroke="#bcd4ff" stroke-width="2" stroke-linecap="round">${gl}</g>`);
  const sd: [number, number][] = [];
  for (let i = 0; i < 70; i++) sd.push([800 + gauss(r) * 200, 120 + r() * 440]);
  A.add(dots(sd, "#dfe8ff", 2, 0.6));
  A.add(ring3(false));
  finish(A, "#02030c", 0.7, 0.45);
  return A.svg();
}

export const CITY_BACKGROUNDS: Record<string, string> = {
  archive: archive(false),
  archive_night: archive(true),
  room: room(),
  study: study(),
  register: register(),
  capital_night: capitalNight(),
  bridge: bridge(),
  festival: festival(),
  tower: tower(),
  street: streetScene(false),
  rain_street: streetScene(true),
};
