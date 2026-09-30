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

/** 글자처럼 보이지만 읽히지 않는 추상 무늬 (둥근 획 덩어리). 가로 n칸 */
function glyphs(r: Rnd, x: number, y: number, w: number, h: number, n: number): string {
  let d = "";
  const cw = w / n;
  for (let i = 0; i < n; i++) {
    const gx = x + i * cw + cw * 0.18, gw = cw * 0.64, gy = y + h * 0.2, gh = h * 0.6;
    // 물결 획 하나 + 짧은 점 획 — 문자 모양이 되지 않게 무작위 곡선
    const y1 = gy + gh * (0.2 + r() * 0.3);
    d += `M${f(gx)} ${f(y1)}q${f(gw * 0.25)} ${f(-gh * (0.2 + r() * 0.3))} ${f(gw * 0.5)} 0t${f(gw * 0.5)} ${f(gh * (r() - 0.5) * 0.4)}`;
    if (r() < 0.7) d += `M${f(gx + gw * (0.15 + r() * 0.3))} ${f(gy + gh * 0.85)}h${f(gw * (0.25 + r() * 0.4))}`;
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


// ───────────────────────── 서울: 응급실 소생실, 새벽 ─────────────────────────

function er(): string {
  const A = new Art("er");
  const r = mulberry32(3303);
  const blur = A.blur("soft", 12);
  const P = persp(800, 420, 700);
  const W = 3.2, CE = -1.9, FL = 1.5, ZB = 5.4, ZN = 1.1;
  // 천장·벽·바닥
  A.add(A.rect(0, 0, 1600, 900, "#8fa6ae"));
  A.add(A.path(quad(P, [[-W, CE, ZN], [W, CE, ZN], [W, CE, ZB], [-W, CE, ZB]]), A.v("ceil", 0, 175, [[0, "#b7c8cc"], [1, "#e4eeee"]])));
  A.add(A.path(wallX(P, -W, CE, FL, ZN, ZB), A.lin("lw", 0, 0, 1, 0, [[0, "#9db4b6"], [1, "#d5e3e0"]])));
  A.add(A.path(wallX(P, W, CE, FL, ZN, ZB), A.lin("rw", 1, 0, 0, 0, [[0, "#98aeb2"], [1, "#cfdedc"]])));
  A.add(A.path(frontZ(P, ZB, -W, W, CE, FL), A.v("bw", 173, 614, [[0, "#e6efec"], [0.6, "#d6e4e1"], [1, "#bccfcd"]])));
  A.add(A.path(flatY(P, FL, -W, W, ZN, ZB), A.v("fl", 614, 900, [[0, "#b8c8c8"], [1, "#6e8288"]])));
  // 벽 아랫단 띠 + 바닥 줄눈
  A.add(A.path(frontZ(P, ZB, -W, W, 0.9, 1.5) + wallX(P, -W, 0.9, 1.5, ZN, ZB) + wallX(P, W, 0.9, 1.5, ZN, ZB), "#8fb3b0", 'opacity=".55"'));
  let gl = "";
  for (let x = -W; x <= W; x += 0.8) { const a = P(x, FL, ZB), b = P(x, FL, ZN); gl += `M${i0(a[0])} ${i0(a[1])}L${i0(b[0])} ${i0(b[1])}`; }
  for (let z = ZB; z > ZN; z /= 1.25) { const a = P(-W, FL, z), b = P(W, FL, z); gl += `M${i0(a[0])} ${i0(a[1])}H${i0(b[0])}`; }
  A.add(A.line(gl, "#dfeaea", 1.5, 'opacity=".45"'));
  // 창 (새벽 전의 짙은 하늘)
  const wq = frontZ(P, ZB, -2.7, -1.5, -1.3, -0.1);
  A.add(A.path(frontZ(P, ZB, -2.78, -1.42, -1.38, -0.02), "#9fb0b4") + A.path(wq, A.v("win", 180, 400, [[0, "#14204a"], [0.7, "#2d4478"], [1, "#6f78a8"]])));
  const [wx0, wy0] = P(-2.7, -1.3, ZB), [wx1, wy1] = P(-1.5, -0.1, ZB);
  A.add(skyline(A, r, wx0, wx1, wy1, 6, 34, 8, 16, "#0e1636", "#ffd98a", 0.12, 1.6));
  A.add(starField(r, 10, wx0, wy0, wx1, wy0 + 50, "#e8eeff", 0.8));
  A.add(A.line(`M${i0((wx0 + wx1) / 2)} ${i0(wy0)}V${i0(wy1)}M${i0(wx0)} ${i0((wy0 + wy1) / 2)}H${i0(wx1)}`, "#9fb0b4", 3));
  // 벽시계 04:44
  const [cx, cy] = P(0, -1.35, ZB);
  A.add(`<circle cx="${i0(cx)}" cy="${i0(cy)}" r="27" fill="#56686e"/><circle cx="${i0(cx)}" cy="${i0(cy)}" r="23" fill="#fbfdfc"/>`);
  const hand = (deg: number, L: number) => { const a = ((deg - 90) * Math.PI) / 180; return `M${i0(cx)} ${i0(cy)}l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`; };
  A.add(A.line(rel(hand(142, 12) + hand(264, 18)), "#2a3438", 2.6, 'stroke-linecap="round"') + `<circle cx="${i0(cx)}" cy="${i0(cy)}" r="2.5" fill="#c23a3a"/>`);
  // 의료가스 레일 + 선반
  A.add(A.path(frontZ(P, ZB, -1.2, 1.4, -0.55, -0.3), "#f4f8f6") + A.path(frontZ(P, ZB, -1.2, 1.4, -0.33, -0.3), "#9fb4b4"));
  const oc = ["#3aa060", "#f4f4f4", "#e8b030", "#3a6fd0", "#3aa060", "#e8b030"];
  oc.forEach((c, i) => { const [ox, oy] = P(-1 + i * 0.44, -0.43, ZB); A.add(`<circle cx="${i0(ox)}" cy="${i0(oy)}" r="5" fill="${c}" stroke="#6a7a7e" stroke-width="1.5"/>`); });
  let bins = "";
  for (let i = 0; i < 6; i++) bins += frontZ(P, ZB, 1.55 + (i % 3) * 0.5, 1.95 + (i % 3) * 0.5, -1.2 + Math.floor(i / 3) * 0.45, -0.95 + Math.floor(i / 3) * 0.45);
  A.add(A.path(frontZ(P, ZB, 1.5, 3.1, -1.25, -0.2), "#c4d4d2") + A.path(bins, "#5b8ecf"));
  // 크래시 카트 (빨강)
  A.add(A.path(frontZ(P, 5.0, 1.6, 2.35, 0.25, 1.4), "#c23a3a") + A.path(frontZ(P, 5.0, 1.6, 1.75, 0.25, 1.4), "#8f1d24"));
  let dr = "";
  for (let k = 0; k < 4; k++) dr += frontZ(P, 5.0, 1.64, 2.31, 0.32 + k * 0.27, 0.34 + k * 0.27);
  A.add(A.path(dr, "#f2d2d2") + A.path(frontZ(P, 5.0, 1.55, 2.4, 0.2, 0.26), "#e8e8e8"));
  // 커튼 (천장 레일에서 드리운 주름)
  const curtain = (x: number, z0: number, z1: number, n: number) => {
    let a = "", b = "";
    for (let k = 0; k < n; k++) {
      const za = z0 + ((z1 - z0) * k) / n, zb = z0 + ((z1 - z0) * (k + 1)) / n;
      const q = wallX(P, x, CE + 0.15, FL - 0.25, za, zb);
      if (k % 2) a += q; else b += q;
    }
    return A.path(b, "#a9d2d2") + A.path(a, "#7fb2b6") + A.line(quad(P, [[x, CE + 0.1, z0], [x, CE + 0.1, z1], [x, CE + 0.12, z1], [x, CE + 0.12, z0]]), "#c7d7d8", 4);
  };
  A.add(curtain(-2.5, 1.2, 3.8, 14) + curtain(2.5, 1.2, 4.4, 16));
  A.add(A.path(wallX(P, -2.5, CE + 0.15, FL - 0.25, 1.2, 3.8) + wallX(P, 2.5, CE + 0.15, FL - 0.25, 1.2, 4.4), A.v("cs", 100, 800, [[0, "#ffffff", 0.25], [0.5, "#ffffff", 0], [1, "#2a4a56", 0.35]])));
  // 천장 형광등
  const tubes: [number, number][] = [[2.1, 2.7], [3.2, 3.7], [4.3, 4.8]];
  tubes.forEach(([z0, z1], i) => {
    A.add(A.path(flatY(P, CE, -0.9, 0.9, z0, z1), "#f4fbff", i === 1 ? A.a("fx", 0, 8) : ""));
    const [gx, gy] = P(0, CE, (z0 + z1) / 2);
    A.add(A.ell(gx, gy + 10, 360 / z0 * 2, 90 / z0 * 2, A.glowG("tg" + i, "#e6fbff", "#ffffff"), 0.6));
  });
  // 바닥 반사
  A.add(A.ell(800, 720, 300, 70, "#f4fbff", 0.25, `filter="${blur}"`) + A.ell(800, 640, 180, 30, "#f4fbff", 0.25, `filter="${blur}"`));
  // 침대 (가운데)
  const BY = 0.42, bx0 = -0.72, bx1 = 0.72, bz0 = 3.0, bz1 = 4.8;
  A.add(A.path(flatY(P, FL - 0.02, bx0 - 0.1, bx1 + 0.1, bz0, bz1), "#2f4046", `opacity=".3" filter="${blur}"`));
  let legs = "";
  for (const [lx, lz] of [[bx0 + 0.1, bz0], [bx1 - 0.1, bz0], [bx0 + 0.1, bz1], [bx1 - 0.1, bz1]] as P2[]) { const a = P(lx, BY + 0.3, lz), b = P(lx, FL - 0.08, lz); legs += `M${i0(a[0])} ${i0(a[1])}V${i0(b[1])}`; }
  A.add(A.line(legs, "#5e6c72", 6));
  A.add(dots([[bx0 + 0.1, bz0], [bx1 - 0.1, bz0], [bx0 + 0.1, bz1], [bx1 - 0.1, bz1]].map(([x, z]) => P(x, FL - 0.06, z)), "#2f3a40", 14));
  A.add(A.path(frontZ(P, bz0, bx0, bx1, BY + 0.12, BY + 0.34), "#8e9ca2"));
  A.add(A.path(frontZ(P, bz0, bx0, bx1, BY, BY + 0.14), "#e2ecef"));
  A.add(A.path(flatY(P, BY, bx0, bx1, bz0, bz1), A.v("sheet", 480, 580, [[0, "#ffffff"], [1, "#dce8ee"]])));
  A.add(A.path(flatY(P, BY - 0.02, bx0 + 0.1, bx1 - 0.1, bz1 - 0.55, bz1 - 0.1), "#f8fbff") + A.path(flatY(P, BY - 0.01, bx0, bx1, bz0 + 0.2, bz0 + 0.8), "#a9c6dc"));
  // 사이드레일
  A.add(A.line(quad(P, [[bx1 + 0.02, BY - 0.18, bz0 + 0.4], [bx1 + 0.02, BY - 0.18, bz1 - 0.4], [bx1 + 0.02, BY, bz1 - 0.4], [bx1 + 0.02, BY, bz0 + 0.4]]), "#c7d2d6", 3));
  // 수액 걸이
  const [ix, iy] = P(-1.15, -1.3, 3.2), [, iyb] = P(-1.15, FL, 3.2);
  A.add(A.line(`M${i0(ix)} ${i0(iy)}V${i0(iyb)}M${i0(ix - 18)} ${i0(iy)}h36`, "#9aa8ae", 3));
  A.add(A.path(`M${i0(ix + 6)} ${i0(iy + 4)}h22v34q-11 8-22 0z`, "#e6f4fb", 'opacity=".9"') + A.line(`M${i0(ix + 17)} ${i0(iy + 42)}q10 60 60 110`, "#dfeff6", 1.5));
  // 모니터 (붐 암)
  const [mx0, my0] = P(0.22, -0.95, 3.3), [mx1, my1] = P(1.18, -0.2, 3.3);
  const [ax, ay] = P(0.9, CE, 3.6);
  A.add(A.line(`M${i0(ax)} ${i0(ay)}V${i0(my0 - 30)}L${i0((mx0 + mx1) / 2)} ${i0(my0 - 8)}`, "#8a969c", 8, 'stroke-linejoin="round"'));
  A.add(A.ell((mx0 + mx1) / 2, (my0 + my1) / 2, 240, 170, A.glowG("mon", "#6affd0"), 0.3, A.a("br", 0, 4)));
  A.add(A.rect(mx0 - 10, my0 - 10, mx1 - mx0 + 20, my1 - my0 + 20, "#4a565c", 'rx="8"') + A.rect(mx0, my0, mx1 - mx0, my1 - my0, "#0d1a26"));
  const mw = mx1 - mx0 - 70, mh = my1 - my0;
  let ecg = `M${i0(mx0 + 6)} ${i0(my0 + mh * 0.25)}`;
  const bw = mw / 3;
  for (let k = 0; k < 3; k++) ecg += rel(`h${f(bw * 0.3)}l4-4 4 4h${f(bw * 0.08)}l3 6 5-${f(mh * 0.2)} 5 ${f(mh * 0.26)} 3-6h${f(bw * 0.15)}q6-7 12 0h${f(bw * 0.47 - 44)}`);
  A.add(A.line(ecg, "#5dff8e", 2, 'stroke-linejoin="round"'));
  let pl = `M${i0(mx0 + 6)} ${i0(my0 + mh * 0.58)}`;
  for (let k = 0; k < 5; k++) pl += rel(`q${f(mw / 20)}-${f(mh * 0.14)} ${f(mw / 10)} 0t${f(mw / 10)} 0`);
  A.add(A.line(pl, "#5fd8ff", 2));
  let rs = `M${i0(mx0 + 6)} ${i0(my0 + mh * 0.85)}`;
  for (let k = 0; k < 3; k++) rs += rel(`q${f(mw / 12)}-${f(mh * 0.1)} ${f(mw / 6)} 0`);
  A.add(A.line(rs, "#ffe066", 2));
  A.add(A.path(rp(mx1 - 56, my0 + 8, 40, 16) + rp(mx1 - 56, my0 + 34, 26, 10), "#5dff8e") + A.path(rp(mx1 - 56, my0 + mh * 0.5, 36, 14), "#5fd8ff") + A.path(rp(mx1 - 56, my0 + mh * 0.78, 22, 10), "#ffe066"));
  A.add(`<circle cx="${i0(mx0 + mw * 0.98)}" cy="${i0(my0 + mh * 0.25)}" r="3.5" fill="#d8ffe4" ${A.a("tw", 0, 1)}/>`);
  A.add(A.ell(800, 250, 700, 300, A.glowG("bloom", "#f4fbff"), 0.25));
  finish(A, "#1d2d4f", 0.55, 0.3);
  return A.svg();
}

// ───────────────────────── 서울: 을지로 뒷골목의 아침 ─────────────────────────

function seoul(): string {
  const A = new Art("seoul");
  const r = mulberry32(4404);
  const blur = A.blur("soft", 14);
  const P = persp(800, 430, 700);
  const W = 1.6, FL = 1.5, ZS = 4.6, ZE = 3.9, TOP = -1.55;
  // 하늘 (가게 지붕 위 좁은 틈)
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, 240, [[0, "#7fb4e4"], [0.6, "#c4dff2"], [1, "#fff0d0"]])));
  A.add(A.ell(1060, 200, 400, 260, A.glowG("sun", "#fff0c8", "#ffffff"), 0.9));
  A.add(cloud(r, 780, 120, 300, 60, { lit: "#ffffff", mid: "#f0f6fb", shade: "#c8dcec" }, 1, 0.9));
  // 가게 건물 (정면) + 이웃
  A.add(A.path(frontZ(P, ZS, -3.2, 3.2, TOP, FL), A.v("shopw", 190, 680, [[0, "#d9c9ae"], [1, "#b9a58a"]])));
  A.add(A.path(frontZ(P, ZS, -3.2, -1.1, TOP - 0.5, FL), "#b8a8a0") + A.path(frontZ(P, ZS, 1.2, 3.2, TOP - 0.3, FL), "#c6b39a"));
  A.add(A.path(frontZ(P, ZS, -3.2, 3.2, TOP - 0.52, TOP - 0.44) + frontZ(P, ZS, -1.1, 1.2, TOP - 0.05, TOP + 0.03), "#8a7a70"));
  // 2층 창 + 실외기
  A.add(A.path(frontZ(P, ZS, -0.8, 0.1, -1.1, -0.45) + frontZ(P, ZS, -2.6, -1.8, -1.4, -0.7) + frontZ(P, ZS, 1.8, 2.7, -1.2, -0.6), "#5a6a80"));
  A.add(A.path(frontZ(P, ZS, -0.76, 0.06, -1.06, -0.8), "#9fc0dc", 'opacity=".6"'));
  A.add(A.path(frontZ(P, ZS, 0.35, 0.95, -0.95, -0.55), "#e4e0d6") + `<circle cx="${i0(P(0.72, 0, ZS)[0])}" cy="${i0(P(0, -0.75, ZS)[1])}" r="18" fill="#9a968c"/>`);
  // 간판 (추상 글자)
  const [sx0, sy0] = P(-1.35, -0.35, ZS), [sx1, sy1] = P(1.35, 0.02, ZS);
  A.add(A.rect(sx0, sy0, sx1 - sx0, sy1 - sy0, "#243a6a") + A.rect(sx0 + 4, sy0 + 4, sx1 - sx0 - 8, sy1 - sy0 - 8, "none", 'stroke="#e8c98a" stroke-width="2"'));
  A.add(A.path(glyphs(r, sx0 + 70, sy0 + 10, sx1 - sx0 - 90, sy1 - sy0 - 20, 5), "none", 'stroke="#ffe7a8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'));
  A.add(`<circle cx="${i0(sx0 + 36)}" cy="${i0((sy0 + sy1) / 2)}" r="20" fill="#ffe7a8"/><path d="M${i0(sx0 + 36)} ${i0((sy0 + sy1) / 2)}v-13M${i0(sx0 + 36)} ${i0((sy0 + sy1) / 2)}h9" stroke="#243a6a" stroke-width="3" stroke-linecap="round"/>`);
  // 차양
  const [aw0, ay0] = P(-1.4, 0.06, ZS), [aw1] = P(1.4, 0.06, ZS);
  let stripe = "";
  for (let k = 0; k < 14; k++) if (k % 2 === 0) stripe += pr([[aw0 + ((aw1 - aw0) * k) / 14, ay0], [aw0 + ((aw1 - aw0) * (k + 1)) / 14, ay0], [aw0 - 10 + ((aw1 - aw0 + 20) * (k + 1)) / 14, ay0 + 34], [aw0 - 10 + ((aw1 - aw0 + 20) * k) / 14, ay0 + 34]]);
  A.add(A.path(pr([[aw0, ay0], [aw1, ay0], [aw1 + 10, ay0 + 34], [aw0 - 10, ay0 + 34]]), "#f2eadc") + A.path(stripe, "#4a8a6a"));
  // 가게 창 (따뜻한 안쪽 빛, 선반의 시계들, 금빛 모래시계)
  const [gx0, gy0] = P(-1.25, 0.2, ZS), [gx1, gy1] = P(0.55, 1.12, ZS);
  A.add(A.rect(gx0 - 8, gy0 - 8, gx1 - gx0 + 16, gy1 - gy0 + 16, "#6a5040"));
  A.add(A.rect(gx0, gy0, gx1 - gx0, gy1 - gy0, A.v("inner", gy0, gy1, [[0, "#6a4a30"], [0.5, "#a8743e"], [1, "#5a3a26"]])));
  let sh = "";
  for (const k of [0.42, 0.8]) sh += rp(gx0, gy0 + (gy1 - gy0) * k, gx1 - gx0, 5);
  A.add(A.path(sh, "#3a2e2a"));
  const ck: [number, number, number][] = [];
  for (let k = 0; k < 7; k++) ck.push([gx0 + 22 + k * ((gx1 - gx0 - 40) / 6), gy0 + (gy1 - gy0) * 0.42 - 16 - r() * 8, 10 + r() * 8]);
  for (let k = 0; k < 3; k++) ck.push([gx0 + 26 + k * 34, gy0 + (gy1 - gy0) * 0.8 - 14, 11]);
  A.add(A.path(ck.map(([x, y, rr]) => cp(x, y, rr)).join(""), "#e8c98a") + A.path(ck.map(([x, y, rr]) => cp(x, y, rr * 0.75)).join(""), "#fbf3e0"));
  A.add(A.line(ck.map(([x, y, rr]) => `M${i0(x)} ${i0(y)}v${i0(-rr * 0.6)}M${i0(x)} ${i0(y)}h${i0(rr * 0.45)}`).join(""), "#3a2e2a", 1.6));
  const hx = gx1 - 64, hy = gy0 + (gy1 - gy0) * 0.5;
  A.add(`<g transform="translate(${i0(hx)} ${i0(hy)}) scale(1.35) translate(${i0(-hx)} ${i0(-hy)})">`);
  A.add(A.ell(hx, hy, 120, 120, A.glowG("hg", "#ffd27a", "#fff6d8"), 0.9, A.a("br", 0, 5)));
  A.add(A.path(`M${hx - 24} ${hy - 44}h48v7h-48zM${hx - 24} ${hy + 38}h48v7h-48z`, "#c8862a"));
  A.add(A.path(`M${hx - 18} ${hy - 37}q0 28 16 37q-16 9-16 37h36q0-28-16-37q16-9 16-37z`, "#fff1c4", 'opacity=".85"'));
  A.add(A.path(`M${hx - 12} ${hy + 37}q2-14 12-18q10 4 12 18z`, "#f5b04a") + A.path(`M${hx - 9} ${hy - 30}h18q-4 16-9 20q-5-4-9-20z`, "#f5b04a", 'opacity=".75"'));
  A.add(A.line(`M${hx - 20} ${hy - 37}v74M${hx + 20} ${hy - 37}v74`, "#c8862a", 3) + "</g>");
  A.add(A.path(pr([[gx0, gy0], [gx0 + 60, gy0], [gx0 + 10, gy1], [gx0 - 0, gy1]]), "#ffffff", 'opacity=".18"'));
  // 문 (알루미늄 미닫이)
  const [dx0, dy0] = P(0.7, 0.15, ZS), [dx1, dy1] = P(1.3, FL, ZS);
  A.add(A.rect(dx0, dy0, dx1 - dx0, dy1 - dy0, "#8a9aa6") + A.rect(dx0 + 5, dy0 + 5, dx1 - dx0 - 10, dy1 - dy0 - 10, "#5a4a3e") + A.rect(dx0 + 5, dy0 + 5, dx1 - dx0 - 10, (dy1 - dy0) * 0.55, "#c08a50", 'opacity=".8"'));
  // 교차로 바닥의 아침 햇빛
  A.add(A.path(flatY(P, FL, -3.2, 3.2, ZE, ZS), "#e9d6b2"));
  A.add(A.path(flatY(P, FL, -W, W, 1, ZE), A.v("gnd", 640, 900, [[0, "#9a8f8a"], [1, "#5a5260"]])));
  A.add(A.path(frontZ(P, ZS, -3.2, 3.2, 0.95, FL), "#ffd9a0", 'opacity=".35"'));
  // 옆벽 (그늘, 서늘한 푸른빛)
  A.add(A.path(wallX(P, -W, -4, FL, 1, ZE), A.lin("lw", 0, 0, 1, 0, [[0, "#6a6880"], [1, "#a79ea8"]])));
  A.add(A.path(wallX(P, W, -4, FL, 1, ZE), A.lin("rw", 1, 0, 0, 0, [[0, "#7a7084"], [1, "#c2b2a8"]])));
  A.add(A.path(wallX(P, W, -4, -1.2, 1.6, ZE), "#ffcf94", 'opacity=".35"'));
  let mwin = "", band = "";
  for (const x of [-W, W]) {
    for (const [z0, z1] of [[1.2, 1.7], [2.9, 3.3]] as P2[]) mwin += wallX(P, x, -1.3, -0.5, z0, z1);
    for (const y of [-1.6, 0.0]) band += wallX(P, x, y, y + 0.06, 1, ZE);
  }
  A.add(A.path(mwin, "#3e4660") + A.path(band, "#5a5068", 'opacity=".5"'));
  // 벽의 창, 파이프, 실외기
  let wwin = "";
  for (const x of [-W, W]) for (const [z0, z1] of [[1.4, 1.9], [2.4, 2.8], [3.2, 3.5]] as P2[]) wwin += wallX(P, x, -2.4, -1.6, z0, z1);
  A.add(A.path(wwin, "#2e3048", 'opacity=".8"'));
  let pipe = "";
  for (const [x, z] of [[-W, 2.2], [W, 3.0], [-W, 3.6]] as P2[]) { const a = P(x, -4, z), b = P(x, FL, z); pipe += `M${i0(a[0])} ${i0(a[1])}L${i0(b[0])} ${i0(b[1])}`; }
  A.add(A.line(pipe, "#9a92a4", 5));
  const acs: P3[] = [[-W, -0.2, 2.3], [W, -0.9, 2.5], [-W, 0.4, 3.2], [W, 0.2, 3.4]];
  for (const [x, y, z] of acs) {
    const s = x < 0 ? 1 : -1;
    A.add(A.path(quad(P, [[x, y, z], [x + s * 0.35, y, z], [x + s * 0.35, y + 0.45, z], [x, y + 0.45, z]]), "#d8d2cc") + A.path(quad(P, [[x + s * 0.35, y, z], [x + s * 0.35, y, z + 0.45], [x + s * 0.35, y + 0.45, z + 0.45], [x + s * 0.35, y + 0.45, z]]), "#a8a09c"));
    const [c0x, c0y] = P(x + s * 0.175, y + 0.22, z);
    A.add(`<circle cx="${i0(c0x)}" cy="${i0(c0y)}" r="${i0(0.14 * 700 / z)}" fill="#7a7480"/>`);
  }
  // 돌출 간판들 (벽에 수직으로 튀어나온 세로 간판)
  const signC = [["#c23a3a", "#fff4d6"], ["#e8b030", "#3a2e2a"], ["#3a6fd0", "#ffffff"], ["#3aa060", "#ffffff"], ["#8a3a8a", "#ffe7a8"], ["#f07a30", "#ffffff"]];
  const signs: [number, number, number, number][] = [[-W, 2.0, -2.4, -0.6], [-W, 2.8, -3.0, -1.5], [-W, 3.5, -2.0, -0.8], [W, 2.2, -2.6, -0.9], [W, 3.0, -3.0, -1.7], [W, 3.6, -2.1, -1.1]];
  signs.forEach(([x, z, y0, y1], i) => {
    const s = x < 0 ? 1 : -1;
    const [c, g] = signC[i];
    const q = quad(P, [[x + s * 0.06, y0, z], [x + s * 0.5, y0, z], [x + s * 0.5, y1, z], [x + s * 0.06, y1, z]]);
    const [qx0, qy0] = P(x + s * 0.06, y0, z), [qx1, qy1] = P(x + s * 0.5, y1, z);
    A.add(A.path(q, c) + A.path(quad(P, [[x + s * 0.5, y0, z], [x + s * 0.5, y0, z + 0.06], [x + s * 0.5, y1, z + 0.06], [x + s * 0.5, y1, z]]), mix(c, "#000000", 0.35)));
    const lx = Math.min(qx0, qx1), w = Math.abs(qx1 - qx0), n = Math.max(2, Math.round((qy1 - qy0) / w));
    let gd = "";
    for (let k = 0; k < n * 2; k++) gd += glyphs(r, lx + w * 0.1, qy0 + ((qy1 - qy0) * k) / (n * 2) + 2, w * 0.8, (qy1 - qy0) / (n * 2) - 4, 1);
    A.add(A.path(gd, "none", `stroke="${g}" stroke-width="${f(Math.max(2, w * 0.07))}" stroke-linecap="round"`));
  });
  // 벽에 붙은 가로 간판
  A.add(A.path(wallX(P, -W, -1.0, -0.6, 2.5, 3.3), "#e0d0a0") + A.path(wallX(P, W, -0.5, -0.1, 1.3, 2.0), "#c65a36"));
  // 전깃줄 (하늘에 얽힌)
  let wire = "";
  for (let k = 0; k < 9; k++) {
    const za = 1.3 + r() * 2.5, zb = za + gauss(r) * 0.8;
    const a = P(-W, -2.2 - r() * 1.4, za), b = P(W, -2.2 - r() * 1.4, zb);
    const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 30 + r() * 40;
    wire += `M${i0(a[0])} ${i0(a[1])}Q${i0(mx)} ${i0(my)} ${i0(b[0])} ${i0(b[1])}`;
  }
  A.add(A.line(wire, "#26243a", 2.2, 'opacity=".85"'));
  // 골목 바닥의 잡동사니 (상자, 화분)
  A.add(A.path(quad(P, [[-W + 0.05, 1.0, 2.2], [-W + 0.55, 1.0, 2.2], [-W + 0.55, FL, 2.2], [-W + 0.05, FL, 2.2]]), "#4a7ab8") + A.path(quad(P, [[-W + 0.05, 0.55, 2.4], [-W + 0.45, 0.55, 2.4], [-W + 0.45, 1.0, 2.4], [-W + 0.05, 1.0, 2.4]]), "#e8b030"));
  const [px, py] = P(W - 0.3, FL, 3.0);
  A.add(A.path(`M${i0(px - 16)} ${i0(py - 34)}h32l-5 34h-22z`, "#b0643a") + A.path(cp(px - 6, py - 48, 14) + cp(px + 8, py - 54, 16) + cp(px, py - 66, 12), "#4a9a4a") + A.path(cp(px + 4, py - 62, 8), "#7ac06a"));
  // 햇빛 번짐
  A.add(A.path(pr([[1090, 0], [1250, 0], [980, 700], [860, 700]]), "#fff2d0", `opacity=".22" filter="${blur}"`));
  A.add(A.ell(900, 560, 420, 200, A.glowG("bl", "#ffe6b0"), 0.35));
  finish(A, "#2a2440", 0.5, 0.35);
  return A.svg();
}


/** 줄에 매단 등불들 (현수선). 각 등불 몸통 + 빛번짐. anim개는 흔들림 */
function lanternLine(A: Art, r: Rnd, a: P2, b: P2, sag: number, n: number, size: number, cols: string[], glow: string, anim: number, lineC = "#3a2e2a"): string {
  let s = A.line(`M${i0(a[0])} ${i0(a[1])}Q${i0((a[0] + b[0]) / 2)} ${i0((a[1] + b[1]) / 2 + sag * 2)} ${i0(b[0])} ${i0(b[1])}`, lineC, Math.max(1, size * 0.12));
  const gl: string[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * ((a[0] + b[0]) / 2) + t * t * b[0];
    const y = (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * ((a[1] + b[1]) / 2 + sag * 2) + t * t * b[1];
    const c = cols[Math.floor(r() * cols.length)];
    const body = `<path d="${rel(`M${f(x)} ${f(y)}v${f(size * 0.3)}`)}" stroke="${lineC}" stroke-width="1"/>${A.ell(x, y + size * 1.1, size * 0.62, size * 0.8, c)}${A.ell(x - size * 0.18, y + size * 0.95, size * 0.16, size * 0.4, "#fff3d0", 0.7)}${A.rect(x - size * 0.3, y + size * 0.25, size * 0.6, size * 0.12, "#3a2e2a")}`;
    gl.push(A.ell(x, y + size * 1.1, size * 3, size * 3, glow, 0.55));
    s += anim-- > 0 ? `<g ${A.a("sw", r() * 6, 4 + r() * 3)}>${body}</g>` : body;
  }
  return gl.join("") + s;
}

// ───────────────────────── 시장 거리 ─────────────────────────

function market(): string {
  const A = new Art("market");
  const r = mulberry32(5505);
  const HZ = "#dcebf6";
  const P = persp(800, 400, 700);
  const FL = 1.5;
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, 420, [[0, "#4b98de"], [0.5, "#8fc6f0"], [1, "#f4f2e4"]])));
  A.add(A.ell(620, 90, 460, 340, A.glowG("sun", "#fff3cf", "#ffffff"), 0.7));
  const CC: CloudC = { lit: "#ffffff", mid: "#eef6fd", shade: "#b9d3ec" };
  A.add(cloud(r, 1000, 200, 360, 100, CC, -1) + cloud(r, 480, 230, 300, 80, CC, -1, 0.9));
  // 먼 언덕 도시와 여명탑
  A.add(A.ell(800, 140, 180, 240, A.glowG("tg", "#ffffff"), 0.4));
  A.add(dawnTower(A, 800, 330, 40, 0.5, HZ, false, 1.05));
  const hb = (x: number) => 400 - 70 * bell(x, 800, 260);
  A.add(town(A, { seed: 51, x0: 560, x1: 1040, base: hb, hMin: 12, hMax: 22, wMin: 16, wMax: 26, haze: 0.45, hazeC: HZ, win: 0.4 }));
  A.add(town(A, { seed: 52, x0: 600, x1: 1000, base: () => 420, hMin: 16, hMax: 30, wMin: 22, wMax: 34, haze: 0.3, hazeC: HZ, win: 0.5 }));
  // 거리 바닥 (돌)
  A.add(A.path(flatY(P, FL, -3.4, 3.4, 1, 14), A.v("gnd", 420, 900, [[0, "#e6d7bd"], [1, "#b09a7c"]])));
  let cob = "";
  for (let z = 14; z > 1.2; z /= 1.12) { const a = P(-3.4, FL, z), b = P(3.4, FL, z); cob += `M${i0(a[0])} ${i0(a[1])}H${i0(b[0])}`; }
  A.add(A.line(cob, "#c4ae8e", 1.5, 'opacity=".6"'));
  // 양옆 건물 (흰 벽 + 주황 지붕)
  for (const sd of [-1, 1]) {
    const X = sd * 2.6;
    A.add(A.path(wallX(P, X, -2.4, FL, 1, 14), A.lin("bw" + sd, sd < 0 ? 0 : 1, 0, sd < 0 ? 1 : 0, 0, [[0, sd < 0 ? "#e9dfcc" : "#d9ccb8"], [1, "#f6efe2"]])));
    A.add(A.path(quad(P, [[X, -2.4, 1], [X, -2.4, 14], [X + sd * 0.9, -3.4, 14], [X + sd * 0.9, -3.4, 1]]), sd < 0 ? "#e0764a" : "#c65a36"));
    A.add(A.path(wallX(P, X, -2.4, -2.28, 1, 14), "#b24e30"));
    let wn = "";
    for (let z = 1.6; z < 13; z *= 1.35) wn += wallX(P, X, -1.9, -1.3, z, z * 1.1);
    A.add(A.path(wn, "#6c7c96"));
  }
  // 천막 가게들
  const stripes = [["#e0764a", "#fff6df"], ["#4a8ab8", "#f4f0e4"], ["#d9a632", "#fff6df"], ["#9a4a6a", "#f6e6d6"], ["#4a9a6a", "#f4f0e4"], ["#c23a3a", "#fff1c4"]];
  const spice = ["#c23a3a", "#e07a2a", "#f2c23a", "#8a5a2a", "#6a8a3a", "#d4552a", "#f5b04a", "#7a3a2a"];
  const zs = [9.5, 7.2, 5.4, 4.0, 3.0, 2.2, 1.6];
  for (const sd of [-1, 1]) {
    zs.forEach((z0, k) => {
      const z1 = z0 * 1.28;
      const [c1, c2] = stripes[(k * 2 + (sd > 0 ? 1 : 0)) % stripes.length];
      const xi = sd * 1.35, xo = sd * 2.6;
      // 그늘진 안쪽
      A.add(A.path(wallX(P, xo, -0.95, FL, z0, z1), "#4a3a40", 'opacity=".75"'));
      // 탁자 + 물건
      A.add(A.path(flatY(P, 0.6, xi + sd * 0.05, xo, z0 + 0.05, z1 - 0.05), "#a8764a") + A.path(wallX(P, xi + sd * 0.05, 0.6, 1.05, z0 + 0.05, z1 - 0.05), "#7a4e30"));
      let piles = "";
      const pc: string[] = [];
      for (let m = 0; m < 3; m++) {
        const zz = z0 + ((z1 - z0) * (m + 0.5)) / 3, xx = sd * (1.6 + r() * 0.3);
        const [px, py] = P(xx, 0.6, zz);
        const rr = (0.14 * 700) / zz;
        const c = spice[Math.floor(r() * spice.length)];
        pc.push(A.ell(px, py - rr * 0.2, rr, rr * 0.55, c) + A.ell(px - rr * 0.3, py - rr * 0.4, rr * 0.35, rr * 0.2, "#ffffff", 0.3));
        piles += "";
      }
      A.add(pc.join(""));
      // 기둥
      const a = P(xi, -0.4, z0), b = P(xi, FL, z0);
      A.add(A.line(`M${i0(a[0])} ${i0(a[1])}V${i0(b[1])}`, "#6a4a30", Math.max(2, 42 / z0)));
      // 줄무늬 차양
      let s1 = "", s2 = "";
      const n = 6;
      for (let m = 0; m < n; m++) {
        const za = z0 + ((z1 - z0) * m) / n, zb = z0 + ((z1 - z0) * (m + 1)) / n;
        const q = quad(P, [[xi, -0.4, za], [xi, -0.4, zb], [xo, -1.0, zb], [xo, -1.0, za]]);
        if (m % 2) s1 += q; else s2 += q;
      }
      A.add(A.path(s1, c1) + A.path(s2, c2));
      // 앞 드림 (물결 가장자리)
      const v0 = P(xi, -0.4, z0), v1 = P(xi, -0.4, z1), h = (0.22 * 700) / z0;
      let sc = `M${i0(v0[0])} ${i0(v0[1])}L${i0(v1[0])} ${i0(v1[1])}`;
      const m2 = 5;
      for (let m = m2; m > 0; m--) {
        const ta = m / m2, tb = (m - 1) / m2;
        const xa = v0[0] + (v1[0] - v0[0]) * ta, xb = v0[0] + (v1[0] - v0[0]) * tb;
        const ya = v0[1] + (v1[1] - v0[1]) * ta, yb = v0[1] + (v1[1] - v0[1]) * tb;
        sc += `L${i0(xa)} ${i0(ya + h)}Q${i0((xa + xb) / 2)} ${i0((ya + yb) / 2 + h * 1.5)} ${i0(xb)} ${i0(yb + h)}`;
      }
      A.add(A.path(sc + "Z", c1) + A.line(`M${i0(v0[0])} ${i0(v0[1])}L${i0(v1[0])} ${i0(v1[1])}`, "#ffffff", Math.max(1, 20 / z0), 'opacity=".5"'));
    });
  }
  // 등불 줄
  const gl = A.glowG("lg", "#ffcf7a");
  let anim = 12;
  for (const z of [6, 3.6, 2.2]) {
    const a = P(-1.35, -0.8, z), b = P(1.35, -0.8, z * 1.15);
    A.add(lanternLine(A, r, a, b, 180 / z, 7, 64 / z, ["#e05a3a", "#f5b04a", "#e0764a", "#c23a3a"], gl, anim));
    anim -= 6;
  }
  // 깃발 줄
  let fl1 = "", fl2 = "";
  for (const z of [8, 4.8]) {
    const a = P(-2.6, -2.2, z), b = P(2.6, -2.2, z);
    for (let k = 0; k < 14; k++) {
      const t = (k + 0.5) / 14, x = a[0] + (b[0] - a[0]) * t, y = a[1] + Math.sin(Math.PI * t) * (220 / z);
      const q = pr([[x - 90 / z, y], [x + 90 / z, y], [x, y + 200 / z]]);
      if (k % 2) fl1 += q; else fl2 += q;
    }
    A.add(A.line(`M${i0(a[0])} ${i0(a[1])}Q800 ${i0(a[1] + 440 / z)} ${i0(b[0])} ${i0(b[1])}`, "#6a4a30", 1.5));
  }
  A.add(A.path(fl1, "#f5b04a") + A.path(fl2, "#e0764a"));
  A.add(A.ell(700, 300, 700, 300, A.glowG("bloom", "#fff6d8"), 0.3));
  finish(A, "#5a4a6a", 0.35, 0.3);
  return A.svg();
}

// ───────────────────────── 낮은 거리 뒷골목, 해질녘 ─────────────────────────

function alley(): string {
  const A = new Art("alley");
  const r = mulberry32(6606);
  const blur = A.blur("soft", 10);
  const P = persp(800, 420, 700);
  const FL = 1.4, W = 1.7, ZE = 12;
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, 470, [[0, "#3c3a78"], [0.35, "#8a5a8a"], [0.7, "#e88a6a"], [1, "#ffc98a"]])));
  A.add(A.ell(820, 420, 360, 300, A.glowG("sun", "#ffb070", "#fff0c8"), 1));
  A.add(`<circle cx="820" cy="430" r="40" fill="#fff0c8"/>`);
  A.add(streaks(r, 8, 500, 1100, 200, 380, "#ffb49a", 0.6, 8));
  // 끝의 성벽 실루엣
  A.add(A.path(`M560 470V404h20v-10h14v10h40v-14h14v14h60v-8h14v8h140v-12h14v12h60v-10h14v10h40V470z`, "#5a3a5a"));
  // 좌우 벽 (거친 흰 벽이 노을에 물듦)
  A.add(A.path(wallX(P, -W, -4, FL, 1, ZE), A.lin("lw", 0, 0, 1, 0, [[0, "#6a4a5a"], [0.6, "#b87a7a"], [1, "#f0a888"]])));
  A.add(A.path(wallX(P, W, -4, FL + 0.5, 1, ZE), A.lin("rw", 1, 0, 0, 0, [[0, "#4a3a54"], [0.6, "#8a5a70"], [1, "#d08a7a"]])));
  // 벽 위쪽 햇빛 띠
  A.add(A.path(wallX(P, -W, -4, -1.6, 2.2, ZE), "#ffb88a", 'opacity=".35"'));
  // 창, 문, 나무 덧판
  let wn = "", dr = "", lampP: P2[] = [];
  for (const sd of [-1, 1]) for (let z = 1.5; z < 10; z *= 1.45) {
    wn += wallX(P, sd * W, -2.4, -1.7, z, z * 1.12);
    if (sd < 0) dr += wallX(P, sd * W, -0.4, FL, z * 1.18, z * 1.3);
    if (r() < 0.7) lampP.push(P(sd * W * 0.96, -0.8, z * 1.25));
  }
  A.add(A.path(wn, "#2a2238") + A.path(dr, "#5a3a30"));
  // 등 (막 켜지기 시작)
  const lg = A.glowG("lamp", "#ffc070", "#fff0c8");
  lampP.forEach(([x, y], i) => A.add(A.ell(x, y, 50, 50, lg, 0.8, i < 5 ? A.a("fl", i, 2.5 + i * 0.3) : "") + `<circle cx="${i0(x)}" cy="${i0(y)}" r="4" fill="#fff4d6"/>`));
  // 길 (왼쪽) + 운하 (오른쪽)
  A.add(A.path(flatY(P, FL, -W, 0.05, 1, ZE) + wallX(P, W, FL, FL + 0.6, 1, ZE), A.v("walk", 420, 900, [[0, "#b8847a"], [1, "#4a3444"]])));
  A.add(A.path(flatY(P, FL + 0.35, 0.05, W, 1, ZE), A.v("water", 420, 900, [[0, "#ffc08a"], [0.3, "#b86a7a"], [1, "#2a2440"]])));
  A.add(A.path(wallX(P, 0.05, FL, FL + 0.35, 1, ZE), "#5a3a44"));
  // 물 반짝임
  for (let i = 0; i < 12; i++) {
    const z = 1.3 + Math.pow(r(), 1.5) * 9, x = 0.2 + r() * 0.75;
    const [gx, gy] = P(x, FL + 0.35, z);
    A.add(A.rect(gx - 60 / z, gy, 120 / z, Math.max(1.2, 6 / z), "#ffe2b0", A.a("sh", r() * 7, 4 + r() * 4)));
  }
  // 작은 나무 다리
  A.add(A.path(quad(P, [[0.05, FL - 0.05, 5], [W, FL - 0.05, 5], [W, FL - 0.05, 5.5], [0.05, FL - 0.05, 5.5]]), "#6a4232") + A.path(frontZ(P, 5, 0.05, W, FL - 0.05, FL + 0.08), "#4a2e28"));
  // 빨랫줄 + 빨래
  const cloth = ["#f4ede0", "#e0764a", "#4a8ab8", "#f2d27a", "#d8a0b0", "#ffffff", "#8ab870"];
  for (const [z, y] of [[2.2, -1.5], [3.4, -1.2], [5, -1.5], [7.5, -1.3]] as P2[]) {
    const a = P(-W, y, z), b = P(W, y, z * 1.05);
    const sag = 140 / z;
    A.add(A.line(`M${i0(a[0])} ${i0(a[1])}Q${i0((a[0] + b[0]) / 2)} ${i0((a[1] + b[1]) / 2 + sag)} ${i0(b[0])} ${i0(b[1])}`, "#2a2030", 1.5));
    let cl = "";
    for (let k = 0; k < 6; k++) {
      const t = 0.1 + k * 0.15 + r() * 0.04;
      const x = a[0] + (b[0] - a[0]) * t, yy = a[1] + (b[1] - a[1]) * t + sag * 2 * t * (1 - t) * 2;
      const w = (0.22 + r() * 0.18) * 700 / z, h = (0.3 + r() * 0.35) * 700 / z;
      const c = cloth[Math.floor(r() * cloth.length)];
      const d = r() < 0.5 ? rp(x - w / 2, yy, w, h) : rel(`M${i0(x - w / 2)} ${i0(yy)}h${i0(w)}l${i0(-w * 0.12)} ${i0(h)}h${i0(-w * 0.3)}l${i0(-w * 0.08)} ${i0(-h * 0.5)}l${i0(-w * 0.08)} ${i0(h * 0.5)}h${i0(-w * 0.3)}z`);
      A.add(k === 2 && z < 4 ? `<g ${A.a("sw", r() * 5, 5)}>${A.path(d, c)}</g>` : A.path(d, c));
      cl += rp(x - w / 2, yy, w * 0.25, h * 0.9);
    }
    A.add(A.path(cl, "#2a1e30", 'opacity=".25"'));
  }
  // 역광 번짐
  A.add(A.ell(820, 440, 600, 380, A.glowG("bloom", "#ffc890"), 0.35));
  A.add(A.path(pr([[760, 470], [880, 470], [1010, 900], [690, 900]]), "#ffd2a0", `opacity=".12" filter="${blur}"`));
  finish(A, "#1e1830", 0.55, 0.4);
  return A.svg();
}

/** 판잣집 줄: 나무·양철 벽 + 외쪽지붕 (색이 제각각) */
function shanty(A: Art, o: { seed: number; x0: number; x1: number; base: (x: number) => number; hMin: number; hMax: number; wMin: number; wMax: number; haze: number; hazeC: string }): string {
  const r = mulberry32(o.seed);
  const H = (c: string) => mix(c, o.hazeC, o.haze);
  const walls = ["#b08a64", "#9a7a5e", "#c7ab88", "#8a6e5a", "#d8c6a8", "#a89484"];
  const roofs = ["#7a6a64", "#a8583a", "#6a7a84", "#8a4a34", "#b89a6a", "#5a6a5a"];
  const bw: string[] = walls.map(() => ""), br: string[] = roofs.map(() => "");
  let sh = "", wn = "", plank = "";
  for (let x = o.x0; x < o.x1; ) {
    const w = o.wMin + r() * (o.wMax - o.wMin), b = o.base(x + w / 2) + r() * 6, h = o.hMin + r() * (o.hMax - o.hMin);
    const wi = Math.floor(r() * walls.length), ri = Math.floor(r() * roofs.length);
    bw[wi] += rp(x, b - h, w, h);
    sh += rp(x + w * 0.75, b - h, w * 0.25, h);
    const tilt = (r() - 0.5) * w * 0.5;
    br[ri] += pr([[x - w * 0.08, b - h + 2], [x + w * 1.08, b - h + 2 - tilt * 0.3], [x + w * 1.05, b - h - w * 0.18 - tilt], [x - w * 0.05, b - h - w * 0.12]]);
    if (r() < 0.7) wn += rp(x + w * 0.25, b - h * 0.65, w * 0.22, h * 0.25);
    plank += `M${i0(x + w * 0.5)} ${i0(b - h)}v${i0(h)}`;
    x += w * (0.62 + r() * 0.3);
  }
  let s = bw.map((d, i) => A.path(d, H(walls[i]))).join("") + A.path(sh, H("#4a3a3a"), 'opacity=".35"') + A.line(plank, H("#6a5040"), 1, 'opacity=".4"') + A.path(wn, H("#3a3040"));
  s += br.map((d, i) => A.path(d, H(roofs[i]))).join("");
  return s;
}

// ───────────────────────── 낮은 거리 전경 (낮) ─────────────────────────

function slums(): string {
  const A = new Art("slums");
  const r = mulberry32(7707);
  const HZ = "#d8e8f4";
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, 420, [[0, "#4a96dc"], [0.55, "#94c8ee"], [1, "#eaf2f0"]])));
  A.add(A.ell(1250, 90, 420, 320, A.glowG("sun", "#fff3cf", "#ffffff"), 0.7));
  const CC: CloudC = { lit: "#ffffff", mid: "#eef6fd", shade: "#b9d3ec" };
  A.add(cloud(r, 300, 170, 460, 120, CC, 1) + cloud(r, 1320, 210, 420, 100, CC, 1, 0.9));
  // 윗도시 (성벽 너머 언덕)
  A.add(A.ell(800, 120, 160, 220, A.glowG("tg", "#ffffff"), 0.4));
  A.add(dawnTower(A, 800, 260, 20, 0.5, HZ, false, 1.1));
  const hb = (k: number) => (x: number) => 250 + k * 28 - (90 - k * 20) * bell(x, 800, 500);
  A.add(town(A, { seed: 71, x0: -20, x1: 1620, base: hb(0), hMin: 12, hMax: 22, wMin: 18, wMax: 30, haze: 0.5, hazeC: HZ, win: 0.3, tower: 0.08 }));
  A.add(town(A, { seed: 72, x0: -20, x1: 1620, base: hb(1), hMin: 16, hMax: 28, wMin: 24, wMax: 40, haze: 0.36, hazeC: HZ, win: 0.35 }));
  // 성벽
  const WT = 330, WB = 450;
  A.add(A.rect(0, WT, 1600, WB - WT, A.v("wall", WT, WB, [[0, "#efe6d6"], [0.5, "#d8cab4"], [1, "#a8977e"]])));
  let mer = "";
  for (let x = 0; x < 1600; x += 36) mer += rp(x, WT - 16, 22, 17);
  A.add(A.path(mer, "#efe6d6"));
  let st = "";
  for (let y = WT + 18; y < WB; y += 22) st += `M0 ${y}H1600`;
  for (let y = WT + 18, k = 0; y < WB; y += 22, k++) for (let x = (k % 2) * 30; x < 1600; x += 60) st += `M${x} ${y}v22`;
  A.add(A.line(st, "#b8a88e", 1.2, 'opacity=".5"'));
  A.add(A.rect(0, WT, 1600, 4, "#ffffff", 'opacity=".7"'));
  // 탑
  for (const tx of [260, 1330]) {
    A.add(A.rect(tx - 46, WT - 70, 92, WB - WT + 70, "#f3ede2") + A.rect(tx + 16, WT - 70, 30, WB - WT + 70, "#c9bba8"));
    A.add(A.path(pr([[tx - 56, WT - 70], [tx + 56, WT - 70], [tx, WT - 150]]), "#e0764a") + A.path(pr([[tx, WT - 150], [tx + 56, WT - 70], [tx + 16, WT - 70]]), "#b24e30"));
    A.add(A.path(arch(tx - 10, WT - 10, 20, WT - 46, 0.5), "#5a6070"));
  }
  // 성벽 아래 그늘
  A.add(A.rect(0, WB, 1600, 50, A.v("wsh", WB, WB + 50, [[0, "#5a5070", 0.45], [1, "#5a5070", 0]])));
  // 판잣집 (뒤 → 앞)
  A.add(shanty(A, { seed: 73, x0: -20, x1: 1620, base: () => 490, hMin: 30, hMax: 50, wMin: 36, wMax: 60, haze: 0.25, hazeC: HZ }));
  A.add(shanty(A, { seed: 74, x0: -20, x1: 1620, base: (x) => 545 + 10 * Math.sin(x / 200), hMin: 40, hMax: 64, wMin: 48, wMax: 80, haze: 0.14, hazeC: HZ }));
  // 빨랫줄
  let ln = "", cl1 = "", cl2 = "", cl3 = "";
  for (let k = 0; k < 7; k++) {
    const x0 = 80 + k * 220 + r() * 40, x1 = x0 + 120 + r() * 60, y0 = 480 + r() * 30;
    ln += `M${i0(x0)} ${i0(y0)}Q${i0((x0 + x1) / 2)} ${i0(y0 + 16)} ${i0(x1)} ${i0(y0 - 4)}`;
    for (let m = 0; m < 4; m++) {
      const t = 0.15 + m * 0.22, x = x0 + (x1 - x0) * t, y = y0 + 16 * 2 * t * (1 - t) * 2 - 2;
      const d = rp(x - 7, y, 14, 16 + r() * 10);
      if (m % 3 === 0) cl1 += d; else if (m % 3 === 1) cl2 += d; else cl3 += d;
    }
  }
  A.add(A.line(ln, "#4a3a3a", 1.2) + A.path(cl1, "#f4ede0") + A.path(cl2, "#e0764a") + A.path(cl3, "#4a8ab8"));
  // 운하 + 돌다리
  A.add(A.rect(0, 588, 1600, 60, A.v("canal", 588, 648, [[0, "#9ccbe6"], [1, "#4a7a9a"]])));
  for (let i = 0; i < 10; i++) A.add(A.rect(r() * 1500, 596 + r() * 44, 30 + r() * 50, 2, "#ffffff", A.a("sh", r() * 7, 5 + r() * 3)));
  A.add(A.rect(0, 584, 1600, 6, "#8a7a6a"));
  A.add(A.path("M700 648V600q100-50 200 0v48h-20v-30q-80-36-160 0v30z", "#d8cab4") + A.rect(690, 592, 220, 8, "#efe6d6"));
  // 앞 판잣집 (크게)
  A.add(A.rect(0, 648, 1600, 252, A.v("gnd", 648, 900, [[0, "#a8927a"], [1, "#6a5a5a"]])));
  A.add(shanty(A, { seed: 75, x0: -40, x1: 1640, base: () => 900, hMin: 190, hMax: 240, wMin: 110, wMax: 170, haze: 0, hazeC: HZ }));
  // 굴뚝 연기
  const sm = A.glowG("smoke", "#ffffff");
  for (const [x, y] of [[340, 470], [980, 450], [1240, 520]] as P2[]) A.add(A.ell(x, y, 30, 22, sm, 0.7) + A.ell(x + 20, y - 34, 40, 28, sm, 0.5) + A.ell(x + 50, y - 74, 54, 34, sm, 0.35, A.a("br", x, 7)));
  A.add(A.ell(1100, 200, 800, 400, A.glowG("bloom", "#fff7e0"), 0.3));
  finish(A, "#5a4a6a", 0.35, 0.35);
  return A.svg();
}

// ───────────────────────── 남문 성벽 위, 새벽 ─────────────────────────

function southgate(): string {
  const A = new Art("southgate");
  const r = mulberry32(8808);
  const blur = A.blur("soft", 10);
  const HOR = 500;
  A.add(A.rect(0, 0, 1600, 900, A.v("sky", 0, HOR, [[0, "#2a3c78"], [0.35, "#6a78b8"], [0.65, "#e0a0a8"], [0.88, "#ffc88a"], [1, "#fff0c4"]])));
  A.add(starField(r, 30, 0, 0, 1600, 140, "#e8eeff", 0.6));
  A.add(A.ell(960, HOR, 820, 360, A.glowG("dawn", "#ffc080", "#fff6d8"), 1));
  A.add(A.path(`M915 ${HOR}a45 45 0 0 1 90 0z`, "#fff8e0"));
  A.add(streaks(r, 9, 200, 1500, 250, 420, "#ffd0b0", 0.7, 10) + streaks(r, 6, 0, 1600, 120, 250, "#8a8ac0", 0.55, 8));
  A.add(cloud(r, 330, 380, 380, 70, { lit: "#ffd6b8", mid: "#c49ab4", shade: "#8a7aa8" }, 1, 0.9));
  // 먼 산과 평원
  A.add(A.path(ridge(r, -20, 1620, 30, (x) => HOR - 20 - 36 * bell(x, 300, 250) - 26 * bell(x, 1350, 200), 3), "#a88aa8"));
  A.add(A.path(ridge(r, -20, 1620, 40, (x) => HOR + 6 + 10 * Math.sin(x / 150), 2), "#8e7aa0"));
  A.add(A.rect(0, HOR + 10, 1600, 200, A.v("plain", HOR + 10, HOR + 210, [[0, "#b89ab0"], [0.4, "#8a9a8a"], [1, "#5a7a5a"]])));
  // 밭 조각
  const fc = ["#9aa878", "#b8b080", "#7a9a6a", "#c8b88a"];
  for (let i = 0; i < 4; i++) {
    let d = "";
    for (let k = 0; k < 14; k++) { const x = r() * 1600, y = HOR + 40 + Math.pow(r(), 0.8) * 150, w = 60 + (y - HOR) * 1.2 * r(), h = 4 + (y - HOR) * 0.08; d += pr([[x, y], [x + w, y - h * 0.3], [x + w * 1.1, y + h], [x + w * 0.1, y + h * 1.2]]); }
    A.add(A.path(d, fc[i], 'opacity=".7"'));
  }
  // 멀리 이어지는 성벽과 작은 망루 (오른쪽)
  A.add(A.path(`M1100 520L1600 470V540L1100 548Z`, "#b8a0ac") + A.rect(1440, 400, 40, 90, "#c8b0b4") + A.path("M1434 402h52l-26-40z", "#b0503a"));
  // 숲, 강, 길
  let tr: P2[] = [];
  for (let i = 0; i < 160; i++) { const x = r() * 1600, y = HOR + 14 + Math.pow(r(), 1.4) * 60; if (Math.abs(x - 960) > 80) tr.push([x, y]); }
  A.add(dots(tr, "#6a6a80", 8, 0.7));
  A.add(A.path(`M960 ${HOR + 8}C930 540 1080 570 980 610S760 660 820 720L900 720C860 670 1080 640 1060 600S970 540 972 ${HOR + 8}z`, "#e8c8a0", 'opacity=".85"'));
  A.add(A.line(`M1300 ${HOR + 12}C1200 540 1400 560 1260 600S1100 640 1180 700`, "#ffe0b0", 4, 'opacity=".8"'));
  // 성벽 윗길 (앞)
  A.add(A.path(`M0 640H1600V900H0Z`, A.v("walk", 640, 900, [[0, "#b8a0a0"], [1, "#6a5a6a"]])));
  let fl = "";
  for (let x = -400; x < 2000; x += 90) fl += `M${x} 640L${800 + (x - 800) * 2.2} 900`;
  fl += "M0 700H1600M0 790H1600";
  A.add(A.line(fl, "#8a7a84", 1.5, 'opacity=".5"'));
  // 앞 흉벽 + 총안
  A.add(A.rect(0, 580, 1600, 64, A.v("para", 580, 644, [[0, "#e8d0c0"], [1, "#a8909a"]])));
  let mer = "";
  for (let x = -20; x < 1600; x += 110) mer += rp(x, 520, 64, 62);
  A.add(A.path(mer, A.v("mer", 520, 580, [[0, "#f2dccc"], [1, "#c8b0b0"]])) + A.line(`M0 580H1600`, "#fff0e0", 3));
  let mrim = "";
  for (let x = -20; x < 1600; x += 110) mrim += `M${x} 521h64`;
  A.add(A.line(mrim, "#fff4e4", 3));
  // 망루 (왼쪽 중앙)
  const tx = 560, tw = 150;
  A.add(A.rect(tx - tw / 2, 170, tw, 480, A.lin("tw", 0, 0, 1, 0, [[0, "#f0d8cc"], [0.6, "#d8bcb8"], [1, "#9a8494"]])));
  let tm = "";
  for (let k = 0; k < 5; k++) tm += rp(tx - tw / 2 - 10 + k * 36, 150, 22, 24);
  A.add(A.rect(tx - tw / 2 - 12, 170, tw + 24, 18, "#c8b0b0") + A.path(tm, "#f0d8cc"));
  A.add(A.path(pr([[tx - tw / 2 - 20, 152], [tx + tw / 2 + 20, 152], [tx, 40]]), "#c65a36") + A.path(pr([[tx, 40], [tx + tw / 2 + 20, 152], [tx + 20, 152]]), "#9a3e2a"));
  A.add(A.path(arch(tx - 18, 330, 36, 260, 0.5) + arch(tx - 14, 480, 28, 420, 0.5), "#3a3050"));
  A.add(A.line(`M${tx - tw / 2} 170V650`, "#fff0e0", 2, 'opacity=".6"') + A.line(`M${tx + tw / 2} 170V650`, "#ffd0a0", 3, 'opacity=".8"'));
  // 깃대 + 깃발
  A.add(A.line(`M${tx} 40V-10`, "#6a4a3a", 4));
  A.add(`<path d="M${tx} -6h90l-14 18 14 18h-90z" fill="#f5b04a" ${A.a("sw", 0, 4)}/>`);
  // 횃불
  A.add(A.ell(tx + 90, 440, 70, 70, A.glowG("torch", "#ffb060", "#fff0c8"), 0.8, A.a("fl", 0, 2)) + A.line(`M${tx + 90} 450v40`, "#4a3030", 5) + A.path(`M${tx + 84} 450q6-22 6-30q6 12 6 30z`, "#ffe0a0"));
  // 역광
  A.add(A.path(pr([[960, HOR], [700, 900], [1250, 900]]), "#fff0d0", `opacity=".14" filter="${blur}"`));
  A.add(A.ell(960, 480, 700, 320, A.glowG("bloom", "#ffe8c0"), 0.35));
  finish(A, "#2a2040", 0.45, 0.35);
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
  er: er(),
  seoul: seoul(),
  market: market(),
  alley: alley(),
  slums: slums(),
  southgate: southgate(),
};
