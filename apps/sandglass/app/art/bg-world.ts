// World backgrounds for 「천 번째 새벽, 당신에게」.
// Each value is a complete SVG string (viewBox 1600x900, slice).
// Every id / class is prefixed "sgw-<id>-" so several SVGs can coexist in one DOM.
// Style: bright TV-anime fantasy background plates — luminous skies, crisp flat
// shapes, atmospheric perspective and radial-gradient bloom.

type Pt = [number, number];
type Stop = [number, string, number?];

/* ───────────────────────── utilities ───────────────────────── */

class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  n(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  r(a: number, b: number): number {
    return a + (b - a) * this.n();
  }
  i(a: number, b: number): number {
    return Math.floor(this.r(a, b + 1));
  }
  pick<T>(a: readonly T[]): T {
    return a[Math.floor(this.n() * a.length)];
  }
}

const f = (v: number): string => String(Math.abs(v) < 100 ? Math.round(v * 10) / 10 : Math.round(v));
const q = (v: number): string => String(Math.round(v));
const f2 = (v: number): string => String(Math.round(v * 100) / 100).replace(/^(-?)0\./, "$1.");
const pt = (p: Pt): string => `${q(p[0])} ${q(p[1])}`;
const TAU = Math.PI * 2;

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** mix two #rrggbb colours */
function mix(a: string, b: string, t: number): string {
  const A = hex(a);
  const B = hex(b);
  return (
    "#" +
    A.map((v, k) =>
      Math.round(v + (B[k] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
}

class Pic {
  readonly p: string;
  private d: string[] = [];
  private c: string[] = [];
  private b: string[] = [];
  private cache = new Map<string, string>();
  private k = 0;
  private kfs = new Set<string>();
  moving = 0;
  filters = 0;
  constructor(name: string) {
    this.p = "sgw-" + name;
  }
  id(s: string): string {
    return `${this.p}-${s}`;
  }
  ref(s: string): string {
    return `url(#${this.id(s)})`;
  }
  def(s: string): void {
    this.d.push(s);
  }
  add(...s: string[]): void {
    this.b.push(...s);
  }
  uid(): string {
    return (this.k++).toString(36);
  }
  private stops(st: Stop[]): string {
    return st
      .map(([o, c, a]) => `<stop offset="${f2(o)}" stop-color="${c}"${a === undefined || a === 1 ? "" : ` stop-opacity="${f2(a)}"`}/>`)
      .join("");
  }
  lin(st: Stop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false): string {
    const key = "l" + JSON.stringify([st, x1, y1, x2, y2, user]);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const n = "g" + this.uid();
    this.def(
      `<linearGradient id="${this.id(n)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(st)}</linearGradient>`,
    );
    const u = this.ref(n);
    this.cache.set(key, u);
    return u;
  }
  rad(st: Stop[], cx = 0.5, cy = 0.5, r = 0.5, user = false): string {
    const key = "r" + JSON.stringify([st, cx, cy, r, user]);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const n = "g" + this.uid();
    const geo = cx === 0.5 && cy === 0.5 && r === 0.5 ? "" : ` cx="${cx}" cy="${cy}" r="${r}"`;
    this.def(`<radialGradient id="${this.id(n)}"${geo}${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(st)}</radialGradient>`);
    const u = this.ref(n);
    this.cache.set(key, u);
    return u;
  }
  /** soft bloom falloff (objectBoundingBox) */
  glow(c: string, hard = false): string {
    return hard
      ? this.rad([[0, c, 1], [0.16, c, 0.85], [0.38, c, 0.3], [1, c, 0]])
      : this.rad([[0, c, 1], [0.25, c, 0.5], [0.55, c, 0.15], [1, c, 0]]);
  }
  blur(sd: number, name = "b"): string {
    this.filters++;
    this.def(
      `<filter id="${this.id(name)}" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2200" height="1500"><feGaussianBlur stdDeviation="${sd}"/></filter>`,
    );
    return this.ref(name);
  }
  keyframes(name: string, kf: string, rule: string): void {
    if (this.kfs.has(name)) return;
    this.kfs.add(name);
    this.c.push(`@keyframes ${this.id(name)}{${kf}}.${this.id(name)}{animation:${this.id(name)} ${rule}}`);
  }
  an(name: string, dur?: number, delay?: number): string {
    this.moving++;
    const st: string[] = [];
    if (dur !== undefined) st.push(`animation-duration:${f(dur)}s`);
    if (delay !== undefined) st.push(`animation-delay:-${f(delay)}s`);
    return `class="${this.p}-a ${this.id(name)}"${st.length ? ` style="${st.join(";")}"` : ""}`;
  }
  tw(dur = 4, delay = 0, lo = 0.3): string {
    const n = "tw" + Math.round(lo * 100);
    this.keyframes(n, `0%,100%{opacity:1}50%{opacity:${lo}}`, "4s ease-in-out infinite");
    return this.an(n, dur, delay);
  }
  drift(dur = 9, delay = 0, dy = -10, dx = 0): string {
    const n = `dr${Math.round(dx)}_${Math.round(dy)}`.replace(/-/g, "m");
    this.keyframes(n, `0%,100%{transform:translate(0,0)}50%{transform:translate(${dx}px,${dy}px)}`, "9s ease-in-out infinite");
    return this.an(n, dur, delay);
  }
  flick(dur = 1.6, delay = 0): string {
    this.keyframes(
      "fl",
      "0%,100%{opacity:1;transform:scale(1,1)}23%{opacity:.85;transform:scale(1.04,.93)}47%{opacity:.97;transform:scale(.96,1.07)}71%{opacity:.9;transform:scale(1.02,.97)}",
      "1.6s ease-in-out infinite",
    );
    return this.an("fl", dur, delay);
  }
  /** continuous rotation — element must have a bbox centred on its pivot */
  spin(dur = 60, delay = 0, steps = 0): string {
    const n = steps ? "sps" + steps : "sp";
    this.keyframes(n, "from{transform:rotate(0deg)}to{transform:rotate(360deg)}", `60s ${steps ? `steps(${steps})` : "linear"} infinite`);
    return this.an(n, dur, delay);
  }
  /** pendulum swing — element bbox centred on the pivot */
  swing(dur = 2, delay = 0, deg = 12): string {
    const n = "sw" + deg;
    this.keyframes(n, `0%,100%{transform:rotate(${deg}deg)}50%{transform:rotate(-${deg}deg)}`, "2s ease-in-out infinite");
    return this.an(n, dur, delay);
  }
  /** move up by `dist` and loop (for periodic streams) */
  rise(dist: number, dur: number, delay = 0): string {
    const n = "ri" + Math.round(dist);
    this.keyframes(n, `from{transform:translateY(0)}to{transform:translateY(-${Math.round(dist)}px)}`, "6s linear infinite");
    return this.an(n, dur, delay);
  }
  /** fall by `dist`, fading in/out (ash) */
  fall(dist: number, dx: number, dur: number, delay = 0): string {
    const n = `fa${Math.round(dist)}_${Math.round(dx)}`.replace(/-/g, "m");
    this.keyframes(
      n,
      `0%{transform:translate(0,0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translate(${Math.round(dx)}px,${Math.round(dist)}px);opacity:0}`,
      "10s linear infinite",
    );
    return this.an(n, dur, delay);
  }
  svg(): string {
    const css =
      `.${this.p}-a{transform-box:fill-box;transform-origin:center}` +
      this.c.join("") +
      `@media (prefers-reduced-motion:reduce){.${this.p}-a{animation:none!important}}`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">` +
      `<defs>${this.d.join("")}</defs><style>${css}</style>${this.b.join("")}</svg>`
    );
  }
}

const op_ = (op?: number): string => (op === undefined || op === 1 ? "" : ` opacity="${f2(op)}"`);
const rect = (fill: string, op?: number, x = 0, y = 0, w = 1600, h = 900, extra = ""): string =>
  `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(h)}" fill="${fill}"${op_(op)}${extra}/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, op?: number, extra = ""): string =>
  `<ellipse cx="${q(cx)}" cy="${q(cy)}" rx="${q(rx)}" ry="${q(ry)}" fill="${fill}"${op_(op)}${extra}/>`;
const circ = (cx: number, cy: number, r: number, fill: string, op?: number, extra = ""): string =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${op_(op)}${extra}/>`;
const path = (d: string, fill: string, op?: number, extra = ""): string => `<path d="${d}" fill="${fill}"${op_(op)}${extra}/>`;
const stroke = (d: string, c: string, w: number, op?: number, extra = ""): string =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}"${op === undefined || op === 1 ? "" : ` stroke-opacity="${f2(op)}"`} stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const poly = (pts: Pt[]): string => "M" + pts.map(pt).join("L") + "Z";
const circD = (cx: number, cy: number, r: number): string =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const g = (inner: string, extra = ""): string => `<g${extra ? " " + extra : ""}>${inner}</g>`;
const tr = (x: number, y: number, s = 1, rot = 0, sy?: number): string =>
  `transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ""}${s !== 1 || sy !== undefined ? ` scale(${f2(s)} ${f2(sy ?? s)})` : ""}"`;

/** zero-length round-capped subpaths → dots */
function dotsD(pts: Pt[]): string {
  let out = "";
  let px = 0;
  let py = 0;
  pts.forEach(([x, y], k) => {
    const X = Math.round(x);
    const Y = Math.round(y);
    out += k === 0 ? `M${X} ${Y}h0` : `m${X - px} ${Y - py}h0`;
    px = X;
    py = Y;
  });
  return out;
}
const dots = (pts: Pt[], w: number, c: string, op = 1, extra = ""): string =>
  pts.length
    ? `<path d="${dotsD(pts)}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"${op === 1 ? "" : ` stroke-opacity="${f2(op)}"`}${extra}/>`
    : "";

/** transparent disc that makes a group's bbox centred on (cx,cy) — pivot helper */
const pivot = (cx: number, cy: number, r: number): string => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#000" fill-opacity="0"/>`;

/* ───────────────────────── shared motifs ───────────────────────── */

/** toothed gear outline with hub hole, evenodd */
function gearD(cx: number, cy: number, r: number, teeth: number, depth = 0.14, hole = 0.62, rot = 0): string {
  const pts: Pt[] = [];
  const ri = r * (1 - depth);
  for (let k = 0; k < teeth; k++) {
    const a = rot + (k / teeth) * TAU;
    const w = (TAU / teeth) * 0.25;
    pts.push([cx + Math.cos(a - w * 1.25) * ri, cy + Math.sin(a - w * 1.25) * ri]);
    pts.push([cx + Math.cos(a - w * 0.7) * r, cy + Math.sin(a - w * 0.7) * r]);
    pts.push([cx + Math.cos(a + w * 0.7) * r, cy + Math.sin(a + w * 0.7) * r]);
    pts.push([cx + Math.cos(a + w * 1.25) * ri, cy + Math.sin(a + w * 1.25) * ri]);
  }
  const F = r >= 22 ? q : f;
  let d = "M" + pts.map((p) => `${F(p[0])} ${F(p[1])}`).join("L") + "Z";
  if (hole > 0) d += circD(cx, cy, r * hole);
  return d;
}
/** gear drawn with dashed strokes (compact): teeth ring, rim, spokes, hub */
function gear(cx: number, cy: number, r: number, teeth: number, c: string, hi: string, rot = 0, spokes = 5, extra = ""): string {
  const F = r >= 22 ? q : f;
  let sp = "";
  for (let k = 0; k < spokes; k++) {
    const a = rot + (k / spokes) * TAU;
    sp += `M${F(cx)} ${F(cy)}L${F(cx + Math.cos(a) * r * 0.7)} ${F(cy + Math.sin(a) * r * 0.7)}`;
  }
  return g(
    `<circle cx="${F(cx)}" cy="${F(cy)}" r="${f(r * 0.92)}" fill="none" stroke="${c}" stroke-width="${f(r * 0.16)}" pathLength="${teeth * 2}" stroke-dasharray="1" stroke-dashoffset="${f2(rot)}"/>` +
      `<circle cx="${F(cx)}" cy="${F(cy)}" r="${f(r * 0.74)}" fill="none" stroke="${c}" stroke-width="${f(r * 0.24)}"/>` +
      stroke(sp, c, r * 0.12) +
      circ(cx, cy, r * 0.22, c) +
      stroke(`M${F(cx - r * 0.72)} ${F(cy - r * 0.3)}A${f(r * 0.78)} ${f(r * 0.78)} 0 0 1 ${F(cx + r * 0.1)} ${F(cy - r * 0.78)}`, hi, Math.max(1, r * 0.06), 0.75) +
      circ(cx, cy, r * 0.08, hi, 0.8),
    extra,
  );
}

/** ring of short ticks round a dial (dashed circle) */
function tickRing(cx: number, cy: number, r0: number, r1: number, n: number, c: string, thick: number, op = 1): string {
  const rr = (r0 + r1) / 2;
  const L = n * 20;
  const dash = Math.max(0.3, ((thick / (TAU * rr)) * L));
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="none" stroke="${c}" stroke-width="${f(r1 - r0)}" pathLength="${L}" stroke-dasharray="${f2(dash)} ${f2(20 - dash)}" stroke-dashoffset="${f2(dash / 2 + 5 * 0)}" transform="rotate(-90 ${f(cx)} ${f(cy)})"${op === 1 ? "" : ` stroke-opacity="${f2(op)}"`}/>`;
}

/** ring of `n` dots/ticks round a clock face */
function ticksD(cx: number, cy: number, r0: number, r1: number, n: number, rot = 0): string {
  let d = "";
  const F = r0 >= 30 ? q : f;
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * TAU;
    d += `M${F(cx + Math.cos(a) * r0)} ${F(cy + Math.sin(a) * r0)}L${F(cx + Math.cos(a) * r1)} ${F(cy + Math.sin(a) * r1)}`;
  }
  return d;
}

interface ClockOpt {
  rim?: string;
  rimHi?: string;
  face?: string;
  ink?: string;
  h?: number; // hour hand angle (deg from 12)
  m?: number;
  sec?: string; // animation attr for second hand
  secC?: string;
  broken?: number; // seed → jagged bite
  glass?: boolean;
}
/** a round clock face, crisp anime style */
function clock(cx: number, cy: number, r: number, o: ClockOpt = {}): string {
  const rim = o.rim ?? "#8a6a45";
  const rimHi = o.rimHi ?? "#e8c98a";
  const face = o.face ?? "#f6ecd6";
  const ink = o.ink ?? "#3a2e2a";
  let faceD = circD(cx, cy, r * 0.86);
  let rimD = circD(cx, cy, r) + circD(cx, cy, r * 0.86);
  if (o.broken !== undefined) {
    const R = new Rng(o.broken);
    const a0 = R.r(0, TAU);
    const span = R.r(0.8, 1.6);
    const out: Pt[] = [];
    const inn: Pt[] = [];
    const N = 22;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * TAU;
      let da = a - a0;
      da = ((da % TAU) + TAU) % TAU;
      const bite = da < span ? R.r(0.25, 0.75) : 1;
      out.push([cx + Math.cos(a) * r * Math.min(1, bite + 0.1), cy + Math.sin(a) * r * Math.min(1, bite + 0.1)]);
      inn.push([cx + Math.cos(a) * r * 0.86 * bite, cy + Math.sin(a) * r * 0.86 * bite]);
    }
    faceD = poly(inn);
    rimD = poly(out) + poly(inn.slice().reverse());
  }
  const ha = ((o.h ?? 300) * Math.PI) / 180 - Math.PI / 2;
  const ma = ((o.m ?? 60) * Math.PI) / 180 - Math.PI / 2;
  let s =
    path(rimD, rim, undefined, ' fill-rule="evenodd"') +
    path(faceD, face) +
    tickRing(cx, cy, r * 0.66, r * 0.8, 12, ink, Math.max(1, r * 0.07), 0.85) +
    stroke(
      `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(ha) * r * 0.45)} ${f(cy + Math.sin(ha) * r * 0.45)}M${f(cx)} ${f(cy)}L${f(cx + Math.cos(ma) * r * 0.68)} ${f(cy + Math.sin(ma) * r * 0.68)}`,
      ink,
      Math.max(1.2, r * 0.07),
    ) +
    stroke(`M${f(cx - r * 0.72)} ${f(cy - r * 0.5)}A${f(r * 0.93)} ${f(r * 0.93)} 0 0 1 ${f(cx + r * 0.2)} ${f(cy - r * 0.9)}`, rimHi, Math.max(1, r * 0.06), 0.9);
  if (o.sec) {
    const L = r * 0.74;
    s += g(pivot(cx, cy, L) + stroke(`M${f(cx)} ${f(cy + L * 0.2)}L${f(cx)} ${f(cy - L)}`, o.secC ?? "#b8402f", Math.max(0.8, r * 0.03)), o.sec);
  }
  s += circ(cx, cy, Math.max(1.2, r * 0.07), ink);
  if (o.glass) s += path(`M${f(cx - r * 0.55)} ${f(cy - r * 0.2)}Q${f(cx - r * 0.4)} ${f(cy - r * 0.6)} ${f(cx)} ${f(cy - r * 0.68)}Q${f(cx - r * 0.35)} ${f(cy - r * 0.45)} ${f(cx - r * 0.55)} ${f(cy - r * 0.2)}Z`, "#fff", 0.45);
  return s;
}

/** four-point sparkle star */
const sparkD = (x: number, y: number, s: number): string =>
  `M${f(x)} ${f(y - s)}Q${f(x + s * 0.12)} ${f(y - s * 0.12)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.12)} ${f(y + s * 0.12)} ${f(x)} ${f(y + s)}Q${f(x - s * 0.12)} ${f(y + s * 0.12)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.12)} ${f(y - s * 0.12)} ${f(x)} ${f(y - s)}Z`;

function vignette(P: Pic, c = "#000", op = 0.7, inner = 0.45): string {
  return rect(P.rad([[0, c, 0], [inner, c, 0], [0.8, c, op * 0.55], [1, c, op]], 0.5, 0.45, 0.75));
}
function bottomShade(P: Pic, c = "#05070f", op = 0.5, from = 0.6): string {
  return rect(P.lin([[0, c, 0], [from, c, 0], [1, c, op]]));
}

/** star field as dot paths with a few twinkling groups */
function starField(P: Pic, r: Rng, n: number, box: [number, number, number, number], c = "#e8eeff", keep?: (x: number, y: number) => number): string {
  const [x0, y0, x1, y1] = box;
  const b: Pt[][] = [[], [], [], [], []];
  let made = 0;
  for (let t = 0; t < n * 20 && made < n; t++) {
    const x = r.r(x0, x1);
    const y = r.r(y0, y1);
    if (keep && r.n() > keep(x, y)) continue;
    made++;
    const v = r.n();
    const twk = r.n() < 0.25;
    if (v < 0.65) b[twk ? 3 : 0].push([x, y]);
    else if (v < 0.93) b[twk ? 4 : 1].push([x, y]);
    else b[2].push([x, y]);
  }
  return (
    dots(b[0], 1.3, c, 0.55) +
    dots(b[1], 2, c, 0.8) +
    dots(b[2], 2.8, "#ffffff", 1) +
    g(dots(b[3], 1.6, c, 0.9), P.tw(3.6, 0.3)) +
    g(dots(b[4], 2.4, "#ffffff", 1), P.tw(5.1, 2.2, 0.15))
  );
}

/* ── Solein city ── */
interface CityTone {
  wall: string;
  wallSh: string;
  roof: string;
  roofSh: string;
  win?: string; // lit window colour (night)
  winP?: number;
}
/** a band of Solein houses (white walls, orange roofs) on a baseline function */
function cityBand(r: Rng, x0: number, x1: number, base: (x: number) => number, hmin: number, hmax: number, wmin: number, wmax: number, t: CityTone, light = 1): string {
  let walls = "";
  let wallsSh = "";
  let roofs = "";
  let roofsSh = "";
  const wins: Pt[] = [];
  let x = x0;
  while (x < x1) {
    const w = r.r(wmin, wmax);
    const h = r.r(hmin, hmax);
    const by = base(x + w / 2) + r.r(-4, 4);
    const top = by - h;
    const rh = w * r.r(0.32, 0.5);
    const X = Math.round(x);
    const W = Math.round(w);
    const B = Math.round(by + 30);
    const T = Math.round(top);
    const R = Math.round(rh);
    walls += `M${X} ${B}V${T}h${W}V${B}Z`;
    // shaded side (light from left when light>0)
    const sw = Math.round(w * 0.3);
    wallsSh += `M${light > 0 ? X + W - sw : X} ${B}V${T}h${sw}V${B}Z`;
    if (r.n() < 0.72) {
      const e = Math.round(w * 0.06);
      const hw = Math.round(W / 2);
      roofs += `M${X - e} ${T + 1}l${hw + e} ${-R}l${W - hw + e} ${R}Z`;
      roofsSh += `M${X + hw} ${T - R}l${W - hw + e} ${R}h${-(W - hw + e)}Z`;
    } else {
      roofs += `M${X - 2} ${T - 4}h${W + 4}v7h${-W - 4}Z`;
    }
    if (t.win) {
      const rows = Math.max(1, Math.floor(h / 16));
      for (let yy = 0; yy < rows; yy++)
        for (let xx = x + 5; xx < x + w - 4; xx += 9) if (r.n() < (t.winP ?? 0.3)) wins.push([xx, top + 9 + yy * 14]);
    }
    x += w * r.r(0.72, 1.02);
  }
  let s = path(walls, t.wall) + path(wallsSh, t.wallSh) + path(roofs, t.roof) + path(roofsSh, t.roofSh);
  if (t.win) s += dots(wins, 3.2, t.win, 0.95);
  return s;
}

/** Dawn Tower (여명탑) — tall white clock tower; base at (x, by) */
function dawnTower(P: Pic, x: number, by: number, h: number, tone: { stone: string; shade: string; gold: string; dial: string; rim?: string }, lit = 0): string {
  const w = h * 0.12;
  const topY = by - h;
  const dialY = topY + h * 0.18;
  const dr = w * 0.62;
  let s = "";
  // body (tapered)
  s += path(poly([[x - w * 0.62, by], [x - w * 0.5, topY + h * 0.3], [x - w * 0.55, topY + h * 0.28], [x - w * 0.55, topY + h * 0.06], [x + w * 0.55, topY + h * 0.06], [x + w * 0.55, topY + h * 0.28], [x + w * 0.5, topY + h * 0.3], [x + w * 0.62, by]]), tone.stone);
  s += path(poly([[x + w * 0.12, by], [x + w * 0.12, topY + h * 0.06], [x + w * 0.55, topY + h * 0.06], [x + w * 0.55, topY + h * 0.28], [x + w * 0.5, topY + h * 0.3], [x + w * 0.62, by]]), tone.shade);
  // ledges
  for (const k of [0.3, 0.52, 0.74]) s += rect(tone.shade, 0.8, x - w * 0.62, topY + h * k, w * 1.24, Math.max(2, h * 0.008));
  // slit windows
  let sl = "";
  for (const k of [0.4, 0.62, 0.84]) sl += `M${f(x - w * 0.12)} ${f(topY + h * k)}h${f(w * 0.08)}v${f(h * 0.05)}h${f(-w * 0.08)}Z`;
  s += path(sl, lit ? tone.gold : tone.shade, lit ? 0.9 : 1);
  // spire + altar crown
  s += path(poly([[x - w * 0.62, topY + h * 0.06], [x, topY - h * 0.1], [x + w * 0.62, topY + h * 0.06]]), tone.stone);
  s += path(poly([[x, topY - h * 0.1], [x + w * 0.62, topY + h * 0.06], [x + w * 0.1, topY + h * 0.06]]), tone.shade);
  s += stroke(`M${f(x)} ${f(topY - h * 0.1)}V${f(topY - h * 0.16)}`, tone.gold, Math.max(1.5, w * 0.06));
  s += circ(x, topY - h * 0.165, Math.max(1.5, w * 0.08), tone.gold);
  // dial
  if (lit) s += circ(x, dialY, dr * 2.6, P.glow(tone.gold), 0.5 * lit);
  s += circ(x, dialY, dr, tone.rim ?? tone.gold);
  s += circ(x, dialY, dr * 0.84, tone.dial);
  s += tickRing(x, dialY, dr * 0.58, dr * 0.74, 12, tone.gold, Math.max(1, dr * 0.08));
  s += stroke(`M${f(x)} ${f(dialY)}L${f(x)} ${f(dialY - dr * 0.6)}M${f(x)} ${f(dialY)}L${f(x + dr * 0.35)} ${f(dialY + dr * 0.2)}`, tone.gold, Math.max(1.2, dr * 0.08));
  return s;
}

/** Solein on its hill, viewed from afar: tiers of houses climbing to the castle and the Dawn Tower */
function soleinSkyline(P: Pic, r: Rng, cfg: { horizon: number; far: CityTone; mid: CityTone; near?: CityTone; hazeC: string; castle: string; castleSh: string; tower: { stone: string; shade: string; gold: string; dial: string }; towerX?: number; towerH?: number; lit?: number; peak?: number }): string {
  const H = cfg.horizon;
  const tx = cfg.towerX ?? 800;
  const th = cfg.towerH ?? 330;
  const peak = cfg.peak ?? 200;
  const hill = (x: number, t: number): number => H + 14 * t - peak * (1 - t * 0.2) * Math.exp(-Math.pow((x - tx) / (330 + 110 * t), 2));
  const mt = (a: CityTone, b: CityTone, t: number): CityTone => ({
    wall: mix(a.wall, b.wall, t),
    wallSh: mix(a.wallSh, b.wallSh, t),
    roof: mix(a.roof, b.roof, t),
    roofSh: mix(a.roofSh, b.roofSh, t),
    win: a.win && b.win ? mix(a.win, b.win, t) : undefined,
    winP: a.winP,
  });
  let s = "";
  // the hill mass itself
  s += path(`M-20 ${H + 80}` + Array.from({ length: 33 }, (_, k) => `L${k * 52 - 20} ${q(hill(k * 52 - 20, 0) + 20)}`).join("") + `L1640 ${H + 80}Z`, cfg.far.wallSh);
  // tower + castle on the summit
  const top = hill(tx, 0);
  s += dawnTower(P, tx, top + 10, th, cfg.tower, cfg.lit ?? 0);
  const towers: [number, number, number][] = [
    [tx - 150, 22, 110],
    [tx - 95, 30, 150],
    [tx + 90, 30, 140],
    [tx + 150, 22, 100],
    [tx - 210, 18, 70],
    [tx + 205, 18, 76],
  ];
  let keep = `M${q(tx - 130)} ${q(top + 20)}V${q(top - 70)}H${q(tx + 130)}V${q(top + 20)}Z`;
  let keepSh = "";
  let cones = "";
  let conesSh = "";
  for (const [x, w, h] of towers) {
    const by = hill(x, 0) + 20;
    keep += `M${q(x - w / 2)} ${q(by)}V${q(by - h)}H${q(x + w / 2)}V${q(by)}Z`;
    keepSh += `M${q(x + w * 0.15)} ${q(by)}V${q(by - h)}H${q(x + w / 2)}V${q(by)}Z`;
    cones += `M${q(x - w / 2 - 4)} ${q(by - h)}L${q(x)} ${q(by - h - w * 1.5)}L${q(x + w / 2 + 4)} ${q(by - h)}Z`;
    conesSh += `M${q(x)} ${q(by - h - w * 1.5)}L${q(x + w / 2 + 4)} ${q(by - h)}H${q(x)}Z`;
  }
  s += path(keep, cfg.castle) + path(keepSh, cfg.castleSh) + path(cones, cfg.far.roof) + path(conesSh, cfg.far.roofSh);
  // crenellation on the keep
  let cren = "";
  for (let x = tx - 130; x < tx + 130; x += 16) cren += `M${q(x)} ${q(top - 70)}v-8h9v8Z`;
  s += path(cren, cfg.castle);
  // tiers of houses
  const tiers = 4;
  for (let t = 0; t < tiers; t++) {
    const u = t / (tiers - 1);
    const sc = 0.6 + 0.5 * u;
    const tone = mt(cfg.far, cfg.mid, u);
    const span = t === tiers - 1 ? 900 : (330 + 110 * t) * 1.5;
    s += cityBand(r, Math.max(-40, tx - span), Math.min(1640, tx + span), (x) => hill(x, t * 1.2 + 0.6), 18 * sc, 32 * sc, 24 * sc, 42 * sc, tone);
    if (t === 1 || t === 3) s += rect(P.lin([[0, cfg.hazeC, 0], [1, cfg.hazeC, 0.45]]), undefined, 0, H - peak, 1600, peak + 60);
  }
  if (cfg.near) {
    s += rect(cfg.hazeC, 0.18, 0, H - 40, 1600, 400);
    s += cityBand(r, -60, 1660, (x) => H + 120 + Math.sin(x / 150) * 10, 40, 70, 50, 86, cfg.near);
  }
  return s;
}

/** cumulus cloud: puffs rising to a crown, flat base, lit tops, shaded underside */
function cloud(r: Rng, cx: number, cy: number, w: number, h: number, body: string, lit: string, shade: string, op = 1): string {
  let b = "";
  let hl = "";
  const n = Math.max(3, Math.round(w / (h * 0.75)));
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const x = cx - w / 2 + t * w + r.r(-h * 0.1, h * 0.1);
    const rr = h * (0.3 + 0.6 * Math.sin(Math.PI * t)) * r.r(0.8, 1.1);
    const y = cy - rr * 0.75;
    b += circD(x, y, rr);
    hl += circD(x - rr * 0.12, y - rr * 0.14, rr * 0.82);
  }
  const bw = w / 2 + h * 0.1;
  b += `M${f(cx - bw)} ${f(cy - h * 0.1)}Q${f(cx)} ${f(cy - h * 0.6)} ${f(cx + bw)} ${f(cy - h * 0.1)}Q${f(cx + bw + h * 0.1)} ${f(cy)} ${f(cx + bw - h * 0.25)} ${f(cy)}H${f(cx - bw + h * 0.25)}Q${f(cx - bw - h * 0.1)} ${f(cy)} ${f(cx - bw)} ${f(cy - h * 0.1)}Z`;
  const up = ` transform="translate(0 ${f(-h * 0.14)})"`;
  return g(path(b, shade) + g(path(b, body) + path(hl, lit), up.trim()), op < 1 ? `opacity="${f2(op)}"` : "");
}
/** long thin streak cloud (night / high altitude) */
function streak(cx: number, cy: number, w: number, h: number, c: string, op: number): string {
  return path(`M${f(cx - w / 2)} ${f(cy)}Q${f(cx - w * 0.2)} ${f(cy - h)} ${f(cx + w * 0.1)} ${f(cy - h * 0.6)}Q${f(cx + w * 0.3)} ${f(cy - h * 1.1)} ${f(cx + w / 2)} ${f(cy)}Z`, c, op);
}

/** smooth undulating band from y down to bottom (hills, mist, ash drifts) */
function waveD(r: Rng, x0: number, x1: number, y: number, amp: number, wl: number, bottom = 900): string {
  let d = `M${q(x0)} ${q(bottom)}L${q(x0)} ${q(y)}`;
  let x = x0;
  let yy = y;
  while (x < x1) {
    const w = wl * r.r(0.6, 1.4);
    const ny = y + r.r(-amp, amp) * 0.4;
    d += `Q${q(x + w / 2)} ${q(Math.min(yy, ny) - amp * r.r(0.5, 1))} ${q(x + w)} ${q(ny)}`;
    x += w;
    yy = ny;
  }
  return d + `L${q(x)} ${q(bottom)}Z`;
}

/** vertical light shaft */
function beam(P: Pic, pts: Pt[], c: string, op: number, extra = ""): string {
  return path(poly(pts), P.lin([[0, c, 1], [0.6, c, 0.35], [1, c, 0]]), op, extra);
}

/** candle with flickering flame; returns [static, animated] */
function candle(P: Pic, x: number, y: number, s: number, delay = 0, glowOp = 0.7): string {
  const h = 26 * s;
  const w = 7 * s;
  let o = circ(x, y - h - 8 * s, 70 * s, P.glow("#ffc56a"), glowOp * 0.6);
  o += rect("#f4e6c8", undefined, x - w / 2, y - h, w, h);
  o += rect("#d6c2a0", undefined, x + w * 0.1, y - h, w * 0.4, h);
  const fl = path(`M${f(x)} ${f(y - h - 17 * s)}Q${f(x + 5 * s)} ${f(y - h - 6 * s)} ${f(x)} ${f(y - h - 1 * s)}Q${f(x - 5 * s)} ${f(y - h - 6 * s)} ${f(x)} ${f(y - h - 17 * s)}Z`, "#ffd88a");
  const core = path(`M${f(x)} ${f(y - h - 10 * s)}Q${f(x + 2 * s)} ${f(y - h - 4 * s)} ${f(x)} ${f(y - h - 2 * s)}Q${f(x - 2 * s)} ${f(y - h - 4 * s)} ${f(x)} ${f(y - h - 10 * s)}Z`, "#fffbe8");
  o += g(fl + core, P.flick(1.3 + (delay % 0.7), delay));
  return o;
}

/* ───────────────────────── scenes ───────────────────────── */

function sBlack(): string {
  const P = new Pic("black");
  P.add(rect("#040408"));
  P.add(ell(800, 420, 1000, 620, P.glow("#15131c"), 0.9));
  P.add(vignette(P, "#000", 0.8, 0.35));
  return P.svg();
}

function sWhite(): string {
  const P = new Pic("white");
  P.add(rect("#f4f0e8"));
  P.add(ell(800, 420, 1100, 700, P.glow("#fffdf8"), 1));
  P.add(ell(800, 380, 520, 360, P.glow("#ffffff"), 0.9));
  P.add(vignette(P, "#d8cfc0", 0.45, 0.4));
  return P.svg();
}

/* 틈새의 방 — ash throne room between deaths. The signature image. */
function sBetween(): string {
  const P = new Pic("between");
  const r = new Rng(1000);
  const VX = 800;
  const VY = 430; // vanishing point
  // ── wall base
  P.add(rect(P.lin([[0, "#1b1a22"], [0.55, "#2d2a35"], [1, "#35323b"]])));
  // light spill on the wall around the window
  P.add(ell(800, 330, 760, 520, P.glow("#8f8a90"), 0.55));
  // ── the great arched window (outer frame)
  const wx0 = 500;
  const wx1 = 1100;
  const wSpring = 250;
  const wBot = 640;
  const arch = (x0: number, x1: number, spring: number, bot: number): string => {
    const cx = (x0 + x1) / 2;
    const rw = (x1 - x0) / 2;
    return `M${f(x0)} ${f(bot)}V${f(spring)}C${f(x0)} ${f(spring - rw * 0.9)} ${f(cx - rw * 0.35)} ${f(spring - rw * 1.25)} ${f(cx)} ${f(spring - rw * 1.32)}C${f(cx + rw * 0.35)} ${f(spring - rw * 1.25)} ${f(x1)} ${f(spring - rw * 0.9)} ${f(x1)} ${f(spring)}V${f(bot)}Z`;
  };
  P.def(`<clipPath id="${P.id("win")}"><path d="${arch(wx0, wx1, wSpring, wBot)}"/></clipPath>`);
  // embrasure (thick wall depth)
  P.add(path(arch(wx0 - 46, wx1 + 46, wSpring, wBot + 10), "#46424b"));
  P.add(path(arch(wx0 - 46, wx1 + 46, wSpring, wBot + 10), P.lin([[0, "#9d98a0", 0.35], [0.5, "#5a5660", 0.1], [1, "#1b1a22", 0.4]], 0, 0, 1, 0)));
  // ── sky inside the window: endless gray dawn
  let sky = rect(P.lin([[0, "#6c6872"], [0.3, "#96918f"], [0.58, "#cdc6bb"], [0.7, "#ebe4d7"], [0.78, "#cfc8bd"], [1, "#9a9491"]], 0, 0, 0, 1), undefined, wx0, 0, wx1 - wx0, wBot);
  // sun disc — pale gray, flat, with bloom (a halo behind the throne crown)
  const SY = 190;
  sky += circ(800, SY, 300, P.glow("#efe9de"), 0.6);
  sky += circ(800, SY, 130, P.glow("#f7f3ea", true), 0.7);
  sky += circ(800, SY, 74, "#ece7de");
  sky += circ(800, SY, 74, P.rad([[0, "#ffffff", 0.5], [0.7, "#ffffff", 0], [1, "#bdb7ae", 0.7]]));
  // long cloud bands crossing the sky
  const band = (y: number, h: number, c: string, o: number, x0: number, x1: number): string =>
    path(`M${f(x0)} ${f(y)}Q${f((x0 + x1) / 2)} ${f(y - h * 0.6)} ${f(x1)} ${f(y - h * 0.1)}L${f(x1)} ${f(y + h * 0.3)}Q${f((x0 + x1) / 2)} ${f(y + h * 0.1)} ${f(x0)} ${f(y + h * 0.5)}Z`, c, o);
  sky += band(120, 14, "#8b8689", 0.7, 480, 900);
  sky += band(212, 12, "#a8a2a1", 0.55, 700, 1120);
  sky += band(300, 22, "#b5afaa", 0.55, 480, 880);
  sky += band(345, 14, "#c9c2b8", 0.5, 800, 1120);
  // distant ash sea of clouds at the horizon — smooth layered bands
  const hz = 470;
  // far spires of a dead city, very pale (atmospheric)
  let sp = "";
  for (const [x, h] of [[560, 60], [610, 95], [640, 50], [960, 70], [1000, 120], [1040, 55]] as Pt[])
    sp += `M${x - 8} ${hz + 20}V${hz - h + 20}L${x} ${hz - h}L${x + 8} ${hz - h + 20}V${hz + 20}Z`;
  sky += path(sp, "#bcb6af", 0.75);
  sky += path(waveD(r, wx0 - 20, wx1 + 20, hz, 16, 90, wBot), "#b3ada6");
  sky += path(waveD(r, wx0 - 20, wx1 + 20, hz + 40, 18, 110, wBot), "#9d9793");
  sky += path(waveD(r, wx0 - 20, wx1 + 20, hz + 90, 20, 130, wBot), "#86817f");
  // horizon bright line
  sky += rect(P.lin([[0, "#f3ede2", 0], [0.5, "#f3ede2", 0.9], [1, "#f3ede2", 0]], 0, 0, 1, 0), 0.8, wx0, hz - 12, wx1 - wx0, 4);
  P.add(g(sky, `clip-path="${P.ref("win")}"`));
  // tracery: mullions, transom, cracked panes
  const trc = "#2a2830";
  let tra = "";
  tra += `M${693} ${wBot}V${wSpring - 150}h10V${wBot}Z M${897} ${wBot}V${wSpring - 150}h10V${wBot}Z`;
  tra += `M${wx0} 392h${wx1 - wx0}v9h${-(wx1 - wx0)}Z`;
  P.add(g(path(tra, trc) + stroke(arch(wx0 + 6, wx1 - 6, wSpring, wBot), trc, 12, 1, ""), `clip-path="${P.ref("win")}"`));
  P.add(stroke(arch(wx0, wx1, wSpring, wBot), "#1e1c24", 10));
  // rose tracery in the arch head
  P.add(stroke(`M${693} ${wSpring - 150}Q${800} ${wSpring - 250} ${907} ${wSpring - 150}`, trc, 9));
  // crack lines on glass
  P.add(stroke("M540 150L585 188L570 232L612 262M1060 300L1022 330L1040 372M720 120L748 98L760 60", "#e8e2d8", 1.4, 0.55));
  // rim light on window frame
  P.add(stroke(`M${wx0 - 44} ${wBot}V${wSpring}`, "#b9b3ae", 3, 0.45));
  P.add(stroke(`M${wx1 + 44} ${wBot}V${wSpring}`, "#b9b3ae", 3, 0.3));
  // ── colonnade: receding pillars both sides
  const pillar = (x: number, w: number, top: number, bot: number, dark: string, lit: string, litSide: 1 | -1, broken = false): string => {
    let s = "";
    const body = broken
      ? `M${f(x - w / 2)} ${f(bot)}V${f(top + 40)}L${f(x - w * 0.2)} ${f(top + 10)}L${f(x + w * 0.05)} ${f(top + 34)}L${f(x + w * 0.3)} ${f(top)}L${f(x + w / 2)} ${f(top + 26)}V${f(bot)}Z`
      : `M${f(x - w / 2)} ${f(bot)}V${f(top)}H${f(x + w / 2)}V${f(bot)}Z`;
    s += path(body, dark);
    // fluting
    s += rect(P.lin([[0, "#000", 0], [0.5, "#000", 0.25], [1, "#000", 0]], 0, 0, 1, 0), undefined, x - w * 0.3, top + 44, w * 0.25, bot - top - 54);
    // lit edge toward window
    const ex = litSide > 0 ? x + w / 2 - w * 0.16 : x - w / 2;
    s += path(`M${f(ex)} ${f(bot)}V${f(top + 44)}h${f(w * 0.16)}V${f(bot)}Z`, lit, 0.8);
    if (!broken) {
      s += rect(dark, undefined, x - w * 0.66, top - w * 0.2, w * 1.32, w * 0.24);
      s += rect(lit, 0.5, x - w * 0.66, top - w * 0.2, w * 1.32, w * 0.05);
    }
    s += rect(dark, undefined, x - w * 0.62, bot - w * 0.24, w * 1.24, w * 0.24);
    return s;
  };
  // far pair
  P.add(pillar(420, 40, 120, 610, "#34313a", "#7d7880", 1));
  P.add(pillar(1180, 40, 120, 610, "#34313a", "#7d7880", -1));
  // middle pair
  P.add(pillar(300, 62, 60, 650, "#2b2931", "#6f6a72", 1, true));
  P.add(pillar(1300, 62, 60, 650, "#2b2931", "#6f6a72", -1));
  // near pair (huge, dark, framing)
  P.add(pillar(90, 130, -20, 760, "#1c1b22", "#58545c", 1));
  P.add(pillar(1510, 130, -20, 760, "#1c1b22", "#58545c", -1, false));
  // ceiling vault shadow
  P.add(rect(P.lin([[0, "#0d0c12", 0.9], [1, "#0d0c12", 0]]), undefined, 0, 0, 1600, 160));
  // ── floor
  const fy = 620;
  P.add(path(`M0 ${fy}H1600V900H0Z`, P.lin([[0, "#56525a"], [0.3, "#433f48"], [1, "#24222a"]])));
  // tile lines in perspective
  let tl = "";
  for (let k = -8; k <= 8; k++) {
    const xb = VX + k * 150;
    const t = (fy - VY) / (900 - VY);
    tl += `M${f(VX + (xb - VX) * t)} ${fy}L${f(xb)} 900`;
  }
  for (const yy of [636, 660, 695, 745, 815]) tl += `M0 ${yy}H1600`;
  P.add(stroke(tl, "#1e1c23", 1.6, 0.6));
  // window light pooled on floor
  P.add(path(`M600 ${fy}L1000 ${fy}L1180 900L420 900Z`, P.lin([[0, "#d9d2c6", 0.55], [1, "#d9d2c6", 0]])));
  P.add(ell(800, 660, 420, 60, P.glow("#e6dfd2"), 0.5));
  // ash drifts along the wall base
  P.add(path(waveD(r, 140, 560, fy - 6, 14, 90, fy + 16), "#5f5b62"));
  P.add(path(waveD(r, 1040, 1470, fy - 6, 14, 90, fy + 16), "#5f5b62"));
  P.add(path(waveD(r, 150, 540, fy - 2, 8, 70, fy + 16), "#77727a", 0.6));
  P.add(path(waveD(r, 1060, 1460, fy - 2, 8, 70, fy + 16), "#77727a", 0.6));
  // ── dais
  P.add(path("M560 680L1040 680L1110 720L490 720Z", "#3e3a43"));
  P.add(path("M560 680L1040 680L1052 688L548 688Z", "#9a948f", 0.7));
  P.add(path("M610 640L990 640L1040 680L560 680Z", "#46424b"));
  P.add(path("M610 640L990 640L1000 647L600 647Z", "#aaa39d", 0.75));
  P.add(path("M490 720L1110 720L1110 736L490 736Z", "#29272e"));
  P.add(path("M560 680L1040 680L1040 690L560 690Z", "#29272e", 0.6));
  // ── the throne: ash and broken clockwork, backlit
  const T = "#2a272f";
  const T2 = "#3a3640";
  const RIM = "#d8d1c6";
  // back slab with gothic crown
  const back = "M680 600L680 330L700 300L700 250L722 222L740 250L760 205L780 180L800 120L820 180L840 205L860 250L878 222L900 250L900 300L920 330L920 600Z";
  // cog halo behind the back (broken clockwork)
  P.add(gear(800, 400, 150, 28, "#34313a", "#8a848a", 0.1, 6));
  P.add(path(back, T));
  // central broken clock dial set into the back
  P.add(clock(800, 330, 70, { rim: "#6d6158", rimHi: "#e3d6bf", face: "#8c8781", ink: "#2b2830", h: 118, m: 250, broken: 7 }));
  P.add(stroke("M760 300L790 330L776 356M820 312L806 338L834 368", "#2b2830", 1.4, 0.7));
  // crumbling edges of the back (ash bites)
  let bite = "";
  for (let k = 0; k < 9; k++) bite += circD(r.pick([680, 920]) + r.r(-6, 6), r.r(360, 580), r.r(4, 10));
  P.add(path(bite, "#2d2a35"));
  // rim light on back silhouette
  P.add(stroke("M680 600L680 330L700 300L700 250L722 222L740 250L760 205L780 180L800 120L820 180L840 205L860 250L878 222L900 250L900 300L920 330L920 600", RIM, 2.4, 0.75));
  // seat + arms
  P.add(path("M650 520L700 505L700 560L650 575Z M950 520L900 505L900 560L950 575Z", T2));
  P.add(path("M640 510L706 496L712 512L646 526Z M960 510L894 496L888 512L954 526Z", "#4b4751"));
  P.add(stroke("M640 510L706 496M960 510L894 496", RIM, 2, 0.7));
  P.add(path("M690 560L910 560L930 600L670 600Z", T2));
  P.add(path("M690 560L910 560L915 568L685 568Z", "#aaa39d", 0.7));
  P.add(path("M650 575L700 560L700 640L650 640Z M950 575L900 560L900 640L950 640Z M670 600L930 600L930 640L670 640Z", T));
  // exposed gears in the arms
  P.add(gear(675, 598, 22, 10, "#5a5249", "#c8a878", 0.3, 4));
  P.add(gear(925, 598, 22, 10, "#5a5249", "#c8a878", 0.1, 4));
  // gold trickle — a last glint of sand on the seat
  P.add(ell(800, 562, 60, 6, P.glow("#ffd27a"), 0.8));
  // ── broken clock faces strewn on floor (foreshortened)
  const floorClock = (x: number, y: number, rr: number, seed: number, rot: number): string =>
    g(clock(0, 0, rr, { rim: "#6e5f4d", rimHi: "#d9c29a", face: "#c9c2b6", ink: "#3b3640", h: seed * 37, m: seed * 91, broken: seed }), `transform="translate(${f(x)} ${f(y)}) scale(1 .38) rotate(${f(rot)})"`);
  const fc: [number, number, number, number, number][] = [
    [470, 700, 46, 3, 20],
    [1150, 690, 40, 5, -30],
    [360, 780, 70, 11, 70],
    [1250, 800, 80, 13, 10],
    [620, 772, 34, 17, 150],
    [990, 760, 38, 19, -60],
    [1420, 700, 42, 29, 45],
  ];
  for (const [x, y, rr, sd, rot] of fc) {
    P.add(ell(x + 6, y + 6, rr * 1.1, rr * 0.42, "#141319", 0.5));
    P.add(floorClock(x, y, rr, sd, rot));
  }
  // shards of glass glinting
  let sh = "";
  for (let k = 0; k < 10; k++) {
    const x = r.r(150, 1450);
    const y = r.r(690, 880);
    const s = r.r(3, 8);
    sh += `M${f(x)} ${f(y)}l${f(s)} ${f(-s * 0.4)}l${f(-s * 0.3)} ${f(s * 0.7)}Z`;
  }
  P.add(path(sh, "#e4ddd2", 0.6));
  // loose small gears on floor
  for (const [x, y, rr] of [[540, 740, 16], [1330, 740, 18]] as [number, number, number][])
    P.add(g(gear(0, 0, rr, 10, "#6a5c49", "#d0b27d", 0.2, 4), `transform="translate(${x} ${y}) scale(1 .4)"`));
  // ── gears frozen mid-air (static), plus two that barely bob
  const airG: [number, number, number, number, number][] = [
    [470, 250, 44, 14, 0],
    [1135, 205, 58, 16, 1],
    [1060, 470, 26, 10, 0],
    [545, 420, 20, 9, 1],
    [355, 380, 30, 12, 0],
    [1255, 360, 24, 10, 0],
    [1000, 110, 22, 9, 1],
  ];
  airG.forEach(([x, y, rr, n, bob], k) => {
    const gl = ell(x, y, rr * 1.6, rr * 1.6, P.glow("#cfc8bd"), 0.18);
    const body = gear(x, y, rr, n, k % 2 ? "#6b5d4b" : "#58514b", k % 2 ? "#e4c58c" : "#b9ad9c", k * 0.4, 5);
    P.add(gl);
    P.add(bob ? g(body, P.drift(9 + k, k * 1.3, -6)) : body);
  });
  // ── golden sand falling UPWARD
  P.def(
    `<mask id="${P.id("fade")}" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect width="1600" height="900" fill="${P.lin([[0, "#fff", 0], [0.3, "#fff", 1], [0.85, "#fff", 1], [1, "#fff", 0.2]])}"/></mask>`,
  );
  const streams: [number, number, number][] = [
    // x, bottom y, strength
    [360, 780, 1],
    [470, 700, 0.8],
    [620, 772, 0.7],
    [990, 760, 0.8],
    [1150, 690, 0.7],
    [1250, 800, 1],

    [1420, 700, 0.55],
    [760, 560, 0.6],
    [835, 560, 0.5],
  ];
  let st = "";
  streams.forEach(([x, by, s], k) => {
    const Pd = 220;
    // static glow column
    st += rect(P.lin([[0, "#ffd27a", 0], [0.6, "#ffd27a", 0.45], [1, "#ffe7a8", 0.8]]), 0.3 * s, x - 11, 0, 22, by);
    st += rect(P.lin([[0, "#fff1c4", 0], [0.5, "#fff1c4", 0.6], [1, "#fff1c4", 1]]), 0.5 * s, x - 1.5, 0, 3, by);
    st += ell(x, by, 30 * s, 8 * s, P.glow("#ffd27a"), 0.8 * s);
    // periodic grains → moving group
    const R = new Rng(500 + k);
    const base: Pt[] = [];
    for (let j = 0; j < 7; j++) base.push([x + R.r(-3.5, 3.5), R.r(0, Pd)]);
    const pts: Pt[] = [];
    for (let c = 0; c * Pd < by + Pd; c++) for (const [bx, byy] of base) if (byy + c * Pd < by + Pd) pts.push([bx + Math.sin((byy + c * Pd) / 60) * 2, byy + c * Pd]);
    st += g(dots(pts, 2.8, "#ffe29a"), P.rise(Pd, 5.5 + (k % 4) * 0.9, k * 0.7));
  });
  P.add(g(st, `mask="url(#${P.id("fade")})"`));
  // loose rising glints
  for (let k = 0; k < 7; k++) {
    const x = r.r(200, 1400);
    const y = r.r(300, 760);
    P.add(g(path(sparkD(x, y, r.r(4, 8)), "#fff1c4"), P.fall(-r.r(140, 260), r.r(-20, 20), r.r(7, 12), r.r(0, 10))));
  }
  // ── atmosphere: god rays from the window
  P.add(beam(P, [[640, 0], [760, 0], [640, 900], [300, 900]], "#e9e3d8", 0.12));
  P.add(beam(P, [[860, 0], [980, 0], [1330, 900], [1060, 900]], "#e9e3d8", 0.1));
  P.add(ell(800, 250, 520, 300, P.glow("#dcd6cc"), 0.18));
  P.add(vignette(P, "#0b0a10", 0.85, 0.42));
  P.add(bottomShade(P, "#0b0a10", 0.45, 0.72));
  return P.svg();
}

/* 새벽 — golden sunrise over Solein. Hope. */
function sDawn(): string {
  const P = new Pic("dawn");
  const r = new Rng(2024);
  P.add(rect(P.lin([[0, "#5f95d2"], [0.3, "#9cc6ea"], [0.52, "#e9e6d0"], [0.64, "#ffe0a0"], [0.72, "#ffc878"], [1, "#f5b04a"]])));
  const SX = 600;
  const SY = 460;
  // rays
  let rays = "";
  for (let k = 0; k < 18; k++) {
    const a = -Math.PI + (k / 17) * Math.PI + r.r(-0.04, 0.04);
    const w = r.r(0.025, 0.06);
    const L = 1500;
    rays += poly([[SX, SY], [SX + Math.cos(a - w) * L, SY + Math.sin(a - w) * L], [SX + Math.cos(a + w) * L, SY + Math.sin(a + w) * L]]);
  }
  P.add(path(rays, P.rad([[0, "#fff6df", 0.9], [0.4, "#fff1c4", 0.35], [1, "#fff1c4", 0]], SX, SY, 1000, true), 0.55));
  P.add(circ(SX, SY, 520, P.glow("#ffe9b0"), 0.8));
  P.add(circ(SX, SY, 200, P.glow("#fffbe8", true), 0.95));
  P.add(circ(SX, SY, 64, "#fffdf2"));
  // clouds lit from below
  P.add(cloud(r, 250, 170, 380, 60, "#fbe7c6", "#fff8ea", "#e6b09a", 0.95));
  P.add(cloud(r, 1270, 120, 460, 70, "#f7e3c8", "#fff8ea", "#dba89a"));
  P.add(cloud(r, 1060, 300, 300, 40, "#ffe6be", "#fffaf0", "#f0b890", 0.9));
  P.add(cloud(r, 380, 360, 240, 30, "#ffe3b4", "#fffaf0", "#f2b288", 0.85));
  P.add(cloud(r, 1450, 400, 280, 34, "#ffdcaa", "#fff4dc", "#eaa77f", 0.8));
  P.add(soleinSkyline(P, r, {
    horizon: 640,
    towerX: 880,
    towerH: 360,
    hazeC: "#ffd9a0",
    castle: "#f4dcc0",
    castleSh: "#e3a47a",
    tower: { stone: "#fbead2", shade: "#e6c2a0", gold: "#f5b04a", dial: "#fff1c4" },
    far: { wall: "#f7e2c6", wallSh: "#eac7a4", roof: "#eea27a", roofSh: "#dd8e6a" },
    mid: { wall: "#f3ede2", wallSh: "#dcc5ad", roof: "#e0764a", roofSh: "#c65a36" },
    near: { wall: "#e9d3bc", wallSh: "#c9a88e", roof: "#c65a36", roofSh: "#a4472c" },
    lit: 0.7,
  }));
  // sun rim glow on the tower + bloom over city
  P.add(ell(SX, 600, 900, 160, P.glow("#ffe7a8"), 0.55));
  // sparkles
  for (let k = 0; k < 14; k++) {
    const x = r.r(200, 1400);
    const y = r.r(160, 560);
    P.add(g(path(sparkD(x, y, r.r(5, 11)), "#fffbe8"), P.tw(r.r(2.5, 5), r.r(0, 5), 0.1)));
  }
  P.add(circ(SX, SY, 90, P.glow("#ffffff"), 0.9));
  P.add(bottomShade(P, "#7a3a24", 0.35, 0.7));
  return P.svg();
}

/* 회명 — Solein under a gray sun, ash falling. */
function sAshfall(): string {
  const P = new Pic("ashfall");
  const r = new Rng(404);
  P.add(rect(P.lin([[0, "#4d4a4c"], [0.35, "#77736f"], [0.6, "#a9a49c"], [0.7, "#c9c4bc"], [1, "#8a8784"]])));
  const SX = 800;
  const SY = 250;
  P.add(circ(SX, SY, 420, P.glow("#c9c4bc"), 0.5));
  P.add(circ(SX, SY, 150, P.glow("#dcd7cf", true), 0.6));
  P.add(circ(SX, SY, 72, "#d7d2c9"));
  P.add(circ(SX, SY, 72, P.rad([[0, "#9d9892", 0.1], [0.75, "#8a8784", 0.25], [1, "#6a6664", 0.7]])));
  // smoky cloud bands
  P.add(cloud(r, 300, 200, 520, 60, "#8f8a86", "#a7a19b", "#6f6b69", 0.85));
  P.add(cloud(r, 1300, 150, 560, 70, "#8a8581", "#a19b95", "#686462", 0.9));
  P.add(cloud(r, 820, 370, 700, 36, "#a39e97", "#b8b2aa", "#85807c", 0.6));
  P.add(soleinSkyline(P, r, {
    horizon: 650,
    towerH: 340,
    hazeC: "#a9a49c",
    castle: "#a8a39c",
    castleSh: "#7e7975",
    tower: { stone: "#b3aea6", shade: "#8a8580", gold: "#9c8f76", dial: "#c2bcb2" },
    far: { wall: "#aaa59e", wallSh: "#94908a", roof: "#8f7f76", roofSh: "#7c6f68" },
    mid: { wall: "#9f9a93", wallSh: "#85807b", roof: "#7c6a60", roofSh: "#665751" },
    near: { wall: "#77736e", wallSh: "#615e5a", roof: "#5d4f4a", roofSh: "#4b403c" },
  }));
  // ash haze layer
  P.add(rect(P.lin([[0, "#c9c4bc", 0], [0.55, "#c9c4bc", 0.25], [0.75, "#b8b2aa", 0.35], [1, "#5d5a58", 0.4]])));
  // static ash specks
  const sp: Pt[] = [];
  for (let k = 0; k < 160; k++) sp.push([r.r(0, 1600), r.r(0, 900)]);
  P.add(dots(sp, 2.2, "#d8d3cb", 0.55));
  // falling ash (animated)
  for (let k = 0; k < 34; k++) {
    const x = r.r(-50, 1650);
    const y = r.r(-120, 400);
    const s = r.r(2, 5);
    const flake = `M${f(x)} ${f(y)}l${f(s)} ${f(-s * 0.5)}l${f(s * 0.6)} ${f(s)}l${f(-s * 1.1)} ${f(s * 0.5)}Z`;
    P.add(g(path(flake, k % 3 ? "#e2ddd5" : "#bdb7af"), P.fall(r.r(450, 700), r.r(-60, 60), r.r(9, 16), r.r(0, 16))));
  }
  P.add(vignette(P, "#2a2826", 0.7, 0.4));
  P.add(bottomShade(P, "#2a2826", 0.45, 0.7));
  return P.svg();
}

/* 시계의 집 옥상 — night rooftop over Solein lights and the Dawn Tower */
function sVillaRoof(): string {
  const P = new Pic("villa_roof");
  const r = new Rng(77);
  P.add(rect(P.lin([[0, "#0c1330"], [0.35, "#1d2d5a"], [0.62, "#3d5a92"], [0.72, "#6f7fb0"], [1, "#1d2d4f"]])));
  P.add(starField(P, r, 260, [0, 0, 1600, 520], "#e8eeff", (x, y) => 1 - y / 600));
  // moon
  P.add(circ(1260, 150, 240, P.glow("#c9d8ff"), 0.45));
  P.add(circ(1260, 150, 44, "#f4f6ff"));
  P.add(circ(1276, 142, 40, "#dfe6fb", 0.5));
  // thin clouds
  P.add(streak(380, 260, 620, 18, "#3d5288", 0.7));
  P.add(streak(1150, 330, 520, 14, "#4f659c", 0.6));
  P.add(streak(700, 200, 400, 10, "#34497e", 0.6));
  P.add(soleinSkyline(P, r, {
    horizon: 640,
    towerH: 330,
    hazeC: "#4f6fa3",
    castle: "#2e3c68",
    castleSh: "#243157",
    tower: { stone: "#8391bd", shade: "#5f6b98", gold: "#ffd27a", dial: "#fff1c4" },
    far: { wall: "#3a4a78", wallSh: "#2f3d68", roof: "#4b3f62", roofSh: "#3c3253", win: "#ffd27a", winP: 0.22 },
    mid: { wall: "#2b375f", wallSh: "#232d50", roof: "#3b2f4a", roofSh: "#30263d", win: "#ffc86a", winP: 0.3 },
    near: { wall: "#1f2745", wallSh: "#19203a", roof: "#2b2236", roofSh: "#221b2c", win: "#ffb85a", winP: 0.35 },
    lit: 1,
  }));
  // warm city glow
  P.add(ell(800, 660, 900, 140, P.glow("#ffb86a"), 0.35));
  // twinkling city lights
  for (let k = 0; k < 8; k++) {
    const x = r.r(200, 1400);
    const y = r.r(560, 650);
    P.add(g(circ(x, y, 10, P.glow("#ffe0a0")), P.tw(r.r(2, 4), r.r(0, 4), 0.3)));
  }
  // ── foreground roof (bottom, non-crucial)
  P.add(path("M0 760L420 700L1180 700L1600 760V900H0Z", "#1a1826"));
  let tiles = "";
  for (let y = 720; y < 900; y += 22) tiles += `M0 ${y + 40}L1600 ${y + 40}`;
  P.add(stroke(tiles, "#2a2638", 2, 0.7));
  P.add(path("M0 760L420 700L1180 700L1600 760L1600 768L1180 708L420 708L0 768Z", "#6d7cb0", 0.6));
  // iron railing
  let rail = "M0 690H1600";
  for (let x = 10; x < 1600; x += 34) rail += `M${x} 690V${740 - Math.abs(x - 800) * 0.01}`;
  P.add(stroke(rail, "#0e0d16", 4));
  P.add(stroke("M0 687H1600", "#7b8cc0", 1.5, 0.5));
  // chimney left + weather-vane clock right
  P.add(path("M110 720V540H190V720Z", "#231f2e"));
  P.add(path("M100 540H200V520H100Z", "#2d2838"));
  P.add(path("M178 720V540H190V720Z", "#5b679a", 0.5));
  P.add(stroke("M1440 700V520", "#0e0d16", 5));
  P.add(g(clock(1440, 500, 34, { rim: "#6a5a45", rimHi: "#e8c98a", face: "#e8dcc0", ink: "#2a2230", h: 40, m: 280 })));
  P.add(circ(1440, 500, 90, P.glow("#ffe0a0"), 0.25));
  // lantern on railing
  P.add(circ(560, 660, 90, P.glow("#ffc56a"), 0.6));
  P.add(path("M548 640H572L568 676H552Z", "#ffd88a"));
  P.add(path("M545 636H575V642H545Z", "#2a2230"));
  P.add(vignette(P, "#05070f", 0.6, 0.45));
  return P.svg();
}

/* 여명탑 꼭대기 — colossal dial, altar, city far below, pre-dawn */
function sDawnTower(): string {
  const P = new Pic("dawntower");
  const r = new Rng(4444);
  P.add(rect(P.lin([[0, "#2d3552"], [0.3, "#5e6282"], [0.55, "#a79a9a"], [0.68, "#e2c79a"], [0.74, "#ffd9a0"], [1, "#6d5f64"]])));
  P.add(starField(P, r, 90, [0, 0, 1600, 260], "#f0f2ff", (x, y) => 1 - y / 280));
  P.add(ell(800, 640, 1100, 260, P.glow("#ffe0a8"), 0.7));
  // far city below (tiny, hazy)
  P.add(path(waveD(r, 0, 1600, 640, 10, 120), "#a58c86"));
  P.add(cityBand(r, -20, 1620, (x) => 660 + Math.sin(x / 170) * 6, 8, 16, 10, 18, { wall: "#c9b3a4", wallSh: "#b09c90", roof: "#b77d68", roofSh: "#a26d5c", win: "#ffd27a", winP: 0.12 }));
  P.add(rect(P.lin([[0, "#ffd9a0", 0], [1, "#d9b394", 0.6]]), undefined, 0, 620, 1600, 120));
  // ── colossal clock dial behind the altar
  const CX = 800;
  const CY = 330;
  const R = 300;
  // gears behind
  P.add(gear(470, 210, 120, 24, "#5b4d45", "#d6ac6c", 0.2, 6));
  P.add(gear(1150, 250, 150, 28, "#5b4d45", "#d6ac6c", 0.1, 6));
  P.add(gear(1060, 520, 80, 18, "#6a5a4c", "#e0b878", 0.3, 5));
  // dial ring
  P.add(circ(CX, CY, R + 30, "#3a3140"));
  P.add(circ(CX, CY, R + 30, P.lin([[0, "#c9a36a", 0.6], [0.5, "#5e4a3e", 0.2], [1, "#2a2230", 0.5]])));
  P.add(circ(CX, CY, R, "#433a48"));
  P.add(circ(CX, CY, R - 8, P.rad([[0, "#ffe8b8", 0.55], [0.7, "#b98f63", 0.35], [1, "#4a3a3a", 0.5]])));
  P.add(`<circle cx="${CX}" cy="${CY}" r="${R - 30}" fill="none" stroke="#f5b04a" stroke-width="3" stroke-opacity=".8"/>`);
  P.add(`<circle cx="${CX}" cy="${CY}" r="${R - 110}" fill="none" stroke="#f5b04a" stroke-width="2" stroke-opacity=".6"/>`);
  P.add(tickRing(CX, CY, R - 60, R - 32, 24, "#f5b04a", 5, 0.9));
  // sun & moon symbols instead of numerals
  let sym = "";
  let symS = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU - Math.PI / 2;
    const x = CX + Math.cos(a) * (R - 85);
    const y = CY + Math.sin(a) * (R - 85);
    if (k % 2 === 0) {
      sym += circD(x, y, 11);
      symS += ticksD(x, y, 14, 21, 8);
    } else sym += `M${f(x - 8)} ${f(y - 10)}A12 12 0 1 0 ${f(x - 8)} ${f(y + 10)}A9 9 0 1 1 ${f(x - 8)} ${f(y - 10)}Z`;
  }
  P.add(path(sym, "#ffd27a"));
  P.add(stroke(symS, "#ffd27a", 2.4));
  // hands
  P.add(stroke(`M${CX} ${CY}L${CX - 20} ${CY - 180}M${CX} ${CY}L${CX + 150} ${CY + 70}`, "#2a2230", 12));
  P.add(stroke(`M${CX} ${CY}L${CX - 20} ${CY - 180}M${CX} ${CY}L${CX + 150} ${CY + 70}`, "#ffd27a", 3));
  P.add(circ(CX, CY, 22, "#2a2230"));
  P.add(circ(CX, CY, 10, "#ffd27a"));
  // rim light
  P.add(stroke(`M${CX - R - 28} ${CY}A${R + 28} ${R + 28} 0 0 1 ${CX} ${CY - R - 28}`, "#ffe0a8", 4, 0.6));
  // ── platform, pillars, altar
  P.add(path("M60 900L60 120H150V900Z M1450 900V120H1540V900Z", "#3c3440"));
  P.add(path("M40 120H170V96H40Z M1430 120H1560V96H1430Z", "#4a4250"));
  P.add(path("M60 900V120H80V900Z M1520 900V120H1540V900Z", "#e8c98a", 0.3));
  P.add(path("M0 610H1600V900H0Z", P.lin([[0, "#8b7a78"], [0.15, "#6b5d60"], [1, "#2d2630"]])));
  // balustrade
  let bal = "";
  for (let x = 170; x < 1440; x += 38) bal += `M${x} 610V568`;
  P.add(stroke(bal, "#54494f", 12));
  P.add(path("M160 560H1440V572H160Z M150 606H1450V618H150Z", "#6e6166"));
  P.add(path("M160 560H1440V563H160Z", "#ffe0a8", 0.7));
  // floor rings (inlaid gold circle)
  P.add(`<ellipse cx="800" cy="760" rx="520" ry="110" fill="none" stroke="#f5b04a" stroke-width="3" stroke-opacity=".45"/>`);
  P.add(`<ellipse cx="800" cy="760" rx="420" ry="86" fill="none" stroke="#f5b04a" stroke-width="2" stroke-opacity=".35"/>`);
  // altar
  P.add(path("M650 700L950 700L930 590L670 590Z", "#6a5d63"));
  P.add(path("M860 700L950 700L930 590L850 590Z", "#4d4249"));
  P.add(path("M630 590H970V560H630Z", "#8a7b7f"));
  P.add(path("M630 560H970V566H630Z", "#ffe0a8", 0.8));
  P.add(path("M770 620H830V680H770Z", "#f5b04a", 0.7));
  P.add(path(sparkD(800, 650, 22), "#fff1c4"));
  P.add(ell(800, 560, 200, 30, P.glow("#ffd27a"), 0.7));
  // twinkling gold motes around the dial
  for (let k = 0; k < 10; k++) {
    const a = r.r(0, TAU);
    P.add(g(path(sparkD(CX + Math.cos(a) * r.r(200, 340), CY + Math.sin(a) * r.r(200, 320), r.r(4, 8)), "#fff1c4"), P.tw(r.r(2, 5), r.r(0, 5), 0.1)));
  }
  P.add(vignette(P, "#150f18", 0.6, 0.45));
  return P.svg();
}

/* 시계의 집 외관 — ivy-covered old detached palace at evening */
function sVilla(): string {
  const P = new Pic("villa");
  const r = new Rng(1717);
  P.add(rect(P.lin([[0, "#2e3a6e"], [0.3, "#5d5a92"], [0.5, "#b07a98"], [0.62, "#f0a878"], [0.72, "#ffd29a"], [1, "#e89a6a"]])));
  P.add(starField(P, r, 80, [0, 0, 1600, 240], "#f0f2ff", (x, y) => 1 - y / 260));
  P.add(ell(1250, 600, 700, 300, P.glow("#ffd9a0"), 0.7));
  P.add(cloud(r, 300, 230, 460, 50, "#c98a9a", "#f2b8a0", "#8a6a90", 0.9));
  P.add(cloud(r, 1300, 180, 420, 44, "#d898a0", "#ffc8a8", "#94709a", 0.85));
  P.add(cloud(r, 1020, 380, 300, 30, "#f0b08e", "#ffdcb4", "#c08090", 0.8));
  // distant tree line
  P.add(path(waveD(r, 0, 1600, 560, 30, 60), "#6a5a7a"));
  P.add(path(waveD(r, 0, 1600, 600, 26, 50), "#4d4262"));
  // ── the villa
  const wall = "#e8d2b8";
  const wallSh = "#b99a8a";
  const roof = "#3e3a58";
  const roofSh = "#2e2a44";
  const trim = "#7a5a4a";
  const winLit = "#ffd27a";
  let win = "";
  let winFrame = "";
  const clocks: [number, number, number][] = [];
  const addWin = (x: number, y: number, w: number, h: number, clockIn = false): void => {
    winFrame += `M${x - 4} ${y - 4}h${w + 8}v${h + 8}h${-w - 8}Z`;
    win += `M${x} ${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}H${x}Z`;
    if (clockIn) clocks.push([x + w / 2, y + h * 0.55, w * 0.36]);
  };
  // wings
  P.add(path("M330 640V430H560V640Z M1040 640V430H1270V640Z", wall));
  P.add(path("M500 640V430H560V640Z M1210 640V430H1270V640Z", wallSh));
  P.add(path("M310 432L445 330L580 432Z M1020 432L1155 330L1290 432Z", roof));
  P.add(path("M445 330L580 432H445Z M1155 330L1290 432H1155Z", roofSh));
  // central block
  P.add(path("M560 640V380H1040V640Z", wall));
  P.add(path("M960 640V380H1040V640Z", wallSh));
  P.add(path("M540 384L800 250L1060 384Z", roof));
  P.add(path("M800 250L1060 384H800Z", roofSh));
  // clock tower gable
  P.add(path("M720 390V200H880V390Z", wall));
  P.add(path("M850 390V200H880V390Z", wallSh));
  P.add(path("M700 204L800 90L900 204Z", roof));
  P.add(path("M800 90L900 204H800Z", roofSh));
  P.add(stroke("M800 90V60", "#2a2638", 3));
  P.add(path("M800 60l14 5-14 5Z", "#e8c98a"));
  // trims
  P.add(path("M320 432H580V440H320Z M1030 432H1280V440H1030Z M550 384H1050V392H550Z M320 520H1280V526H320Z", trim));
  // windows
  for (const x of [360, 420, 480]) {
    addWin(x, 460, 36, 50, x === 420);
    addWin(x, 555, 36, 60);
  }
  for (const x of [1070, 1130, 1190]) {
    addWin(x, 460, 36, 50, x === 1130);
    addWin(x, 555, 36, 60);
  }
  for (const x of [590, 650, 710, 850, 910, 970]) addWin(x, 420, 36, 70, x === 650 || x === 910);
  for (const x of [590, 650, 910, 970]) addWin(x, 548, 36, 70, x === 590);
  P.add(path(winFrame, trim));
  P.add(path(win, winLit));
  // window glow
  P.add(path(win, P.lin([[0, "#fff1c4"], [1, "#f5b04a"]])));
  for (const [x, y, cr] of clocks) P.add(clock(x, y, cr, { rim: "#8a6a45", rimHi: "#fff1c4", face: "#fff6df", ink: "#5a3e2a" }));
  // door
  P.add(path("M760 640V560A40 40 0 0 1 840 560V640Z", "#5a3a2a"));
  P.add(path("M770 640V562A30 30 0 0 1 830 562V640Z", "#ffcf7a"));
  P.add(ell(800, 600, 200, 140, P.glow("#ffc56a"), 0.5));
  // big clock face on the tower
  P.add(circ(800, 290, 120, P.glow("#ffe0a0"), 0.55));
  P.add(clock(800, 290, 56, { rim: "#8a6a45", rimHi: "#ffe6a8", face: "#fff6df", ink: "#3a2e2a", h: 200, m: 60, sec: P.spin(60, 0, 60), secC: "#b8402f" }));
  // small clock on each wing gable
  P.add(clock(445, 395, 22, { face: "#fff1d0", h: 90, m: 180 }));
  P.add(clock(1155, 395, 22, { face: "#fff1d0", h: 300, m: 120 }));
  // chimneys
  P.add(path("M600 330V270H630V340Z M975 330V260H1005V340Z", "#6a4a44"));
  // ── ivy
  const ivy = (cx: number, cy: number, rx: number, ry: number, n: number): string => {
    let a = "";
    let b = "";
    let c = "";
    for (let k = 0; k < n; k++) {
      const x = cx + r.r(-rx, rx);
      const y = cy + r.r(-ry, ry);
      const rr = r.r(8, 18);
      a += circD(x, y, rr);
      if (r.n() < 0.6) b += circD(x - 3, y - 4, rr * 0.7);
      if (r.n() < 0.3) c += circD(x - 5, y - 6, rr * 0.35);
    }
    return path(a, "#2f4a3e") + path(b, "#4f7a55") + path(c, "#8fb070", 0.8);
  };
  P.add(ivy(360, 520, 50, 110, 38));
  P.add(ivy(560, 420, 30, 60, 18));
  P.add(ivy(1260, 500, 36, 120, 34));
  P.add(ivy(1000, 610, 60, 30, 16));
  // hanging vines strokes
  P.add(stroke("M340 440Q350 500 336 560M380 440Q372 480 386 520M1250 440Q1262 500 1248 560M740 210Q736 260 746 320", "#3f6b4a", 3));
  // ── garden and path (lower, non-crucial)
  P.add(path("M0 640H1600V900H0Z", P.lin([[0, "#5a5a6a"], [1, "#2a2638"]])));
  P.add(path("M770 640L830 640L1000 900L600 900Z", "#b89a8a"));
  P.add(path("M770 640L830 640L1000 900L600 900Z", P.lin([[0, "#ffd29a", 0.6], [1, "#ffd29a", 0]])));
  P.add(path(waveD(r, 0, 700, 650, 20, 60), "#2f3a3e"));
  P.add(path(waveD(r, 900, 1600, 650, 20, 60), "#2f3a3e"));
  // side trees silhouettes
  const tree = (x: number, by: number, h: number): string => {
    let d = `M${x - 10} ${by}V${by - h * 0.4}h20V${by}Z`;
    for (let k = 0; k < 7; k++) d += circD(x + r.r(-h * 0.25, h * 0.25), by - h * r.r(0.45, 0.95), h * r.r(0.14, 0.24));
    return path(d, "#262440");
  };
  P.add(tree(120, 680, 420));
  P.add(tree(1480, 690, 460));
  P.add(tree(240, 700, 260));
  P.add(tree(1360, 700, 280));
  // garden lamps
  for (const [x, y] of [[640, 700], [960, 700]] as Pt[]) {
    P.add(stroke(`M${x} ${y}V${y - 70}`, "#1f1c2c", 4));
    P.add(g(circ(x, y - 76, 60, P.glow("#ffc56a")), P.tw(3, x / 100, 0.7)));
    P.add(circ(x, y - 76, 7, "#fff1c4"));
  }
  P.add(vignette(P, "#1a1428", 0.55, 0.45));
  P.add(bottomShade(P, "#141024", 0.4, 0.72));
  return P.svg();
}

export const WORLD_BACKGROUNDS: Record<string, string> = {
  black: sBlack(),
  white: sWhite(),
  between: sBetween(),
  dawn: sDawn(),
  ashfall: sAshfall(),
  villa_roof: sVillaRoof(),
  dawntower: sDawnTower(),
  villa: sVilla(),
};
