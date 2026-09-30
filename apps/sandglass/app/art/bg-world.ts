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
    walls += poly([[x, by + 40], [x, top], [x + w, top], [x + w, by + 40]]);
    // shaded side (light from left when light>0)
    const sx = light > 0 ? x + w * 0.7 : x;
    wallsSh += poly([[sx, by + 40], [sx, top], [sx + w * 0.3, top], [sx + w * 0.3, by + 40]]);
    if (r.n() < 0.72) {
      roofs += poly([[x - w * 0.06, top + 1], [x + w / 2, top - rh], [x + w * 1.06, top + 1]]);
      roofsSh += poly([[x + w / 2, top - rh], [x + w * 1.06, top + 1], [x + w * 0.5, top + 1]]);
    } else {
      // flat terrace roof lip
      roofs += poly([[x - 2, top + 3], [x - 2, top - 4], [x + w + 2, top - 4], [x + w + 2, top + 3]]);
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

/** Solein on its hill, viewed from afar */
function soleinSkyline(P: Pic, r: Rng, cfg: { horizon: number; far: CityTone; mid: CityTone; near?: CityTone; hazeC: string; castle: string; castleSh: string; tower: { stone: string; shade: string; gold: string; dial: string }; towerX?: number; towerH?: number; lit?: number }): string {
  const H = cfg.horizon;
  const tx = cfg.towerX ?? 800;
  const th = cfg.towerH ?? 330;
  let s = "";
  // far hill silhouette
  const hill = (x: number): number => H - 150 * Math.exp(-Math.pow((x - tx) / 420, 2)) - 20 * Math.sin(x / 130);
  // castle mass on the summit
  s += dawnTower(P, tx, hill(tx) - 40, th, cfg.tower, cfg.lit ?? 0);
  let cas = "";
  const bl: [number, number, number][] = [
    [tx - 190, 70, 90],
    [tx - 120, 60, 130],
    [tx - 60, 80, 110],
    [tx + 50, 80, 120],
    [tx + 120, 60, 140],
    [tx + 180, 70, 85],
  ];
  for (const [bx, bw, bh] of bl) {
    const by = hill(bx) - 30;
    cas += poly([[bx - bw / 2, by + 60], [bx - bw / 2, by - bh], [bx + bw / 2, by - bh], [bx + bw / 2, by + 60]]);
    cas += poly([[bx - bw / 2 - 4, by - bh], [bx, by - bh - bw * 0.55], [bx + bw / 2 + 4, by - bh]]);
  }
  s += path(cas, cfg.castle);
  // castle roof tints
  let cr = "";
  for (const [bx, bw, bh] of bl) {
    const by = hill(bx) - 30;
    cr += poly([[bx, by - bh - bw * 0.55], [bx + bw / 2 + 4, by - bh], [bx, by - bh]]);
  }
  s += path(cr, cfg.castleSh);
  s += cityBand(r, -40, 1640, (x) => hill(x) + 40, 22, 40, 26, 44, cfg.far);
  s += rect(cfg.hazeC, 0.35, 0, H - 200, 1600, 300);
  s += cityBand(r, -40, 1640, (x) => H + 20 - 70 * Math.exp(-Math.pow((x - tx) / 600, 2)), 30, 55, 34, 60, cfg.mid);
  if (cfg.near) {
    s += rect(cfg.hazeC, 0.2, 0, H - 60, 1600, 300);
    s += cityBand(r, -60, 1660, () => H + 110, 40, 80, 50, 90, cfg.near);
  }
  return s;
}

/** soft cumulus cloud from circles — flat anime style: shade base, body, lit crown */
function cloud(r: Rng, cx: number, cy: number, w: number, h: number, body: string, lit: string, shade: string, op = 1): string {
  let b = "";
  let l = "";
  let hl = "";
  const n = Math.max(4, Math.round(w / 38));
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const x = cx - w / 2 + t * w + r.r(-8, 8);
    const rr = h * (0.3 + 0.7 * Math.sin(Math.PI * (0.08 + t * 0.84))) * r.r(0.7, 1.05);
    b += circD(x, cy - rr * 0.3, rr);
    l += circD(x - rr * 0.06, cy - rr * 0.42, rr * 0.9);
    if (r.n() < 0.7) hl += circD(x - rr * 0.2, cy - rr * 0.62, rr * 0.62);
  }
  const base = `M${f(cx - w / 2 - h * 0.2)} ${f(cy - h * 0.1)}h${f(w + h * 0.4)}v${f(h * 0.2)}h${f(-w - h * 0.4)}Z`;
  return g(path(b + base, shade) + path(l, body) + path(hl, lit), op < 1 ? `opacity="${f2(op)}"` : "");
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

export const WORLD_BACKGROUNDS: Record<string, string> = {
  black: sBlack(),
  white: sWhite(),
  between: sBetween(),
};
