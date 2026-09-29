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
    const D = (globalThis as { __bgw?: [string, number, string][] }).__bgw; // DEBUG
    if (D) for (const x of s) D.push([this.p, x.length, x.slice(0, 70)]); // DEBUG
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
    lit += L > 0 ? `M${X + W - Math.max(2, Math.round(W * 0.16))} ${top}h${Math.max(2, Math.round(W * 0.16))}v${Math.round(Math.min(h, 60))}h${-Math.max(2, Math.round(W * 0.16))}Z` : `M${X} ${top}h${Math.max(2, Math.round(W * 0.16))}v${Math.round(Math.min(h, 60))}h${-Math.max(2, Math.round(W * 0.16))}Z`;
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
    dS += `M${X(s * 21)} ${Y(8)}Q${X(s * 16)} ${Y(22)} ${X(s * 8)} ${Y(30)}L${X(s * 8)} ${Y(27)}Q${X(s * 14.5)} ${Y(20)} ${X(s * 19)} ${Y(8)}Z`;
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
  return `<g fill="none" stroke="${c}" stroke-linecap="round"${op < 1 ? ` opacity="${f2(op)}"` : ""}${tr}>${s}</g>`;
}
/** leafy mass: base blobs + progressively lit, finer clumps toward the light */
function foliage(r: Rng, cx: number, cy: number, rx: number, ry: number, n: number, rmin: number, rmax: number, lx: number, ly: number, cs: string[], sy = 1): string {
  const b = blobs(r, cx, cy, rx, ry, n, rmin, rmax);
  let s = blobPaint(b, cs[0], 1, sy, cy);
  const thr = [-0.1, 0.35, 0.72];
  for (let k = 1; k < cs.length; k++) {
    const sub: Blob[] = [];
    for (const [x, y, rr] of b) {
      const d = ((x - cx) / rx) * lx + ((y - cy) / ry) * ly;
      if (d < thr[k - 1] + r.r(-0.15, 0.15)) continue;
      const m = k === 1 ? 2 : 3;
      for (let j = 0; j < m; j++) {
        const s2 = rr * r.r(0.22, 0.5) * (1 - k * 0.12);
        sub.push([x + lx * rr * 0.35 + r.r(-rr, rr) * 0.55, y + ly * rr * 0.35 + r.r(-rr, rr) * 0.55, s2]);
      }
    }
    s += blobPaint(sub, cs[k], 1, sy, cy);
  }
  return s;
}
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
  P.add(starField(P, r, { n: 180, box: [0, 0, 1600, 470], keep: (x, y) => Math.min(1, Math.hypot(x - MX, y - MY) / 420) * (1 - y / 560) }));
  P.add(ring(P, r, { a: [-160, 520], c: [640, -140], b: [1760, 260], w: 66, n: 440, glow: 0.8, fs, bright: 6 }));
  // moon
  P.add(ell(MX, MY, 110, 110, P.glow("#f0f4ff", true), 0.7));
  P.add(`<circle cx="${MX}" cy="${MY}" r="50" fill="${P.rad([[0, "#ffffff"], [0.65, "#f3f4ff"], [1, "#d3daf6"]], 0.4, 0.38, 0.62)}"/>`);
  P.add(path(`M${MX - 26} ${MY - 8}c6-14 22-16 30-6c-4 12-22 18-30 6ZM${MX + 6} ${MY + 16}c8-6 20-2 22 8c-8 6-20 4-22-8Z`, "#c5cdef", 0.4));
  // far treeline, cypresses, hazy
  P.add(foliage(r, 800, 492, 900, 16, 64, 14, 36, 0.3, -1, ["#2c3c84", "#3a4c98", "#4d62ae"], 0.8));
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
    return path(trunk, "#080c26") + foliage(r, cx, cy, rx, ry, 42, 32, 84, lx, -0.7, ["#0b1134", "#141d4a", "#22306a", "#3a4e94"]) + dots(pts, 2.2, "#b4c2f2", 0.6);
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
  for (const hx of [290, 1310]) P.add(foliage(r, hx, 578, 340, 20, 36, 18, 40, 0.2, -1, ["#101946", "#1a2658", "#2a3c7e"], 0.75));
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
      const w = 10 + (y - PY) * 0.12 + r.r(0, 18);
      s += `M${q(930 + (y - PY) * 0.12 - w / 2 + r.r(-8, 8))} ${q(y)}h${q(w)}`;
    }
    return s;
  };
  P.add(`<g ${P.tw(3.1, 0, 0.35)}><path d="${streak(PY + 6, 11)}" stroke="#eef2ff" stroke-width="3" stroke-linecap="round" stroke-opacity=".75"/></g>`);
  P.add(`<g ${P.tw(4.3, 1.9, 0.3)}><path d="${streak(PY + 16, 10)}" stroke="#c8d4ff" stroke-width="2" stroke-linecap="round" stroke-opacity=".6"/></g>`);
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
  P.add(foliage(r, 60, 810, 330, 170, 34, 44, 90, 0.5, -0.9, ["#070b24", "#0f1640", "#1b275c"]), foliage(r, 1560, 810, 330, 170, 34, 44, 90, -0.3, -0.9, ["#070b24", "#0f1640", "#1b275c"]));
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
    }
    const c = cityD(r, -60, 1660, (x) => L.y - L.hill * Math.exp(-(((x - cx) / spread) ** 2)) + Math.sin(x / 110 + k * 2) * 5 + Math.sin(x / 37 + k) * 3, {
      h: L.h,
      w: L.w,
      spire: L.spire ?? 0.05,
      turret: 0.1,
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
      for (let j = 0; j < 5; j++) {
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
  P.add(starField(P, r, { n: 300, box: [0, 0, 1600, 580], keep: (x, y) => (1 - y / 720) * (x < 820 && y < 380 ? 0.35 : 1) }));
  P.add(ring(P, r, { a: [1760, 700], c: [1230, 30], b: [520, -150], w: 100, n: 1300, glow: 1.2, fs, bright: 8 }));
  // city glow on the horizon
  P.add(ell(950, 640, 900, 200, P.glow("#7b8ee0"), 0.5));
  const mistC = "#5a6cc0";
  P.add(
    capital(P, r, {
      cx: 950,
      light: -1,
      spread: 560,
      layers: [
        { y: 610, hill: 70, h: [14, 42], w: [12, 26], c: "#3a4a94", lit: "#6f82cc", litOp: 0.6, mist: mistC, mistOp: 0.5, win: 0.05, winOp: 0.5, winS: 0.7 },
        { y: 668, hill: 85, h: [24, 64], w: [16, 38], c: "#222d6c", lit: "#6275c4", litOp: 0.55, win: 0.14, winOp: 0.8, winS: 0.9, mist: "#4a5cb0", mistOp: 0.38 },
        { y: 750, hill: 70, h: [34, 96], w: [24, 56], c: "#111842", lit: "#40519c", litOp: 0.55, win: 0.12, winOp: 0.9, mist: "#2c3a80", mistOp: 0.3 },
        { y: 860, hill: 30, h: [40, 120], w: [34, 80], c: "#070b24", lit: "#27346e", litOp: 0.5, win: 0.07, winOp: 0.8, winS: 1.3 },
      ],
      tower: { at: 1, base: 690, top: 118, lit: "#f7f8ff", mid: "#c3ccef", shade: "#5967ad", win: "#a8c8ff", rim: "#ffffff", glow: "#a9baff" },
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
  const fb: Blob[] = [
    ...blobs(r, 90, 800, 260, 140, 26, 40, 80),
    ...blobs(r, 1530, 790, 260, 150, 26, 40, 80),
  ];
  const fbl = [...blobLight(fb.slice(0, 26), 90, 800, 260, 140, -0.6, -0.8, 0.1, 0.62), ...blobLight(fb.slice(26), 1530, 790, 260, 150, -0.6, -0.8, 0.1, 0.62)];
  P.add(path(blobsD(fb), "#060a22"), path(blobsD(fbl), "#1a2658", 0.9));
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
        { y: 668, hill: 60, h: [14, 42], w: [12, 26], c: "#342c7a", lit: "#6d60c0", litOp: 0.6, mist: "#5244a0", mistOp: 0.45 },
        { y: 740, hill: 70, h: [24, 64], w: [16, 38], c: "#1e1850", lit: "#5a4eb0", litOp: 0.5, win: 0.12, winOp: 0.8, mist: "#3a2e80", mistOp: 0.3 },
        { y: 830, hill: 40, h: [40, 110], w: [28, 60], c: "#0a0822", lit: "#302a70", litOp: 0.5, win: 0.1, winOp: 0.85 },
      ],
      tower: { at: 1, base: 740, top: 300, lit: "#efedff", mid: "#b2acec", shade: "#463e96", win: "#aac4ff", rim: "#ffffff", glow: "#9f94ff" },
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
    const b = blobs(r, cx, cy, rx, ry, n, rmax * 0.45, rmax);
    const lit = blobLight(b, cx, cy, rx, ry, 0, 1, 0.05, 0.78);
    const core = blobLight(b, cx, cy, rx, ry, 0, 1, 0.55, 0.55);
    return path(blobsD(b, 0.45), "#8c6c9c", 0.8) + path(blobsD(lit, 0.42), "#e6a09a", 0.75) + path(blobsD(core, 0.38), "#ffe0a8", 0.85);
  };
  P.add(bank(250, 430, 330, 26, 22, 60), bank(1320, 400, 360, 28, 24, 64), bank(760, 330, 260, 18, 14, 46), bank(1480, 520, 200, 16, 12, 44), bank(90, 540, 200, 14, 12, 40));
  P.add(`<g ${P.pulse(10, 0)}>${ell(800, 600, 700, 200, P.glow("#fff0c8"), 0.3)}</g>`);
  P.add(
    capital(P, r, {
      layers: [
        { y: 650, hill: 55, h: [14, 42], w: [12, 26], c: "#bb8aa0", lit: "#f7c4a0", litOp: 0.5, mist: "#f4c4a8", mistOp: 0.55 },
        { y: 725, hill: 70, h: [24, 64], w: [16, 38], c: "#7a5282", lit: "#e8a890", litOp: 0.45, win: 0.05, winOp: 0.6, mist: "#d99aa0", mistOp: 0.35 },
        { y: 820, hill: 40, h: [40, 110], w: [28, 60], c: "#33234e", lit: "#8a5a78", litOp: 0.5, win: 0.04, winOp: 0.7 },
      ],
      light: 1,
      tower: { at: 1, base: 725, top: 240, lit: "#ffe6c4", mid: "#c792a0", shade: "#56406e", win: "#fff2d0", rim: "#fff4dc", glow: "#ffe6b8" },
    }),
  );
  P.add(bottomShade(P, "#1c1030", 0.55, 0.64));
  P.add(vignette(P, "#2a1838", 0.4, 0.55));
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
