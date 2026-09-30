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
const f2 = (v: number): string => String(Math.round(v * 100) / 100).replace(/^(-?)0\./, "$1.");
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
    const geo = cx === 0.5 && cy === 0.5 && r === 0.5 ? "" : ` cx="${cx}" cy="${cy}" r="${r}"`;
    this.def(
      `<radialGradient id="${this.id(n)}"${geo}${fxy}${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(st)}</radialGradient>`,
    );
    const u = this.ref(n);
    this.cache.set(key, u);
    return u;
  }
  /** soft bloom falloff, objectBoundingBox — reuse on any ellipse */
  glow(c: string, hard = false): string {
    return hard
      ? this.rad([[0, c, 1], [0.14, c, 0.85], [0.35, c, 0.3], [1, c, 0]])
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

/** Lumenheim-style skyline: returns silhouette, lit roof/wall facets and window points */
function cityD(
  r: Rng,
  x0: number,
  x1: number,
  base: (x: number) => number,
  o: { h: [number, number]; w: [number, number]; spire?: number; turret?: number; dome?: number; win?: number; winMax?: number; bottom?: number; light?: number },
): { d: string; lit: string; wins: Pt[] } {
  let d = "";
  let lit = "";
  const wins: Pt[] = [];
  let x = x0;
  const B = o.bottom ?? 900;
  const L = o.light ?? 1; // +1: light from the right
  while (x < x1) {
    let w = r.r(o.w[0], o.w[1]);
    const by = base(x + w / 2);
    let h = r.r(o.h[0], o.h[1]);
    const v = r.n();
    const sp = o.spire ?? 0.05;
    const tu = o.turret ?? 0.1;
    const dm = o.dome ?? 0.03;
    let X = Math.round(x);
    let top = Math.round(by - h);
    if (v < sp) {
      // church spire
      w = Math.max(w * 0.7, 10);
      h *= 1.35;
      top = Math.round(by - h);
      const W = Math.round(w);
      const sh = Math.round(w * r.r(2.4, 3.6));
      d += `M${X} ${B}V${top}l${Math.round(W / 2)} ${-sh}l${W - Math.round(W / 2)} ${sh}V${B}Z`;
      lit += L > 0 ? `M${X + Math.round(W / 2)} ${top - sh}l${W - Math.round(W / 2)} ${sh}h-${Math.max(2, Math.round(W * 0.35))}Z` : `M${X + Math.round(W / 2)} ${top - sh}l${-Math.round(W / 2)} ${sh}h${Math.max(2, Math.round(W * 0.35))}Z`;
    } else if (v < sp + tu) {
      // round turret with cone
      w = Math.max(w * 0.5, 8);
      h *= 1.2;
      top = Math.round(by - h);
      const W = Math.round(w);
      const ch = Math.round(w * r.r(1.3, 2.1));
      d += `M${X - 1} ${top + 2}l${Math.round(W / 2) + 1} ${-ch}l${W - Math.round(W / 2) + 1} ${ch}Z`;
      d += `M${X} ${B}V${top}h${W}V${B}Z`;
      lit += L > 0 ? `M${X + Math.round(W / 2)} ${top - ch + 2}l${W - Math.round(W / 2) + 1} ${ch}h${-Math.round(W * 0.4)}Z` : `M${X + Math.round(W / 2)} ${top - ch + 2}l${-Math.round(W / 2) - 1} ${ch}h${Math.round(W * 0.4)}Z`;
    } else if (v < sp + tu + dm) {
      const W = Math.round(w);
      d += `M${X} ${B}V${top}q${Math.round(W / 2)} ${-Math.round(W * 0.8)} ${W} 0V${B}Z`;
    } else {
      const W = Math.round(w);
      const rh = Math.round(w * r.r(0.3, 0.62));
      if (r.n() < 0.25) {
        // hip roof
        const ins = Math.round(W * 0.22);
        d += `M${X} ${B}V${top}l${ins} ${-rh}h${W - 2 * ins}l${ins} ${rh}V${B}Z`;
        lit += L > 0 ? `M${X + W - ins} ${top - rh}l${ins} ${rh}h${-ins * 2}Z` : `M${X + ins} ${top - rh}l${-ins} ${rh}h${ins * 2}Z`;
      } else {
        d += `M${X} ${B}V${top}l${Math.round(W / 2)} ${-rh}l${W - Math.round(W / 2)} ${rh}V${B}Z`;
        lit += L > 0 ? `M${X + Math.round(W / 2)} ${top - rh}l${W - Math.round(W / 2)} ${rh}h${-Math.round(W * 0.45)}Z` : `M${X + Math.round(W / 2)} ${top - rh}l${-Math.round(W / 2)} ${rh}h${Math.round(W * 0.45)}Z`;
      }
      if (r.n() < 0.22) d += `M${X + Math.round(W * 0.7)} ${top - Math.round(rh * 0.3)}v${-Math.round(rh * 0.5 + 3)}h3v${Math.round(rh * 0.6 + 3)}Z`;
    }
    // lit wall strip on the light side
    const W = Math.round(w);
    if (r.n() < 0.25) lit += L > 0 ? `M${X + W - Math.max(2, Math.round(W * 0.16))} ${top}h${Math.max(2, Math.round(W * 0.16))}v${Math.round(Math.min(h, 60))}h${-Math.max(2, Math.round(W * 0.16))}Z` : `M${X} ${top}h${Math.max(2, Math.round(W * 0.16))}v${Math.round(Math.min(h, 60))}h${-Math.max(2, Math.round(W * 0.16))}Z`;
    if (o.win && r.n() < 0.7) {
      const cols = Math.max(1, Math.floor(w / 8));
      const rows = Math.min(o.winMax ?? 5, Math.floor(h / 10));
      const dens = o.win * r.r(0.3, 2.2);
      for (let cI = 0; cI < cols; cI++) for (let rI = 0; rI < rows; rI++) if (r.n() < dens) wins.push([x + (w / (cols + 1)) * (cI + 1), top + 7 + rI * 10]);
    }
    x += w * r.r(0.55, 0.95);
  }
  return { d, lit, wins };
}

/** 성서관 — the white marble Archive tower (octagonal, three visible faces) */
function archive(
  P: Pic,
  cx: number,
  base: number,
  top: number,
  o: { lit: string; mid: string; shade: string; win: string; winOp?: number; left?: boolean; rim?: string; glow?: string },
): string {
  const u = (base - top) / 100;
  const Y = (v: number) => f(base - v * u);
  const X = (v: number) => f(cx + v * u);
  const Ls = o.left === false ? -1 : 1; // +1: light from the left
  const litC = o.lit;
  const midC = o.mid;
  const shC = o.shade;
  const faceL = Ls > 0 ? litC : shC;
  const faceR = Ls > 0 ? shC : litC;
  const cen = P.lin(Ls > 0 ? [[0, litC], [1, midC]] : [[0, midC], [1, litC]], 0, 0, 1, 0);
  const vshade = P.lin([[0, "#000", 0], [1, "#000", 0.28]]);
  let dL = "";
  let dC = "";
  let dR = "";
  let dS = ""; // silhouette-only details (pinnacles, needle)
  const tier = (y0: number, y1: number, w: number) => {
    const s = w * 0.28;
    dL += `M${X(-w / 2)} ${Y(y0)}V${Y(y1)}H${X(-w / 2 + s)}V${Y(y0)}Z`;
    dC += `M${X(-w / 2 + s)} ${Y(y0)}V${Y(y1)}H${X(w / 2 - s)}V${Y(y0)}Z`;
    dR += `M${X(w / 2 - s)} ${Y(y0)}V${Y(y1)}H${X(w / 2)}V${Y(y0)}Z`;
  };
  const spire = (x: number, y0: number, h: number, w: number) => {
    dS += `M${X(x - w / 2)} ${Y(y0)}V${Y(y0 + h * 0.35)}L${X(x)} ${Y(y0 + h)}L${X(x + w / 2)} ${Y(y0 + h * 0.35)}V${Y(y0)}Z`;
  };
  // tiers: [y0, y1, width]
  const T: [number, number, number][] = [
    [-8, 14, 25],
    [14, 15.6, 27],
    [15.6, 38, 16],
    [38, 39.6, 19],
    [39.6, 55, 13],
    [55, 56.4, 15.5],
    [56.4, 67, 10.5],
    [67, 68, 12],
    [68, 73.5, 8.4],
  ];
  T.forEach(([a, b, w]) => tier(a, b, w));
  // wings with buttress roofs
  for (const s of [-1, 1]) {
    dS += `M${X(s * 12.5)} ${Y(-8)}V${Y(8)}L${X(s * 17)} ${Y(12)}L${X(s * 22)} ${Y(8)}V${Y(-8)}Z`;
    // flying buttress arcs
    spire(s * 17, 12, 9, 1.8);
    spire(s * 12.8, 15.6, 13, 2.2);
    spire(s * 9.4, 38, 10, 1.9);
    spire(s * 7.4, 56.4, 7.5, 1.5);
    spire(s * 5.6, 68, 5, 1);
  }
  // onion dome, lantern, needle
  dS += `M${X(-4.4)} ${Y(73.5)}C${X(-5.4)} ${Y(77)} ${X(-3.4)} ${Y(79.5)} ${X(-1.2)} ${Y(81.5)}L${X(0)} ${Y(83)}L${X(1.2)} ${Y(81.5)}C${X(3.4)} ${Y(79.5)} ${X(5.4)} ${Y(77)} ${X(4.4)} ${Y(73.5)}Z`;
  dS += `M${X(-0.9)} ${Y(82)}V${Y(86.5)}H${X(0.9)}V${Y(82)}Z`;
  dS += `M${X(-0.55)} ${Y(86.5)}L${X(0)} ${Y(100)}L${X(0.55)} ${Y(86.5)}Z`;
  const domeG = P.lin(Ls > 0 ? [[0, litC], [0.45, midC], [1, shC]] : [[0, shC], [0.55, midC], [1, litC]], 0, 0, 1, 0);
  let s = "";
  if (o.glow) s += ell(cx, base - 62 * u, 26 * u, 34 * u, P.glow(o.glow), 0.55);
  s += path(dS, domeG) + path(dL, faceL) + path(dC, cen) + path(dR, faceR);
  // cornice shadows + vertical deepening
  let cs = "";
  for (const [a, , w] of T) cs += `M${X(-w / 2)} ${Y(a)}h${f(w * u)}v${f(-0.9 * u)}h${f(-w * u)}Z`;
  s += path(cs, "#000", 0.22);
  s += `<rect x="${X(-13)}" y="${Y(40)}" width="${f(26 * u)}" height="${f(48 * u)}" fill="${vshade}"/>`;
  // pilaster seams
  let seam = "";
  for (const [a, b, w] of [T[2], T[4], T[6]]) {
    const s2 = w * 0.28;
    seam += `M${X(-w / 2 + s2)} ${Y(a)}V${Y(b)}M${X(w / 2 - s2)} ${Y(a)}V${Y(b)}`;
  }
  s += `<path d="${seam}" stroke="#000" stroke-opacity=".18" stroke-width="${f(0.35 * u)}"/>`;
  // windows (arched)
  const arch = (x: number, y0: number, h: number, w: number) =>
    `M${X(x - w / 2)} ${Y(y0)}V${Y(y0 + h - w / 2)}A${f((w * u) / 2)} ${f((w * u) / 2)} 0 0 1 ${X(x + w / 2)} ${Y(y0 + h - w / 2)}V${Y(y0)}Z`;
  let wd = "";
  for (const k of [-1, 1]) wd += arch(k * 2.6, 18, 7, 1.3) + arch(k * 2.6, 28, 7, 1.3);
  wd += arch(0, 18, 8, 1.6) + arch(0, 28, 8, 1.6);
  for (const k of [-1, 1]) wd += arch(k * 2.3, 42, 9, 1.3);
  wd += arch(0, 42, 10, 1.6);
  let bw = "";
  for (const k of [-1, 0, 1]) bw += arch(k * 2.1, 58.5, 6.5, 1.4);
  bw += arch(-1.8, 69.2, 3, 0.9) + arch(1.8, 69.2, 3, 0.9);
  wd += arch(0, -2, 9, 5) + arch(-6.5, -2, 6.5, 2.6) + arch(6.5, -2, 6.5, 2.6);
  s += path(wd, o.win, (o.winOp ?? 0.85) * 0.75);
  s += path(bw, o.win, o.winOp ?? 1);
  // balustrade dots along galleries
  const bd: Pt[] = [];
  for (const [yy, w] of [
    [15.6, 27],
    [39.6, 19],
    [56.4, 15.5],
  ]) for (let k = -w / 2 + 0.8; k < w / 2; k += 1.3) bd.push([cx + k * u, base - (yy + 0.9) * u]);
  s += dots(bd, Math.max(1, 0.5 * u), o.rim ?? litC, 0.7);
  if (o.rim) {
    let rim = "";
    for (const [a, b, w] of [T[2], T[4], T[6], T[8]]) {
      const x = Ls > 0 ? -w / 2 : w / 2;
      rim += `M${X(x)} ${Y(a)}V${Y(b)}`;
    }
    s += `<path d="${rim}" stroke="${o.rim}" stroke-width="${f(Math.max(1, 0.35 * u))}" stroke-opacity=".9"/>`;
  }
  return s;
}

/** clustered circles (foliage crowns, clouds) */
type Blob = [number, number, number];
function blobs(r: Rng, cx: number, cy: number, rx: number, ry: number, n: number, rmin: number, rmax: number): Blob[] {
  const out: Blob[] = [];
  for (let k = 0; k < n; k++) {
    const a = r.r(0, Math.PI * 2);
    const d = Math.sqrt(r.n());
    out.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r.r(rmin, rmax) * (1 - d * 0.35)]);
  }
  return out;
}
const blobsD = (b: Blob[], sy = 1): string =>
  b.map(([x, y, rr]) => `M${q(x - rr)} ${q(y)}a${q(rr)} ${q(rr * sy)} 0 1 0 ${q(rr * 2)} 0a${q(rr)} ${q(rr * sy)} 0 1 0 ${q(-rr * 2)} 0`).join("");
/** highlight subset of blobs facing the light direction (lx,ly unit-ish) */
function blobLight(b: Blob[], cx: number, cy: number, rx: number, ry: number, lx: number, ly: number, thr: number, shrink: number): Blob[] {
  return b
    .filter(([x, y]) => ((x - cx) / rx) * lx + ((y - cy) / ry) * ly > thr)
    .map(([x, y, rr]): Blob => [x + lx * rr * 0.28, y + ly * rr * 0.28, rr * shrink]);
}
/** paint blobs as round-capped dots, bucketed by radius (very compact) */
function blobPaint(b: Blob[], c: string, op = 1, sy = 1, cy = 0): string {
  const m = new Map<number, Pt[]>();
  for (const [x, y, rr] of b) {
    const k = rr < 12 ? Math.max(1, Math.round(rr / 2) * 2) : Math.round(rr / 5) * 5;
    const a = m.get(k) ?? [];
    a.push([x, sy === 1 ? y : cy + (y - cy) / sy]);
    m.set(k, a);
  }
  let s = "";
  for (const [k, pts] of m) s += `<path d="${dotsD(pts)}" stroke-width="${k * 2}"/>`;
  const tr = sy === 1 ? "" : ` transform="matrix(1 0 0 ${f2(sy)} 0 ${f(cy * (1 - sy))})"`;
  return `<g fill="none"${c ? ` stroke="${c}"` : ""} stroke-linecap="round"${op < 1 ? ` opacity="${f2(op)}"` : ""}${tr}>${s}</g>`;
}
/** leafy mass: silhouette with a thin moonlit rim toward the light + subtle inner clumps. cs = [base, inner, rim] */
function foliage(P: Pic, r: Rng, cx: number, cy: number, rx: number, ry: number, n: number, rmin: number, rmax: number, lx: number, ly: number, cs: string[], sy = 1, rimW = 4): string {
  const b = blobs(r, cx, cy, rx, ry, n, rmin, rmax);
  const id = P.id("fo" + Math.round(cx) + "_" + Math.round(cy));
  P.def(`<g id="${id}">${blobPaint(b, "", 1, sy, cy)}</g>`);
  let s = "";
  if (cs[2]) s += `<use href="#${id}" stroke="${cs[2]}" x="${f(lx * rimW)}" y="${f(ly * rimW)}"/>`;
  s += `<use href="#${id}" stroke="${cs[0]}"/>`;
  if (cs[1]) {
    const sub: Blob[] = [];
    for (const [x, y, rr] of b) {
      const d = ((x - cx) / rx) * lx + ((y - cy) / ry) * ly;
      if (d < 0.25 + r.r(-0.2, 0.2)) continue;
      for (let j = 0; j < 2; j++) sub.push([x + lx * rr * 0.3 + r.r(-rr, rr) * 0.5, y + ly * rr * 0.3 + r.r(-rr, rr) * 0.5, rr * r.r(0.3, 0.55)]);
    }
    s += blobPaint(sub, cs[1], 1, sy, cy);
  }
  return s;
}
/** distant fir-forest silhouette as one sawtooth polygon */
function forestD(r: Rng, x0: number, x1: number, base: (x: number) => number, hmin: number, hmax: number, dens: (x: number) => number = () => 1): string {
  let d = `M${q(x0)} ${q(base(x0) + 40)}`;
  let x = x0;
  while (x < x1) {
    const k = dens(x);
    const h = r.r(hmin, hmax) * (0.5 + k * 0.5);
    const w = h * r.r(0.2, 0.3);
    const b = base(x);
    if (r.n() < k) d += `L${q(x - w)} ${q(b - h * 0.2)}L${q(x - w * 0.4)} ${q(b - h * 0.55)}L${q(x)} ${q(b - h)}L${q(x + w * 0.4)} ${q(b - h * 0.55)}L${q(x + w)} ${q(b - h * 0.2)}`;
    else d += `L${q(x)} ${q(b - r.r(0, 6))}`;
    x += w * r.r(0.9, 1.5);
  }
  return d + `L${q(x)} ${q(base(x) + 40)}Z`;
}
function glyphD(r: Rng, x: number, y: number, s: number): string {
  // a compact "syllable block" of 2–3 calligraphic strokes (jamo-like)
  let d = "";
  const k = r.i(2, 3);
  const h = s / 2;
  for (let j = 0; j < k; j++) {
    const v = r.n();
    // each stroke lives in a sub-cell of the block
    const cx = x + (j === 1 ? h * 0.35 : -h * 0.3) + r.r(-h, h) * 0.15;
    const cy = y + (j === 2 ? h * 0.4 : -h * 0.2) + r.r(-h, h) * 0.15;
    const L = s * r.r(0.4, 0.75);
    if (v < 0.18) {
      const rr = s * r.r(0.12, 0.2);
      d += `M${f(cx - rr)} ${f(cy)}a${f(rr)} ${f(rr)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-rr * 2)} 0`;
    } else if (v < 0.6) {
      const hz = r.n() < 0.5;
      const bend = r.r(-0.18, 0.18) * L;
      d += hz
        ? `M${f(cx - L / 2)} ${f(cy)}q${f(L / 2)} ${f(bend)} ${f(L)} ${f(r.r(-0.1, 0.1) * L)}`
        : `M${f(cx)} ${f(cy - L / 2)}q${f(bend)} ${f(L / 2)} ${f(r.r(-0.15, 0.15) * L)} ${f(L)}`;
      if (r.n() < 0.35) d += `l${f(r.r(-0.2, 0.2) * L)} ${f(-0.18 * L)}`;
    } else {
      // sweeping curve with a flick
      const a = r.r(0, Math.PI * 2);
      const dx = Math.cos(a) * L;
      const dy = Math.sin(a) * L;
      d += `M${f(cx - dx / 2)} ${f(cy - dy / 2)}q${f(dx / 2 - dy * 0.45)} ${f(dy / 2 + dx * 0.45)} ${f(dx)} ${f(dy)}l${f(-dx * 0.18)} ${f(-dy * 0.1 + L * 0.12)}`;
    }
  }
  if (r.n() < 0.3) d += `M${f(x + r.r(-h, h) * 0.8)} ${f(y - h * 1.05)}h0`;
  return d;
}

/* moonflower symbol (six petals, lily × magnolia) */
function moonflowerDef(P: Pic, tone: { hi: string; mid: string; edge: string; heart: string }): { top: string; side: string } {
  const pg = P.rad([[0, tone.heart], [0.25, tone.hi], [0.7, tone.mid], [1, tone.edge]], 0, 0, 44, true);
  const petal = (L: number, W: number) => `M0 0C${W} ${f(-L * 0.25)} ${f(W * 0.95)} ${f(-L * 0.72)} 0 ${-L}C${f(-W * 0.95)} ${f(-L * 0.72)} ${-W} ${f(-L * 0.25)} 0 0Z`;
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

/* 백색 정원 — moonlit imperial garden, the prologue oath place */
function sGarden(): string {
  const P = new Pic("garden");
  const r = new Rng(101);
  const fs = flareDef(P);
  const MX = 1010;
  const MY = 150;
  P.add(rect(P.lin([[0, "#050820"], [0.3, "#0e1644"], [0.52, "#27397e"], [0.62, "#4458a4"]])));
  P.add(ell(MX, MY, 820, 560, P.glow("#5d74d0"), 0.6));
  P.add(ell(MX, MY, 330, 300, P.glow("#c3d0ff"), 0.4));
  P.add(starField(P, r, { n: 140, box: [0, 0, 1600, 470], keep: (x, y) => Math.min(1, Math.hypot(x - MX, y - MY) / 420) * (1 - y / 560) }));
  P.add(ring(P, r, { a: [-160, 520], c: [640, -140], b: [1760, 260], w: 66, n: 440, glow: 0.8, fs, bright: 6 }));
  // moon
  P.add(ell(MX, MY, 110, 110, P.glow("#f0f4ff", true), 0.7));
  P.add(`<circle cx="${MX}" cy="${MY}" r="50" fill="${P.rad([[0, "#ffffff"], [0.65, "#f3f4ff"], [1, "#d3daf6"]], 0.4, 0.38, 0.62)}"/>`);
  P.add(ell(MX - 12, MY - 6, 26, 18, P.glow("#aeb8e4"), 0.35), ell(MX + 14, MY + 16, 18, 12, P.glow("#aeb8e4"), 0.3));
  // far treeline, cypresses, hazy
  P.add(foliage(P, r, 800, 492, 900, 16, 64, 14, 36, 0.3, -1, ["#2c3c84", "#34479a", "#5a70bc"], 0.8, 3));
  let cyp = "";
  for (const [x, h] of [
    [380, 150],
    [430, 118],
    [1180, 160],
    [1232, 120],
    [300, 96],
    [1300, 100],
  ] as Pt[])
    cyp += `M${x - 13} 500C${x - 16} ${500 - h * 0.6} ${x - 4} ${500 - h * 0.9} ${x} ${500 - h}C${x + 4} ${500 - h * 0.9} ${x + 16} ${500 - h * 0.6} ${x + 13} 500Z`;
  P.add(path(cyp, "#26357a"));
  P.add(ell(800, 505, 1000, 60, P.glow("#9fb2f4"), 0.6));

  // ── rotunda (defined once, reused for the reflection)
  const CX = 800;
  const BY = 548;
  const colG = P.lin([[0, "#27336e"], [0.4, "#7382c6"], [0.72, "#eaeefe"], [0.86, "#ffffff"], [1, "#a3afe2"]], 0, 0, 1, 0);
  const domeG = P.lin([[0, "#253070"], [0.35, "#6c7cc4"], [0.68, "#e4e9fd"], [0.82, "#ffffff"], [1, "#9aa6de"]], 0, 0, 1, 0);
  const capG = P.lin([[0, "#f4f6ff"], [1, "#7a88c8"]]);
  let rot = "";
  // inner dark + moon shaft through the oculus
  rot += path(`M${CX - 148} ${BY - 14}V${BY - 200}H${CX + 148}V${BY - 14}Z`, "#0a1034");
  rot += path(`M${CX - 16} ${BY - 205}L${CX - 70} ${BY - 20}H${CX + 70}L${CX + 16} ${BY - 205}Z`, P.lin([[0, "#dfe6ff", 0.55], [1, "#dfe6ff", 0.05]]));
  rot += ell(CX, BY - 26, 110, 20, P.glow("#e6ecff"), 0.7);
  let cols = "";
  for (const [x, w] of [
    [-140, 15],
    [-86, 20],
    [-30, 23],
    [30, 23],
    [86, 20],
    [140, 15],
  ] as Pt[]) {
    const h = 188 + (Math.abs(x) < 50 ? 14 : Math.abs(x) < 100 ? 7 : 0);
    cols += `<rect x="${CX + x - w / 2}" y="${BY - 202}" width="${w}" height="${h}" fill="${colG}"/>`;
    cols += `<rect x="${CX + x - w / 2 - 4}" y="${BY - 206}" width="${w + 8}" height="7" fill="${capG}"/>`;
    cols += `<rect x="${CX + x - w / 2 - 3}" y="${BY - 18 + (Math.abs(x) < 50 ? 14 : Math.abs(x) < 100 ? 7 : 0) - 4}" width="${w + 6}" height="7" fill="#5a68ac"/>`;
  }
  rot += cols;
  rot += path(`M${CX - 168} ${BY - 204}Q${CX} ${BY - 244} ${CX + 168} ${BY - 204}V${BY - 226}Q${CX} ${BY - 266} ${CX - 168} ${BY - 226}Z`, domeG);
  rot += path(`M${CX - 168} ${BY - 204}Q${CX} ${BY - 244} ${CX + 168} ${BY - 204}V${BY - 208}Q${CX} ${BY - 248} ${CX - 168} ${BY - 208}Z`, "#1a2260", 0.5);
  rot += path(
    `M${CX - 152} ${BY - 236}C${CX - 152} ${BY - 322} ${CX - 64} ${BY - 366} ${CX} ${BY - 368}C${CX + 64} ${BY - 366} ${CX + 152} ${BY - 322} ${CX + 152} ${BY - 236}Q${CX} ${BY - 272} ${CX - 152} ${BY - 236}Z`,
    domeG,
  );
  let ribs = "";
  for (let k = -3; k <= 3; k++) ribs += `M${CX + k * 44} ${BY - 250 + Math.abs(k) * 3}Q${CX + k * 32} ${BY - 330} ${CX} ${BY - 366}`;
  rot += `<path d="${ribs}" fill="none" stroke="#3a4890" stroke-width="2" stroke-opacity=".35"/>`;
  rot += path(`M${CX - 5} ${BY - 366}V${BY - 392}L${CX} ${BY - 412}L${CX + 5} ${BY - 392}V${BY - 366}Z`, "#e8edff");
  // steps
  rot += path(`M${CX - 186} ${BY - 8}Q${CX} ${BY - 44} ${CX + 186} ${BY - 8}L${CX + 204} ${BY + 12}Q${CX} ${BY - 26} ${CX - 204} ${BY + 12}Z`, P.lin([[0, "#e4e9ff"], [1, "#56649f"]]));
  P.def(`<g id="${P.id("rot")}">${rot}</g>`);
  P.add(ell(CX, BY - 180, 250, 230, P.glow("#c9d4ff"), 0.4));
  P.add(`<use href="#${P.id("rot")}"/>`);
  P.add(ell(CX, BY - 412, 30, 30, P.glow("#ffffff", true), 0.85));
  // vines & flowers on the rotunda
  const mf = moonflowerDef(P, { hi: "#ffffff", mid: "#e9edfa", edge: "#8796d4", heart: "#fffbe8" });
  let vine = "";
  for (let k = 0; k < 10; k++) {
    const x = CX - 160 + k * 35.5 + r.r(-5, 5);
    const y0 = BY - 216 - Math.cos(((x - CX) / 160) * 1.3) * 30;
    vine += `M${q(x)} ${q(y0)}c${q(r.r(-10, 10))} 26 ${q(r.r(-12, 12))} 50 ${q(r.r(-6, 6))} ${q(r.r(50, 120))}`;
  }
  vine += `M${CX - 168} ${BY - 214}Q${CX - 84} ${BY - 170} ${CX} ${BY - 200}Q${CX + 84} ${BY - 170} ${CX + 168} ${BY - 214}`;
  P.add(`<path d="${vine}" fill="none" stroke="#15294a" stroke-width="2.4"/>`);
  for (let k = 0; k < 9; k++) P.add(use(r.n() < 0.55 ? mf.top : mf.side, CX - 165 + r.r(0, 330), BY - 226 + r.r(0, 110), r.r(0.17, 0.28), r.r(-30, 30), 0.72));

  // ── framing trees (dappled moonlight)
  const tree = (cx: number, cy: number, rx: number, ry: number, lx: number, tx: number) => {
    const trunk = `M${tx - 22} 720C${tx - 16} 600 ${tx - 4} 480 ${tx - 30} ${cy + 40}L${tx + 4} ${cy + 50}C${tx + 14} 480 ${tx + 26} 600 ${tx + 34} 720Z`;
    const pts: Pt[] = [];
    for (let j = 0; j < 60; j++) {
      const a = r.r(0, 6.28);
      const d = Math.sqrt(r.n());
      const x = cx + Math.cos(a) * rx * d;
      const y = cy + Math.sin(a) * ry * d;
      if ((x - cx) / rx * lx - (y - cy) / ry * 0.7 > 0.35) pts.push([x, y]);
    }
    return path(trunk, "#080c26") + foliage(P, r, cx, cy, rx, ry, 70, 24, 70, lx, -0.7, ["#0b1134", "#121b46", "#5a6cb8"], 1, 5) + dots(pts, 2.2, "#b4c2f2", 0.6);
  };
  P.add(tree(150, 190, 320, 190, 0.75, 170), tree(1470, 170, 290, 200, 0.2, 1450));
  // weeping strands of moonflowers from the left tree
  let wv = "";
  const wf: string[] = [];
  for (let k = 0; k < 7; k++) {
    const x = 250 + k * 44 + r.r(-8, 8);
    const y0 = 250 + r.r(-30, 40);
    const len = r.r(90, 200);
    wv += `M${q(x)} ${q(y0)}q${q(r.r(-8, 8))} ${q(len / 2)} ${q(r.r(-4, 4))} ${q(len)}`;
    for (let j = 0; j < 2; j++) wf.push(use(mf.side, x + r.r(-4, 4), y0 + len * (0.4 + j * 0.3), r.r(0.16, 0.24), 180 + r.r(-20, 20)));
  }
  P.add(`<path d="${wv}" fill="none" stroke="#1d2e5c" stroke-width="1.6"/>`, wf.join(""));

  // ── hedged flower beds (mid)
  P.add(path(`M-40 590H1640V760H-40Z`, "#0b1236"));
  for (const hx of [290, 1310]) P.add(foliage(P, r, hx, 578, 340, 20, 36, 18, 40, 0.2, -1, ["#101946", "#172252", "#4a5ca8"], 0.75, 3));
  P.add(ell(290, 560, 380, 60, P.glow("#dbe4ff"), 0.4), ell(1310, 560, 380, 60, P.glow("#dbe4ff"), 0.4));
  const tiny: Pt[] = [];
  const tiny2: Pt[] = [];
  for (let k = 0; k < 200; k++) {
    const x = r.n() < 0.5 ? r.r(-20, 610) : r.r(990, 1620);
    const y = r.r(548, 600);
    (r.n() < 0.6 ? tiny : tiny2).push([x, y]);
  }
  P.add(dots(tiny, 3.2, "#eef2ff", 0.8), dots(tiny2, 5, "#ffffff", 0.9));
  const fl: [number, number, number][] = [];
  for (let k = 0; k < 22; k++) {
    const x = k % 2 ? r.r(-20, 600) : r.r(1000, 1620);
    const y = r.r(556, 650);
    fl.push([x, y, 0.3 + ((y - 556) / 94) * 0.32]);
  }
  fl.sort((a, b) => a[1] - b[1]);
  P.add(fl.map(([x, y, s]) => use(r.n() < 0.7 ? mf.top : mf.side, x, y, s, r.r(-25, 25), 0.62)).join(""));

  // ── reflecting pool with fountain head
  const PY = 664;
  P.add(path(`M600 ${PY - 8}H1000L1290 900H310Z`, P.lin([[0, "#c8d2f6"], [0.15, "#5c6bb0"], [1, "#1c2456"]])));
  const water = `M618 ${PY}H982L1250 900H350Z`;
  P.def(`<clipPath id="${P.id("pc")}"><path d="${water}"/></clipPath>`);
  P.add(path(water, P.lin([[0, "#34478c"], [0.25, "#16204e"], [1, "#080c26"]])));
  P.add(`<g clip-path="${P.ref("pc")}"><use href="#${P.id("rot")}" transform="translate(0 ${BY * 2 + 6}) scale(1 -1)" opacity=".32"/>`);
  // moon streak shimmer
  const streak = (y0: number, n: number) => {
    let s = "";
    for (let k = 0; k < n; k++) {
      const y = y0 + k * 22 + r.r(-4, 4);
      const w = r.r(6, 40) + (y - PY) * 0.1;
      s += `M${q(935 + (y - PY) * 0.1 - w / 2 + r.r(-30, 30))} ${q(y)}h${q(w)}`;
    }
    return s;
  };
  P.add(ell(940, 780, 60, 130, P.glow("#c8d4ff"), 0.3));
  P.add(`<g ${P.tw(3.1, 0, 0.35)}><path d="${streak(PY + 6, 11)}" stroke="#eef2ff" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".45"/></g>`);
  P.add(`<g ${P.tw(4.3, 1.9, 0.3)}><path d="${streak(PY + 16, 10)}" stroke="#c8d4ff" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".4"/></g>`);
  P.add(`</g>`);
  // fountain
  const FY = PY + 4;
  P.add(ell(CX, FY - 60, 150, 110, P.glow("#cdd8ff"), 0.45));
  P.add(path(`M${CX - 12} ${FY}L${CX - 7} ${FY - 72}H${CX + 7}L${CX + 12} ${FY}Z`, colG));
  P.add(path(`M${CX - 58} ${FY - 80}Q${CX} ${FY - 90} ${CX + 58} ${FY - 80}Q${CX + 40} ${FY - 60} ${CX} ${FY - 58}Q${CX - 40} ${FY - 60} ${CX - 58} ${FY - 80}Z`, P.lin([[0, "#f6f8ff"], [1, "#6a7ac2"]])));
  P.add(path(`M${CX - 4} ${FY - 82}L${CX - 2} ${FY - 112}H${CX + 2}L${CX + 4} ${FY - 82}Z`, "#dfe6ff"));
  const veil = `M${CX - 56} ${FY - 80}C${CX - 72} ${FY - 60} ${CX - 76} ${FY - 30} ${CX - 80} ${FY}M${CX + 56} ${FY - 80}C${CX + 72} ${FY - 60} ${CX + 76} ${FY - 30} ${CX + 80} ${FY}M${CX} ${FY - 112}C${CX - 18} ${FY - 128} ${CX - 44} ${FY - 108} ${CX - 52} ${FY - 82}M${CX} ${FY - 112}C${CX + 18} ${FY - 128} ${CX + 44} ${FY - 108} ${CX + 52} ${FY - 82}`;
  P.add(`<path d="${veil}" fill="none" stroke="#e8eeff" stroke-width="3.5" stroke-opacity=".3"/>`);
  P.add(`<g ${P.tw(1.8, 0, 0.35)}><path d="${veil}" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="5 11" stroke-opacity=".85"/></g>`);
  P.add(ell(CX, FY - 112, 20, 20, P.glow("#ffffff", true), 0.8));
  P.add(`<g ${P.tw(2.6, 1, 0.4)}>${ell(CX, FY + 4, 90, 7, P.glow("#ffffff"), 0.6)}</g>`);

  // ── foreground flower thickets
  P.add(foliage(P, r, 60, 810, 330, 170, 40, 40, 86, 0.5, -0.9, ["#070b24", "#0c1236", "#3c4c98"], 1, 4), foliage(P, r, 1560, 810, 330, 170, 40, 40, 86, -0.3, -0.9, ["#070b24", "#0c1236", "#3c4c98"], 1, 4));
  const ff: [number, number, number][] = [];
  for (let k = 0; k < 16; k++) ff.push([k % 2 ? r.r(-30, 360) : r.r(1240, 1630), r.r(640, 870), r.r(0.8, 1.4)]);
  ff.sort((a, b) => a[1] - b[1]);
  P.add(ff.map(([x, y, s]) => use(r.n() < 0.75 ? mf.top : mf.side, x, y, s, r.r(-40, 40), 0.62)).join(""));
  for (let k = 0; k < 5; k++) P.add(flare(P, fs, r.n() < 0.5 ? r.r(100, 540) : r.r(1060, 1500), r.r(420, 640), r.r(0.25, 0.45), P.tw(r.r(2.5, 5), r.r(0, 4), 0.1)));
  // mist + grade
  P.add(ell(800, 600, 1100, 70, P.glow("#b4c2f0"), 0.3));
  P.add(bottomShade(P, "#04061a", 0.5, 0.66));
  P.add(vignette(P, "#03051a", 0.65, 0.5));
  return P.svg();
}

/* shared: Lumenheim — terraced hill city with the Archive tower */
type CityLayer = {
  y: number;
  hill: number;
  h: [number, number];
  w: [number, number];
  c: string;
  lit?: string;
  litOp?: number;
  win?: number;
  winC?: string;
  winOp?: number;
  winS?: number;
  mist?: string;
  mistOp?: number;
  spire?: number;
  turret?: number;
};
function capital(
  P: Pic,
  r: Rng,
  o: {
    cx?: number;
    light?: number;
    spread?: number;
    layers: CityLayer[];
    tower?: { at: number; base: number; top: number; lit: string; mid: string; shade: string; win: string; rim?: string; glow?: string; winOp?: number };
  },
): string {
  let s = "";
  const cx = o.cx ?? 800;
  const light = o.light ?? 1;
  const spread = o.spread ?? 520;
  o.layers.forEach((L, k) => {
    if (o.tower && o.tower.at === k) {
      const T = o.tower;
      s += archive(P, cx, T.base, T.top, { ...T, left: light < 0 });
      const H = T.base - T.top;
      s += ell(cx, T.base - H * 0.12, H * 0.45, H * 0.1, P.glow(o.layers[k].mist ?? T.mid), 0.7);
    }
    const c = cityD(r, -60, 1660, (x) => L.y - L.hill * Math.exp(-(((x - cx) / spread) ** 2)) + Math.sin(x / 110 + k * 2) * 5 + Math.sin(x / 37 + k) * 3, {
      h: L.h,
      w: L.w,
      spire: L.spire ?? 0.05,
      turret: L.turret ?? 0.1,
      dome: 0.03,
      win: L.win,
      winMax: 4,
      light,
    });
    s += path(c.d, L.c);
    if (L.lit) s += path(c.lit, L.lit, L.litOp ?? 0.5);
    if (L.win && c.wins.length) {
      const wc = L.winC ?? "#f6d48f";
      const ws = L.winS ?? 1;
      const big = c.wins.filter(() => r.n() < 0.25);
      const small = c.wins.filter((w) => !big.includes(w));
      s += dots(small, 2.2 * ws, wc, (L.winOp ?? 0.8) * 0.75) + dots(big, 3.1 * ws, wc, L.winOp ?? 0.8);
      // warm bloom over the densest window clusters
      for (let j = 0; j < (ws >= 1 ? 4 : 0); j++) {
        const w = c.wins[Math.floor(r.n() * c.wins.length)];
        s += ell(w[0], w[1], 70 * ws, 30 * ws, P.glow(wc), 0.1);
      }
    }
    if (L.mist) s += rect(P.lin([[0, L.mist, 0], [0.55, L.mist, L.mistOp ?? 0.4], [1, L.mist, 0]]), 1, 0, L.y - 20, 1600, 90);
  });
  return s;
}

/* 타이틀 — key visual */
function sTitle(): string {
  const P = new Pic("title");
  const r = new Rng(2024);
  const fs = flareDef(P);
  P.add(rect(P.lin([[0, "#040717"], [0.3, "#0a1234"], [0.55, "#1c2866"], [0.74, "#3a4b98"]])));
  // off-screen moon, upper-left: a calm luminous field for the logo
  P.add(ell(260, 40, 900, 620, P.glow("#34459a"), 0.75));
  P.add(ell(200, 10, 420, 320, P.glow("#8a9ce0"), 0.35));
  // ring glow wash
  P.add(ell(1250, 260, 700, 460, P.glow("#3c4fb0"), 0.55));
  P.add(starField(P, r, { n: 215, box: [0, 0, 1600, 580], keep: (x, y) => (1 - y / 720) * (x < 820 && y < 380 ? 0.35 : 1) }));
  P.add(ring(P, r, { a: [1760, 700], c: [1230, 30], b: [520, -150], w: 100, n: 1050, glow: 1.35, fs, bright: 8 }));
  // city glow on the horizon
  P.add(ell(950, 640, 900, 200, P.glow("#7b8ee0"), 0.5));
  P.add(ell(950, 330, 130, 380, P.glow("#8ea4ff"), 0.35));
  const mistC = "#5a6cc0";
  P.add(
    capital(P, r, {
      cx: 950,
      light: -1,
      spread: 560,
      layers: [
        { y: 612, hill: 80, h: [8, 26], w: [26, 50], c: "#3a4a94", lit: "#7084cc", litOp: 0.5, mist: mistC, mistOp: 0.5, win: 0.05, winOp: 0.5, winS: 0.7 },
        { y: 672, hill: 110, h: [16, 46], w: [30, 60], c: "#222d6c", lit: "#6275c4", litOp: 0.45, win: 0.2, winOp: 0.85, winS: 0.9, mist: "#4a5cb0", mistOp: 0.4 },
        { y: 755, hill: 80, h: [26, 70], w: [44, 86], spire: 0.025, turret: 0.04, c: "#111842", lit: "#40519c", litOp: 0.45, win: 0.16, winOp: 0.9, mist: "#2c3a80", mistOp: 0.3 },
        { y: 865, hill: 30, h: [34, 90], w: [80, 140], spire: 0, turret: 0, c: "#070b24", win: 0.05, winOp: 0.8, winS: 1.3 },
      ],
      tower: { at: 1, base: 640, top: 84, lit: "#f7f8ff", mid: "#c3ccef", shade: "#5967ad", win: "#a8c8ff", rim: "#ffffff", glow: "#a9baff" },
    }),
  );
  // falling star — head glows over the tower's shoulder
  const mg = meteorDef(P, "#fff7e8");
  const HX = 1128;
  const HY = 318;
  P.add(ell(HX, HY, 170, 170, P.glow("#ffeccc"), 0.4));
  P.add(meteor(P, P.lin([[0, "#aac4ff", 0.5], [1, "#aac4ff", 0]], 0, 0, 1, 0), HX, HY, 380, -33, 22, 0.55));
  P.add(meteor(P, mg, HX, HY, 560, -33, 5.5, 1, P.glow("#fff6e6", true)));
  P.add(flare(P, fs, HX, HY, 2.2, P.tw(2.6, 0, 0.7)));
  // foreground moonflowers
  const mf = moonflowerDef(P, { hi: "#ffffff", mid: "#e2e7f8", edge: "#7282c6", heart: "#fffbe8" });
  P.add(foliage(P, r, 90, 810, 270, 140, 34, 36, 76, -0.6, -0.8, ["#060a22", "#0c1336", "#4a5cac"], 1, 4));
  P.add(foliage(P, r, 1530, 800, 270, 150, 34, 36, 76, -0.6, -0.8, ["#060a22", "#0c1336", "#4a5cac"], 1, 4));
  const fl: [number, number, number][] = [];
  for (let k = 0; k < 18; k++) {
    const left = k % 2 === 0;
    fl.push([left ? r.r(-20, 330) : r.r(1290, 1620), r.r(680, 880), r.r(0.7, 1.3)]);
  }
  fl.sort((a, b) => a[1] - b[1]);
  P.add(fl.map(([x, y, s]) => use(r.n() < 0.72 ? mf.top : mf.side, x, y, s, r.r(-40, 40), 0.64)).join(""));
  const pd = "M0 0C6-4 16-4 22 0C16 4 6 4 0 0Z";
  let pet = "";
  for (let k = 0; k < 12; k++) pet += `<path d="${pd}" transform="translate(${q(r.pick([r.r(60, 480), r.r(1120, 1540)]))} ${q(r.r(480, 720))}) rotate(${q(r.r(0, 360))}) scale(${f2(r.r(0.5, 1))})"/>`;
  P.add(`<g fill="#eef1ff" opacity=".75">${pet}</g>`);
  P.add(bottomShade(P, "#03051a", 0.5, 0.66));
  P.add(vignette(P, "#02041a", 0.6, 0.52));
  return P.svg();
}

/* 별지는 밤 */
function sStarfall(): string {
  const P = new Pic("starfall");
  const r = new Rng(77);
  const fs = flareDef(P, "#dcd8ff");
  P.add(rect(P.lin([[0, "#060518"], [0.3, "#16134a"], [0.56, "#35297a"], [0.72, "#5a4596"]])));
  P.add(ell(820, 330, 1100, 540, P.glow("#5a50c8"), 0.6));
  P.add(starField(P, r, { n: 360, box: [0, 0, 1600, 600] }));
  P.add(ring(P, r, { a: [-220, 640], c: [640, -260], b: [1820, 150], w: 130, n: 1700, glow: 1.7, fs, bright: 10, tone: ["#6a58e0", "#b9b0ff", "#ffffff"] }));
  P.add(ell(700, 210, 520, 200, P.glow("#e8e4ff"), 0.22));
  // meteors streaming from a radiant high on the left
  const RX = 250;
  const RY = -260;
  const mg = meteorDef(P);
  const hg = P.glow("#ffffff", true);
  for (let k = 0; k < 28; k++) {
    const x = r.r(120, 1560);
    const y = r.r(30, 540);
    const ang = (Math.atan2(RY - y, RX - x) * 180) / Math.PI;
    const len = r.r(80, 300) * (k < 6 ? 1.5 : 1);
    P.add(meteor(P, mg, x, y, len, ang, r.r(1.4, 3.6), r.r(0.4, 1), k < 9 ? hg : ""));
  }
  P.add(ell(800, 640, 900, 180, P.glow("#8a7ae0"), 0.5));
  P.add(
    capital(P, r, {
      light: -1,
      layers: [
        { y: 668, hill: 70, h: [8, 26], w: [22, 44], c: "#342c7a", lit: "#6d60c0", litOp: 0.5, mist: "#5244a0", mistOp: 0.45 },
        { y: 745, hill: 90, h: [16, 46], w: [30, 60], c: "#1e1850", lit: "#5a4eb0", litOp: 0.45, win: 0.12, winOp: 0.8, mist: "#3a2e80", mistOp: 0.3 },
        { y: 840, hill: 40, h: [30, 80], w: [50, 100], spire: 0.02, turret: 0.04, c: "#0a0822", lit: "#302a70", litOp: 0.45, win: 0.08, winOp: 0.85 },
      ],
      tower: { at: 1, base: 700, top: 290, lit: "#efedff", mid: "#b2acec", shade: "#463e96", win: "#aac4ff", rim: "#ffffff", glow: "#9f94ff" },
    }),
  );
  P.add(bottomShade(P, "#03031a", 0.6, 0.62));
  P.add(vignette(P, "#02021a", 0.55, 0.52));
  return P.svg();
}

/* 새벽 */
function sDawn(): string {
  const P = new Pic("dawn");
  const r = new Rng(505);
  P.add(rect(P.lin([[0, "#1c2360"], [0.25, "#454c98"], [0.44, "#9c78a8"], [0.56, "#e39e98"], [0.66, "#f5c98c"], [0.74, "#fde6b6"]])));
  P.add(ell(800, 650, 1150, 460, P.glow("#ffcf94"), 0.75));
  P.add(ell(800, 650, 460, 240, P.glow("#fff6e0", true), 0.95));
  P.add(starField(P, r, { n: 150, box: [0, 0, 1600, 320], keep: (_x, y) => 1 - y / 320, op: 0.6, tw: 0.35 }));
  P.add(ring(P, r, { a: [-200, 380], c: [760, -80], b: [1800, 260], w: 80, n: 600, glow: 0.4, tone: ["#b8a0d8", "#f0d8f0", "#ffffff"], lane: false }));
  // soft rays (blurred, static) + gentle pulse overlay
  const rb = P.blur(18, "ry");
  let rays = "";
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI / 2 + (k - 5) * 0.19 + r.r(-0.05, 0.05);
    const w = r.r(0.025, 0.06);
    rays += `M800 650L${q(800 + Math.cos(a - w) * 1000)} ${q(650 + Math.sin(a - w) * 1000)}L${q(800 + Math.cos(a + w) * 1000)} ${q(650 + Math.sin(a + w) * 1000)}Z`;
  }
  P.add(`<g filter="${rb}">${path(rays, P.rad([[0, "#fff2d0", 0.5], [0.6, "#fff2d0", 0.12], [1, "#fff2d0", 0]], 800, 650, 800, true))}</g>`);
  // cloud banks: lavender tops, gold undersides lit from below
  const bank = (cx: number, cy: number, rx: number, ry: number, n: number, rmax: number) => {
    return `<g opacity=".85">${foliage(P, r, cx, cy, rx, ry, n, rmax * 0.4, rmax, 0, 1, ["#8e6e9e", "#9a76a4", "#ffd9a0"], 0.3, 3)}</g>`;
  };
  P.add(bank(250, 430, 420, 20, 34, 56), bank(1320, 400, 440, 22, 36, 60), bank(760, 330, 300, 14, 20, 42), bank(1480, 520, 260, 12, 16, 40), bank(90, 540, 260, 10, 16, 36));
  P.add(`<g ${P.pulse(10, 0)}>${ell(800, 600, 700, 200, P.glow("#fff0c8"), 0.3)}</g>`);
  P.add(
    capital(P, r, {
      layers: [
        { y: 650, hill: 60, h: [8, 26], w: [22, 44], c: "#bb8aa0", lit: "#f7c4a0", litOp: 0.45, mist: "#f4c4a8", mistOp: 0.55 },
        { y: 728, hill: 90, h: [16, 46], w: [30, 60], c: "#7a5282", lit: "#e8a890", litOp: 0.4, win: 0.05, winOp: 0.6, mist: "#d99aa0", mistOp: 0.35 },
        { y: 830, hill: 40, h: [30, 80], w: [50, 100], spire: 0.02, turret: 0.04, c: "#33234e", lit: "#8a5a78", litOp: 0.45, win: 0.04, winOp: 0.7 },
      ],
      light: 1,
      tower: { at: 1, base: 690, top: 236, lit: "#ffe6c4", mid: "#c792a0", shade: "#56406e", win: "#fff2d0", rim: "#fff4dc", glow: "#ffe6b8" },
    }),
  );
  P.add(bottomShade(P, "#1c1030", 0.55, 0.64));
  P.add(vignette(P, "#2a1838", 0.4, 0.55));
  return P.svg();
}

/* candle: wax + animated flame + warm bloom */
function candle(P: Pic, x: number, y: number, h: number, s = 1, delay = 0): string {
  const wax = P.lin([[0, "#8a6a4a"], [0.35, "#f4e6c8"], [0.7, "#e2cfa8"], [1, "#6a4c32"]], 0, 0, 1, 0);
  const fl = P.lin([[0, "#fff8e0"], [0.45, "#f6d48f"], [1, "#e5a654", 0]], 0, 1, 0, 0);
  const w = 9 * s;
  return (
    ell(x, y - h - 10 * s, 90 * s, 90 * s, P.glow("#f6c070"), 0.35) +
    `<rect x="${f(x - w / 2)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="${wax}"/>` +
    path(`M${f(x - w / 2)} ${f(y - h)}q${f(w / 2)} ${f(3 * s)} ${f(w)} 0v${f(6 * s)}q${f(-w / 2)} ${f(2 * s)} ${f(-w)} 0Z`, "#fff4dc", 0.5) +
    `<g ${P.flick(r2(1.3, delay), delay)}><path d="M${f(x)} ${f(y - h - 22 * s)}C${f(x + 5 * s)} ${f(y - h - 12 * s)} ${f(x + 5 * s)} ${f(y - h - 3 * s)} ${f(x)} ${f(y - h - 1)}C${f(x - 5 * s)} ${f(y - h - 3 * s)} ${f(x - 5 * s)} ${f(y - h - 12 * s)} ${f(x)} ${f(y - h - 22 * s)}Z" fill="${fl}"/>` +
    ell(x, y - h - 9 * s, 22 * s, 26 * s, P.glow("#ffe2a0", true), 0.5) +
    `</g>`
  );
}
const r2 = (a: number, d: number): number => a + ((d * 7) % 5) * 0.13;

/* 옛 천문대 — Lucien's hidden study */
function sObservatory(): string {
  const P = new Pic("observatory");
  const r = new Rng(303);
  const fs = flareDef(P);
  P.add(rect(P.lin([[0, "#0a0e28"], [0.5, "#121838"], [1, "#07091a"]])));
  // dome shell
  const CY = 400;
  P.add(path(`M-60 ${CY}C-60 60 300 -120 800 -130C1300 -120 1660 60 1660 ${CY}Z`, P.rad([[0, "#232a58"], [0.6, "#141a40"], [1, "#0a0e26"]], 800, 120, 900, true)));
  // dome panels + ribs
  let ribs = "";
  for (let k = -7; k <= 7; k++) {
    const x = 800 + k * 118;
    ribs += `M${q(x)} ${CY}Q${q(800 + k * 118 * 1.08)} ${q(60 - Math.abs(k) * 6)} 800 -150`;
  }
  P.add(`<path d="${ribs}" fill="none" stroke="#0a0c22" stroke-width="16" stroke-opacity=".7"/><path d="${ribs}" fill="none" stroke="#6a5870" stroke-width="2" stroke-opacity=".3" transform="translate(-4 0)"/>`);
  P.add(ell(800, 180, 420, 300, P.glow("#8a9ce0"), 0.25));
  let rings = "";
  for (const yy of [260, 150]) rings += `M-60 ${yy + 60}Q800 ${yy - 230} 1660 ${yy + 60}`;
  P.add(`<path d="${rings}" fill="none" stroke="#0a0c22" stroke-width="9" stroke-opacity=".6"/>`);
  // slit showing the night + ring
  const slit = `M722 ${CY + 4}L752 -10H848L878 ${CY + 4}Z`;
  P.def(`<clipPath id="${P.id("sl")}"><path d="${slit}"/></clipPath>`);
  P.add(path(slit, P.lin([[0, "#050818"], [0.6, "#101a4a"], [1, "#24347a"]])));
  P.add(`<g clip-path="${P.ref("sl")}">`);
  P.add(starField(P, r, { n: 70, box: [720, 0, 880, 400], tw: 0.3 }));
  P.add(ring(P, r, { a: [560, 420], c: [800, 180], b: [1040, -40], w: 60, n: 240, glow: 1.3, fs, bright: 3, lane: false }));
  P.add(`</g>`);
  P.add(`<path d="M722 ${CY + 4}L752 -10M878 ${CY + 4}L848 -10" stroke="#c89a58" stroke-width="5"/><path d="M718 ${CY + 4}L748 -10M882 ${CY + 4}L852 -10" stroke="#3a2a22" stroke-width="4"/>`);
  // cornice
  P.add(path(`M-60 ${CY - 8}Q800 ${CY - 60} 1660 ${CY - 8}V${CY + 22}Q800 ${CY - 30} -60 ${CY + 22}Z`, P.lin([[0, "#a07848"], [0.3, "#4a3326"], [1, "#1e140e"]])));
  // walls
  P.add(path(`M-60 ${CY + 20}Q800 ${CY - 30} 1660 ${CY + 20}V900H-60Z`, P.lin([[0, "#1a1a36"], [1, "#0b0c1e"]])));
  // bookshelves left/right: books as thick strokes
  const books = (x0: number, x1: number, rows: number[]) => {
    const cols = ["#4a2f2a", "#2a3456", "#5a4630", "#233044", "#3e2a44", "#6a5230"];
    const by: Record<string, string[]> = {};
    for (const y of rows) {
      let x = x0;
      while (x < x1) {
        const w = r.r(7, 14);
        const h = r.r(34, 50);
        const c = r.pick(cols);
        (by[c] ??= []).push(`M${q(x + w / 2)} ${q(y)}v${q(-h)}`);
        x += w + r.r(0.5, 2);
        if (r.n() < 0.05) x += r.r(10, 30);
      }
    }
    let s = "";
    for (const c of Object.keys(by)) s += `<path d="${by[c].join("")}" stroke="${c}" stroke-width="10"/>`;
    return s;
  };
  const shelfRows = [470, 540, 610, 680];
  for (const [x0, x1] of [
    [-40, 380],
    [1220, 1640],
  ]) {
    P.add(path(`M${x0 - 10} ${CY + 30}H${x1 + 10}V760H${x0 - 10}Z`, "#140e10"));
    P.add(books(x0, x1, shelfRows));
    let sh = "";
    for (const y of shelfRows) sh += `M${x0 - 10} ${y}h${x1 - x0 + 20}v8h${-(x1 - x0 + 20)}Z`;
    P.add(path(sh, "#5a3a24"), path(sh.replace(/v8/g, "v2").replace(/v-?\d+Z/g, "Z"), "#b08050", 0.5));
    P.add(`<rect x="${x0 - 10}" y="${CY + 30}" width="${x1 - x0 + 20}" height="330" fill="${P.lin(x0 < 0 ? [[0, "#000", 0.6], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", 0.6]], 0, 0, 1, 0)}"/>`);
  }
  // star charts pinned on the wall
  const chart = (x: number, y: number, w: number, h: number, rot: number, warm: number) => {
    const pg = P.lin([[0, "#e8dcc0"], [1, "#a8946c"]], 0, 0, 1, 1);
    let ink = "";
    const cx = w / 2;
    const cy = h / 2;
    const rr = Math.min(w, h) * 0.36;
    ink += `M${f(cx - rr)} ${f(cy)}a${f(rr)} ${f(rr)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-rr * 2)} 0`;
    ink += `M${f(cx - rr * 0.6)} ${f(cy)}a${f(rr * 0.6)} ${f(rr * 0.6)} 0 1 0 ${f(rr * 1.2)} 0a${f(rr * 0.6)} ${f(rr * 0.6)} 0 1 0 ${f(-rr * 1.2)} 0`;
    ink += `M${f(cx)} ${f(cy - rr)}V${f(cy + rr)}M${f(cx - rr)} ${f(cy)}H${f(cx + rr)}`;
    const st: Pt[] = [];
    let con = "";
    for (let k = 0; k < 7; k++) {
      const p: Pt = [cx + r.r(-rr, rr) * 0.8, cy + r.r(-rr, rr) * 0.8];
      st.push(p);
      con += (k ? "L" : "M") + pt(p);
    }
    return (
      `<g transform="translate(${q(x)} ${q(y)}) rotate(${f(rot)})" opacity="${f2(warm)}">` +
      `<rect x="3" y="4" width="${q(w)}" height="${q(h)}" fill="#000" opacity=".35"/><rect width="${q(w)}" height="${q(h)}" fill="${pg}"/>` +
      `<path d="${ink}" fill="none" stroke="#5a4630" stroke-width="1.2" stroke-opacity=".7"/><path d="${con}" fill="none" stroke="#3a5a9a" stroke-width="1" stroke-opacity=".8"/>${dots(st, 3, "#2a4a8a", 0.9)}` +
      `<circle cx="${q(w / 2)}" cy="5" r="2.5" fill="#c89a58"/></g>`
    );
  };
  P.add(chart(420, 440, 110, 140, -6, 0.75), chart(545, 470, 90, 110, 4, 0.8), chart(470, 600, 120, 90, 2, 0.7));
  P.add(chart(1000, 450, 100, 130, 5, 0.7), chart(1110, 430, 90, 120, -4, 0.65), chart(1050, 590, 130, 95, -2, 0.6));
  P.add(chart(260, 408, 80, 54, -3, 0.5), chart(1290, 404, 84, 56, 3, 0.5));
  // moonlight shaft from the slit
  P.add(path(`M724 ${CY}L878 ${CY}L1090 880L520 880Z`, P.lin([[0, "#c8d4ff", 0.34], [0.7, "#a8b8f0", 0.1], [1, "#a8b8f0", 0]])));
  const motes: Pt[][] = [[], [], []];
  for (let k = 0; k < 90; k++) {
    const t = r.n();
    const y = CY + t * 460;
    const x = 800 + (r.n() - 0.5) * (150 + t * 480);
    motes[k % 3].push([x, y]);
  }
  motes.forEach((m, k) => P.add(`<g ${P.tw(3 + k * 1.3, k * 1.1, 0.2)}>${dots(m, 2, "#e8eeff", 0.7)}</g>`));
  // floor
  P.add(path(`M-60 740Q800 700 1660 740V900H-60Z`, P.lin([[0, "#2a1c16"], [1, "#0e0a0a"]])));
  let planks = "";
  for (let k = -12; k <= 12; k++) planks += `M${800 + k * 30} 722L${800 + k * 130} 900`;
  P.add(`<path d="${planks}" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`);
  P.add(ell(800, 800, 330, 70, P.glow("#b8c6f8"), 0.35));
  P.add(`<ellipse cx="800" cy="790" rx="190" ry="36" fill="none" stroke="#c89a58" stroke-opacity=".45" stroke-width="3"/>`);
  // telescope
  const brass = P.lin([[0, "#3a220e"], [0.28, "#b8742e"], [0.45, "#f6d48f"], [0.55, "#fff0c0"], [0.7, "#c88a3e"], [1, "#4a2a10"]]);
  const ang = -56;
  P.add(ell(800, 450, 260, 200, P.glow("#9fb2f0"), 0.25));
  // pier & legs
  P.add(path(`M790 520L770 700H830L810 520Z`, P.lin([[0, "#2a1a10"], [0.5, "#7a4e26"], [1, "#1a0e08"]], 0, 0, 1, 0)));
  P.add(`<path d="M800 690L690 790M800 690L910 790M800 690V800" stroke="#3a2412" stroke-width="12" stroke-linecap="round"/><path d="M800 690L690 790M800 690L910 790" stroke="#c88a3e" stroke-width="2" stroke-opacity=".5"/>`);
  P.add(`<circle cx="800" cy="512" r="34" fill="${brass}"/><circle cx="800" cy="512" r="22" fill="none" stroke="#3a220e" stroke-width="3" stroke-dasharray="4 3"/><circle cx="800" cy="512" r="7" fill="#fff0c0"/>`);
  P.add(`<g transform="translate(800 470) rotate(${ang})">`);
  P.add(path(`M-230 -15L230 -30V30L-230 15Z`, brass));
  let bands = "";
  for (const x of [-200, -120, -20, 90, 180, 222]) {
    const hh = 15 + ((x + 230) / 460) * 15 + 3;
    bands += `<rect x="${x}" y="${f(-hh)}" width="${x > 200 ? 14 : 9}" height="${f(hh * 2)}" fill="${brass}"/>`;
  }
  P.add(bands);
  P.add(ell(236, 0, 8, 30, "#0c1030"), ell(236, -6, 4, 16, "#b8c8ff", 0.6));
  P.add(path(`M-230 -10H-280V10H-230Z`, brass), path(`M-60 -40H120V-28H-60Z`, brass));
  P.add(`</g>`);
  // desk with candles, open book, papers
  P.add(path(`M300 640L660 626L690 660L320 680Z`, P.lin([[0, "#6a4228"], [1, "#2a160c"]])));
  P.add(path(`M320 680L690 660V676L322 698Z`, "#1a0c06"), path(`M340 690V800H352V690ZM660 672V790H672V672Z`, "#1a0c06"));
  P.add(path(`M430 646L500 636L560 646L500 656Z`, "#e8dcc0", 0.85), path(`M500 636V656`, "none", 1, ` stroke="#7a6040" stroke-width="1.5"`));
  let lines = "";
  for (let k = 0; k < 5; k++) lines += `M${440 + k * 2} ${645 - k * 1.6}l48 -6M${512} ${638 + k * 3}l40 3`;
  P.add(`<path d="${lines}" stroke="#3a5a9a" stroke-opacity=".6"/>`);
  P.add(path(`M580 640l40-8l10 12l-42 8Z`, "#d8ccb0", 0.7));
  P.add(candle(P, 380, 650, 52, 1.4, 0), candle(P, 420, 648, 34, 1.2, 1.4), candle(P, 612, 636, 30, 1.2, 2), candle(P, 1180, 612, 44, 1.3, 1));
  P.add(path(`M1100 612H1300V624H1100Z`, "#3a2416"));
  // warm light spill from candles
  P.add(ell(470, 620, 480, 300, P.glow("#e5a654"), 0.3), ell(1180, 580, 360, 240, P.glow("#e5a654"), 0.26));
  P.add(bottomShade(P, "#05040c", 0.6, 0.66));
  P.add(vignette(P, "#03030c", 0.8, 0.45));
  return P.svg();
}

/* mountain range with light/shadow faces. light from the left. */
function range(r: Rng, peaks: [number, number, number, number][], base: number, c: { body: string; lit: string; shade?: string }): string {
  let body = "";
  let lit = "";
  let gul = "";
  for (const [px, py, wl, wr] of peaks) {
    const L = ridge(r, px - wl, px, base, py, 6, (base - py) * 0.16, 0.55);
    const R = ridge(r, px, px + wr, py, base, 6, (base - py) * 0.16, 0.55);
    body += poly([...L, ...R.slice(1)]);
    // lit face: left ridge back up along a jagged couloir
    const cou: Pt[] = [];
    const n = 9;
    for (let k = n; k >= 1; k--) {
      const t = k / n;
      cou.push([px + wr * 0.16 * t + r.r(-14, 14) * t, py + (base - py) * t * 0.95]);
    }
    lit += poly([...L, ...cou]);
    // snow gullies on the shadow face
    for (let g = 0; g < 3; g++) {
      const sx = px + wr * r.r(0.15, 0.55);
      const sy = py + (sx - px) * ((base - py) / wr) + 4;
      const len = (base - sy) * r.r(0.3, 0.7);
      gul += `M${q(sx)} ${q(sy)}l${q(r.r(-6, 2))} ${q(len * 0.5)}l${q(r.r(-4, 4))} ${q(len * 0.5)}l3 ${q(-len * 0.6)}Z`;
    }
  }
  return path(body, c.body) + path(gul, c.lit, 0.45) + path(lit, c.lit);
}

/* 북부 설원 — blue dusk */
function sSnowfield(): string {
  const P = new Pic("snowfield");
  const r = new Rng(404);
  P.add(rect(P.lin([[0, "#0d143a"], [0.22, "#26336e"], [0.4, "#5a68a8"], [0.5, "#9aa2cc"], [0.56, "#d8cbd8"], [0.6, "#eed8d4"]])));
  P.add(ell(420, 530, 1000, 200, P.glow("#ffd8c8"), 0.55));
  P.add(starField(P, r, { n: 150, box: [0, 0, 1600, 330], keep: (_x, y) => 1 - y / 360, op: 0.8 }));
  P.add(ring(P, r, { a: [-120, 330], c: [760, -90], b: [1720, 220], w: 60, n: 520, glow: 0.5, lane: false }));
  // far range
  P.add(range(r, [[820, 250, 330, 360], [420, 330, 300, 240], [1220, 320, 260, 330], [120, 380, 240, 200], [1520, 370, 220, 200]], 530, { body: P.lin([[0, "#7c88bc"], [1, "#b4bcdc"]], 0, 250, 0, 530, true), lit: P.lin([[0, "#fbf0f2"], [1, "#d4d8ee"]], 0, 250, 0, 530, true) }));
  P.add(rect(P.lin([[0, "#c8cce6", 0], [1, "#c8cce6", 0.8]]), 1, 0, 400, 1600, 140));
  // near range
  P.add(range(r, [[560, 400, 260, 220], [1060, 390, 240, 280], [250, 440, 220, 200], [1400, 430, 240, 260]], 560, { body: P.lin([[0, "#4e5c98"], [1, "#8a96c6"]], 0, 390, 0, 560, true), lit: P.lin([[0, "#d8d4ec"], [1, "#a8b2da"]], 0, 390, 0, 560, true) }));
  P.add(rect(P.lin([[0, "#9ca8d4", 0], [1, "#b8c2e2", 0.9]]), 1, 0, 470, 1600, 110));
  // fir forest bands
  P.add(path(forestD(r, -20, 1640, (x) => 588 + Math.sin(x / 90) * 3, 26, 58, (x) => 0.55 + 0.45 * Math.sin(x / 170)), "#2a3668"));
  P.add(path(forestD(r, -20, 1640, (x) => 602 + Math.sin(x / 70) * 3, 36, 84, (x) => (Math.abs(x - 800) < 190 ? 0.12 : 0.8)), "#18214a"));
  P.add(rect(P.lin([[0, "#c0c8e6", 0], [1, "#c0c8e6", 0.35]]), 1, 0, 560, 1600, 50));
  // the snowfield
  P.add(path(`M-40 600Q400 590 800 598Q1200 606 1640 596V900H-40Z`, P.lin([[0, "#dfe4f4"], [0.25, "#aeb9e0"], [0.7, "#6c7bb4"], [1, "#3c4884"]])));
  // drifts
  let crest = "";
  let shade = "";
  for (let k = 0; k < 7; k++) {
    const y = 630 + k * k * 7 + k * 20;
    const x0 = r.r(-300, 600);
    const w = r.r(700, 1300);
    const h = 6 + k * 3;
    crest += `M${q(x0)} ${q(y)}Q${q(x0 + w / 2)} ${q(y - h)} ${q(x0 + w)} ${q(y + 4)}Q${q(x0 + w / 2)} ${q(y - h + 5)} ${q(x0)} ${q(y)}Z`;
    shade += `M${q(x0 + 40)} ${q(y + 3)}Q${q(x0 + w / 2)} ${q(y - h + 6)} ${q(x0 + w - 20)} ${q(y + 6)}Q${q(x0 + w / 2)} ${q(y + h * 1.4)} ${q(x0 + 40)} ${q(y + 3)}Z`;
  }
  P.add(path(shade, "#4a5896", 0.35), path(crest, "#f4f6ff", 0.55));
  // lone trees mid field
  P.add(path(firD(r, 1180, 648, 120, 30) + firD(r, 1214, 652, 84, 22) + firD(r, 380, 640, 70, 18), "#141c42"));
  P.add(path(firD(new Rng(9), 1180, 648, 120, 30), "#dfe6ff", 0.12, ` transform="translate(-3 -2)"`));
  // footprints trail toward the forest
  const fp: Pt[] = [];
  const fp2: Pt[] = [];
  for (let k = 0; k < 44; k++) {
    const t = k / 44;
    const y = 880 - Math.pow(t, 0.7) * 276;
    const x = 820 + Math.sin(t * 5) * 60 * (1 - t) + (k % 2 ? 1 : -1) * 5 * (1 - t);
    (t < 0.5 ? fp : fp2).push([x, y]);
  }
  P.add(dots(fp, 5, "#3a4682", 0.5), dots(fp2, 2.5, "#4a5690", 0.5));
  // glitter
  for (let g = 0; g < 3; g++) {
    const pts: Pt[] = [];
    for (let k = 0; k < 40; k++) pts.push([r.r(0, 1600), r.r(610, 860)]);
    P.add(`<g ${P.tw(2.4 + g, g * 0.9, 0.1)}>${dots(pts, 2, "#ffffff", 0.8)}</g>`);
  }
  P.add(bottomShade(P, "#141a44", 0.5, 0.62));
  P.add(vignette(P, "#0a0f30", 0.55, 0.5));
  return P.svg();
}

/* 북부 오두막 안 — firelit log cabin */
function sCabin(): string {
  const P = new Pic("cabin");
  const r = new Rng(505);
  P.add(rect("#1a0e08"));
  // log wall
  const logG = P.lin([[0, "#7a4a2c"], [0.25, "#5a3420"], [0.75, "#3a2014"], [1, "#160a04"]]);
  let logs = "";
  for (let y = -20; y < 720; y += 46) logs += `<rect x="-20" y="${y}" width="1640" height="46" rx="20" fill="${logG}"/>`;
  P.def(`<g id="${P.id("lg")}">${logs}</g>`);
  P.add(`<use href="#${P.id("lg")}"/>`);
  // knots & grain
  let grain = "";
  for (let k = 0; k < 70; k++) {
    const y = -20 + r.i(0, 15) * 46 + r.r(14, 32);
    const x = r.r(0, 1600);
    grain += `M${q(x)} ${q(y)}h${q(r.r(40, 160))}`;
  }
  P.add(`<path d="${grain}" stroke="#1a0c06" stroke-opacity=".35" stroke-width="2"/>`);
  // window
  const WX = 610;
  const WY = 150;
  const WW = 380;
  const WH = 330;
  const win = `M${WX} ${WY}h${WW}v${WH}h${-WW}Z`;
  P.def(`<clipPath id="${P.id("wc")}"><path d="${win}"/></clipPath>`);
  P.add(ell(800, 320, 420, 330, P.glow("#6a80c8"), 0.35));
  P.add(path(win, P.lin([[0, "#101a44"], [0.6, "#2c4080"], [1, "#5a70b0"]])));
  P.add(`<g clip-path="${P.ref("wc")}">`);
  P.add(ell(880, 210, 120, 120, P.glow("#dfe6ff"), 0.5), `<circle cx="880" cy="210" r="16" fill="#eef2ff"/>`);
  P.add(starField(P, r, { n: 40, box: [WX, WY, WX + WW, WY + 150], tw: 0.3 }));
  P.add(path(forestD(r, WX - 20, WX + WW + 20, () => 420, 50, 130, () => 0.8), "#0f1838"));
  P.add(path(`M${WX} 410Q800 396 ${WX + WW} 414V${WY + WH}H${WX}Z`, P.lin([[0, "#c8d4f0"], [1, "#7e8ec4"]])));
  const sn: Pt[] = [];
  const sn2: Pt[] = [];
  for (let k = 0; k < 70; k++) (k % 2 ? sn : sn2).push([r.r(WX, WX + WW), r.r(WY, WY + WH)]);
  P.add(`<g ${P.drift(6, 0, 10, 3)}>${dots(sn, 3, "#ffffff", 0.85)}</g>`, `<g ${P.drift(8, 2, 12, -2)}>${dots(sn2, 2, "#e8eeff", 0.7)}</g>`);
  // frost in corners
  for (const [x, y] of [
    [WX, WY],
    [WX + WW, WY],
    [WX, WY + WH],
    [WX + WW, WY + WH],
  ] as Pt[])
    P.add(ell(x, y, 90, 80, P.glow("#eef4ff"), 0.45));
  P.add(`</g>`);
  // frame & mullions
  const fr = "#2a1608";
  P.add(`<path d="${win}M${WX + WW / 2} ${WY}V${WY + WH}M${WX} ${WY + WH / 2}H${WX + WW}" fill="none" stroke="${fr}" stroke-width="14"/>`);
  P.add(`<path d="M${WX - 16} ${WY - 16}h${WW + 32}v${WH + 32}h${-WW - 32}Z" fill="none" stroke="#4a2a14" stroke-width="12"/>`);
  P.add(`<path d="M${WX - 22} ${WY - 22}h${WW + 44}" stroke="#8a5a34" stroke-width="3"/>`);
  // sill with a line of snow outside
  P.add(path(`M${WX - 40} ${WY + WH + 10}h${WW + 80}v18h${-WW - 80}Z`, P.lin([[0, "#a06a3e"], [1, "#3a200e"]])));
  // curtains
  const cur = (x: number, dir: number) => {
    let d = `M${x} ${WY - 40}`;
    d += `C${x + dir * 60} ${WY + 60} ${x + dir * 30} ${WY + 220} ${x + dir * 70} ${WY + WH + 40}`;
    d += `H${x - dir * 70}V${WY - 40}Z`;
    let folds = "";
    for (let k = 1; k < 4; k++) folds += `M${x - dir * k * 17} ${WY - 30}C${x - dir * k * 15 + dir * 20} ${WY + 150} ${x - dir * k * 17} ${WY + 250} ${x - dir * k * 14 + dir * 10} ${WY + WH + 36}`;
    return path(d, P.lin([[0, "#8a2a38"], [1, "#3a0c16"]])) + `<path d="${folds}" fill="none" stroke="#1e060c" stroke-width="5" stroke-opacity=".6"/>`;
  };
  P.add(cur(WX - 30, 1), cur(WX + WW + 30, -1));
  P.add(`<path d="M${WX - 110} ${WY - 44}H${WX + WW + 110}" stroke="#2a1608" stroke-width="8" stroke-linecap="round"/>`);
  // fireplace (right)
  const FX = 1310;
  let stones = "";
  const stoneC = ["#5a4a44", "#4a3c38", "#6a5a50", "#3e322e"];
  const st: Record<string, string> = {};
  for (let y = 330; y < 740; y += 34)
    for (let x = FX - 190 + ((y / 34) % 2) * 20; x < FX + 190; x += r.r(40, 64)) {
      const w = r.r(34, 58);
      const c = r.pick(stoneC);
      st[c] = (st[c] ?? "") + `M${q(x)} ${q(y)}h${q(w)}v30h${q(-w)}Z`;
    }
  for (const c of Object.keys(st)) stones += path(st[c], c);
  P.add(path(`M${FX - 200} 320H${FX + 200}V740H${FX - 200}Z`, "#241a18"), stones);
  // hearth opening
  P.add(path(`M${FX - 120} 740V560Q${FX} 470 ${FX + 120} 560V740Z`, "#0a0402"));
  P.add(ell(FX, 700, 150, 110, P.glow("#ff9a40"), 0.8));
  // logs
  P.add(path(`M${FX - 90} 712l170-18l6 16l-170 20ZM${FX - 70} 696l150 24l-4 14l-150-22Z`, "#2a1408"));
  // flames
  const flame = (sx: number, h: number, w: number) =>
    `M${FX + sx - w} 712C${FX + sx - w} ${712 - h * 0.4} ${FX + sx - w * 0.3} ${712 - h * 0.6} ${FX + sx} ${712 - h}C${FX + sx + w * 0.2} ${712 - h * 0.6} ${FX + sx + w} ${712 - h * 0.45} ${FX + sx + w} 712Z`;
  const f1 = P.lin([[0, "#fff4c8"], [0.4, "#f6c060"], [1, "#d8602a", 0.3]], 0, 1, 0, 0);
  P.add(`<g ${P.flick(1.4, 0)}>${path(flame(-30, 120, 40) + flame(30, 140, 44) + flame(0, 170, 40), P.lin([[0, "#f6a040"], [1, "#b8401a", 0]], 0, 1, 0, 0))}</g>`);
  P.add(`<g ${P.flick(1.1, 0.5)}>${path(flame(-14, 100, 26) + flame(20, 110, 26), f1)}</g>`);
  P.add(`<g ${P.flick(0.9, 0.2)}>${path(flame(4, 70, 18), P.lin([[0, "#fffbe8"], [1, "#fff0b0", 0.4]], 0, 1, 0, 0))}</g>`);
  const embers: Pt[] = [];
  for (let k = 0; k < 18; k++) embers.push([FX + r.r(-80, 80), r.r(700, 730)]);
  P.add(`<g ${P.tw(1.7, 0.3, 0.4)}>${dots(embers, 3, "#ffb050", 0.9)}</g>`);
  // mantel
  P.add(path(`M${FX - 230} 300H${FX + 230}V332H${FX - 230}Z`, P.lin([[0, "#a06a3e"], [1, "#3a200e"]])));
  P.add(candle(P, FX - 150, 300, 30, 1.1, 1), candle(P, FX + 160, 300, 40, 1.1, 2.4));
  P.add(path(`M${FX - 40} 300V250h24v50ZM${FX + 20} 300V262h30v38Z`, "#4a3226"));
  // shelf with jars (left) & hanging herbs
  P.add(path(`M140 300H460V314H140Z`, "#5a3a20"));
  let jars = "";
  for (let k = 0; k < 6; k++) {
    const x = 160 + k * 50;
    const h = r.r(30, 50);
    jars += `M${x} 300V${q(300 - h)}q0-6 8-8h14q8 2 8 8V300Z`;
  }
  P.add(path(jars, "#6a5a4a", 0.9));
  P.add(`<path d="M190 60v70M250 60v90M310 60v60M370 60v80" stroke="#2a1608" stroke-width="2"/>`);
  let herbs = "";
  for (const [x, y] of [
    [190, 130],
    [250, 150],
    [310, 120],
    [370, 140],
  ] as Pt[])
    herbs += `M${x} ${y - 10}c-14 20-16 40-6 60c4-20 10-30 6-60c10 20 12 40 2 64`;
  P.add(path(herbs, "#4a5a2a"));
  // warm fire light on the room
  P.add(ell(FX, 620, 1000, 560, P.glow("#ff9a48"), 0.55));
  P.add(`<g ${P.pulse(2.6, 0)}>${ell(FX - 100, 580, 800, 460, P.glow("#ffb060"), 0.28)}</g>`);
  // floor + rug
  P.add(path(`M-20 720H1620V900H-20Z`, P.lin([[0, "#3a2214"], [1, "#140a04"]])));
  let pl = "";
  for (let k = -14; k <= 14; k++) pl += `M${800 + k * 44} 720L${800 + k * 150} 900`;
  P.add(`<path d="${pl}" stroke="#0e0602" stroke-opacity=".55" stroke-width="3"/>`);
  P.add(ell(800, 820, 420, 70, "#6a1a24", 0.8), `<ellipse cx="800" cy="820" rx="380" ry="58" fill="none" stroke="#c89a58" stroke-width="3" stroke-opacity=".45" stroke-dasharray="12 8"/>`);
  // table with two cups
  const TY = 580;
  P.add(path(`M540 ${TY}H1060L1100 ${TY + 30}H500Z`, P.lin([[0, "#9a6238"], [1, "#5a341c"]])));
  P.add(path(`M500 ${TY + 30}H1100V${TY + 46}H500Z`, "#2a1408"));
  P.add(path(`M530 ${TY + 46}h20v150h-20ZM1050 ${TY + 46}h20v150h-20Z`, "#1e0e06"));
  const cupG = P.lin([[0, "#6a5a4a"], [0.4, "#e8dcc8"], [0.75, "#fff4e0"], [1, "#b89a78"]], 0, 0, 1, 0);
  const cup = (x: number) =>
    ell(x, TY + 12, 40, 8, "#000", 0.35) +
    path(`M${x - 22} ${TY - 34}h44l-4 44q-18 8-36 0Z`, cupG) +
    ell(x, TY - 34, 22, 5, "#5a3218") +
    `<path d="M${x + 21} ${TY - 26}c14 0 14 18 0 20" fill="none" stroke="#d8c8b0" stroke-width="4"/>`;
  P.add(cup(730), cup(868));
  P.add(`<g ${P.drift(5, 0, -14)}><path d="M726 ${TY - 44}c-10-16 10-26 0-44c-8-14 6-24 2-34M872 ${TY - 44}c10-16-10-26 0-44c8-14-6-22-2-34" fill="none" stroke="#fff4e8" stroke-width="3" stroke-linecap="round" stroke-opacity=".3"/></g>`);
  P.add(candle(P, 800, TY + 4, 26, 1, 3));
  P.add(ell(800, TY, 260, 60, P.glow("#ffd090"), 0.3));
  // chair backs silhouettes
  P.add(path(`M372 ${TY - 110}h14v330h-14ZM452 ${TY - 100}h13v320h-13ZM372 ${TY - 104}h93v13h-93ZM372 ${TY - 56}h93v9h-93ZM360 ${TY + 60}h120v14h-120Z`, "#1a0c06"));
  P.add(path(`M1134 ${TY - 100}h14v320h-14ZM1214 ${TY - 110}h14v330h-14ZM1134 ${TY - 104}h94v13h-94ZM1120 ${TY + 60}h120v14h-120Z`, "#140904"));
  P.add(bottomShade(P, "#0a0402", 0.55, 0.64));
  P.add(vignette(P, "#050201", 0.7, 0.45));
  return P.svg();
}

/* faceted fallen-star crystal: base at (x,by), height h, half-width w, tilt deg */
function shard(P: Pic, r: Rng, x: number, by: number, h: number, w: number, tilt: number, c: { lit: string; mid: string; dark: string; glow: string }, op = 1): string {
  const pts: Pt[] = [
    [-w, 0],
    [-w * 0.8, -h * 0.55],
    [-w * 0.25, -h * r.r(0.9, 0.98)],
    [w * 0.1, -h],
    [w * 0.7, -h * 0.62],
    [w, 0],
  ];
  const ridgeX = w * r.r(-0.1, 0.25);
  const L: Pt[] = [pts[0], pts[1], pts[2], pts[3], [ridgeX, -h * 0.35], [ridgeX * 0.8, 0]];
  const Rr: Pt[] = [[ridgeX * 0.8, 0], [ridgeX, -h * 0.35], pts[3], pts[4], pts[5]];
  const core: Pt[] = [[-w * 0.35, -h * 0.1], [-w * 0.15, -h * 0.7], [ridgeX, -h * 0.45], [ridgeX * 0.6, -h * 0.05]];
  return (
    `<g transform="translate(${q(x)} ${q(by)}) rotate(${f(tilt)})"${op < 1 ? ` opacity="${f2(op)}"` : ""}>` +
    ell(0, -h * 0.45, w * 2.6, h * 0.75, P.glow(c.glow), 0.35) +
    path(poly(L), P.lin([[0, c.lit], [1, c.mid]], 0, 0, 1, 1)) +
    path(poly(Rr), P.lin([[0, c.mid], [1, c.dark]], 0, 0, 1, 1)) +
    path(poly(core), "#ffffff", 0.35) +
    `<path d="M${pt(pts[2])}L${pt(pts[3])}L${ridgeX} ${q(-h * 0.35)}" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity=".8"/>` +
    `</g>`
  );
}

/* 별무덤 황야 — ruined cities pierced by fallen stars */
function sWasteland(): string {
  const P = new Pic("wasteland");
  const r = new Rng(606);
  const fs = flareDef(P, "#d8e8ff");
  P.add(rect(P.lin([[0, "#15123a"], [0.25, "#35285e"], [0.45, "#7a4468"], [0.56, "#c8666a"], [0.62, "#f09a70"], [0.66, "#f8c890"]])));
  P.add(ell(800, 560, 1100, 320, P.glow("#ffb880"), 0.6));
  P.add(ell(800, 580, 300, 110, P.glow("#fff0d0", true), 0.8));
  P.add(starField(P, r, { n: 110, box: [0, 0, 1600, 300], keep: (_x, y) => 1 - y / 300, op: 0.7 }));
  P.add(ring(P, r, { a: [-160, 300], c: [700, -100], b: [1760, 140], w: 70, n: 520, glow: 0.55, tone: ["#8a60b0", "#d0b0e0", "#fff0f8"], lane: false }));
  // hazy far ruins on the horizon
  const ruin = (x0: number, x1: number, base: number, hmin: number, hmax: number, wmin: number, wmax: number) => {
    let d = "";
    let x = x0;
    while (x < x1) {
      const w = r.r(wmin, wmax);
      const h = r.r(hmin, hmax);
      const t = base - h;
      const lean = r.r(-0.08, 0.08) * h;
      d += `M${q(x)} ${base}L${q(x + lean)} ${q(t + r.r(0, 10))}L${q(x + lean + w * 0.3)} ${q(t - r.r(0, 14))}L${q(x + lean + w * 0.5)} ${q(t + r.r(4, 16))}L${q(x + lean + w * 0.75)} ${q(t - r.r(0, 20))}L${q(x + w + lean)} ${q(t + r.r(0, 30))}L${q(x + w)} ${base}Z`;
      x += w + r.r(-w * 0.3, w * 0.8);
    }
    return d;
  };
  P.add(path(ruin(-40, 1640, 600, 20, 90, 20, 50), "#8a5070", 0.75));
  P.add(rect(P.lin([[0, "#f0a080", 0], [1, "#f0a080", 0.5]]), 1, 0, 520, 1600, 90));
  // far shards glowing
  const pale = { lit: "#f4f0ff", mid: "#b8b4ec", dark: "#5a4c90", glow: "#e8d8ff" };
  const cyan = { lit: "#eafcff", mid: "#8ac4ec", dark: "#2c4a88", glow: "#a8e0ff" };
  for (const [x, h, t] of [
    [240, 70, -30],
    [520, 50, 20],
    [1080, 60, -15],
    [1390, 80, 25],
    [690, 40, 35],
  ])
    P.add(shard(P, r, x, 600, h, h * 0.22, t, pale, 0.7));
  // ground plane
  P.add(path(`M-40 612Q800 596 1640 612V900H-40Z`, P.lin([[0, "#a4606a"], [0.18, "#5a3448"], [0.5, "#2a1830"], [1, "#100a14"]])));
  // mid ruins (darker) with broken towers
  P.add(path(ruin(-40, 1640, 660, 40, 170, 40, 90), "#4a2a4c"));
  P.add(path(fillBelow(ridge(r, -40, 1640, 664, 664, 6, 14, 0.6)), "#3a2034"));
  P.add(rect(P.lin([[0, "#c87a7a", 0], [0.6, "#c87a7a", 0.3], [1, "#c87a7a", 0]]), 1, 0, 560, 1600, 130));
  // collapsed towers
  const tower = (x: number, by: number, h: number, w: number, tilt: number, c: string) => {
    let d = `M${-w / 2} 0V${-h}l${w * 0.2} ${-h * 0.06}l${w * 0.2} ${h * 0.09}l${w * 0.25} ${-h * 0.12}l${w * 0.35} ${h * 0.14}V0Z`;
    let holes = "";
    for (let k = 1; k < 6; k++) holes += `M${-w * 0.2} ${-h * (k / 6) + 10}a${w * 0.1} ${w * 0.12} 0 0 1 ${w * 0.2} 0v18h${-w * 0.2}Z`;
    return `<g transform="translate(${x} ${by}) rotate(${tilt})">${path(d, c)}${path(holes, "#f0a078", 0.45)}</g>`;
  };
  P.add(tower(250, 720, 330, 70, -9, "#2e1a34"), tower(1360, 720, 280, 64, 12, "#2e1a34"), tower(520, 700, 150, 44, 22, "#3a2240"));
  // the great star-shard (center)
  P.add(ell(800, 640, 380, 90, P.glow("#bfe8ff"), 0.6));
  P.add(`<g ${P.pulse(6, 0)}>${ell(800, 400, 260, 320, P.glow("#bfe0ff"), 0.4)}</g>`);
  P.add(shard(P, r, 800, 680, 520, 90, 9, cyan));
  P.add(shard(P, r, 700, 690, 200, 44, -28, cyan), shard(P, r, 905, 690, 160, 36, 34, pale));
  // mid shards flanking
  P.add(shard(P, r, 380, 740, 280, 60, -24, pale), shard(P, r, 1210, 740, 320, 66, 20, cyan), shard(P, r, 1480, 760, 180, 40, -12, pale));
  // debris mounds swallowing the shard bases
  let mound = "";
  for (const [x, y, w] of [
    [800, 690, 150],
    [700, 694, 70],
    [905, 694, 60],
    [380, 744, 110],
    [1210, 744, 120],
    [1480, 762, 70],
    [250, 724, 90],
    [1360, 724, 90],
    [520, 704, 60],
  ])
    mound += `M${x - w} ${y + 14}Q${x - w * 0.5} ${y - 22} ${x} ${y - 16}Q${x + w * 0.6} ${y - 24} ${x + w} ${y + 14}Z`;
  P.add(path(mound, "#221426"), path(mound, "#b89ac8", 0.12, ` transform="translate(0 -3)"`));
  // glints on shard edges
  for (const [x, y, s] of [
    [770, 190, 1.4],
    [846, 360, 0.8],
    [330, 480, 0.9],
    [1270, 440, 1],
    [690, 520, 0.7],
  ])
    P.add(flare(P, fs, x, y, s, P.tw(r.r(2.5, 4.5), r.r(0, 3), 0.2)));
  // rubble foreground
  P.add(path(fillBelow(ridge(r, -40, 1640, 760, 740, 6, 40, 0.55)), P.lin([[0, "#2a1830"], [1, "#0e0810"]])));
  let rub = "";
  for (let k = 0; k < 30; k++) {
    const x = r.r(-20, 1620);
    const y = r.r(740, 880);
    const s = r.r(10, 40) * (y / 800);
    rub += `M${q(x)} ${q(y)}l${q(s)} ${q(-s * 0.6)}l${q(s * 0.8)} ${q(s * 0.3)}l${q(-s * 0.3)} ${q(s * 0.5)}Z`;
  }
  P.add(path(rub, "#1a0e1c"));
  P.add(ell(800, 760, 600, 60, P.glow("#9fd0ff"), 0.25));
  // warm dust haze
  P.add(`<g ${P.drift(14, 0, 0, 30)}>${ell(500, 650, 700, 60, P.glow("#f0a080"), 0.25)}</g>`);
  P.add(bottomShade(P, "#0c0610", 0.6, 0.64));
  P.add(vignette(P, "#0a0512", 0.6, 0.5));
  return P.svg();
}

/* 무명자의 마을 — foggy seaside village */
function sVillage(): string {
  const P = new Pic("village");
  const r = new Rng(707);
  P.add(rect(P.lin([[0, "#2c3638"], [0.3, "#55625f"], [0.48, "#8d9894"], [0.55, "#a9b2ad"]])));
  P.add(ell(820, 420, 700, 200, P.glow("#dfe6e0"), 0.45));
  // barely visible ring through fog
  P.add(ring(P, r, { a: [-120, 360], c: [760, -40], b: [1720, 260], w: 60, n: 200, glow: 0.18, tone: ["#9aa8a8", "#c8d4d0", "#eef4f0"], lane: false }));
  // sea at the horizon
  P.add(path(`M-20 452H1620V540H-20Z`, P.lin([[0, "#9aa4a0"], [1, "#6e7a78"]])));
  P.add(`<g ${P.tw(5, 0, 0.4)}><path d="M620 470h160M840 480h120M700 494h220M560 506h100M980 500h90" stroke="#e8eee8" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/></g>`);
  // pier and a lone boat
  P.add(`<path d="M780 540L840 470M790 540V505M808 520V490M826 500V476" stroke="#4a5452" stroke-width="4"/><path d="M780 505L840 468" stroke="#4a5452" stroke-width="6"/>`);
  P.add(path(`M1020 478q30 8 60 0l-6 8h-48Z`, "#4a5452"), `<path d="M1050 478V446" stroke="#4a5452" stroke-width="2"/>`);
  const layers: [number, number, number, [number, number], string, string][] = [
    // y, hill (neg = valley at center), win prob, w, body, fog after
    [520, -110, 0.02, [30, 60], "#7a8684", "#a0aaa6"],
    [560, -60, 0.03, [40, 80], "#5a6664", "#8a9692"],
    [650, -110, 0.03, [60, 110], "#394442", "#6e7a78"],
    [780, -150, 0.02, [90, 160], "#1c2424", ""],
  ];
  const lamps: Pt[] = [];
  layers.forEach(([y, hill, wp, w, c, fog], k) => {
    const city = cityD(r, -60, 1660, (x) => y - hill * Math.exp(-(((x - 800) / 260) ** 2)) + Math.abs(x - 800) * 0.03 * (k + 1) * -1 + 20 * k, {
      h: [30 + k * 20, 60 + k * 40],
      w,
      spire: 0,
      turret: 0.04,
      dome: 0,
      win: wp,
      winMax: 3,
      light: 1,
    });
    P.add(path(city.d, c), path(city.lit, "#ffffff", 0.06));
    if (city.wins.length) P.add(dots(city.wins, 3 + k, "#dfeee6", 0.3), dots(city.wins.filter((_w, j) => j % 5 === 0), 3 + k, "#f0fff6", 0.8));
    if (fog) {
      P.add(rect(P.lin([[0, fog, 0], [0.5, fog, 0.75], [1, fog, 0]]), 1, 0, y - 40 + k * 10, 1600, 120));
      P.add(`<g ${P.drift(18 + k * 5, k * 3, 0, k % 2 ? 40 : -40)}>${ell(r.r(300, 1300), y + 10, 600, 50, P.glow(fog), 0.7)}</g>`);
    }
    if (k === 1 || k === 2) lamps.push([800 + (k === 1 ? -120 : 150), y - 10], [800 + (k === 1 ? 110 : -170), y]);
  });
  // lanterns: some pale-lit, some dead
  const lamp = (x: number, y: number, s: number, lit: boolean, delay: number) => {
    let o = `<path d="M${x} ${y}V${q(y - 90 * s)}h${q(18 * s)}" fill="none" stroke="#141a1a" stroke-width="${f(4 * s)}"/>`;
    const lx = x + 18 * s;
    const ly = y - 84 * s;
    if (lit) o += `<g ${P.pulse(4 + delay, delay)}>${ell(lx, ly + 12 * s, 70 * s, 70 * s, P.glow("#e4f2ea"), 0.5)}</g>`;
    o += path(`M${f(lx - 7 * s)} ${f(ly + 4 * s)}h${f(14 * s)}l${f(-2 * s)} ${f(18 * s)}h${f(-10 * s)}Z`, lit ? "#e8f4ee" : "#2a3434", lit ? 0.9 : 1);
    o += path(`M${f(lx - 9 * s)} ${f(ly + 4 * s)}h${f(18 * s)}l${f(-9 * s)} ${f(-7 * s)}Z`, "#141a1a");
    return o;
  };
  P.add(lamp(lamps[0][0], lamps[0][1], 0.6, true, 0), lamp(lamps[1][0], lamps[1][1], 0.6, false, 0));
  P.add(lamp(lamps[2][0], lamps[2][1], 0.85, false, 0), lamp(lamps[3][0], lamps[3][1], 0.85, true, 2));
  P.add(lamp(560, 780, 1.4, false, 0), lamp(1080, 790, 1.5, true, 1.2), lamp(250, 820, 1.8, false, 0));
  // cobbled lane down the middle
  P.add(ell(800, 700, 160, 260, P.glow("#8a9692"), 0.25));
  // low fog in front
  P.add(`<g ${P.drift(22, 0, 0, 60)}>${ell(500, 720, 800, 90, P.glow("#b8c2be"), 0.5)}</g>`);
  P.add(`<g ${P.drift(26, 8, 0, -50)}>${ell(1200, 700, 700, 80, P.glow("#c8d0cc"), 0.45)}</g>`);
  P.add(bottomShade(P, "#0c1212", 0.6, 0.62));
  P.add(vignette(P, "#101818", 0.6, 0.48));
  return P.svg();
}

/* glyph field helper: returns path d for n glyphs in a box with a size function */
function glyphField(r: Rng, n: number, gen: () => [number, number, number]): string {
  let d = "";
  for (let k = 0; k < n; k++) {
    const [x, y, s] = gen();
    d += glyphD(r, x, y, s);
  }
  return d;
}
const gstroke = (d: string, c: string, w: number, op: number, extra = ""): string =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${f2(op)}"${extra}/>`;

/** glowing glyph strokes: the path is defined once and drawn twice (bloom + core) */
let gbN = 0;
function gbloom(P: Pic, d: string, c: string, w: number, op: number, bloom = 4): string {
  const id = P.id("gl" + (gbN++).toString(36));
  P.def(`<path id="${id}" d="${d}"/>`);
  return `<g fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"><use href="#${id}" stroke-width="${f(w * bloom)}" stroke-opacity="${f2(op * 0.13)}"/><use href="#${id}" stroke-width="${f(w)}" stroke-opacity="${f2(op)}"/></g>`;
}

/* 무명해 — the Nameless Sea */
function sSea(): string {
  const P = new Pic("sea");
  const r = new Rng(808);
  const HZ = 452;
  P.add(rect(P.lin([[0, "#04060c"], [0.35, "#0a0f1a"], [0.5, "#1b2330"], [0.502, "#0c1018"], [0.7, "#06080e"], [1, "#030408"]])));
  P.add(ell(800, HZ, 900, 160, P.glow("#3a4a60"), 0.6));
  P.add(starField(P, r, { n: 120, box: [0, 0, 1600, 400], keep: (_x, y) => 1 - y / 440, op: 0.6 }));
  P.add(ring(P, r, { a: [-140, 380], c: [760, -80], b: [1740, 300], w: 60, n: 360, glow: 0.3, tone: ["#4a5a70", "#9aa8c0", "#dfe6ff"], lane: false }));
  // the rising pillar of names
  P.add(ell(800, 300, 190, 360, P.glow("#9fb2d8"), 0.4));
  P.add(ell(800, 400, 70, 200, P.glow("#dfe6ff"), 0.25));
  P.add(ell(800, HZ, 260, 40, P.glow("#dfe6ff", true), 0.55));
  const sky: string[] = [];
  const groups = 8;
  for (let g = 0; g < groups; g++) {
    const d = glyphField(r, 11, () => {
      const pillar = r.n() < 0.75;
      const y = pillar ? HZ - Math.pow(r.n(), 0.8) * 400 : r.r(180, HZ - 10);
      const spread = pillar ? 30 + (HZ - y) * 0.25 : 700;
      const x = 800 + r.g() * spread * (pillar ? 0.8 : 0.6);
      const s = pillar ? r.r(8, 18) : r.r(6, 12) * (0.6 + (y - 180) / 400);
      return [x, y, s];
    });
    sky.push(d);
  }
  const skyAll = `<g id="${P.id("gs")}">${sky.map((d, g) => `<g ${P.drift(8 + g, g * 1.3, -8 - (g % 3) * 4, g % 2 ? 4 : -4)}>${gbloom(P, d, "#e6ecff", 1.3, 0.85)}</g>`).join("")}</g>`;
  P.add(skyAll);
  // horizon line
  P.add(`<path d="M-20 ${HZ}H1620" stroke="#c8d2e8" stroke-opacity=".35" stroke-width="1.5"/>`);
  // glassy water: reflection of the pillar, sheen lines
  P.add(`<use href="#${P.id("gs")}" transform="translate(0 ${HZ * 2}) scale(1 -1)" opacity=".22"/>`);
  P.add(ell(800, HZ + 90, 120, 200, P.glow("#8fa0c8"), 0.25));
  let sheen = "";
  let sheen2 = "";
  for (let k = 0; k < 34; k++) {
    const t = k / 34;
    const y = HZ + 6 + t * t * 330;
    const x = r.r(-100, 1500);
    const w = r.r(60, 280) * (0.4 + t);
    const seg = `M${q(x)} ${q(y)}h${q(w)}`;
    if (k % 2) sheen += seg;
    else sheen2 += seg;
  }
  P.add(`<g ${P.tw(6, 0, 0.3)}><path d="${sheen}" stroke="#9aa8c8" stroke-opacity=".12" stroke-width="1.2"/></g>`);
  P.add(`<g ${P.tw(7.5, 3, 0.3)}><path d="${sheen2}" stroke="#c8d2ec" stroke-opacity=".09" stroke-width="1"/></g>`);
  // glyphs resting on the water (perspective) with glints under them
  for (let g = 0; g < 4; g++) {
    const pts: [number, number, number][] = [];
    const d = glyphField(r, 9, () => {
      const t = r.n();
      const y = HZ + 12 + t * t * 260;
      const x = 800 + r.g() * (200 + t * 500);
      const s = 5 + t * 18;
      pts.push([x, y, s]);
      return [x, y - s * 0.4, s];
    });
    P.add(`<g ${P.drift(9 + g * 2, g * 2, -3, g % 2 ? 6 : -6)}>${gbloom(P, d, "#dfe6ff", 1.2, 0.55)}</g>`);
  }
  // pale shore
  P.add(path(`M-40 800Q400 760 800 772Q1200 784 1640 752V900H-40Z`, P.lin([[0, "#9aa0ac"], [0.25, "#5c6270"], [1, "#1a1d24"]])));
  P.add(`<g ${P.tw(4.5, 1, 0.4)}><path d="M-40 800Q400 760 800 772Q1200 784 1640 752" fill="none" stroke="#e8eef8" stroke-opacity=".55" stroke-width="2.5"/></g>`);
  P.add(`<path d="M-40 790Q400 752 800 764Q1200 776 1640 744" fill="none" stroke="#c8d2e8" stroke-opacity=".2" stroke-width="6"/>`);
  // washed-up faint letters on the sand
  P.add(gstroke(glyphField(r, 10, () => [r.r(100, 1500), r.r(800, 860), r.r(12, 22)]), "#c8d0e0", 1.6, 0.18));
  P.add(bottomShade(P, "#020305", 0.5, 0.7));
  P.add(vignette(P, "#000", 0.7, 0.45));
  return P.svg();
}

/* 무명해 속 — the memory sea's depth */
function sDepth(): string {
  const P = new Pic("depth");
  const r = new Rng(909);
  P.add(rect(P.lin([[0, "#4a6cc0"], [0.12, "#2a3e90"], [0.38, "#141e5c"], [0.68, "#080c2e"], [1, "#020309"]])));
  // surface caustics
  let wav = "";
  for (let k = 0; k < 5; k++) {
    let d = `M-20 ${10 + k * 12}`;
    for (let x = -20; x < 1640; x += 80) d += `q40 ${q(r.r(-10, 10))} 80 0`;
    wav += d;
  }
  P.add(`<g ${P.drift(7, 0, 0, 30)}><path d="${wav}" fill="none" stroke="#dfe8ff" stroke-width="7" stroke-opacity=".08"/></g>`);
  P.add(ell(800, 0, 900, 160, P.glow("#bcd0ff"), 0.6));
  // light shafts (blurred, static) + two breathing shafts
  const bl = P.blur(14, "sh");
  const shaft = (x: number, w: number, lean: number, len: number) => `M${q(x - w / 2)} -20L${q(x + w / 2)} -20L${q(x + lean + w * 1.6)} ${q(len)}L${q(x + lean - w * 1.6)} ${q(len)}Z`;
  const sg = P.lin([[0, "#dfe8ff", 0.5], [0.6, "#a8c0ff", 0.12], [1, "#a8c0ff", 0]]);
  P.add(`<g filter="${bl}">${path(shaft(560, 60, -120, 720) + shaft(760, 90, -30, 860) + shaft(980, 50, 90, 700) + shaft(1240, 70, 200, 640) + shaft(330, 50, -200, 600), sg)}</g>`);
  P.add(`<g ${P.pulse(7, 0)}>${path(shaft(820, 40, 10, 800), sg, 0.8)}</g>`, `<g ${P.pulse(9, 3)}>${path(shaft(650, 30, -80, 700), sg, 0.6)}</g>`);
  // central luminous column
  P.add(ell(800, 460, 220, 420, P.glow("#8fb8ff"), 0.35));
  // motes
  const mt: Pt[] = [];
  for (let k = 0; k < 140; k++) mt.push([r.r(0, 1600), r.r(0, 900)]);
  P.add(dots(mt, 1.6, "#bcd0ff", 0.35));
  // glyph layers: far (small, dim) → near (large, bright)
  const layer = (n: number, groups: number, smin: number, smax: number, c: string, w: number, op: number, sink: number, spread: number) => {
    let s = "";
    for (let g = 0; g < groups; g++) {
      const d = glyphField(r, n, () => {
        const y = r.r(40, 860);
        const x = 800 + r.g() * spread * (0.6 + y / 1400);
        return [x, y, r.r(smin, smax)];
      });
      s += `<g ${P.drift(10 + g * 1.7, g * 2.3, sink, g % 2 ? 6 : -6)}>${w > 1.2 ? gbloom(P, d, c, w, op) : gstroke(d, c, w, op)}</g>`;
    }
    return s;
  };
  P.add(layer(16, 5, 5, 10, "#6f8fd8", 1, 0.55, 10, 700));
  P.add(layer(12, 6, 10, 18, "#9fc0ff", 1.5, 0.75, 14, 520));
  // glows behind the near letters
  for (let k = 0; k < 10; k++) P.add(ell(800 + r.g() * 300, r.r(120, 620), 60, 60, P.glow("#8fb8ff"), 0.25));
  P.add(layer(6, 5, 20, 34, "#e8f0ff", 2.2, 0.9, 18, 380));
  P.add(bottomShade(P, "#010208", 0.7, 0.55));
  P.add(vignette(P, "#01020a", 0.7, 0.45));
  return P.svg();
}

/* 성서관 옥상 의식장 — the Archive rooftop ritual platform */
function sRitual(): string {
  const P = new Pic("ritual");
  const r = new Rng(1111);
  const fs = flareDef(P);
  P.add(rect(P.lin([[0, "#060920"], [0.3, "#10173e"], [0.5, "#26306a"], [0.58, "#3c3a78"]])));
  P.add(starField(P, r, { n: 260, box: [0, 0, 1600, 500], keep: (_x, y) => 1 - y / 560 }));
  P.add(ring(P, r, { a: [-160, 460], c: [620, -150], b: [1760, 120], w: 90, n: 1000, glow: 1.1, fs, bright: 7 }));
  const mg = meteorDef(P);
  for (let k = 0; k < 11; k++) {
    const x = r.r(100, 1500);
    const y = r.r(40, 380);
    P.add(meteor(P, mg, x, y, r.r(80, 220), -150 + r.r(-6, 6), r.r(1.4, 3), r.r(0.5, 1)));
  }
  // capital far below: a sea of lights beyond the parapet
  P.add(ell(800, 520, 1000, 110, P.glow("#a88ac8"), 0.5));
  const c = cityD(r, -40, 1640, (x) => 530 + Math.sin(x / 90) * 4, { h: [6, 20], w: [10, 24], spire: 0.06, turret: 0.05, win: 0.4, winMax: 2 });
  P.add(path(c.d, "#1e2250"), dots(c.wins, 2, "#f6d48f", 0.8));
  const lights: Pt[] = [];
  for (let k = 0; k < 160; k++) lights.push([r.r(-20, 1620), r.r(536, 560)]);
  P.add(path(`M-20 540H1620V600H-20Z`, "#141838"), dots(lights, 2.2, "#f0c070", 0.7));
  P.add(ell(800, 548, 900, 30, P.glow("#e0a060"), 0.3));
  // parapet with balusters
  P.add(path(`M-20 560H1620V600H-20Z`, P.lin([[0, "#5a6090"], [1, "#262a50"]])));
  let bal = "";
  for (let x = -10; x < 1620; x += 26) bal += `M${x} 566v30`;
  P.add(`<path d="${bal}" stroke="#141838" stroke-width="10" stroke-opacity=".7"/>`);
  P.add(`<path d="M-20 560H1620" stroke="#a8b0e0" stroke-width="3" stroke-opacity=".6"/>`);
  // flanking rune obelisks
  const glyphRun = (x: number, y0: number, y1: number, s: number) => {
    let d = "";
    for (let y = y0; y < y1; y += s * 1.4) d += glyphD(r, x, y, s);
    return d;
  };
  for (const [x, w, top] of [
    [300, 46, 250],
    [1300, 46, 250],
    [60, 80, 120],
    [1540, 80, 120],
  ]) {
    P.add(path(`M${x - w / 2} 600V${top + w}L${x} ${top}L${x + w / 2} ${top + w}V600Z`, P.lin([[0, "#6a72a8"], [0.5, "#2e3466"], [1, "#161a3c"]], 0, 0, 1, 0)));
    if (w < 60) P.add(`<g ${P.pulse(4 + x / 900, x / 400)}>${gstroke(glyphRun(x, top + w + 30, 560, 16), "#8fb8ff", 2, 0.9)}</g>`, ell(x, top + 200, 60, 180, P.glow("#5e8fe8"), 0.3));
  }
  // platform floor
  const FC = 700;
  P.add(path(`M-20 600H1620V900H-20Z`, P.lin([[0, "#2a2e58"], [0.4, "#1a1d40"], [1, "#0a0b1e"]])));
  P.add(ell(800, FC, 760, 200, P.rad([[0, "#4a4a78"], [0.6, "#2c2e5a"], [1, "#1a1c40", 0]]), 1));
  // slabs
  let sl = "";
  for (let k = 1; k < 5; k++) sl += `<ellipse cx="800" cy="${FC}" rx="${k * 170}" ry="${k * 44}" fill="none"/>`;
  P.add(`<g stroke="#0c0d24" stroke-width="3" stroke-opacity=".6">${sl}</g>`);
  // star-ink rune circles
  const rune = (rx: number, ry: number, n: number, s: number) => {
    let d = "";
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      d += glyphD(r, 800 + Math.cos(a) * rx, FC + Math.sin(a) * ry, s * (0.8 + 0.2 * Math.sin(a)));
    }
    return d;
  };
  P.add(`<ellipse cx="800" cy="${FC}" rx="520" ry="136" fill="none" stroke="#5e8fe8" stroke-width="16" stroke-opacity=".15"/>`);
  P.add(`<g ${P.pulse(5, 0)}><ellipse cx="800" cy="${FC}" rx="520" ry="136" fill="none" stroke="#8fb8ff" stroke-width="2.5" stroke-opacity=".85"/><ellipse cx="800" cy="${FC}" rx="470" ry="122" fill="none" stroke="#8fb8ff" stroke-width="1.5" stroke-opacity=".6"/>${gstroke(rune(495, 129, 44, 14), "#bcd4ff", 1.6, 0.85)}</g>`);
  P.add(`<g ${P.pulse(6.5, 2)}><ellipse cx="800" cy="${FC}" rx="330" ry="86" fill="none" stroke="#8fb8ff" stroke-width="2" stroke-opacity=".7"/>${gstroke(rune(300, 78, 28, 12), "#bcd4ff", 1.4, 0.75)}</g>`);
  let star = "";
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const b = ((k + 3) / 8) * Math.PI * 2;
    star += `M${q(800 + Math.cos(a) * 470)} ${q(FC + Math.sin(a) * 122)}L${q(800 + Math.cos(b) * 470)} ${q(FC + Math.sin(b) * 122)}`;
  }
  P.add(`<path d="${star}" stroke="#8fb8ff" stroke-width="1.2" stroke-opacity=".35"/>`);
  // altar
  P.add(ell(800, FC - 40, 320, 110, P.glow("#ffb060"), 0.35));
  const stone = P.lin([[0, "#3a3c6a"], [0.35, "#9a98c0"], [0.6, "#6a6a98"], [1, "#22244a"]], 0, 0, 1, 0);
  P.add(path(`M620 ${FC - 50}V${FC - 16}A180 44 0 0 0 980 ${FC - 16}V${FC - 50}Z`, stone), ell(800, FC - 50, 180, 44, "#6a6a98"));
  P.add(path(`M680 ${FC - 96}V${FC - 60}A120 30 0 0 0 920 ${FC - 60}V${FC - 96}Z`, stone), ell(800, FC - 96, 120, 30, P.rad([[0, "#e0b890"], [1, "#6e6c9a"]])));
  // brazier: tripod + bowl
  const BY = FC - 190;
  P.add(`<path d="M800 ${BY + 30}L760 ${FC - 100}M800 ${BY + 30}L840 ${FC - 100}M800 ${BY + 30}V${FC - 96}" stroke="#1a1418" stroke-width="7" stroke-linecap="round"/>`);
  P.add(path(`M730 ${BY}Q800 ${BY + 64} 870 ${BY}Z`, P.lin([[0, "#2a1c18"], [0.45, "#c88a3e"], [0.6, "#6a4020"], [1, "#1a0e08"]], 0, 0, 1, 0)));
  P.add(ell(800, BY, 70, 12, "#3a1c0c"));
  // fire
  P.add(ell(800, BY - 60, 300, 260, P.glow("#ffa040"), 0.55));
  const fl = (sx: number, h: number, w: number) => `M${800 + sx - w} ${BY + 2}C${800 + sx - w} ${BY - h * 0.45} ${800 + sx - w * 0.2} ${BY - h * 0.6} ${800 + sx} ${BY - h}C${800 + sx + w * 0.3} ${BY - h * 0.6} ${800 + sx + w} ${BY - h * 0.4} ${800 + sx + w} ${BY + 2}Z`;
  P.add(`<g ${P.flick(1.5, 0)}>${path(fl(-26, 110, 34) + fl(26, 120, 34) + fl(0, 160, 40), P.lin([[0, "#f6a040"], [1, "#c8401a", 0]], 0, 1, 0, 0))}</g>`);
  P.add(`<g ${P.flick(1.1, 0.4)}>${path(fl(-10, 100, 24) + fl(14, 90, 22), P.lin([[0, "#fff0c0"], [0.5, "#f6c060"], [1, "#e5a654", 0]], 0, 1, 0, 0))}</g>`);
  P.add(`<g ${P.flick(0.8, 0.2)}>${path(fl(2, 60, 14), "#fffbe8", 0.9)}</g>`);
  const sparks: Pt[] = [];
  for (let k = 0; k < 16; k++) sparks.push([800 + r.g() * 40, BY - r.r(100, 240)]);
  P.add(`<g ${P.drift(3, 0, -20)}>${dots(sparks, 2.4, "#ffd080", 0.8)}</g>`);
  // warm light on floor
  P.add(ell(800, FC - 20, 520, 130, P.glow("#ff9a48"), 0.25));
  P.add(bottomShade(P, "#04040e", 0.55, 0.66));
  P.add(vignette(P, "#02030c", 0.65, 0.5));
  return P.svg();
}

/* 기억의 공간 — white-silver memory void */
function sMemory(): string {
  const P = new Pic("memory");
  const r = new Rng(1212);
  const fs = flareDef(P, "#b8c4f0");
  P.add(rect(P.rad([[0, "#ffffff"], [0.3, "#f3f3fa"], [0.7, "#d6dbec"], [1, "#aeb8d4"]], 0.5, 0.45, 0.75)));
  // pastel light pools
  for (const [x, y, rx, c, o] of [
    [300, 220, 420, "#e6dcff", 0.5],
    [1300, 260, 460, "#dce8ff", 0.5],
    [1120, 640, 380, "#fff0dc", 0.45],
    [420, 640, 360, "#f0e4ff", 0.4],
  ] as [number, number, number, string, number][])
    P.add(ell(x, y, rx, rx * 0.7, P.glow(c), o));
  // soft rays from the heart of the void (blurred)
  const bl = P.blur(22, "ry");
  let rays = "";
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + r.r(-0.1, 0.1);
    const w = r.r(0.04, 0.09);
    rays += `M800 400L${q(800 + Math.cos(a - w) * 1100)} ${q(400 + Math.sin(a - w) * 1100)}L${q(800 + Math.cos(a + w) * 1100)} ${q(400 + Math.sin(a + w) * 1100)}Z`;
  }
  P.add(`<g filter="${bl}">${path(rays, P.rad([[0, "#ffffff", 0.9], [0.5, "#ffffff", 0.35], [1, "#ffffff", 0]], 800, 400, 800, true))}</g>`);
  P.add(ell(800, 400, 420, 340, P.glow("#ffffff"), 0.95));
  // bokeh
  const bk = P.rad([[0, "#ffffff", 0.0], [0.7, "#ffffff", 0.35], [0.9, "#ffffff", 0.7], [1, "#ffffff", 0]]);
  let bo = "";
  for (let k = 0; k < 26; k++) {
    const rr = r.r(10, 46);
    bo += `<circle cx="${q(r.r(0, 1600))}" cy="${q(r.r(0, 860))}" r="${q(rr)}" fill="${bk}" opacity="${f2(r.r(0.3, 0.8))}"/>`;
  }
  P.add(`<g ${P.pulse(8, 0)}>${bo}</g>`);
  // fragments
  const paper = P.lin([[0, "#fffdf8"], [1, "#e6e0d2"]], 0, 0, 1, 1);
  const petalG = P.lin([[0, "#ffffff"], [0.6, "#f2f2fb"], [1, "#aeb8dc"]], 0, 0, 0, 1);
  const frag = (x: number, y: number, s: number, rot: number, depth: number) => {
    const w = r.r(26, 56) * s;
    const h = r.r(16, 36) * s;
    const pts: Pt[] = [
      [0, r.r(0, 6) * s],
      [w * r.r(0.3, 0.5), r.r(-3, 3) * s],
      [w * r.r(0.55, 0.7), r.r(2, 7) * s],
      [w, r.r(-2, 4) * s],
      [w - r.r(0, 10) * s, h],
      [w * r.r(0.4, 0.6), h - r.r(0, 7) * s],
      [r.r(0, 8) * s, h + r.r(-3, 3) * s],
    ];
    let lines = "";
    for (let k = 1; k < 4; k++) if (r.n() < 0.8) lines += `M${f(w * r.r(0.08, 0.2))} ${f((h * k) / 4)}c${f(w * 0.2)} ${f(r.r(-1, 1) * s)} ${f(w * 0.4)} ${f(r.r(-1, 1) * s)} ${f(w * r.r(0.4, 0.7))} 0`;
    return (
      `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(rot)})" opacity="${f2(depth)}">` +
      path(poly(pts), "#7a86b0", 0.14, ` transform="translate(${f(5 * s)} ${f(8 * s)})"`) +
      path(poly(pts), paper) +
      `<path d="${lines}" fill="none" stroke="#6a7cc0" stroke-opacity=".28" stroke-width="${f(1.1 * s)}"/></g>`
    );
  };
  const petal = (x: number, y: number, s: number, rot: number, depth: number) =>
    `<path d="M0 0C${f(10 * s)} ${f(-9 * s)} ${f(32 * s)} ${f(-9 * s)} ${f(42 * s)} 0C${f(32 * s)} ${f(7 * s)} ${f(10 * s)} ${f(7 * s)} 0 0Z" fill="${petalG}" transform="translate(${q(x)} ${q(y)}) rotate(${q(rot)})" opacity="${f2(depth)}"/>`;
  for (let g = 0; g < 14; g++) {
    let s = "";
    for (let k = 0; k < 5; k++) {
      const x = r.r(-40, 1640);
      const y = r.r(20, 820);
      if (Math.hypot((x - 800) / 1.4, y - 400) < 200) continue;
      const depth = r.r(0.3, 1);
      const sc = 0.45 + depth * 0.9;
      s += r.n() < 0.45 ? frag(x, y, sc, r.r(-40, 40), depth) : petal(x, y, sc, r.r(0, 360), depth);
    }
    P.add(`<g ${P.drift(11 + g * 1.3, g * 1.7, -14 - (g % 3) * 5, g % 2 ? 10 : -10)}>${s}</g>`);
  }
  // glints
  for (let k = 0; k < 14; k++) P.add(flare(P, fs, r.r(80, 1520), r.r(60, 720), r.r(0.4, 1), k < 9 ? P.tw(r.r(2.5, 5), r.r(0, 4), 0.15) : ""));
  const dust: Pt[] = [];
  for (let k = 0; k < 140; k++) dust.push([r.r(0, 1600), r.r(0, 900)]);
  P.add(dots(dust, 2, "#8e9ad0", 0.3));
  P.add(bottomShade(P, "#8e98bc", 0.35, 0.66));
  P.add(vignette(P, "#7e88b0", 0.55, 0.5));
  return P.svg();
}

export const WORLD_BACKGROUNDS: Record<string, string> = {
  black: sBlack(),
  white: sWhite(),
  garden: sGarden(),
  title: sTitle(),
  starfall: sStarfall(),
  dawn: sDawn(),
  observatory: sObservatory(),
  snowfield: sSnowfield(),
  cabin: sCabin(),
  wasteland: sWasteland(),
  village: sVillage(),
  sea: sSea(),
  depth: sDepth(),
  ritual: sRitual(),
  memory: sMemory(),
};
