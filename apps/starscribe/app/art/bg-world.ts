// World backgrounds for 「이름을 잃은 별에게」.
// Every value is a complete, hand-authored SVG string (1600x900, slice).
// All ids / classes are prefixed "bgw-<id>-" so several SVGs can coexist in one DOM.

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
  g(): number {
    return (this.n() + this.n() + this.n() + this.n() - 2) * 1.73;
  }
  pick<T>(a: readonly T[]): T {
    return a[Math.floor(this.n() * a.length)];
  }
}

const f = (v: number): string => String(Math.round(v * 10) / 10);
const q = (v: number): string => String(Math.round(v));
const f2 = (v: number): string => String(Math.round(v * 100) / 100);
const pt = (p: Pt): string => `${q(p[0])} ${q(p[1])}`;

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
    this.p = "bgw-" + name;
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
  private uid(): string {
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
  rad(st: Stop[], cx = 0.5, cy = 0.5, r = 0.5, user = false, fx?: number, fy?: number): string {
    const key = "r" + JSON.stringify([st, cx, cy, r, user, fx, fy]);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const n = "g" + this.uid();
    const fxy = fx === undefined ? "" : ` fx="${fx}" fy="${fy}"`;
    this.def(
      `<radialGradient id="${this.id(n)}" cx="${cx}" cy="${cy}" r="${r}"${fxy}${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(st)}</radialGradient>`,
    );
    const u = this.ref(n);
    this.cache.set(key, u);
    return u;
  }
  /** soft bloom falloff, objectBoundingBox — reuse on any ellipse */
  glow(c: string, hard = false): string {
    return hard
      ? this.rad([[0, c, 1], [0.12, c, 0.9], [0.3, c, 0.35], [0.6, c, 0.1], [1, c, 0]])
      : this.rad([[0, c, 1], [0.22, c, 0.55], [0.48, c, 0.2], [0.75, c, 0.06], [1, c, 0]]);
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
  /** attributes for an animated element */
  an(name: string, dur?: number, delay?: number): string {
    this.moving++;
    const st: string[] = [];
    if (dur !== undefined) st.push(`animation-duration:${f(dur)}s`);
    if (delay !== undefined) st.push(`animation-delay:-${f(delay)}s`);
    return `class="${this.p}-a ${this.id(name)}"${st.length ? ` style="${st.join(";")}"` : ""}`;
  }
  // standard animations
  tw(dur = 4, delay = 0, lo = 0.3): string {
    this.keyframes("tw", `0%,100%{opacity:1}50%{opacity:${lo}}`, "4s ease-in-out infinite");
    return this.an("tw", dur, delay);
  }
  pulse(dur = 5, delay = 0): string {
    this.keyframes("pu", "0%,100%{opacity:1}50%{opacity:.6}", "5s ease-in-out infinite");
    return this.an("pu", dur, delay);
  }
  drift(dur = 9, delay = 0, dy = -10, dx = 0): string {
    const n = `dr${Math.round(dx)}_${Math.round(dy)}`.replace(/-/g, "m");
    this.keyframes(n, `0%,100%{transform:translate(0,0)}50%{transform:translate(${dx}px,${dy}px)}`, "9s ease-in-out infinite");
    return this.an(n, dur, delay);
  }
  flick(dur = 1.6, delay = 0): string {
    this.keyframes(
      "fl",
      "0%,100%{opacity:1;transform:scale(1,1)}23%{opacity:.86;transform:scale(1.03,.95)}47%{opacity:.97;transform:scale(.97,1.06)}71%{opacity:.9;transform:scale(1.02,.98)}",
      "1.6s ease-in-out infinite",
    );
    return this.an("fl", dur, delay);
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

const rect = (fill: string, op?: number, x = 0, y = 0, w = 1600, h = 900): string =>
  `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(h)}" fill="${fill}"${op === undefined ? "" : ` opacity="${f2(op)}"`}/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, op?: number, extra = ""): string =>
  `<ellipse cx="${q(cx)}" cy="${q(cy)}" rx="${q(rx)}" ry="${q(ry)}" fill="${fill}"${op === undefined ? "" : ` opacity="${f2(op)}"`}${extra}/>`;
const path = (d: string, fill: string, op?: number, extra = ""): string =>
  `<path d="${d}" fill="${fill}"${op === undefined ? "" : ` opacity="${f2(op)}"`}${extra}/>`;
const poly = (pts: Pt[]): string => "M" + pts.map(pt).join("L") + "Z";

/** zero-length round-capped subpaths → dots */
function dotsD(pts: Pt[]): string {
  const s = [...pts].sort((a, b) => a[0] - b[0]);
  let out = "";
  let px = 0;
  let py = 0;
  s.forEach(([x, y], k) => {
    const X = Math.round(x);
    const Y = Math.round(y);
    out += k === 0 ? `M${X} ${Y}h0` : `m${X - px} ${Y - py}h0`;
    px = X;
    py = Y;
  });
  return out;
}
const dots = (pts: Pt[], w: number, c: string, op: number, extra = ""): string =>
  pts.length ? `<path d="${dotsD(pts)}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-opacity="${f2(op)}"${extra}/>` : "";

/* ───────────────────────── sky pieces ───────────────────────── */

function starField(
  P: Pic,
  r: Rng,
  o: { n: number; box?: [number, number, number, number]; keep?: (x: number, y: number) => number; c?: string; warm?: string; op?: number; size?: number; tw?: number },
): string {
  const [x0, y0, x1, y1] = o.box ?? [0, 0, 1600, 620];
  const sz = o.size ?? 1;
  const op = o.op ?? 1;
  const b: Pt[][] = [[], [], [], [], [], [], []];
  let made = 0;
  for (let t = 0; t < o.n * 30 && made < o.n; t++) {
    const x = r.r(x0, x1);
    const y = r.r(y0, y1);
    if (o.keep && r.n() > o.keep(x, y)) continue;
    made++;
    const v = r.n();
    const tw = r.n() < (o.tw ?? 0.22);
    if (v < 0.62) b[tw ? 4 : 0].push([x, y]);
    else if (v < 0.9) b[tw ? 5 : 1].push([x, y]);
    else if (v < 0.97) b[tw ? 6 : 2].push([x, y]);
    else b[3].push([x, y]);
  }
  const c = o.c ?? "#dfe6ff";
  let s =
    dots(b[0], 1.2 * sz, c, 0.5 * op) +
    dots(b[1], 1.8 * sz, c, 0.75 * op) +
    dots(b[2], 2.5 * sz, c, 0.95 * op) +
    dots(b[3], 2.3 * sz, o.warm ?? "#ffe7c2", 0.85 * op);
  // twinkling groups
  s += `<g ${P.tw(3.7, 0.4)}>${dots(b[4], 1.4 * sz, c, 0.8 * op)}</g>`;
  s += `<g ${P.tw(5.3, 2.1)}>${dots(b[5], 2 * sz, c, 0.9 * op)}</g>`;
  s += `<g ${P.tw(4.4, 3.2, 0.15)}>${dots(b[6], 2.7 * sz, "#ffffff", op)}</g>`;
  return s;
}

/** four-point flare star, as reusable symbol */
function flareDef(P: Pic, c = "#cfdcff"): string {
  const id = P.id("fs");
  P.def(
    `<g id="${id}"><circle r="12" fill="${P.glow(c)}"/><path d="M-14 0H14M0-14V14" stroke="#eef2ff" stroke-width=".7" stroke-opacity=".75"/><path d="M-5-5L5 5M-5 5L5-5" stroke="#eef2ff" stroke-width=".5" stroke-opacity=".4"/><circle r="1.7" fill="#fff"/></g>`,
  );
  return id;
}
function flare(P: Pic, id: string, x: number, y: number, s: number, anim = "", op = 1): string {
  const u = `<use href="#${id}" transform="translate(${q(x)} ${q(y)}) scale(${f2(s)})"${op < 1 ? ` opacity="${f2(op)}"` : ""}/>`;
  return anim ? `<g ${anim}>${u}</g>` : u;
}

function bez(a: Pt, c: Pt, b: Pt, t: number): { p: Pt; n: Pt } {
  const u = 1 - t;
  const p: Pt = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
  const L = Math.hypot(dx, dy) || 1;
  return { p, n: [-dy / L, dx / L] };
}

/** 천환 — the star ring: blurred luminous band + thousands of star-dust dots */
function ring(
  P: Pic,
  r: Rng,
  o: { a: Pt; c: Pt; b: Pt; w: number; n: number; glow?: number; tone?: [string, string, string]; bright?: number; fs?: string; lane?: boolean; blur?: string },
): string {
  const { a, c, b, w } = o;
  const d = `M${pt(a)}Q${pt(c)} ${pt(b)}`;
  const g = o.glow ?? 1;
  const [outer, mid, core] = o.tone ?? ["#4a5cc0", "#9fb0f0", "#eef2ff"];
  const bl = o.blur ?? P.blur(w * 0.3, "rb");
  let s = `<g filter="${bl}" fill="none">`;
  s += `<path d="${d}" stroke="${outer}" stroke-width="${q(w * 3.2)}" stroke-opacity="${f2(0.12 * g)}"/>`;
  s += `<path d="${d}" stroke="${mid}" stroke-width="${q(w * 1.5)}" stroke-opacity="${f2(0.2 * g)}"/>`;
  s += `<path d="${d}" stroke="${core}" stroke-width="${q(w * 0.6)}" stroke-opacity="${f2(0.28 * g)}"/>`;
  if (o.lane !== false) {
    const m = bez(a, c, b, 0.5).n;
    const off = w * 0.16;
    s += `<path d="${d}" transform="translate(${f(m[0] * off)} ${f(m[1] * off)})" stroke="#0a0e28" stroke-width="${q(w * 0.14)}" stroke-opacity="${f2(0.35 * g)}"/>`;
  }
  s += `</g>`;
  // dust
  const bk: Pt[][] = [[], [], [], []];
  const ph = r.r(0, 6);
  for (let k = 0; k < o.n; k++) {
    const t = r.n();
    const dens = 0.55 + 0.45 * Math.sin(t * 23 + ph) * Math.sin(t * 9 + ph * 2);
    if (r.n() > dens) continue;
    const { p, n } = bez(a, c, b, t);
    const spread = r.g() * w * 0.42;
    const x = p[0] + n[0] * spread + r.r(-3, 3);
    const y = p[1] + n[1] * spread + r.r(-3, 3);
    if (x < -10 || x > 1610 || y < -10 || y > 910) continue;
    const core2 = Math.abs(spread) < w * 0.25;
    const v = r.n();
    bk[v < (core2 ? 0.45 : 0.7) ? 0 : v < 0.9 ? 1 : v < 0.975 ? 2 : 3].push([x, y]);
  }
  s += dots(bk[0], 1.1, "#dfe6ff", 0.5 * g) + dots(bk[1], 1.6, "#e8edff", 0.72 * g) + dots(bk[2], 2.3, "#ffffff", 0.9 * g);
  s += `<g ${P.tw(4.8, 1.3, 0.35)}>${dots(bk[3], 2.6, "#ffffff", g)}</g>`;
  // knots of brightness along the ring
  for (let k = 0; k < 7; k++) {
    const t = 0.08 + k * 0.13 + r.r(-0.03, 0.03);
    const { p } = bez(a, c, b, t);
    s += ell(p[0], p[1], w * r.r(0.9, 1.6), w * r.r(0.5, 0.8), P.glow(core), 0.12 * g * r.r(0.6, 1.2));
  }
  if (o.fs) {
    for (let k = 0; k < (o.bright ?? 6); k++) {
      const { p, n } = bez(a, c, b, r.r(0.05, 0.95));
      const sp = r.g() * w * 0.25;
      const x = p[0] + n[0] * sp;
      const y = p[1] + n[1] * sp;
      if (x < 0 || x > 1600 || y < 0 || y > 900) continue;
      s += flare(P, o.fs, x, y, r.r(0.45, 0.9), k < 4 ? P.tw(r.r(3, 6), r.r(0, 4), 0.35) : "");
    }
  }
  return s;
}

function meteorDef(P: Pic, c = "#ffffff"): string {
  return P.lin([[0, c, 1], [0.15, c, 0.55], [1, c, 0]], 0, 0, 1, 0);
}
/** head at (x,y), tail extending away at angle `ang` degrees */
function meteor(P: Pic, grad: string, x: number, y: number, len: number, ang: number, w: number, op = 1, headGlow = ""): string {
  return (
    `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(ang)})"${op < 1 ? ` opacity="${f2(op)}"` : ""}>` +
    `<path d="M0 ${f(-w / 2)}L${q(len)} 0L0 ${f(w / 2)}Z" fill="${grad}"/>` +
    (headGlow ? `<circle r="${f(w * 3)}" fill="${headGlow}"/>` : "") +
    `<circle r="${f(w * 0.55)}" fill="#fff"/></g>`
  );
}

/* ───────────────────────── terrain pieces ───────────────────────── */

function ridge(r: Rng, x0: number, x1: number, y0: number, y1: number, depth: number, amp: number, rough = 0.55): Pt[] {
  let pts: Pt[] = [
    [x0, y0],
    [x1, y1],
  ];
  let A = amp;
  for (let k = 0; k < depth; k++) {
    const nx: Pt[] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const p = pts[j];
      const n = pts[j + 1];
      nx.push(p, [(p[0] + n[0]) / 2 + r.r(-0.1, 0.1) * (n[0] - p[0]), (p[1] + n[1]) / 2 + r.r(-A, A)]);
    }
    nx.push(pts[pts.length - 1]);
    pts = nx;
    A *= rough;
  }
  return pts;
}
const fillBelow = (pts: Pt[], bottom = 900): string => `M${q(pts[0][0])} ${bottom}L` + pts.map(pt).join("L") + `L${q(pts[pts.length - 1][0])} ${bottom}Z`;

function firD(r: Rng, x: number, by: number, h: number, w: number): string {
  const tiers = r.i(5, 8);
  const L: Pt[] = [[x, by - h]];
  for (let k = 1; k <= tiers; k++) {
    const yy = by - h + h * (k / tiers) * 0.9;
    const ww = w * Math.pow(k / tiers, 0.9) * r.r(0.85, 1.1);
    L.push([x - ww, yy]);
    if (k < tiers) L.push([x - ww * 0.42, yy - (h / tiers) * 0.28]);
  }
  L.push([x - w * 0.07, by - h * 0.08], [x - w * 0.07, by]);
  const R = L.slice(1)
    .reverse()
    .map(([px, py]): Pt => [2 * x - px + r.r(-1, 1), py]);
  return poly([...L, ...R]);
}

/** Lumenheim-style building skyline */
function cityD(
  r: Rng,
  x0: number,
  x1: number,
  base: (x: number) => number,
  o: { h: [number, number]; w: [number, number]; spire?: number; dome?: number; win?: number; winMax?: number; bottom?: number },
): { d: string; wins: Pt[] } {
  let d = "";
  const wins: Pt[] = [];
  let x = x0;
  const bottom = o.bottom ?? 900;
  while (x < x1) {
    const w = r.r(o.w[0], o.w[1]);
    const by = base(x + w / 2);
    const h = r.r(o.h[0], o.h[1]);
    const top = by - h;
    const v = r.n();
    const X = q(x);
    const X2 = q(x + w);
    if (v < (o.spire ?? 0.15)) {
      const sh = w * r.r(1.8, 3.6);
      d += `M${X} ${bottom}V${q(top)}L${q(x + w * 0.3)} ${q(top - w * 0.3)}L${q(x + w / 2)} ${q(top - sh)}L${q(x + w * 0.7)} ${q(top - w * 0.3)}L${X2} ${q(top)}V${bottom}Z`;
    } else if (v < (o.spire ?? 0.15) + (o.dome ?? 0.06)) {
      d += `M${X} ${bottom}V${q(top)}Q${q(x + w / 2)} ${q(top - w * 0.85)} ${X2} ${q(top)}V${bottom}Z`;
      d += `M${q(x + w / 2 - 1)} ${q(top - w * 0.4)}L${q(x + w / 2)} ${q(top - w * 0.9)}L${q(x + w / 2 + 1)} ${q(top - w * 0.4)}Z`;
    } else {
      const rh = w * r.r(0.45, 1.05);
      d += `M${X} ${bottom}V${q(top)}L${q(x + w / 2)} ${q(top - rh)}L${X2} ${q(top)}V${bottom}Z`;
      if (r.n() < 0.3) d += `M${q(x + w * 0.72)} ${q(top - rh * 0.3)}v${q(-rh * 0.45)}h4v${q(rh * 0.6)}Z`;
    }
    if (o.win) {
      const cols = Math.max(1, Math.floor(w / 9));
      const rows = Math.min(o.winMax ?? 6, Math.floor(h / 11));
      for (let cI = 0; cI < cols; cI++)
        for (let rI = 0; rI < rows; rI++)
          if (r.n() < o.win) wins.push([x + (w / (cols + 1)) * (cI + 1), top + 8 + rI * 11]);
    }
    x += w * r.r(0.6, 1.0);
  }
  return { d, wins };
}

/** 성서관 — the white marble Archive tower */
function archive(P: Pic, cx: number, base: number, top: number, o: { lit: string; mid: string; shade: string; win: string; winOp?: number; left?: boolean; rim?: string }): string {
  const u = (base - top) / 100;
  const Y = (v: number) => base - v * u;
  const g = o.left === false ? P.lin([[0, o.shade], [0.55, o.mid], [1, o.lit]], 0, 0, 1, 0) : P.lin([[0, o.lit], [0.45, o.mid], [1, o.shade]], 0, 0, 1, 0);
  const box = (y0: number, y1: number, w: number) => `M${f(cx - w * u / 2)} ${f(Y(y0))}V${f(Y(y1))}H${f(cx + w * u / 2)}V${f(Y(y0))}Z`;
  const spireAt = (x: number, y0: number, h: number, w: number) => `M${f(x - w * u / 2)} ${f(Y(y0))}L${f(x)} ${f(Y(y0 + h))}L${f(x + w * u / 2)} ${f(Y(y0))}Z`;
  let d = "";
  // wings
  d += `M${f(cx - 25 * u)} ${f(Y(-5))}V${f(Y(8))}L${f(cx - 20 * u)} ${f(Y(12))}L${f(cx - 15 * u)} ${f(Y(8))}V${f(Y(-5))}Z`;
  d += `M${f(cx + 15 * u)} ${f(Y(-5))}V${f(Y(8))}L${f(cx + 20 * u)} ${f(Y(12))}L${f(cx + 25 * u)} ${f(Y(8))}V${f(Y(-5))}Z`;
  d += box(-5, 12, 28) + box(12, 13.6, 31) + box(13.6, 40, 20) + box(40, 41.6, 23.5) + box(41.6, 60, 16) + box(60, 61.6, 20) + box(61.6, 72, 13) + box(72, 73.2, 14.5);
  // dome
  d += `M${f(cx - 7 * u)} ${f(Y(73.2))}C${f(cx - 7 * u)} ${f(Y(78))} ${f(cx - 2.5 * u)} ${f(Y(80))} ${f(cx)} ${f(Y(83))}C${f(cx + 2.5 * u)} ${f(Y(80))} ${f(cx + 7 * u)} ${f(Y(78))} ${f(cx + 7 * u)} ${f(Y(73.2))}Z`;
  d += box(82, 86, 2.2) + spireAt(cx, 86, 14, 1.3);
  // pinnacles
  for (const s of [-1, 1]) {
    d += spireAt(cx + s * 13.5 * u, 13.6, 10, 2.6) + spireAt(cx + s * 9.8 * u, 13.6, 7, 1.8);
    d += spireAt(cx + s * 10.5 * u, 41.6, 8, 2.2) + spireAt(cx + s * 8.8 * u, 61.6, 6, 1.8);
    d += spireAt(cx + s * 20 * u, 12, 5, 1.6);
  }
  let s = path(d, g);
  // horizontal shade under cornices
  const sh = [13.6, 41.6, 61.6, 73.2]
    .map((v, k) => `M${f(cx - [10, 8, 6.5, 7][k] * u)} ${f(Y(v))}h${f([20, 16, 13, 14][k] * u)}v${f(1.4 * u)}h${f(-[20, 16, 13, 14][k] * u)}Z`)
    .join("");
  s += path(sh, "#0a0f2a", 0.35);
  // windows
  let wd = "";
  const arch = (x: number, y0: number, h: number, w: number) =>
    `M${f(x - (w * u) / 2)} ${f(Y(y0))}V${f(Y(y0 + h - w / 2))}A${f((w * u) / 2)} ${f((w * u) / 2)} 0 0 1 ${f(x + (w * u) / 2)} ${f(Y(y0 + h - w / 2))}V${f(Y(y0))}Z`;
  for (const k of [-1, 0, 1]) wd += arch(cx + k * 4.2 * u, 16, 8, 1.8) + arch(cx + k * 4.2 * u, 28, 8, 1.8);
  for (const k of [-1, 1]) wd += arch(cx + k * 3.6 * u, 45, 9, 1.8);
  for (const k of [-1, 0, 1]) wd += arch(cx + k * 3.6 * u, 63.5, 7, 2.2);
  wd += arch(cx, 1, 8, 5) + arch(cx - 7 * u, 1, 6, 3) + arch(cx + 7 * u, 1, 6, 3);
  s += path(wd, o.win, o.winOp ?? 0.9);
  // rim light
  if (o.rim) {
    const side = o.left === false ? 1 : -1;
    const rim = [
      [13.6, 40, 20],
      [41.6, 60, 16],
      [61.6, 72, 13],
    ]
      .map(([a, b, w]) => `M${f(cx + side * (w * u) / 2 - (side > 0 ? 1.4 : 0))} ${f(Y(b))}h1.4V${f(Y(a))}h-1.4Z`)
      .join("");
    s += path(rim, o.rim, 0.8);
  }
  return s;
}

/* glyphs — star-ink letters */
function glyphD(r: Rng, x: number, y: number, s: number): string {
  let d = "";
  const k = r.i(2, 3);
  const h = s / 2;
  for (let j = 0; j < k; j++) {
    const v = r.n();
    if (v < 0.22) {
      const rr = s * r.r(0.14, 0.24);
      const cx = x + r.r(-h, h) * 0.6;
      const cy = y + r.r(-h, h) * 0.6;
      d += `M${f(cx - rr)} ${f(cy)}a${f(rr)} ${f(rr)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-rr * 2)} 0`;
    } else if (v < 0.55) {
      const horiz = r.n() < 0.5;
      const ax = x + (horiz ? -h : r.r(-h, h) * 0.7);
      const ay = y + (horiz ? r.r(-h, h) * 0.7 : -h);
      const bx = x + (horiz ? h : r.r(-h, h) * 0.7);
      const by = y + (horiz ? r.r(-h, h) * 0.7 : h);
      d += `M${f(ax)} ${f(ay)}Q${f((ax + bx) / 2 + r.r(-h, h) * 0.5)} ${f((ay + by) / 2 + r.r(-h, h) * 0.5)} ${f(bx)} ${f(by)}`;
    } else {
      d += `M${f(x + r.r(-h, h))} ${f(y + r.r(-h, h))}C${f(x + r.r(-s, s))} ${f(y + r.r(-s, s))} ${f(x + r.r(-s, s))} ${f(y + r.r(-s, s))} ${f(x + r.r(-h, h))} ${f(y + r.r(-h, h))}`;
    }
  }
  if (r.n() < 0.4) d += `M${f(x + r.r(-h, h))} ${f(y - h * 1.1)}h0`;
  return d;
}

/* moonflower symbol (six petals, lily × magnolia) */
function moonflowerDef(P: Pic, tone: { hi: string; mid: string; edge: string; heart: string }): { top: string; side: string } {
  const pg = P.rad([[0, tone.heart], [0.25, tone.hi], [0.7, tone.mid], [1, tone.edge]], 0, 0, 44, true);
  const petal = (L: number, W: number) => `M0 0C${W} ${-L * 0.25} ${W * 0.95} ${-L * 0.72} 0 ${-L}C${-W * 0.95} ${-L * 0.72} ${-W} ${-L * 0.25} 0 0Z`;
  let top = "";
  for (let k = 0; k < 6; k++) {
    const L = k % 2 ? 36 : 42;
    const W = k % 2 ? 11 : 14;
    top += `<path d="${petal(L, W)}" transform="rotate(${k * 60 + (k % 2 ? 0 : 3)})"/>`;
  }
  const idT = P.id("mf");
  P.def(
    `<g id="${idT}"><circle r="46" fill="${P.glow(tone.hi)}" opacity=".35"/><g fill="${pg}">${top}</g>` +
      `<path d="M0 0L-5-12M0 0L5-11M0 0L-9-6M0 0L9-5M0 0L0-13" stroke="${tone.heart}" stroke-width="1" stroke-opacity=".8"/>` +
      `<path d="M-5-12h0M5-11h0M-9-6h0M9-5h0M0-13h0" stroke="#f6d48f" stroke-width="2.6" stroke-linecap="round"/></g>`,
  );
  // side / cup view
  const sg = P.lin([[0, tone.hi], [0.6, tone.mid], [1, tone.edge]], 0, 0, 0, 1);
  const idS = P.id("mfs");
  P.def(
    `<g id="${idS}"><circle cy="-18" r="36" fill="${P.glow(tone.hi)}" opacity=".3"/><g fill="${sg}">` +
      `<path d="M0 0C-18-6-30-22-34-40C-20-34-8-24 0 0Z"/><path d="M0 0C18-6 30-22 34-40C20-34 8-24 0 0Z"/>` +
      `<path d="M0 0C-12-12-16-30-10-46C-2-36 2-20 0 0Z" opacity=".85"/><path d="M0 0C12-12 16-30 10-46C2-36-2-20 0 0Z" opacity=".85"/>` +
      `<path d="M0 0C-7-14-6-34 0-50C6-34 7-14 0 0Z"/></g><path d="M0 0V16" stroke="#1d3a3a" stroke-width="2.4"/></g>`,
  );
  return { top: idT, side: idS };
}
const use = (id: string, x: number, y: number, s: number, rot = 0, sy = 1, extra = ""): string =>
  `<use href="#${id}" transform="translate(${q(x)} ${q(y)})${rot ? ` rotate(${q(rot)})` : ""} scale(${f2(s)}${sy !== 1 ? " " + f2(s * sy) : ""})"${extra}/>`;

/** bumpy foliage silhouette (arc bumps along the top), closed to `bottom` */
function bushD(r: Rng, x0: number, x1: number, y: number, bump: [number, number], jitter: number, bottom = 900): string {
  let d = `M${q(x0)} ${bottom}L${q(x0)} ${q(y)}`;
  let x = x0;
  let cy = y;
  while (x < x1) {
    const w = r.r(bump[0], bump[1]);
    const ny = y + r.r(-jitter, jitter);
    d += `A${q(w / 2)} ${q(w / 2.2)} 0 0 1 ${q(x + w)} ${q(ny)}`;
    x += w;
    cy = ny;
  }
  return d + `L${q(x)} ${q(cy)}L${q(x)} ${bottom}Z`;
}

/* ───────────────────────── common overlays ───────────────────────── */

function vignette(P: Pic, c = "#000", op = 0.75, inner = 0.45): string {
  return rect(P.rad([[0, c, 0], [inner, c, 0], [0.8, c, op * 0.55], [1, c, op]], 0.5, 0.45, 0.75));
}
function bottomShade(P: Pic, c = "#05070f", op = 0.55, from = 0.6): string {
  return rect(P.lin([[0, c, 0], [from, c, 0], [1, c, op]]));
}
function grain(P: Pic, op: number, dark = true): string {
  P.filters++;
  P.def(
    `<filter id="${P.id("gr")}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${dark ? 1 : 0} 0 0 0 0 ${dark ? 1 : 0} 0 0 0 0 ${dark ? 1 : 0} 0 0 0 .9 0"/></filter>`,
  );
  return `<rect width="1600" height="900" filter="${P.ref("gr")}" opacity="${f2(op)}"/>`;
}

/* ───────────────────────── scenes ───────────────────────── */

function sBlack(): string {
  const P = new Pic("black");
  const r = new Rng(11);
  P.add(rect("#04050b"));
  P.add(ell(800, 420, 1000, 620, P.glow("#11152b"), 0.9));
  P.add(ell(800, 380, 520, 340, P.glow("#1a1f3c"), 0.35));
  const pts: Pt[] = [];
  for (let k = 0; k < 60; k++) pts.push([r.r(0, 1600), r.r(0, 900)]);
  P.add(dots(pts, 1.2, "#8f9cc8", 0.12));
  P.add(grain(P, 0.05));
  P.add(vignette(P, "#000", 0.85, 0.35));
  return P.svg();
}

function sWhite(): string {
  const P = new Pic("white");
  P.add(rect("#f3eee4"));
  P.add(ell(800, 420, 1100, 700, P.glow("#fffdf8"), 1));
  P.add(ell(800, 380, 520, 360, P.glow("#ffffff"), 0.9));
  P.add(ell(800, 380, 1400, 260, P.glow("#fff8ea"), 0.5));
  P.add(grain(P, 0.035, false));
  P.add(vignette(P, "#c9b294", 0.5, 0.4));
  return P.svg();
}

/* 백색 정원 */
function sGarden(): string {
  const P = new Pic("garden");
  const r = new Rng(101);
  const fs = flareDef(P);
  P.add(rect(P.lin([[0, "#060920"], [0.35, "#0f1742"], [0.58, "#2a3a80"], [0.7, "#4a5ea8"]])));
  // moon halo
  const MX = 940;
  const MY = 165;
  P.add(ell(MX, MY, 760, 520, P.glow("#6f84d8"), 0.55));
  P.add(ell(MX, MY, 300, 280, P.glow("#c8d4ff"), 0.45));
  P.add(starField(P, r, { n: 360, box: [0, 0, 1600, 520], keep: (x, y) => Math.min(1, Math.hypot(x - MX, y - MY) / 380) * (1 - y / 640) }));
  P.add(ring(P, r, { a: [-160, 560], c: [760, -120], b: [1760, 330], w: 70, n: 1100, glow: 0.85, fs, bright: 7 }));
  // moon
  P.add(ell(MX, MY, 120, 120, P.glow("#eef2ff", true), 0.6));
  P.add(`<circle cx="${MX}" cy="${MY}" r="56" fill="${P.rad([[0, "#ffffff"], [0.7, "#f1f2ff"], [1, "#cdd6f6"]], 0.42, 0.4, 0.6)}"/>`);
  P.add(path(`M${MX - 22} ${MY - 14}a14 11 0 1 0 1 0ZM${MX + 18} ${MY + 12}a10 8 0 1 0 1 0ZM${MX + 8} ${MY - 30}a7 5 0 1 0 1 0Z`, "#b9c3ea", 0.35));
  // far palace silhouette on horizon
  const far = cityD(new Rng(7), -40, 1640, (x) => 500 - 34 * Math.exp(-(((x - 800) / 420) ** 2)), { h: [20, 60], w: [26, 60], spire: 0.28, dome: 0.12, bottom: 620 });
  P.add(path(far.d, "#40529a", 0.75));
  P.add(ell(800, 505, 1200, 70, P.glow("#9fb0f0"), 0.5));
  // mid trees (framing) — rim lit
  const treeL = bushD(r, -60, 470, 300, [70, 140], 70, 720) + bushD(r, -80, 330, 180, [90, 160], 60, 720);
  const treeR = bushD(r, 1130, 1680, 290, [70, 140], 70, 720) + bushD(r, 1290, 1700, 170, [90, 160], 60, 720);
  P.def(`<path id="${P.id("tr")}" d="${treeL + treeR}"/>`);
  P.add(`<use href="#${P.id("tr")}" fill="#6d80c8" opacity=".55" x="3" y="-4"/>`);
  P.add(`<use href="#${P.id("tr")}" fill="${P.lin([[0, "#18234f"], [1, "#0b1030"]])}"/>`);
  // hedge line mid
  const hedge = bushD(r, -40, 1640, 520, [30, 60], 8, 640);
  P.def(`<path id="${P.id("hd")}" d="${hedge}"/>`);
  P.add(`<use href="#${P.id("hd")}" fill="#7d90d4" opacity=".5" y="-3"/>`);
  P.add(`<use href="#${P.id("hd")}" fill="#141d48"/>`);
  // rotunda (arbor)
  const CX = 800;
  const BY = 520;
  const colG = P.lin([[0, "#5a6aa8"], [0.35, "#c8d2f2"], [0.62, "#f4f6ff"], [1, "#8c9ad0"]], 0, 0, 1, 0);
  P.add(ell(CX, BY - 150, 210, 170, P.glow("#cfd8ff"), 0.35));
  P.add(path(`M${CX - 150} ${BY - 20}Q${CX} ${BY - 60} ${CX + 150} ${BY - 20}V${BY - 190}Q${CX} ${BY - 230} ${CX - 150} ${BY - 190}Z`, "#0c1236", 0.9)); // inner shadow
  let cols = "";
  for (const [x, w] of [
    [-138, 16],
    [-82, 20],
    [-26, 22],
    [26, 22],
    [82, 20],
    [138, 16],
  ] as Pt[]) {
    cols += `<rect x="${CX + x - w / 2}" y="${BY - 205}" width="${w}" height="${190 + (Math.abs(x) < 50 ? 12 : Math.abs(x) < 100 ? 6 : 0)}" fill="${colG}"/>`;
    cols += `<rect x="${CX + x - w / 2 - 3}" y="${BY - 210}" width="${w + 6}" height="8" fill="#dfe6ff"/>`;
  }
  P.add(cols);
  // entablature + dome
  P.add(path(`M${CX - 165} ${BY - 205}Q${CX} ${BY - 245} ${CX + 165} ${BY - 205}V${BY - 228}Q${CX} ${BY - 268} ${CX - 165} ${BY - 228}Z`, P.lin([[0, "#f0f3ff"], [1, "#9aa8dc"]])));
  P.add(path(`M${CX - 150} ${BY - 240}C${CX - 150} ${BY - 330} ${CX - 60} ${BY - 372} ${CX} ${BY - 374}C${CX + 60} ${BY - 372} ${CX + 150} ${BY - 330} ${CX + 150} ${BY - 240}Q${CX} ${BY - 275} ${CX - 150} ${BY - 240}Z`, P.lin([[0, "#5c6cb0"], [0.45, "#d9e0fb"], [0.7, "#f6f8ff"], [1, "#8190cc"]], 0, 0, 1, 0)));
  let ribs = "";
  for (let k = -3; k <= 3; k++) ribs += `M${CX + k * 42} ${BY - 252 + Math.abs(k) * 4}Q${CX + k * 30} ${BY - 330} ${CX} ${BY - 372}`;
  P.add(`<path d="${ribs}" fill="none" stroke="#6070b4" stroke-width="1.5" stroke-opacity=".45"/>`);
  P.add(path(`M${CX - 4} ${BY - 372}V${BY - 404}L${CX} ${BY - 420}L${CX + 4} ${BY - 404}V${BY - 372}Z`, "#e8edff"));
  P.add(ell(CX, BY - 420, 26, 26, P.glow("#ffffff", true), 0.8));
  // steps
  P.add(path(`M${CX - 180} ${BY - 12}Q${CX} ${BY - 50} ${CX + 180} ${BY - 12}L${CX + 196} ${BY + 6}Q${CX} ${BY - 34} ${CX - 196} ${BY + 6}Z`, P.lin([[0, "#dfe6ff"], [1, "#6d7cc0"]])));
  // hanging vines + flowers on rotunda
  const mf = moonflowerDef(P, { hi: "#ffffff", mid: "#e8ecf8", edge: "#8e9dd6", heart: "#fffbe8" });
  let vine = "";
  for (let k = 0; k < 9; k++) {
    const x = CX - 150 + k * 37.5 + r.r(-6, 6);
    const y0 = BY - 225 - Math.cos(((x - CX) / 150) * 1.2) * 34;
    vine += `M${q(x)} ${q(y0)}c${q(r.r(-10, 10))} 30 ${q(r.r(-12, 12))} 60 ${q(r.r(-6, 6))} ${q(r.r(60, 130))}`;
  }
  P.add(`<path d="${vine}" fill="none" stroke="#1f3b56" stroke-width="2.2" stroke-opacity=".85"/>`);
  for (let k = 0; k < 14; k++) P.add(use(r.n() < 0.5 ? mf.top : mf.side, CX - 150 + r.r(0, 300), BY - 240 + r.r(10, 120), r.r(0.18, 0.3), r.r(-30, 30), 0.7));
  // fountain in front
  const FY = 612;
  P.add(ell(CX, FY - 10, 280, 60, P.glow("#bcc9ff"), 0.45));
  P.add(path(`M${CX - 190} ${FY}Q${CX} ${FY - 52} ${CX + 190} ${FY}V${FY + 22}Q${CX} ${FY - 26} ${CX - 190} ${FY + 22}Z`, P.lin([[0, "#e8edff"], [1, "#5d6bb0"]])));
  P.add(ell(CX, FY - 8, 176, 30, P.lin([[0, "#1b2660"], [0.5, "#3c4f9c"], [1, "#9aa9e6"]]), 1));
  // moon reflection in basin
  P.add(`<g ${P.tw(3.2, 0.5, 0.45)}>${ell(CX + 30, FY - 6, 60, 5, P.glow("#ffffff", true), 0.7)}</g>`);
  P.add(`<g ${P.tw(4.1, 1.7, 0.3)}>${ell(CX - 70, FY - 12, 38, 3, P.glow("#dfe6ff", true), 0.6)}</g>`);
  // pedestal & bowl
  P.add(path(`M${CX - 14} ${FY - 12}L${CX - 9} ${FY - 108}H${CX + 9}L${CX + 14} ${FY - 12}Z`, colG));
  P.add(path(`M${CX - 70} ${FY - 118}Q${CX} ${FY - 128} ${CX + 70} ${FY - 118}Q${CX + 50} ${FY - 94} ${CX} ${FY - 92}Q${CX - 50} ${FY - 94} ${CX - 70} ${FY - 118}Z`, P.lin([[0, "#f4f6ff"], [1, "#6f7fc4"]])));
  P.add(path(`M${CX - 5} ${FY - 120}L${CX - 3} ${FY - 158}H${CX + 3}L${CX + 5} ${FY - 120}Z`, "#dfe6ff"));
  // water veils
  const wv = `M${CX - 68} ${FY - 118}C${CX - 88} ${FY - 90} ${CX - 92} ${FY - 50} ${CX - 96} ${FY - 12}M${CX + 68} ${FY - 118}C${CX + 88} ${FY - 90} ${CX + 92} ${FY - 50} ${CX + 96} ${FY - 12}M${CX - 40} ${FY - 96}C${CX - 50} ${FY - 70} ${CX - 52} ${FY - 40} ${CX - 54} ${FY - 12}M${CX + 40} ${FY - 96}C${CX + 50} ${FY - 70} ${CX + 52} ${FY - 40} ${CX + 54} ${FY - 12}`;
  P.add(`<path d="${wv}" fill="none" stroke="#e8eeff" stroke-width="3" stroke-opacity=".35"/>`);
  P.add(`<g ${P.tw(2.2, 0, 0.4)}><path d="${wv}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 14" stroke-opacity=".8"/></g>`);
  P.add(`<path d="M${CX} ${FY - 158}C${CX - 20} ${FY - 176} ${CX - 50} ${FY - 150} ${CX - 60} ${FY - 120}M${CX} ${FY - 158}C${CX + 20} ${FY - 176} ${CX + 50} ${FY - 150} ${CX + 60} ${FY - 120}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity=".6"/>`);
  P.add(ell(CX, FY - 160, 22, 22, P.glow("#ffffff", true), 0.7));
  // flower beds: mid bushes
  const bedL = bushD(r, -40, 610, 560, [40, 80], 18, 760);
  const bedR = bushD(r, 990, 1640, 560, [40, 80], 18, 760);
  P.def(`<path id="${P.id("bd")}" d="${bedL + bedR}"/>`);
  P.add(`<use href="#${P.id("bd")}" fill="#8193d8" opacity=".45" y="-4" x="2"/>`);
  P.add(`<use href="#${P.id("bd")}" fill="${P.lin([[0, "#1a2a55"], [1, "#0a1028"]])}"/>`);
  // flower glow beds
  P.add(ell(300, 575, 360, 70, P.glow("#c9d6ff"), 0.35), ell(1300, 575, 360, 70, P.glow("#c9d6ff"), 0.35));
  const fl: string[] = [];
  for (let k = 0; k < 44; k++) {
    const left = k % 2 === 0;
    const x = left ? r.r(-20, 600) : r.r(1000, 1620);
    const y = r.r(548, 640);
    const s = 0.28 + ((y - 548) / 92) * 0.3 + r.r(-0.05, 0.05);
    fl.push(use(r.n() < 0.7 ? mf.top : mf.side, x, y, s, r.r(-25, 25), 0.62));
  }
  P.add(fl.join(""));
  // path
  P.add(path(`M${CX - 90} 632L${CX - 330} 900H${CX + 330}L${CX + 90} 632Z`, P.lin([[0, "#8e9ddc"], [0.35, "#48579a"], [1, "#161d45"]]), 0.8));
  let slabs = "";
  for (let k = 0; k < 7; k++) {
    const y = 640 + k * k * 5.5 + k * 16;
    const hw = 90 + (y - 632) * 0.9;
    slabs += `M${q(CX - hw)} ${q(y)}H${q(CX + hw)}`;
  }
  P.add(`<path d="${slabs}" stroke="#0d1330" stroke-width="2" stroke-opacity=".45"/>`);
  // foreground clusters
  const fgL = bushD(r, -80, 420, 700, [60, 110], 40) + bushD(r, -60, 240, 610, [80, 120], 40);
  const fgR = bushD(r, 1180, 1680, 700, [60, 110], 40) + bushD(r, 1360, 1680, 600, [80, 120], 40);
  P.def(`<path id="${P.id("fg")}" d="${fgL + fgR}"/>`);
  P.add(`<use href="#${P.id("fg")}" fill="#6273bd" opacity=".5" y="-5" x="4"/>`);
  P.add(`<use href="#${P.id("fg")}" fill="#070b22"/>`);
  const ff: string[] = [];
  for (let k = 0; k < 20; k++) {
    const left = k % 2 === 0;
    const x = left ? r.r(-30, 380) : r.r(1220, 1630);
    const y = r.r(620, 820);
    ff.push(use(r.n() < 0.75 ? mf.top : mf.side, x, y, r.r(0.75, 1.25), r.r(-40, 40), 0.62, ` opacity="${f2(r.r(0.75, 1))}"`));
  }
  P.add(ff.join(""));
  // glints near flowers
  for (let k = 0; k < 8; k++) P.add(flare(P, fs, r.pick([r.r(100, 520), r.r(1080, 1500)]), r.r(470, 640), r.r(0.25, 0.45), P.tw(r.r(2.5, 5), r.r(0, 4), 0.1)));
  // mist
  P.add(ell(800, 640, 1100, 90, P.glow("#aebbe8"), 0.28));
  P.add(bottomShade(P, "#04061a", 0.6, 0.62));
  P.add(vignette(P, "#03051a", 0.7, 0.5));
  return P.svg();
}

/* shared: Lumenheim city stack */
function capital(
  P: Pic,
  r: Rng,
  o: {
    layers: { y: number; hill: number; h: [number, number]; c: string; rim?: string; win?: number; winC?: string; winOp?: number; mist?: string; mistOp?: number }[];
    tower?: { at: number; base: number; top: number; lit: string; mid: string; shade: string; win: string; rim?: string; left?: boolean; glow?: string };
    cx?: number;
  },
): string {
  let s = "";
  const cx = o.cx ?? 800;
  o.layers.forEach((L, k) => {
    if (o.tower && o.tower.at === k) {
      const T = o.tower;
      if (T.glow) s += ell(cx, T.top + (T.base - T.top) * 0.35, 260, (T.base - T.top) * 0.75, P.glow(T.glow), 0.4);
      s += archive(P, cx, T.base, T.top, T);
    }
    const scale = 1 + k * 0.45;
    const c = cityD(r, -60, 1660, (x) => L.y - L.hill * Math.exp(-(((x - cx) / 520) ** 2)) + Math.sin(x / 130 + k) * 6, {
      h: L.h,
      w: [16 * scale, 38 * scale],
      spire: 0.2,
      dome: 0.07,
      win: L.win,
      winMax: 5,
    });
    const id = P.id("c" + k);
    P.def(`<path id="${id}" d="${c.d}"/>`);
    if (L.rim) s += `<use href="#${id}" fill="${L.rim}" x="${o.tower?.left === false ? 2 : -2}" y="-2"/>`;
    s += `<use href="#${id}" fill="${L.c}"/>`;
    if (L.win) {
      const wc = L.winC ?? "#f6d48f";
      const big = c.wins.filter(() => r.n() < 0.3);
      const small = c.wins.filter((w) => !big.includes(w));
      s += dots(small, 2.2 * scale, wc, (L.winOp ?? 0.8) * 0.8) + dots(big, 3.2 * scale, wc, L.winOp ?? 0.8);
    }
    if (L.mist) s += rect(P.lin([[0, L.mist, 0], [0.5, L.mist, L.mistOp ?? 0.4], [1, L.mist, 0]]), 1, 0, L.y - 30, 1600, 100);
  });
  return s;
}

/* 타이틀 */
function sTitle(): string {
  const P = new Pic("title");
  const r = new Rng(2024);
  const fs = flareDef(P);
  P.add(rect(P.lin([[0, "#050819"], [0.3, "#0b1236"], [0.55, "#1e2a68"], [0.72, "#3a4a94"]])));
  // big luminous sky wash behind ring
  P.add(ell(1180, 220, 900, 520, P.glow("#3c4fa8"), 0.6));
  // moon (upper-right of tower)
  const MX = 1230;
  const MY = 400;
  P.add(ell(800, 520, 900, 300, P.glow("#6d82d6"), 0.45));
  P.add(starField(P, r, { n: 420, box: [0, 0, 1600, 560], keep: (x, y) => (1 - y / 700) * (x < 700 && y < 360 ? 0.55 : 1) }));
  P.add(ring(P, r, { a: [1780, 640], c: [1180, -40], b: [360, -120], w: 105, n: 1700, glow: 1.15, fs, bright: 9 }));
  P.add(ell(MX, MY, 180, 180, P.glow("#dfe6ff"), 0.45));
  P.add(`<circle cx="${MX}" cy="${MY}" r="30" fill="${P.rad([[0, "#ffffff"], [0.75, "#f1f3ff"], [1, "#c9d2f4"]], 0.42, 0.4, 0.6)}"/>`);
  // falling star
  const mg = meteorDef(P, "#fff6e6");
  P.add(ell(1000, 238, 140, 140, P.glow("#fff3dc"), 0.35));
  P.add(meteor(P, mg, 1000, 238, 470, -28, 5, 1, P.glow("#fff6e6", true)));
  P.add(meteor(P, P.lin([[0, "#bcd0ff", 0.6], [1, "#bcd0ff", 0]], 0, 0, 1, 0), 1000, 238, 300, -28, 16, 0.5));
  // capital
  P.add(
    capital(P, r, {
      cx: 820,
      layers: [
        { y: 610, hill: 70, h: [18, 55], c: "#34438a", mist: "#5a6cb8", mistOp: 0.45 },
        { y: 690, hill: 90, h: [30, 80], c: "#1c2660", rim: "#8ea0e6", win: 0.12, winOp: 0.75, mist: "#3a4a94", mistOp: 0.35 },
        { y: 790, hill: 60, h: [40, 120], c: "#0c1236", rim: "#5d70c0", win: 0.14, winOp: 0.85 },
      ],
      tower: { at: 1, base: 690, top: 120, lit: "#f4f6ff", mid: "#b9c4ec", shade: "#4c5aa0", win: "#9fc2ff", rim: "#ffffff", left: false, glow: "#9fb4ff" },
    }),
  );
  // foreground moonflower corners
  const mf = moonflowerDef(P, { hi: "#ffffff", mid: "#e4e9f8", edge: "#7d8dcc", heart: "#fffbe8" });
  const fg = bushD(r, -80, 360, 760, [60, 110], 50) + bushD(r, 1260, 1680, 760, [60, 110], 50) + bushD(r, -60, 190, 660, [70, 110], 30) + bushD(r, 1420, 1680, 650, [70, 110], 30);
  P.def(`<path id="${P.id("fg")}" d="${fg}"/>`);
  P.add(`<use href="#${P.id("fg")}" fill="#5d6fbf" opacity=".6" y="-5" x="-3"/>`);
  P.add(`<use href="#${P.id("fg")}" fill="#050819"/>`);
  for (let k = 0; k < 16; k++) {
    const left = k % 2 === 0;
    P.add(use(r.n() < 0.7 ? mf.top : mf.side, left ? r.r(-30, 300) : r.r(1300, 1630), r.r(660, 860), r.r(0.8, 1.35), r.r(-40, 40), 0.64));
  }
  // loose petals
  const pd = "M0 0C6-4 16-4 22 0C16 4 6 4 0 0Z";
  let pet = "";
  for (let k = 0; k < 10; k++) pet += `<path d="${pd}" transform="translate(${q(r.pick([r.r(80, 460), r.r(1140, 1520)]))} ${q(r.r(520, 700))}) rotate(${q(r.r(0, 360))}) scale(${f2(r.r(0.6, 1.1))})"/>`;
  P.add(`<g fill="#eef1ff" opacity=".8">${pet}</g>`);
  P.add(bottomShade(P, "#03051a", 0.55, 0.65));
  P.add(vignette(P, "#02041a", 0.65, 0.5));
  return P.svg();
}

/* 별지는 밤 */
function sStarfall(): string {
  const P = new Pic("starfall");
  const r = new Rng(77);
  const fs = flareDef(P, "#dfe0ff");
  P.add(rect(P.lin([[0, "#07061c"], [0.35, "#1a1650"], [0.6, "#3b2f80"], [0.75, "#5a4a9c"]])));
  P.add(ell(800, 300, 1100, 520, P.glow("#5a58c8"), 0.55));
  P.add(starField(P, r, { n: 460, box: [0, 0, 1600, 600] }));
  P.add(ring(P, r, { a: [-200, 470], c: [800, -170], b: [1800, 470], w: 125, n: 2000, glow: 1.6, fs, bright: 10, tone: ["#6a60e0", "#b8b8ff", "#ffffff"] }));
  const mg = meteorDef(P);
  const hg = P.glow("#ffffff", true);
  for (let k = 0; k < 26; k++) {
    const x = r.r(80, 1560);
    const y = r.r(40, 520);
    const len = r.r(90, 320) * (k < 6 ? 1.4 : 1);
    P.add(meteor(P, mg, x, y, len, -32 + r.r(-5, 5), r.r(1.5, 3.8), r.r(0.45, 1), k < 8 ? hg : ""));
  }
  P.add(
    capital(P, r, {
      layers: [
        { y: 660, hill: 70, h: [20, 60], c: "#2a2a6e", rim: "#8c86e0", mist: "#4a4290", mistOp: 0.4 },
        { y: 740, hill: 70, h: [30, 90], c: "#141440", rim: "#7068c8", win: 0.12, winOp: 0.8, mist: "#2a2466", mistOp: 0.3 },
        { y: 830, hill: 40, h: [40, 120], c: "#08081e", rim: "#4a44a0", win: 0.1, winOp: 0.85 },
      ],
      tower: { at: 1, base: 740, top: 300, lit: "#e8e6ff", mid: "#a8a6e0", shade: "#3c3a88", win: "#9fc2ff", rim: "#ffffff", glow: "#8f8cff" },
    }),
  );
  P.add(bottomShade(P, "#03031a", 0.6, 0.6));
  P.add(vignette(P, "#02021a", 0.6, 0.5));
  return P.svg();
}

/* 새벽 */
function sDawn(): string {
  const P = new Pic("dawn");
  const r = new Rng(505);
  P.add(rect(P.lin([[0, "#1e2560"], [0.28, "#4d4f98"], [0.48, "#a47aa8"], [0.6, "#e8a39a"], [0.7, "#f6cf8f"], [0.78, "#fbe6b8"]])));
  // sun bloom
  P.add(ell(800, 640, 1100, 420, P.glow("#ffd9a0"), 0.75));
  P.add(ell(800, 640, 420, 220, P.glow("#fff4dc", true), 0.9));
  P.add(starField(P, r, { n: 160, box: [0, 0, 1600, 330], keep: (_x, y) => 1 - y / 330, op: 0.55, tw: 0.3 }));
  P.add(ring(P, r, { a: [-200, 360], c: [800, -60], b: [1800, 300], w: 80, n: 700, glow: 0.45, tone: ["#b8a0d8", "#f0d8f0", "#ffffff"], lane: false }));
  // clouds — long streaks with gold undersides
  let cl = "";
  let cu = "";
  for (let k = 0; k < 11; k++) {
    const y = r.r(300, 540);
    const x = r.r(-100, 1500);
    const w = r.r(240, 560);
    const h = r.r(10, 24);
    cl += `M${q(x)} ${q(y)}C${q(x + w * 0.2)} ${q(y - h)} ${q(x + w * 0.7)} ${q(y - h * 1.2)} ${q(x + w)} ${q(y)}Z`;
    cu += `M${q(x + w * 0.08)} ${q(y)}C${q(x + w * 0.3)} ${q(y + h * 0.35)} ${q(x + w * 0.7)} ${q(y + h * 0.35)} ${q(x + w * 0.95)} ${q(y)}Z`;
  }
  P.add(path(cl, P.lin([[0, "#9c7fb8"], [1, "#d89aa0"]], 0, 300, 0, 540, true), 0.7));
  P.add(path(cu, "#ffe0a8", 0.8));
  // god rays
  let rays = "";
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.2 + r.r(-0.05, 0.05);
    const w = r.r(0.02, 0.05);
    rays += `M800 640L${q(800 + Math.cos(a - w) * 1100)} ${q(640 + Math.sin(a - w) * 1100)}L${q(800 + Math.cos(a + w) * 1100)} ${q(640 + Math.sin(a + w) * 1100)}Z`;
  }
  P.add(`<g ${P.pulse(9, 0)}>${path(rays, P.rad([[0, "#fff2d0", 0.45], [1, "#fff2d0", 0]], 800, 640, 800, true))}</g>`);
  P.add(
    capital(P, r, {
      layers: [
        { y: 650, hill: 60, h: [18, 55], c: "#b58aa0", mist: "#f0c0a8", mistOp: 0.5 },
        { y: 730, hill: 70, h: [30, 85], c: "#6a4a78", rim: "#ffd29a", win: 0.06, winOp: 0.6, mist: "#d8a0a0", mistOp: 0.3 },
        { y: 830, hill: 40, h: [40, 120], c: "#2c2046", rim: "#f0a878", win: 0.05, winOp: 0.7 },
      ],
      tower: { at: 1, base: 730, top: 250, lit: "#ffe8c8", mid: "#c08a98", shade: "#4c3a6a", win: "#fff0c8", rim: "#fff4dc", glow: "#ffe0b0" },
    }),
  );
  P.add(bottomShade(P, "#1a1030", 0.55, 0.62));
  P.add(vignette(P, "#2a1838", 0.45, 0.55));
  return P.svg();
}

export const WORLD_BACKGROUNDS: Record<string, string> = {
  black: sBlack(),
  white: sWhite(),
  garden: sGarden(),
  title: sTitle(),
  starfall: sStarfall(),
  dawn: sDawn(),
};
