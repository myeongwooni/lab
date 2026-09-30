// 서울·왕도 솔레인 배경 16장. 모두 코드로 그린 SVG 문자열입니다.
// 화풍: TV 애니메이션 판타지 극장판의 배경미술 — 밝은 하늘, 또렷한 색면, 공기 원근, 역광 빛번짐.
// 규칙(docs/art-direction.md 4절): id·클래스 접두어 `<id>-`, 필터 2개 이하, 움직이는 요소 40개 이하
// (opacity/transform만, reduced-motion에서 끔), 시드 고정 난수, <text> 없음.

type Stop = [number, string, number?];
type Rnd = () => number;
type P2 = [number, number];

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
const i0 = (v: number) => String(Math.round(v));
function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
/** 두 색 사이 보간 */
function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
}
const rel = (d: string) => d.replace(/ -/g, "-");
const gauss = (r: Rnd) => (r() + r() + r() - 1.5) / 1.5;
const pts = (p: P2[]) => "M" + p.map(([x, y]) => `${i0(x)} ${i0(y)}`).join("L") + "Z";
/** 상대 좌표 다각형 (짧은 문자열) */
function pr(p: P2[]): string {
  const q = p.map(([x, y]) => [Math.round(x), Math.round(y)]);
  let d = `M${q[0][0]} ${q[0][1]}l`;
  for (let i = 1; i < q.length; i++) d += `${i > 1 ? " " : ""}${q[i][0] - q[i - 1][0]} ${q[i][1] - q[i - 1][1]}`;
  return rel(d + "z");
}
/** 세로 선분 [x, y, len] 목록을 상대 이동으로 이은 경로 (stroke로 그림) */
function vsegs(list: [number, number, number][]): string {
  let d = "", px = 0, py = 0;
  list.forEach(([x0, y0, l], i) => {
    const x = Math.round(x0), y = Math.round(y0), L = Math.max(1, Math.round(l));
    d += i ? `m${x - px} ${y - py}` : `M${x} ${y}`;
    d += `v${L}`;
    px = x;
    py = y + L;
  });
  return rel(d);
}
const bell = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
/** 사각형 경로 (정수) */
const rp = (x: number, y: number, w: number, h: number) => rel(`M${i0(x)} ${i0(y)}h${i0(w)}v${i0(h)}h${i0(-w)}z`);
/** 원 경로 */
const cp = (x: number, y: number, r: number) => {
  const q = r >= 6 ? i0 : f;
  return rel(`M${q(x - r)} ${q(y)}a${q(r)} ${q(r)} 0 1 0 ${q(r * 2)} 0a${q(r)} ${q(r)} 0 1 0 ${q(-r * 2)} 0`);
};
/** 타원 경로 */
const ep = (x: number, y: number, rx: number, ry: number) => {
  const q = Math.min(rx, ry) >= 6 ? i0 : f;
  return rel(`M${q(x - rx)} ${q(y)}a${q(rx)} ${q(ry)} 0 1 0 ${q(rx * 2)} 0a${q(rx)} ${q(ry)} 0 1 0 ${q(-rx * 2)} 0`);
};

/** 위가 둥근(또는 뾰족한) 아치 창 경로. x=왼쪽, yb=아래, w=폭, yt=꼭대기, k=0.5면 반원 */
function arch(x: number, yb: number, w: number, yt: number, k = 0.5): string {
  const r = w * k;
  const rise = Math.sqrt(Math.max(0, r * r - (r - w / 2) * (r - w / 2)));
  const ys = yt + rise;
  return `M${f(x)} ${f(yb)}V${f(ys)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w / 2)} ${f(yt)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(ys)}V${f(yb)}Z`;
}

/** 노이즈 섞인 능선: x0~x1, 아래는 bottom까지 닫음 */
function ridge(r: Rnd, x0: number, x1: number, step: number, y: (x: number) => number, jit: number, bottom = 900): string {
  let d = `M${i0(x0)} ${bottom}`;
  for (let x = x0; x <= x1 + step; x += step) d += `L${i0(x)} ${i0(y(x) + gauss(r) * jit)}`;
  return d + `L${i0(x1 + step)} ${bottom}Z`;
}

type Anim = "tw" | "fl" | "sh" | "br" | "sw" | "bob" | "fx" | "sp";

class Art {
  defs: string[] = [];
  out: string[] = [];
  moving = 0;
  filters = 0;
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
  /** 세로 그라데이션 (userSpace y0→y1) */
  v(n: string, y0: number, y1: number, s: Stop[]) {
    return this.lin(n, 0, y0, 0, y1, s, true);
  }
  rad(n: string, s: Stop[], extra = "") {
    this.defs.push(`<radialGradient id="${this.id(n)}"${extra ? " " + extra : ""}>${this.stops(s)}</radialGradient>`);
    return this.u(n);
  }
  /** 가운데 불투명 → 가장자리 투명인 빛번짐 그라데이션 */
  glowG(n: string, c: string, core = "") {
    const s: Stop[] = [[0, core || c, 1], [0.12, c, 0.75], [0.35, c, 0.3], [0.65, c, 0.08], [1, c, 0]];
    return this.rad(n, s);
  }
  blur(n: string, sd: number) {
    this.filters++;
    this.defs.push(`<filter id="${this.id(n)}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
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
  a(cls: Anim, delay: number, dur?: number) {
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
    return d ? `<path d="${d}" fill="${fill}"${extra ? " " + extra : ""}/>` : "";
  }
  line(d: string, stroke: string, w: number, extra = "") {
    return d ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${f(w)}"${extra ? " " + extra : ""}/>` : "";
  }
  svg() {
    const p = this.p;
    const all: Anim[] = ["tw", "fl", "sh", "br", "sw", "bob", "fx", "sp"];
    const used = all.filter((k) => this.out.some((s) => s.includes(`class="${p}-${k}"`)));
    const kf: Record<Anim, [string, string]> = {
      tw: ["5s ease-in-out", "0%,100%{opacity:1}50%{opacity:.25}"],
      fl: ["2.6s ease-in-out", "0%,100%{opacity:1;transform:scale(1)}20%{opacity:.82;transform:scale(.96)}45%{opacity:.97;transform:scale(1.03)}70%{opacity:.86;transform:scale(.98)}"],
      sh: ["7s ease-in-out", "0%,100%{opacity:.25;transform:translateX(0)}50%{opacity:1;transform:translateX(14px)}"],
      br: ["8s ease-in-out", "0%,100%{opacity:.55}50%{opacity:1}"],
      sw: ["6s ease-in-out", "0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}"],
      bob: ["6s ease-in-out", "0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}"],
      fx: ["9s linear", "0%,100%{opacity:1}91%{opacity:1}92%{opacity:.55}93%{opacity:1}95%{opacity:.7}96%{opacity:1}"],
      sp: ["60s linear", "0%{transform:rotate(0)}100%{transform:rotate(360deg)}"],
    };
    let css = "";
    if (used.length) {
      const sel = used.map((k) => `.${p}-${k}`).join(",");
      css += `${sel}{transform-box:fill-box;transform-origin:center}`;
      for (const k of used) css += `.${p}-${k}{animation:${p}-${k} ${kf[k][0]} infinite}@keyframes ${p}-${k}{${kf[k][1]}}`;
      if (used.includes("sw")) css += `.${p}-sw{transform-origin:50% 0}`;
      css += `@media (prefers-reduced-motion:reduce){${sel}{animation:none}}`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${this.defs.join("")}</defs>${css ? `<style>${css}</style>` : ""}${this.out.join("")}</svg>`;
  }
}

// ───────────────────────── 공용 모티프 ─────────────────────────

/** 점 여러 개를 한 경로로 (둥근 끝 0길이 선분 = 점) */
function dots(list: P2[], color: string, size: number, op = 1) {
  if (!list.length) return "";
  const d = list.map(([x, y]) => `M${i0(x)} ${i0(y)}h0`).join("");
  return `<path d="${d}" stroke="${color}" stroke-width="${f(size)}" stroke-linecap="round" fill="none"${op !== 1 ? ` opacity="${f2(op)}"` : ""}/>`;
}

/** 흩어진 별밭 */
function starField(r: Rnd, n: number, x0: number, y0: number, x1: number, y1: number, color = "#e8eeff", op = 1) {
  const s: P2[][] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.5);
    const k = r();
    s[k < 0.7 ? 0 : k < 0.93 ? 1 : 2].push([x0 + r() * (x1 - x0), y0 + t * (y1 - y0)]);
  }
  return dots(s[0], color, 1.4, 0.5 * op) + dots(s[1], color, 2.1, 0.8 * op) + dots(s[2], "#ffffff", 3, op);
}

/** 반짝이는 십자 별 (애니) */
function sparkle(A: Art, x: number, y: number, s: number, color: string, r: Rnd, cls: Anim = "tw") {
  return `<path d="${rel(`M${f(x)} ${f(y - s)}Q${f(x + s * 0.12)} ${f(y - s * 0.12)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.12)} ${f(y + s * 0.12)} ${f(x)} ${f(y + s)}Q${f(x - s * 0.12)} ${f(y + s * 0.12)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.12)} ${f(y - s * 0.12)} ${f(x)} ${f(y - s)}Z`)}" fill="${color}" ${A.a(cls, r() * 6, 2.5 + r() * 3.5)}/>`;
}

interface CloudC {
  lit: string;
  mid: string;
  shade: string;
}
/** 애니 뭉게구름: 그늘(아래) → 중간 → 빛 받은 윗면의 3단 셀 음영. lx>0이면 빛이 오른쪽 위에서 */
function cloud(r: Rnd, cx: number, cy: number, w: number, h: number, c: CloudC, lx = 1, op = 1): string {
  const n = Math.max(4, Math.round(w / (h * 0.45)));
  const b: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const be = Math.sin(Math.PI * t);
    const rr = h * (0.28 + 0.5 * be) * (0.78 + r() * 0.42);
    b.push([cx - w / 2 + t * w + gauss(r) * w * 0.025, cy - rr * 0.55 - be * h * 0.35 + gauss(r) * h * 0.05, rr]);
  }
  // 윗봉우리 몇 개 더
  for (let i = 0; i < Math.round(n / 3); i++) {
    const t = 0.25 + r() * 0.5;
    const rr = h * (0.3 + r() * 0.25);
    b.push([cx - w / 2 + t * w, cy - h * 0.72 - rr * 0.2, rr]);
  }
  const base = b.map(([x, y, rr]) => cp(x, y, rr)).join("") + ep(cx, cy - h * 0.12, w * 0.5, h * 0.16);
  const mid = b.map(([x, y, rr]) => cp(x - lx * rr * 0.06, y - rr * 0.16, rr * 0.93)).join("");
  const lit = b.map(([x, y, rr]) => cp(x + lx * rr * 0.16, y - rr * 0.3, rr * 0.7)).join("");
  return `<g${op !== 1 ? ` opacity="${f2(op)}"` : ""}><path d="${base}" fill="${c.shade}"/><path d="${mid}" fill="${c.mid}"/><path d="${lit}" fill="${c.lit}"/></g>`;
}

/** 가로로 길게 뻗은 얇은 구름 띠 */
function streaks(r: Rnd, n: number, x0: number, x1: number, y0: number, y1: number, color: string, op: number, hMax = 7): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), w = 60 + r() * 220, h = 2 + r() * hMax;
    d += rel(`M${i0(x)} ${i0(y)}q${i0(w * 0.5)} ${f(-h)} ${i0(w)} 0q${i0(-w * 0.5)} ${f(h * 0.6)} ${i0(-w)} 0z`);
  }
  return `<path d="${d}" fill="${color}" opacity="${f2(op)}"/>`;
}

interface TownOpt {
  seed: number;
  x0: number;
  x1: number;
  base: (x: number) => number;
  hMin: number;
  hMax: number;
  wMin: number;
  wMax: number;
  haze: number;
  hazeC: string;
  win?: number;
  wall?: string;
  wallS?: string;
  roof?: string;
  roofS?: string;
  winC?: string;
  tower?: number;
  /** 창에 불 */
  lit?: string;
  litP?: number;
  lights?: P2[];
}
/** 솔레인의 집 줄: 흰 벽(빛 받는 정면 + 그늘 옆면) + 주황 기와 모임지붕 + 작은 창 */
function town(A: Art, o: TownOpt): string {
  const r = mulberry32(o.seed);
  const H = (c: string) => mix(c, o.hazeC, o.haze);
  let wl = "", ws = "", rf = "", rs = "", eave = "", rim = "";
  const wn: [number, number, number][] = [], lw: [number, number, number][] = [];
  const sc = (o.wMin + o.wMax) / 90;
  const wwnG = Math.max(1.6, 4.2 * sc);
  for (let x = o.x0; x < o.x1; ) {
    const w = o.wMin + r() * (o.wMax - o.wMin);
    const tw = r() < (o.tower ?? 0.06);
    const b = o.base(x + w / 2) + 3 + r() * 5 * sc;
    const h = (o.hMin + r() * (o.hMax - o.hMin)) * (tw ? 1.8 : 1);
    const ww = tw ? w * 0.55 : w;
    const xx = tw ? x + (w - ww) / 2 : x;
    const top = b - h;
    const sw = ww * (0.2 + r() * 0.14);
    wl += rp(xx + sw, top, ww - sw, h);
    ws += rp(xx, top, sw, h);
    if (o.haze < 0.35) eave += rp(xx, top, ww, Math.max(1.5, h * 0.06));
    const ov = ww * 0.08;
    if (tw) {
      const rh = ww * 1.3;
      rf += pr([[xx + sw, top], [xx + ww + ov, top], [xx + ww / 2, top - rh]]);
      rs += pr([[xx - ov, top], [xx + sw, top], [xx + ww / 2, top - rh]]);
      rim += `M${i0(xx + ww + ov)} ${i0(top)}L${i0(xx + ww / 2)} ${i0(top - rh)}`;
    } else {
      const rh = ww * (0.2 + r() * 0.16);
      const kx = ww * (0.2 + r() * 0.12);
      rf += pr([[xx + sw * 0.6, top], [xx + ww + ov, top], [xx + ww - kx, top - rh], [xx + kx + sw * 0.4, top - rh]]);
      rs += pr([[xx - ov, top], [xx + sw * 0.6, top], [xx + kx + sw * 0.4, top - rh], [xx + kx * 0.7, top - rh]]);
      if (o.haze < 0.45) rim += rel(`M${i0(xx + kx * 0.7)} ${i0(top - rh)}h${i0(ww - kx - kx * 0.7)}l${i0(kx + ov)} ${i0(rh)}`);
      if (r() < 0.2) {
        const cx = xx + ww * (0.55 + r() * 0.25);
        rs += rp(cx, top - rh - h * 0.18, Math.max(2, ww * 0.07), h * 0.2);
      }
    }
    // 창
    const wp = o.win ?? 0.7;
    const fl = Math.max(1, Math.round(h / (14 * sc)));
    const cols = Math.max(1, Math.round((ww - sw) / (16 * sc)));
    const wwn = Math.max(1.6, 4.2 * sc), whn = Math.max(2, 6.5 * sc);
    for (let j = 0; j < fl; j++)
      for (let i = 0; i < cols; i++) {
        if (r() > wp) continue;
        const wx = xx + sw + ((i + 0.5) * (ww - sw)) / cols - wwn / 2;
        const wy = top + h * 0.2 + (j * (h * 0.75)) / fl;
        if (wy + whn > b - 1) continue;
        const d: [number, number, number] = [wx + wwn / 2, wy, whn];
        if (o.lit && r() < (o.litP ?? 0.4)) {
          lw.push(d);
          if (o.lights && r() < 0.35) o.lights.push([wx + wwn / 2, wy + whn / 2]);
        } else wn.push(d);
      }
    x += w * (0.72 + r() * 0.34);
  }
  let s = A.path(ws, H(o.wallS ?? "#c9bba8")) + A.path(wl, H(o.wall ?? "#f6f0e4")) + A.path(eave, H(mix(o.wallS ?? "#c9bba8", "#8a6a55", 0.3)), 'opacity=".7"');
  if (wn.length) s += A.line(vsegs(wn), H(o.winC ?? "#6b7486"), Math.round(wwnG));
  if (lw.length) s += A.line(vsegs(lw), o.lit!, Math.round(wwnG));
  s += A.path(rs, H(o.roofS ?? "#b24e30")) + A.path(rf, H(o.roof ?? "#e0764a"));
  s += A.line(rim, H("#f7b489"), Math.max(1, sc * 1.4), 'opacity=".8" stroke-linejoin="round"');
  return s;
}

/** 여명탑: 흰 돌 시계탑. 금빛 문자판(해와 달 기호), 꼭대기 제단 */
function dawnTower(A: Art, cx: number, baseY: number, topY: number, haze: number, hazeC: string, night = false, wkk = 1): string {
  const H = (c: string) => mix(c, hazeC, haze);
  const Ht = baseY - topY;
  const lit = night ? "#aab6d8" : "#fbf7ee", sh = night ? "#56608a" : "#c8bfb2", dk = night ? "#39406a" : "#a99d8e";
  const tiers: [number, number][] = [[0.3, 0.2], [0.24, 0.26], [0.19, 0.2], [0.15, 0.14]];
  let y = baseY, sL = "", sS = "", band = "", win = "";
  let W0 = Ht * 0.3 * wkk;
  let clockY = 0, clockR = 0, lastW = 0;
  tiers.forEach(([wk, hk], i) => {
    const w = Ht * wk * wkk, h = Ht * hk;
    sL += rp(cx - w / 2, y - h, w * 0.62, h);
    sS += rp(cx - w / 2 + w * 0.62, y - h, w * 0.38, h);
    band += rp(cx - w / 2 - w * 0.05, y - h, w * 1.1, Math.max(2, h * 0.04));
    if (i === 2) {
      clockY = y - h * 0.5;
      clockR = w * 0.36;
    } else {
      const n = i === 0 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const aw = (w / n) * 0.3;
        const ax = cx - w / 2 + ((k + 0.5) * w) / n - aw / 2;
        win += arch(ax, y - h * 0.18, aw, y - h * 0.78, 0.5);
      }
    }
    y -= h;
    lastW = w;
    W0 = w;
  });
  // 제단 지붕 + 첨탑
  const spW = lastW * 0.8;
  const sp = `M${f(cx - spW / 2)} ${f(y)}L${f(cx)} ${f(topY)}L${f(cx + spW / 2)} ${f(y)}Z`;
  let s = A.path(sS, H(sh)) + A.path(sL, H(lit)) + A.path(band, H(night ? "#c4cff0" : "#ffffff"));
  s += A.path(win, H(night ? "#f3c77a" : "#8d98ab"));
  s += A.path(`M${f(cx - spW / 2)} ${f(y)}L${f(cx)} ${f(topY)}V${f(y)}Z`, H(lit)) + A.path(`M${f(cx)} ${f(topY)}L${f(cx + spW / 2)} ${f(y)}H${f(cx)}Z`, H(dk));
  void sp;
  // 문자판
  const gold = H(night ? "#f0c060" : "#f5b04a"), gold2 = H("#fff1c4");
  s += `<circle cx="${f(cx)}" cy="${f(clockY)}" r="${f(clockR * 1.12)}" fill="${H(dk)}"/><circle cx="${f(cx)}" cy="${f(clockY)}" r="${f(clockR)}" fill="${gold}"/><circle cx="${f(cx)}" cy="${f(clockY)}" r="${f(clockR * 0.78)}" fill="${gold2}"/>`;
  // 해·달 기호 (12방향 눈금 + 위 해, 아래 달)
  let tk = "";
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    tk += `M${f(cx + Math.cos(a) * clockR * 0.66)} ${f(clockY + Math.sin(a) * clockR * 0.66)}L${f(cx + Math.cos(a) * clockR * 0.76)} ${f(clockY + Math.sin(a) * clockR * 0.76)}`;
  }
  s += A.line(tk, gold, Math.max(1, clockR * 0.07));
  s += `<circle cx="${f(cx)}" cy="${f(clockY - clockR * 0.42)}" r="${f(clockR * 0.13)}" fill="${gold}"/>`;
  s += A.path(rel(`M${f(cx - clockR * 0.12)} ${f(clockY + clockR * 0.3)}a${f(clockR * 0.15)} ${f(clockR * 0.15)} 0 1 0 ${f(clockR * 0.24)} ${f(clockR * 0.18)}a${f(clockR * 0.12)} ${f(clockR * 0.12)} 0 1 1 ${f(-clockR * 0.24)} ${f(-clockR * 0.18)}z`), gold);
  s += A.line(`M${f(cx)} ${f(clockY)}L${f(cx + clockR * 0.3)} ${f(clockY - clockR * 0.4)}M${f(cx)} ${f(clockY)}L${f(cx - clockR * 0.5)} ${f(clockY + clockR * 0.1)}`, H("#8a5a2a"), Math.max(1, clockR * 0.07), 'stroke-linecap="round"');
  // 빛 받는 모서리선
  s += A.line(`M${f(cx - W0 / 2)} ${f(y)}L${f(cx)} ${f(topY)}`, H("#ffffff"), Math.max(1, Ht * 0.004), 'opacity=".8"');
  return s;
}

/** 비네트 + 아래 30% 가라앉히기 */
function finish(A: Art, c: string, vig: number, low: number, cy = 0.42) {
  A.add(A.rect(0, 0, 1600, 900, A.rad("vig", [[0, c, 0], [0.6, c, 0], [1, c, vig]], `cx=".5" cy="${cy}" r=".8"`)));
  if (low) A.add(A.rect(0, 610, 1600, 290, A.v("low", 610, 900, [[0, c, 0], [1, c, low]])));
}

/** 가까운 흰 벽 건물 정면: 주황 기와 처마, 아케이드, 덧창과 꽃 상자. side=1이면 왼쪽 건물(오른쪽 끝이 모서리) */
function facade(A: Art, x0: number, x1: number, top: number, seed: number, side: number, roofY = top - 40): string {
  const r = mulberry32(seed);
  const w = x1 - x0;
  const cx = side > 0 ? x1 : x0;
  let s = A.rect(x0, top, w, 900 - top, A.lin("fw" + seed, side > 0 ? 0 : 1, 0, side > 0 ? 1 : 0, 0, [[0, "#e8dfcf"], [1, "#fbf6ec"]]));
  // 모서리 옆면 (짧게)
  s += A.path(pr([[cx, top - 4], [cx + side * 22, top + 6], [cx + side * 22, 900], [cx, 900]]), "#c9b9a2");
  // 지붕
  s += A.path(pr([[x0 - 10, top + 2], [x1 + 10, top + 2], [x1 + (side > 0 ? 30 : -10), roofY], [x0 + (side > 0 ? -10 : -30), roofY]]), "#e0764a");
  s += A.path(pr([[x0 - 10, top + 2], [x1 + 10, top + 2], [x1 + 10, top + 12], [x0 - 10, top + 12]]), "#b24e30");
  let tile = "";
  for (let x = x0; x < x1 + 20; x += 18) tile += `M${i0(x)} ${i0(top + 2)}L${i0(x + (side > 0 ? 9 : -9))} ${i0(roofY)}`;
  s += A.line(tile, "#c65a36", 2, 'opacity=".6"');
  s += A.line(`M${x0 - 10} ${roofY}H${x1 + 10}`, "#f7b489", 3);
  s += A.rect(x0, top + 12, w, 22, "#8a7a8c", 'opacity=".25"');
  // 창 + 덧창 + 꽃 상자
  let wi = "", sh = "", fb = "", fl: P2[] = [], fl2: P2[] = [], ar = "", arS = "";
  for (let x = x0 + 40; x < x1 - 60; x += 110) {
    wi += arch(x + 22, top + 150, 36, top + 70, 0.5);
    sh += rp(x + 8, top + 76, 12, 74) + rp(x + 60, top + 76, 12, 74);
    fb += rp(x + 16, top + 150, 48, 10);
    for (let k = 0; k < 7; k++) (r() < 0.5 ? fl : fl2).push([x + 18 + r() * 44, top + 146 + r() * 6]);
    ar += arch(x - 5, 900, 90, 610, 0.5);
    arS += rp(x - 5, 610, 90, 10);
  }
  s += A.path(sh, "#4f8fa8") + A.path(wi, "#5f6f8e") + A.path(fb, "#9a5a3a") + dots(fl, "#e05570", 9) + dots(fl2, "#ff9a7a", 7) + dots(fl.concat(fl2).map(([x, y]) => [x + 3, y + 5] as P2), "#5a9a4a", 6);
  s += A.path(ar, "#b5a18a") + A.path(ar, A.v("arI" + seed, 610, 780, [[0, "#6d6582"], [1, "#b5a18a", 0]]));
  s += A.line(`M${x0} 600H${x1}`, "#ffffff", 4, 'opacity=".7"');
  return s;
}


// ───────────────────────── 원근 도구 ─────────────────────────

type P3 = [number, number, number];
/** 한 점 원근: 월드 (x, y, z) → 화면 */
function persp(VX: number, VY: number, F: number) {
  return (x: number, y: number, z: number): P2 => [VX + (x * F) / z, VY + (y * F) / z];
}
type Proj = (x: number, y: number, z: number) => P2;
const quad = (P: Proj, q: P3[]) => pr(q.map(([x, y, z]) => P(x, y, z)));
/** 벽면(x 고정) 위의 사각형 */
const wallX = (P: Proj, x: number, y0: number, y1: number, z0: number, z1: number) => quad(P, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]]);
/** 바닥/천장(y 고정) 위의 사각형 */
const flatY = (P: Proj, y: number, x0: number, x1: number, z0: number, z1: number) => quad(P, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
/** 정면(z 고정) 사각형 */
const frontZ = (P: Proj, z: number, x0: number, x1: number, y0: number, y1: number) => quad(P, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);

/** 한글 비슷한 추상 글자 블록 (읽히지 않는 획 모양). 가로 n칸 */
function glyphs(r: Rnd, x: number, y: number, w: number, h: number, n: number): string {
  let d = "";
  const cw = w / n;
  for (let i = 0; i < n; i++) {
    const gx = x + i * cw + cw * 0.14, gw = cw * 0.72, gy = y + h * 0.12, gh = h * 0.76;
    const k = r();
    const L = (a: number, b: number, c: number, e: number) => `M${f(gx + gw * a)} ${f(gy + gh * b)}L${f(gx + gw * c)} ${f(gy + gh * e)}`;
    if (k < 0.3) d += L(0, 0.1, 0.5, 0.1) + L(0.5, 0.1, 0.5, 0.5) + L(0.8, 0, 0.8, 1) + L(0.8, 0.45, 1, 0.45) + L(0.1, 0.7, 0.6, 0.7);
    else if (k < 0.55) d += L(0.1, 0.05, 0.9, 0.05) + L(0.5, 0.05, 0.5, 0.4) + L(0, 0.45, 1, 0.45) + `M${f(gx + gw * 0.3)} ${f(gy + gh * 0.75)}a${f(gw * 0.2)} ${f(gh * 0.2)} 0 1 0 ${f(gw * 0.4)} 0a${f(gw * 0.2)} ${f(gh * 0.2)} 0 1 0 ${f(-gw * 0.4)} 0`;
    else if (k < 0.8) d += L(0.1, 0.1, 0.1, 0.6) + L(0.1, 0.6, 0.6, 0.6) + L(0.75, 0, 0.75, 0.9) + L(0.2, 0.9, 0.9, 0.9);
    else d += L(0, 0.2, 0.55, 0.2) + L(0.28, 0.2, 0, 0.8) + L(0.28, 0.2, 0.55, 0.8) + L(0.85, 0, 0.85, 1);
  }
  return rel(d);
}

/** 도시 스카이라인 실루엣: 사각 빌딩 + 안테나 + 창 불빛 점 */
function skyline(A: Art, r: Rnd, x0: number, x1: number, base: number, hMin: number, hMax: number, wMin: number, wMax: number, color: string, winC = "", winP = 0, ws = 2): string {
  let d = "";
  const win: P2[] = [];
  for (let x = x0; x < x1; ) {
    const w = wMin + r() * (wMax - wMin);
    const h = hMin + Math.pow(r(), 1.6) * (hMax - hMin);
    d += rp(x, base - h, w, h + 2);
    if (r() < 0.15) d += rp(x + w * 0.45, base - h - h * 0.25, 2, h * 0.25);
    if (r() < 0.25) d += rp(x + w * 0.15, base - h - 6, w * 0.7, 8);
    if (winC)
      for (let yy = base - h + 6; yy < base - 4; yy += ws * 3.2)
        for (let xx = x + 3; xx < x + w - 2; xx += ws * 3) if (r() < winP) win.push([xx, yy]);
    x += w * (0.7 + r() * 0.5);
  }
  return A.path(d, color) + (win.length ? dots(win, winC, ws, 0.9) : "");
}

// ───────────────────────── 서울: 병원 옥상의 새벽 ─────────────────────────

function rooftop(): string {
  const A = new Art("rooftop");
  const r = mulberry32(2202);
  const blur = A.blur("soft", 8);
  const HOR = 586;
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, HOR, [[0, "#15234a"], [0.26, "#2a4274"], [0.5, "#5871a8"], [0.7, "#a791b6"], [0.86, "#eeb49e"], [1, "#ffdcaa"]])));
  A.add(starField(r, 70, 0, 0, 1600, 230, "#e8eeff", 0.8));
  // 그믐달
  A.add(A.ell(360, 140, 60, 60, A.glowG("moon", "#dfe6ff"), 0.4) + A.path("M372 112a30 30 0 1 0 14 52a24 24 0 1 1-14-52z", "#f6f3ff"));
  // 새벽빛 번짐
  A.add(A.ell(1000, HOR, 900, 330, A.glowG("dawn", "#ffc294", "#fff3da"), 0.95));
  A.add(streaks(r, 10, 0, 1600, 300, 470, "#ffc2ae", 0.6, 9));
  A.add(streaks(r, 8, 100, 1500, 170, 300, "#8f8fc4", 0.55, 6));
  A.add(streaks(r, 7, 900, 1600, 200, 290, "#7b76a8", 0.8, 16) + streaks(r, 7, 920, 1600, 206, 292, "#ffc8b0", 0.7, 7));
  A.add(streaks(r, 6, 0, 600, 280, 360, "#6f6d9e", 0.7, 14) + streaks(r, 6, 0, 600, 286, 362, "#f7b8a8", 0.65, 6));
  // 먼 산
  A.add(A.path(ridge(r, -20, 1620, 30, (x) => HOR - 50 - 60 * bell(x, 250, 220) - 40 * bell(x, 1420, 260) - 12 * Math.sin(x / 70), 3), "#9c8cb2", 'opacity=".7"'));
  // 남산과 탑
  A.add(A.path(ridge(r, 480, 900, 20, (x) => HOR - 70 * bell(x, 690, 150) - 8, 1), "#6f6a98"));
  A.add(A.path("M687 516h6v-150h-6zM682 370h16l-2-14h-12zM684 356h12v-10h-12z", "#5d5a88") + A.path(ep(690, 382, 18, 8), "#6b6896") + A.line("M690 346v-40", "#5d5a88", 2));
  A.add(`<circle cx="690" cy="305" r="3" fill="#ff6a6a" ${A.a("tw", 0, 2.4)}/>`);
  // 스카이라인 (먼 → 가까운)
  A.add(skyline(A, r, -10, 1610, HOR, 20, 70, 18, 46, "#8a7fa8", "#ffe6b8", 0.05));
  A.add(skyline(A, r, -10, 1610, HOR + 6, 30, 120, 26, 70, "#5e5a86", "#ffd98a", 0.08, 2.2));
  // 강
  A.add(A.rect(0, HOR + 6, 1600, 70, A.v("river", HOR + 6, HOR + 76, [[0, "#f2c2a2"], [0.5, "#b99ab4"], [1, "#6a6892"]])));
  for (let i = 0; i < 12; i++) A.add(A.rect(700 + gauss(r) * 260, HOR + 12 + r() * 50, 30 + r() * 60, 2, "#fff0d6", A.a("sh", r() * 7, 5 + r() * 3)));
  // 다리
  A.add(A.path(`M-10 ${HOR + 20}Q800 ${HOR + 8} 1610 ${HOR + 22}v7Q800 ${HOR + 15} -10 ${HOR + 27}z`, "#48456e"));
  let piers = "";
  for (let x = 40; x < 1600; x += 120) piers += rp(x, HOR + 24, 8, 26);
  A.add(A.path(piers, "#48456e", 'opacity=".85"'));
  const lamps: P2[] = [];
  for (let x = 10; x < 1600; x += 40) lamps.push([x, HOR + 15 + 0.000008 * (x - 800) ** 2]);
  A.add(dots(lamps, "#ffe2a6", 3.2));
  // 가까운 강변 건물
  A.add(skyline(A, r, -10, 1610, 690, 40, 100, 50, 110, "#3a3860", "#ffd98a", 0.06, 3));
  // 옥상: 난간 벽
  A.add(A.rect(0, 640, 1600, 70, A.v("para", 640, 710, [[0, "#9d93a8"], [0.2, "#77708c"], [1, "#4d4866"]])));
  A.add(A.rect(0, 636, 1600, 6, "#ffd4b0"));
  // 철망 난간
  let bars = "";
  for (let x = 6; x < 1600; x += 16) bars += `M${x} 530v106`;
  A.add(A.line(bars, "#2f2d4c", 2.2, 'opacity=".75"'));
  A.add(A.line("M0 530H1600M0 584H1600", "#2f2d4c", 4) + A.line("M0 528H1600", "#ffcaa8", 1.4, 'opacity=".7"'));
  // 바닥
  A.add(A.rect(0, 710, 1600, 190, A.v("floor", 710, 900, [[0, "#6f6882"], [1, "#3a3650"]])));
  A.add(A.line("M0 760H1600M0 830H1600M300 710L120 900M800 710V900M1300 710L1480 900", "#8a8098", 1.5, 'opacity=".4"'));
  A.add(A.ell(1000, 780, 360, 30, "#ffcfa8", 0.22, `filter="${blur}"`));
  // 계단실 (왼쪽)
  A.add(A.rect(40, 330, 380, 390, A.lin("stw", 0, 0, 1, 0, [[0, "#57527a"], [1, "#8a82a6"]])));
  A.add(A.rect(30, 318, 400, 16, "#a59cbc") + A.rect(30, 330, 400, 5, "#3e3a5e"));
  A.add(A.rect(250, 470, 110, 250, "#5f7a86") + A.rect(256, 476, 98, 244, "#6e8a94") + A.rect(338, 590, 8, 22, "#c9c1a8"));
  A.add(A.rect(270, 440, 70, 22, "#2fa86a") + A.path("M296 444l6 0 0 5-3 3 4 7-3 0-3-5-3 4-3 0 5-8z", "#e8fff0"));
  A.add(A.ell(305, 451, 60, 40, A.glowG("exit", "#6affb0"), 0.35, A.a("br", 0, 5)));
  A.add(A.rect(90, 400, 90, 60, "#2f2d4c") + A.rect(96, 406, 78, 48, A.v("win", 406, 454, [[0, "#ffe4b8"], [1, "#f3b478"]])));
  A.add(A.ell(215, 410, 14, 14, "#fff4d6") + A.ell(215, 410, 90, 90, A.glowG("bulb", "#ffd9a0"), 0.55, A.a("fl", 1, 3)));
  // 자판기 (주인공)
  const vx = 570, vy = 400, vw = 150, vh = 320;
  A.add(A.ell(vx + vw / 2, 720, 260, 40, A.glowG("vspill", "#dff2ff"), 0.6));
  A.add(A.ell(vx + vw / 2, 540, 250, 250, A.glowG("vglow", "#cfe8ff"), 0.45, A.a("br", 2, 6)));
  A.add(A.rect(vx + vw, vy + 6, 26, vh - 6, "#7a2632") + A.rect(vx, vy, vw, vh, A.lin("vb", 0, 0, 1, 0, [[0, "#b73644"], [0.7, "#d44a52"], [1, "#a82e3c"]])));
  A.add(A.rect(vx + 10, vy + 12, vw - 20, 34, "#f6f0ea") + A.path(glyphs(r, vx + 22, vy + 18, 90, 22, 4), "none", 'stroke="#c23a3a" stroke-width="3" stroke-linecap="round"'));
  A.add(A.rect(vx + 12, vy + 56, vw - 44, 150, A.v("vwin", vy + 56, vy + 206, [[0, "#ffffff"], [1, "#dcecff"]])));
  const canC = ["#3a6fd0", "#e8b030", "#3aa060", "#d04a4a", "#8a5ad0", "#f07a30"];
  let cans = "";
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 5; k++) {
      const cx = vx + 20 + k * 19, cy = vy + 66 + row * 48;
      cans += A.rect(cx, cy, 13, 26, canC[(row * 5 + k * 2) % 6], 'rx="3"') + A.rect(cx + 2, cy + 3, 3, 18, "#ffffff", 'opacity=".5"');
    }
  }
  A.add(cans);
  A.add(A.line(`M${vx + 16} ${vy + 96}h${vw - 52}M${vx + 16} ${vy + 144}h${vw - 52}M${vx + 16} ${vy + 192}h${vw - 52}`, "#9aa6c0", 2));
  let btn: P2[] = [];
  for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) btn.push([vx + 26 + k * 19, vy + 99 + row * 48]);
  A.add(dots(btn, "#ff5a5a", 4));
  A.add(A.rect(vx + vw - 28, vy + 70, 16, 60, "#3a1a22", 'rx="3"') + A.rect(vx + vw - 25, vy + 78, 10, 6, "#8affc0"));
  A.add(A.rect(vx + 24, vy + 250, vw - 48, 36, "#2a1418", 'rx="4"') + A.rect(vx, vy, 4, vh, "#ff9aa0", 'opacity=".6"'));
  // 캔커피 하나 (난간 위)
  A.add(A.rect(868, 616, 12, 22, "#c9a470", 'rx="2"') + A.rect(868, 622, 12, 7, "#6a3a24"));
  // 물탱크 + 실외기 (오른쪽)
  A.add(A.rect(1200, 430, 300, 210, A.lin("tank", 0, 0, 1, 0, [[0, "#8f88b0"], [0.35, "#d8cde0"], [1, "#6c6690"]])));
  A.add(A.ell(1350, 430, 150, 22, "#bfb4d0") + A.line("M1200 480H1500M1200 540H1500M1200 600H1500", "#6c6690", 3, 'opacity=".6"'));
  A.add(A.line("M1220 640v70M1480 640v70M1300 640v70M1400 640v70", "#3a3656", 8));
  A.add(A.rect(1040, 620, 120, 90, "#9e98b2") + A.rect(1050, 630, 70, 70, "#6c6690") + `<circle cx="1085" cy="665" r="28" fill="#4d4866"/><path d="M1085 641v48M1061 665h48" stroke="#8a84a4" stroke-width="3"/>`);
  // 역광 테두리 빛 (새벽 쪽)
  A.add(A.line("M1500 432V640M1160 620V710M420 330V720", "#ffc9a4", 2.5, 'opacity=".8"'));
  finish(A, "#1a1838", 0.45, 0.35);
  return A.svg();
}

// ───────────────────────── 태양의 분수 광장 ─────────────────────────

function plaza(): string {
  const A = new Art("plaza");
  const r = mulberry32(1101);
  const blur = A.blur("soft", 10);
  const HZ = "#d6ecfb";
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, 560, [[0, "#3f8fdc"], [0.35, "#72b4ea"], [0.7, "#b4dcf7"], [1, "#fff4dc"]])));
  // 해 (오른쪽 위, 역광 번짐)
  A.add(A.ell(1290, 110, 520, 420, A.glowG("sun", "#fff3cf", "#ffffff"), 0.75));
  A.add(`<circle cx="1290" cy="110" r="46" fill="#fffdf4"/>`);
  // 구름
  const CC: CloudC = { lit: "#ffffff", mid: "#eef6fd", shade: "#b9d3ec" };
  A.add(streaks(r, 9, 0, 1600, 60, 260, "#ffffff", 0.45));
  A.add(cloud(r, 250, 330, 520, 170, CC, 1));
  A.add(cloud(r, 1380, 360, 560, 150, CC, 1));
  A.add(cloud(r, 820, 300, 380, 70, { lit: "#ffffff", mid: "#f3f8fd", shade: "#cfe1f2" }, 1, 0.8));
  A.add(cloud(r, 110, 120, 260, 70, CC, 1, 0.9));
  // 먼 산
  A.add(A.path(ridge(r, -20, 1620, 40, (x) => 430 - 60 * bell(x, 300, 260) - 40 * bell(x, 1350, 300), 4), mix("#9cc3e6", HZ, 0.4)));
  // 여명탑 (멀리, 공기 원근)
  A.add(A.ell(800, 160, 260, 330, A.glowG("tg", "#ffffff"), 0.4));
  A.add(dawnTower(A, 800, 360, -40, 0.42, HZ, false, 1.1));
  A.add(A.ell(800, 136, 70, 70, A.glowG("clk", "#fff1c4", "#ffffff"), 0.7, A.a("br", 0, 7)));
  // 언덕 도시 (뒤 → 앞)
  const hill = (k: number) => (x: number) => 440 + k * 38 - (150 - k * 26) * bell(x, 800, 520 + k * 60);
  A.add(A.path(ridge(r, -20, 1620, 40, (x) => hill(0)(x) + 10, 2), mix("#dcd3c4", HZ, 0.6)));
  A.add(town(A, { seed: 11, x0: 380, x1: 1220, base: hill(0), hMin: 12, hMax: 24, wMin: 16, wMax: 28, haze: 0.55, hazeC: HZ, tower: 0.08, win: 0.35 }));
  A.add(town(A, { seed: 12, x0: 390, x1: 1210, base: hill(1), hMin: 16, hMax: 30, wMin: 22, wMax: 36, haze: 0.42, hazeC: HZ, win: 0.45 }));
  A.add(town(A, { seed: 13, x0: 380, x1: 1220, base: hill(2), hMin: 20, hMax: 38, wMin: 28, wMax: 46, haze: 0.3, hazeC: HZ, win: 0.55 }));
  A.add(A.rect(0, 470, 1600, 90, A.v("mist", 470, 560, [[0, "#ffffff", 0], [0.6, "#ffffff", 0.35], [1, "#ffffff", 0]])));
  A.add(town(A, { seed: 14, x0: 380, x1: 1220, base: hill(3), hMin: 26, hMax: 48, wMin: 36, wMax: 60, haze: 0.18, hazeC: HZ }));
  // 종탑 (중경, 왼쪽)
  const bx = 650, bw = 64, btop = 190, bb = 600;
  A.add(A.rect(bx - bw / 2, btop, bw * 0.6, bb - btop, "#fbf6ec") + A.rect(bx - bw / 2 + bw * 0.6, btop, bw * 0.4, bb - btop, "#cdbfae"));
  A.add(A.path(rp(bx - bw / 2 - 5, btop + 70, bw + 10, 6) + rp(bx - bw / 2 - 5, btop + 230, bw + 10, 6), "#ffffff"));
  A.add(A.path(arch(bx - 20, btop + 60, 40, btop + 8, 0.5), "#4a4c66") + A.path(arch(bx - 14, btop + 180, 16, btop + 130, 0.5) + arch(bx + 2, btop + 180, 12, btop + 130, 0.5), "#7d8aa0"));
  A.add(A.path(rel(`M${bx - 11} ${btop + 44}q0-24 11-24t11 24z`), "#e3a847"));
  A.add(A.path(pts([[bx - bw / 2 - 8, btop], [bx + bw * 0.1, btop], [bx, btop - 80]]), "#e0764a") + A.path(pts([[bx + bw * 0.1, btop], [bx + bw / 2 + 8, btop], [bx, btop - 80]]), "#b24e30"));
  A.add(A.line(`M${bx} ${btop - 80}V${btop - 104}`, "#c98a3a", 3) + `<circle cx="${bx}" cy="${btop - 106}" r="5" fill="#f5b04a"/>`);
  // 광장 바닥
  A.add(A.path(`M0 590H1600V900H0Z`, A.v("floor", 590, 900, [[0, "#efe3cf"], [0.5, "#e2d2b8"], [1, "#c9b596"]])));
  let pv = "";
  for (let k = 1; k < 9; k++) pv += ep(800, 690, 190 * k, 36 * k);
  for (let k = -10; k <= 10; k++) pv += `M${800 + k * 50} 700L${800 + k * 260} 900`;
  const fc = A.clip("fc", "M0 592H1600V900H0Z");
  A.add(`<g clip-path="${fc}">` + A.line(pv, "#c7b394", 2, 'opacity=".5"') + `</g>`);
  // 광장 뒤편 집들
  A.add(town(A, { seed: 15, x0: 380, x1: 1230, base: () => 590, hMin: 60, hMax: 96, wMin: 70, wMax: 110, haze: 0.06, hazeC: HZ, win: 0.8 }));
  A.add(A.rect(0, 580, 1600, 14, "#d8cab4"));
  // 앞 건물들 (양옆, 크게) — 아케이드, 덧창, 꽃 상자
  A.add(facade(A, -10, 400, 360, 5, 1) + facade(A, 1200, 1620, 340, 6, -1));
  // 분수
  const fy = 660;
  A.add(A.ell(800, fy + 22, 300, 52, "#b09a7e", 0.55));
  A.add(A.ell(800, fy, 280, 50, "#d8ccb8") + A.ell(800, fy - 10, 280, 50, "#fbf6ec") + A.ell(800, fy - 6, 256, 40, A.v("water", fy - 46, fy + 34, [[0, "#9fd4f2"], [1, "#4f9ed6"]])));
  // 수면 반짝임
  for (let i = 0; i < 8; i++) A.add(A.rect(620 + i * 46 + gauss(r) * 10, fy - 20 + r() * 34, 22 + r() * 22, 2.4, "#ffffff", A.a("sh", r() * 7, 4 + r() * 3)));
  // 중앙 기둥 + 해 조각
  A.add(A.rect(778, 470, 26, 184, "#fbf6ec") + A.rect(796, 470, 8, 184, "#cfc2b0"));
  A.add(A.ell(800, 600, 90, 18, "#d8ccb8") + A.ell(800, 594, 90, 18, "#fbf6ec") + A.ell(800, 596, 80, 13, "#7cc0ea"));
  A.add(A.ell(800, 430, 150, 150, A.glowG("sunG", "#ffe2a0", "#fff6d8"), 0.8));
  let ray = "";
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    const L = k % 2 ? 62 : 80;
    ray += pts([[800 + Math.cos(a - 0.12) * 40, 430 + Math.sin(a - 0.12) * 40], [800 + Math.cos(a) * L, 430 + Math.sin(a) * L], [800 + Math.cos(a + 0.12) * 40, 430 + Math.sin(a + 0.12) * 40]]);
  }
  A.add(A.path(ray, "#f5b04a") + `<circle cx="800" cy="430" r="44" fill="#f5b04a"/><circle cx="796" cy="426" r="36" fill="#ffd27a"/><circle cx="788" cy="418" r="14" fill="#fff1c4"/>`);
  // 물줄기
  let jet = "";
  for (const s of [-1, 1]) for (const k of [0.5, 0.8, 1.1]) jet += `M${800 + s * 30} ${480}Q${800 + s * 110 * k} ${420 - 30 * k} ${800 + s * 160 * k} ${fy - 20 + 8 * k}`;
  A.add(A.line(jet, "#e8f6ff", 4, 'opacity=".8" stroke-linecap="round"'));
  A.add(A.line(jet, "#ffffff", 1.6, 'stroke-linecap="round"'));
  for (let i = 0; i < 10; i++) A.add(sparkle(A, 640 + r() * 320, 410 + r() * 230, 5 + r() * 6, "#ffffff", r));
  // 빛 번짐 (역광)
  A.add(A.path(pts([[1290, 110], [1000, 900], [1400, 900]]), "#fff6d8", `opacity=".12" filter="${blur}"`));
  A.add(A.ell(1100, 250, 700, 380, A.glowG("bloom", "#fff7e0"), 0.35));
  finish(A, "#6a6f9a", 0.35, 0.25);
  return A.svg();
}

export const CITY_BACKGROUNDS: Record<string, string> = {
  plaza: plaza(),
  rooftop: rooftop(),
};
