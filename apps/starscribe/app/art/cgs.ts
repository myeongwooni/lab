// Event CGs for 「이름을 잃은 별에게」.
// Every CG is a self-contained SVG string (viewBox 0 0 1600 900, slice).
// All ids / classes / keyframes are prefixed with the CG id.
// Rules: <=2 filters per CG, <=40 animated elements, no <text>, no SMIL,
// seeded randomness only, <=40KB per CG.

type Stop = [number, string, number?];
type Pt = [number, number];

const n1 = (v: number): string => String(Math.round(v * 10) / 10);

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number): number {
  return (r() + r() + r() + r() - 2) / 2;
}

function stops(s: Stop[]): string {
  return s
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined || a === 1 ? "" : ` stop-opacity="${a}"`}/>`)
    .join("");
}

/** linear gradient in bounding-box units */
function lg(id: string, x1: number, y1: number, x2: number, y2: number, s: Stop[]): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
}

/** radial gradient in bounding-box units */
function rg(id: string, s: Stop[], cx = 0.5, cy = 0.5, r = 0.5, fx?: number, fy?: number): string {
  const f = fx === undefined ? "" : ` fx="${fx}" fy="${fy ?? cy}"`;
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${f}>${stops(s)}</radialGradient>`;
}

/** soft glow radial (color → transparent) */
function glowGrad(id: string, color: string, core = 0.9, mid = 0.35): string {
  return rg(id, [
    [0, color, core],
    [0.35, color, mid],
    [1, color, 0],
  ]);
}

function blurFilter(id: string, sd: number): string {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
}

/** Shared animation CSS. Animated elements get class `${p}-a ${p}-<kind>`. */
function css(p: string, extra = ""): string {
  return (
    `<style>.${p}-a{transform-box:fill-box;transform-origin:center}` +
    `.${p}-tw{animation:${p}-tw 4.2s ease-in-out infinite}@keyframes ${p}-tw{0%,100%{opacity:1}50%{opacity:.2}}` +
    `.${p}-pu{animation:${p}-pu 5s ease-in-out infinite}@keyframes ${p}-pu{0%,100%{opacity:.6}50%{opacity:1}}` +
    `.${p}-fl{animation:${p}-fl 2.6s ease-in-out infinite}@keyframes ${p}-fl{0%,100%{transform:scale(1);opacity:1}40%{transform:scale(.94,1.07);opacity:.85}70%{transform:scale(1.04,.96);opacity:.95}}` +
    `.${p}-up{animation:${p}-up 8s ease-in-out infinite}@keyframes ${p}-up{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}` +
    `.${p}-sw{animation:${p}-sw 7s ease-in-out infinite}@keyframes ${p}-sw{0%,100%{transform:translateX(0)}50%{transform:translateX(9px)}}` +
    extra +
    `@media (prefers-reduced-motion:reduce){.${p}-a{animation:none!important}}</style>`
  );
}

function A(p: string, kind: string, delay = 0, dur?: number): string {
  const st = `animation-delay:${n1(-delay)}s${dur ? `;animation-duration:${n1(dur)}s` : ""}`;
  return `class="${p}-a ${p}-${kind}" style="${st}"`;
}

function svg(p: string, defs: string, body: string, extraCss = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${css(p, extraCss)}${body}</svg>`;
}

/** Many tiny round dots as one stroked path (cheap stars / dust). */
function dotPath(pts: Pt[], w: number, color: string, op: number, extra = ""): string {
  const q = pts.filter(([x, y]) => x > -6 && x < 1606 && y > -6 && y < 906);
  if (!q.length) return "";
  const d = q.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h0`).join("");
  return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"${extra}/>`;
}

/** Scatter stars in a rect, denser toward the top. Returns 3 size layers. */
function starField(r: () => number, n: number, x0: number, y0: number, x1: number, y1: number, color = "#dfe6ff", bias = 1.6, op = 1): string {
  const L: Pt[][] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * r();
    const y = y0 + (y1 - y0) * Math.pow(r(), bias);
    const k = r();
    L[k < 0.72 ? 0 : k < 0.94 ? 1 : 2].push([x, y]);
  }
  return dotPath(L[0], 1.3, color, 0.55 * op) + dotPath(L[1], 2.1, color, 0.8 * op) + dotPath(L[2], 3.2, color, 0.95 * op);
}

/** 4-point sparkle */
function sparkle(x: number, y: number, s: number): string {
  const k = s * 0.16;
  return `M${n1(x)} ${n1(y - s)}Q${n1(x + k)} ${n1(y - k)} ${n1(x + s)} ${n1(y)}Q${n1(x + k)} ${n1(y + k)} ${n1(x)} ${n1(y + s)}Q${n1(x - k)} ${n1(y + k)} ${n1(x - s)} ${n1(y)}Q${n1(x - k)} ${n1(y - k)} ${n1(x)} ${n1(y - s)}Z`;
}

interface RingCfg {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  t0: number;
  t1: number;
  n: number;
  spread: number;
  color?: string;
  glow?: string;
  op?: number;
  sparkles?: number;
  seed?: number;
  filter?: string;
}

function ellPt(c: RingCfg, tDeg: number, off = 0): Pt {
  const t = (tDeg * Math.PI) / 180;
  const rr = (c.rot * Math.PI) / 180;
  // normal of ellipse approx
  const ex = c.rx * Math.cos(t);
  const ey = c.ry * Math.sin(t);
  const nx = c.ry * Math.cos(t);
  const ny = c.rx * Math.sin(t);
  const nl = Math.hypot(nx, ny) || 1;
  const px = ex + (nx / nl) * off;
  const py = ey + (ny / nl) * off;
  return [c.cx + px * Math.cos(rr) - py * Math.sin(rr), c.cy + px * Math.sin(rr) + py * Math.cos(rr)];
}

/** The 天環 star ring: soft band + thousands of dots + a few sparkles. */
function starRing(p: string, c: RingCfg, animated = 6): string {
  const r = rng(c.seed ?? 7);
  const color = c.color ?? "#dfe6ff";
  const glow = c.glow ?? "#9fb4ee";
  const op = c.op ?? 1;
  let arc = "";
  for (let i = 0; i <= 24; i++) {
    const [x, y] = ellPt(c, c.t0 + ((c.t1 - c.t0) * i) / 24);
    arc += `${i ? "L" : "M"}${n1(x)} ${n1(y)}`;
  }
  const f = c.filter ? ` filter="url(#${c.filter})"` : "";
  let out = `<g opacity="${op}"><g fill="none" stroke="${glow}" stroke-linecap="round"${f}>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 6)}" opacity=".07"/>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 3.4)}" opacity=".1"/>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 1.6)}" opacity=".14"/>` +
    `<path d="${arc}" stroke="${color}" stroke-width="${n1(c.spread * 0.6)}" opacity=".12"/></g>`;
  const L: Pt[][] = [[], [], []];
  for (let i = 0; i < c.n; i++) {
    const t = c.t0 + (c.t1 - c.t0) * r();
    const off = gauss(r) * c.spread;
    const pt = ellPt(c, t, off);
    const k = r() * (1 - Math.min(1, Math.abs(off) / (c.spread * 1.8)) * 0.4);
    L[k < 0.62 ? 0 : k < 0.88 ? 1 : 2].push(pt);
  }
  out += dotPath(L[0], 1.2, color, 0.5) + dotPath(L[1], 1.9, color, 0.75) + dotPath(L[2], 2.8, color, 0.95);
  const sp = c.sparkles ?? 8;
  for (let i = 0; i < sp; i++) {
    const t = c.t0 + (c.t1 - c.t0) * r();
    const [x, y] = ellPt(c, t, gauss(r) * c.spread * 0.5);
    const s = 4 + r() * 7;
    const an = i < animated ? ` ${A(p, "tw", r() * 4, 3 + r() * 3)}` : "";
    out += `<path d="${sparkle(x, y, s)}" fill="#f4f6ff"${an}/>`;
  }
  return out + `</g>`;
}

/** Glowing star-ink glyph strokes (cursive, letter-like) around a region. */
function glyphD(r: () => number, x: number, y: number, s: number): string {
  let d = `M${n1(x)} ${n1(y)}`;
  let cx = x;
  let cy = y;
  const segs = 2 + Math.floor(r() * 3);
  for (let i = 0; i < segs; i++) {
    const dx = (0.4 + r() * 0.8) * s;
    const dy = (r() - 0.5) * s * 1.2;
    const c1x = cx + (r() - 0.3) * s;
    const c1y = cy - (0.3 + r() * 0.9) * s;
    const c2x = cx + dx + (r() - 0.7) * s;
    const c2y = cy + dy + (r() - 0.2) * s;
    cx += dx;
    cy += dy * 0.4;
    d += `C${n1(c1x)} ${n1(c1y)} ${n1(c2x)} ${n1(c2y)} ${n1(cx)} ${n1(cy)}`;
  }
  if (r() < 0.5) d += `M${n1(x + s * 0.3)} ${n1(y - s * 0.7)}l${n1(s * 0.5)} ${n1(-s * 0.15)}`;
  return d;
}

/** Moonflower symbol (six petals). Place with <use>. */
function flowerSym(id: string, petal: string, center: string, edge = "#ffffff"): string {
  let s = `<g id="${id}">`;
  for (let k = 0; k < 6; k++) {
    s += `<path transform="rotate(${k * 60 + 30})" d="M0 0C9 -6 11 -22 0 -34C-11 -22 -9 -6 0 0Z" fill="${petal}" stroke="${edge}" stroke-width="1" stroke-opacity=".5"/>`;
  }
  for (let k = 0; k < 6; k++) {
    s += `<path transform="rotate(${k * 60})" d="M0 0C5 -4 6 -14 0 -22C-6 -14 -5 -4 0 0Z" fill="${edge}" opacity=".6"/>`;
  }
  return s + `<circle r="5" fill="${center}"/></g>`;
}

function useAt(id: string, x: number, y: number, s: number, rot = 0, flat = 1, extra = ""): string {
  // animated wrappers must not carry the transform attribute (CSS transform would replace it)
  if (extra.includes("class=")) return `<g${extra}>${useAt(id, x, y, s, rot, flat)}</g>`;
  return `<use href="#${id}" transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(${Math.round(s * 100) / 100} ${Math.round(s * flat * 100) / 100})"${extra}/>`;
}

/**
 * Backlit figure piece: rim-coloured copy of the shape, the body fill drawn on
 * top shifted away from the light so only a thin rim remains on the lit edge.
 */
function rim(d: string, fill: string, rimColor: string, dx: number, dy: number, extra = ""): string {
  return `<path d="${d}" fill="${rimColor}"/><path d="${d}" fill="${fill}" transform="translate(${dx} ${dy})"${extra}/>`;
}


// ── Profile parts (local coords: head centre 0,0, head height ≈100, facing +x) ──
const HEAD_F =
  "M0 -50C18 -50 30 -42 34 -30C37 -22 38 -16 38 -12C37 -9 36 -7 37 -4C40 1 43 4 43 7C43 9 40 11 37 12C37 15 38 17 38 19C37 20 35 21 35 22C36 23 37 24 37 26C36 28 33 29 33 31C34 35 34 40 30 44C26 48 18 49 14 52L13 78L-20 78L-22 42C-38 32 -46 14 -45 -8C-44 -32 -24 -50 0 -50Z";
const HEAD_M =
  "M0 -50C20 -50 32 -40 35 -28C37 -20 38 -15 39 -11C38 -8 37 -7 38 -4C42 2 46 7 46 11C45 13 42 14 38 14C38 17 39 19 39 21C38 22 36 23 36 24C37 25 38 26 38 28C36 30 34 31 34 33C35 37 36 42 33 46C28 50 18 51 12 52L12 80L-24 80L-24 42C-40 32 -47 12 -46 -10C-45 -34 -25 -50 0 -50Z";
/** girl / Estelle: long hair falling behind the back */
const HAIR_LONG =
  "M30 -40C22 -54 0 -60 -20 -54C-42 -46 -56 -24 -56 4C-56 36 -66 60 -66 96C-66 130 -80 150 -80 190C-80 220 -90 240 -84 262C-76 244 -68 232 -60 226C-58 246 -48 262 -34 270C-40 246 -36 222 -30 200C-24 170 -30 140 -24 110C-18 80 -20 56 -16 34C-8 26 -4 12 -4 0C4 -10 12 -22 18 -28C22 -26 28 -28 30 -40Z";
/** Estelle adult: hair to just below the shoulder */
const HAIR_MID =
  "M30 -40C22 -54 0 -60 -20 -54C-42 -46 -54 -24 -54 4C-54 30 -58 58 -64 84C-66 100 -62 118 -54 128C-50 116 -46 108 -40 102C-40 116 -34 126 -26 132C-28 112 -24 92 -20 70C-16 50 -14 34 -10 20C-4 10 4 -4 12 -18C18 -22 26 -26 30 -40Z";
const BANGS_F =
  "M31 -38C24 -52 6 -58 -10 -54C-2 -48 4 -40 6 -30C10 -36 16 -38 22 -34C26 -30 30 -24 33 -18C36 -24 35 -32 31 -38Z";
/** messy short male hair (Cassian / squire) */
const HAIR_M =
  "M40 -22C40 -42 26 -58 0 -60C-28 -62 -50 -44 -54 -18C-56 0 -52 16 -46 26L-58 34C-48 36 -42 32 -38 28L-44 46C-34 42 -28 34 -24 26L-22 36C-17 28 -17 18 -18 10C-12 2 -8 -8 -6 -16C-2 -12 2 -8 6 -4C10 -10 14 -14 18 -20C22 -16 26 -12 31 -9L28 -17C33 -15 38 -13 43 -11C39 -15 38 -18 40 -22Z";
/** a lock of hair falling in front of the shoulder */
const HAIR_LOCK = "M-4 6C6 40 12 80 8 120C6 138 12 152 20 160C8 161 -2 148 -4 130C-8 98 -16 60 -20 28Z";
/** face details: eye (almond line) + glint + cheek light */
function faceMarks(m: boolean, op = 1): string {
  const eye = m ? "M21 -9C25 -12 29 -12 32 -9" : "M21 -8C25 -12 29 -12 33 -8L34 -10";
  return `<g opacity="${op}"><path d="${eye}" fill="none" stroke="#070a1c" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="28.5" cy="-7.5" r="1.7" fill="#eef2ff"/>` +
    `<path d="M26 4C29 10 29 18 26 24" fill="none" stroke="#b9c6f2" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></g>`;
}
function place(x: number, y: number, s: number, rot: number, flip: boolean, inner: string): string {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_oath — Prologue: the oath in the moonlit white garden
// ────────────────────────────────────────────────────────────────────────────
function cgOath(): string {
  const p = "cg_oath";
  const r = rng(101);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#050817"],
      [0.3, "#0f1640"],
      [0.58, "#26377c"],
      [0.66, "#41539c"],
    ]) +
    rg(`${p}-moon`, [
      [0, "#ffffff"],
      [0.75, "#f0f2ff"],
      [1, "#cdd6f7"],
    ], 0.45, 0.42, 0.62) +
    glowGrad(`${p}-halo`, "#c9d4ff", 0.8, 0.2) +
    glowGrad(`${p}-ink`, "#8fb8ff", 0.95, 0.3) +
    glowGrad(`${p}-fglow`, "#eef0ff", 0.55, 0.12) +
    lg(`${p}-ground`, 0, 0, 0, 1, [
      [0, "#34458c"],
      [0.25, "#18204c"],
      [1, "#060918"],
    ]) +
    lg(`${p}-bG`, 1, 0.1, 0, 0.9, [
      [0, "#2c3674"],
      [0.5, "#141a44"],
      [1, "#090c22"],
    ]) +
    lg(`${p}-bB`, 0, 0.1, 1, 0.9, [
      [0, "#2c3674"],
      [0.5, "#141a44"],
      [1, "#090c22"],
    ]) +
    lg(`${p}-dress`, 1, 0, 0.1, 1, [
      [0, "#36427e"],
      [0.3, "#1b224f"],
      [1, "#090c24"],
    ]) +
    lg(`${p}-pet`, 0, 1, 0, 0, [
      [0, "#aeb9e6"],
      [0.6, "#eef0fa"],
      [1, "#ffffff"],
    ]) +
    lg(`${p}-vig`, 0, 0, 0, 1, [
      [0, "#060918", 0],
      [1, "#060918", 0.8],
    ]) +
    lg(`${p}-mg`, 0, 0, 0, 1, [
      [0, "#fff"],
      [0.62, "#fff"],
      [0.92, "#fff", 0],
    ]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="600" y="200" width="520" height="540" fill="url(#${p}-mg)"/></mask>` +
    `<radialGradient id="${p}-arm" gradientUnits="userSpaceOnUse" cx="806" cy="511" r="120">${stops([[0, "#7d9ae8"], [0.35, "#34408a"], [1, "#11163c"]])}</radialGradient>` +
    blurFilter(`${p}-b`, 6) +
    flowerSym(`${p}-fl`, `url(#${p}-pet)`, "#e8dcb0");

  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  b += starField(r, 150, 0, 0, 1600, 480, "#dfe6ff", 1.8);
  b += starRing(p, { cx: 700, cy: 1500, rx: 1700, ry: 1420, rot: -11, t0: 200, t1: 332, n: 440, spread: 30, seed: 11, filter: `${p}-b`, sparkles: 11 }, 8);
  // moon + halo
  b += `<circle cx="800" cy="290" r="520" fill="url(#${p}-halo)" opacity=".5"/>`;
  b += `<circle cx="800" cy="290" r="230" fill="url(#${p}-halo)" opacity=".85"/>`;
  b += `<circle cx="800" cy="290" r="128" fill="url(#${p}-moon)"/>`;
  b += `<g fill="#c7cff0" opacity=".16"><ellipse cx="760" cy="252" rx="34" ry="20"/><ellipse cx="826" cy="236" rx="18" ry="12"/><ellipse cx="846" cy="330" rx="26" ry="16"/><ellipse cx="782" cy="340" rx="12" ry="8"/></g>`;

  // far palace spires, pale and misty
  let pal = "M0 540V470";
  for (const [x, top, w] of [[70, 400, 16], [150, 440, 26], [250, 360, 12], [330, 430, 22], [1260, 420, 22], [1350, 350, 12], [1440, 430, 26], [1530, 390, 16]] as [number, number, number][])
    pal += `L${x - w} 470V${top + 40}L${x} ${top}L${x + w} ${top + 40}V470`;
  pal += "L1600 470V540Z";
  b += `<path d="${pal}" fill="#6273b8" opacity=".3"/>`;
  // pergola arches far back (white garden)
  let col = "";
  for (let x = 420; x < 1180; x += 64) col += `M${x + 6} 548V500a26 26 0 0 1 52 0V548Z`;
  b += `<path d="M420 548V480H1180V548Z${col}" fill="#7d8dcc" opacity=".22" fill-rule="evenodd"/>`;

  // tree / hedge masses (layered, atmospheric)
  const mass = (x0: number, x1: number, base: number, h: number, seed: number, inner: "l" | "r") => {
    const t = rng(seed);
    let d = `M${x0} ${base}L${x0} ${n1(inner === "r" ? base - h : base - h * 0.08)}`;
    let x = x0;
    while (x < x1) {
      const w = 26 + t() * 40;
      const u = (x - x0) / (x1 - x0);
      const env = inner === "r" ? (u < 0.5 ? 1 : Math.cos((u - 0.5) * Math.PI) ** 0.7) : u > 0.5 ? 1 : Math.sin(u * Math.PI) ** 0.7;
      const y = base - h * (0.08 + 0.92 * env) - t() * 30;
      d += `Q${n1(x + w * 0.5)} ${n1(y - 26)} ${n1(x + w)} ${n1(y)}`;
      x += w;
    }
    return d + `L${x1} ${base}Z`;
  };
  b += `<path d="${mass(-60, 620, 560, 260, 3, "r")}${mass(980, 1660, 560, 280, 4, "l")}" fill="#2d3a7a" opacity=".75"/>`;
  b += `<path d="${mass(-60, 520, 600, 420, 5, "r")}${mass(1080, 1660, 600, 440, 6, "l")}" fill="#141b46"/>`;
  // moonlit edge on near hedges
  b += `<path d="${mass(-60, 520, 600, 420, 5, "r")}${mass(1080, 1660, 600, 440, 6, "l")}" fill="none" stroke="#5c6db4" stroke-width="2" opacity=".5"/>`;
  // ground
  b += `<path d="M0 552Q400 532 800 544T1600 552V900H0Z" fill="url(#${p}-ground)"/>`;
  b += `<ellipse cx="800" cy="600" rx="600" ry="70" fill="url(#${p}-fglow)" opacity=".55"/>`;

  // far flowers as glints, bush flowers as small symbols
  const far: Pt[] = [];
  for (let i = 0; i < 140; i++) far.push([r() * 1600, 552 + Math.pow(r(), 1.4) * 90]);
  b += dotPath(far, 3, "#e6eaff", 0.55);
  let bush = "";
  for (let i = 0; i < 18; i++) {
    const left = r() < 0.5;
    const x = left ? 20 + r() * 380 : 1200 + r() * 380;
    const y = 250 + r() * 330;
    bush += useAt(`${p}-fl`, x, y, 0.25 + r() * 0.18, r() * 60, 0.8);
  }
  b += `<g opacity=".7">${bush}</g>`;
  let mid = "";
  for (let i = 0; i < 22; i++) {
    const x = r() < 0.5 ? 380 + r() * 300 : 920 + r() * 300;
    const y = 560 + r() * 60;
    mid += useAt(`${p}-fl`, x, y, 0.3 + (y - 560) * 0.008, r() * 60, 0.6);
  }
  b += `<g opacity=".85">${mid}</g>`;

  // ── figures ──
  const rimC = "#dfe6ff";
  // girl (left, facing right, looking up)
  const gx = 734, gy = 336, gs = 0.84;
  const gDress = "M714 386C700 394 690 414 690 444C690 486 700 524 698 564C696 606 680 650 664 720L862 720C860 690 850 664 832 650C808 634 784 614 772 584C764 560 766 524 768 502C772 472 772 446 766 426C760 410 750 400 744 392Z";
  const gArm = "M712 402C724 396 738 402 744 418C752 440 756 462 764 480C772 492 786 500 800 503C812 505 826 504 840 506C846 508 846 514 840 516C828 520 814 522 800 522C780 524 764 530 752 532C734 534 718 524 712 504C706 478 704 440 706 420C706 412 708 406 712 402Z";
  // squire (right, facing left, head bowed)
  const bx = 872, by = 282, bs = 0.94;
  const bCape = "M902 348C940 352 972 380 992 420C1010 460 1024 520 1050 580C1060 604 1070 640 1084 720L940 720C930 640 920 560 910 480Z";
  const bBody = "M852 340L900 336C918 346 932 366 936 396C940 432 934 470 926 500C940 520 946 548 948 580C950 620 954 660 962 720L784 720C790 690 792 660 792 640C792 600 800 570 820 556C836 546 852 540 862 530C852 500 842 470 838 440C834 404 838 370 852 340Z";
  const bPlate = "M842 360C858 350 890 350 910 360C916 392 914 428 906 456C888 466 866 466 848 458C838 428 836 392 842 360Z";
  const bArm = "M876 368C890 362 906 368 910 384C914 408 912 432 904 452C896 470 878 484 858 494C842 502 828 506 814 508C800 510 786 512 774 514C766 516 764 522 770 524C784 526 800 524 816 522C834 520 850 516 866 510C890 500 912 484 922 460C930 436 928 404 918 380C910 362 890 356 876 368Z";

  let fig = `<g opacity=".22" filter="url(#${p}-b)"><path d="${gDress}${bBody}" fill="none" stroke="#dfe6ff" stroke-width="8"/></g>`;
  fig += place(gx, gy, gs, -12, false, rim(HAIR_LONG, `url(#${p}-bG)`, rimC, -2.4, 1.2));
  fig += rim(bCape, `url(#${p}-bB)`, "#aab8ec", 2.6, 1.4);
  fig += rim(gDress, `url(#${p}-dress)`, rimC, -2.8, 1.2);
  fig += rim(bBody, `url(#${p}-bB)`, rimC, 2.8, 1.2);
  fig += rim(bPlate, "#1b2254", "#9aa8e0", 2, 1);
  fig += `<path d="M848 384C866 378 890 378 908 386M846 420C866 414 890 414 906 422" fill="none" stroke="#5a69ad" stroke-width="1.4" opacity=".6"/>`;
  // heads
  fig += place(gx, gy, gs, -12, false, rim(HEAD_F, `url(#${p}-bG)`, "#eef1ff", -2.6, 0.8) + rim(BANGS_F, "#0d1236", rimC, -1.8, 1) + faceMarks(false, 0.9));
  fig += place(bx, by, bs, -9, true, rim(HEAD_M, `url(#${p}-bG)`, "#eef1ff", -2.6, 0.8) + rim(HAIR_M, "#0a0e28", "#cdd6ff", -2, 1) + faceMarks(true, 0.85));
  // folds & hair strands
  fig += `<path d="M742 424C748 470 742 530 716 640M726 440C720 500 708 560 690 660M782 590C804 616 822 636 840 660" fill="none" stroke="#7382c8" stroke-width="1.5" opacity=".45"/>`;
  fig += place(gx, gy, gs, -12, false, `<path d="M-30 -40C-48 -10 -50 60 -60 140M-20 -30C-36 10 -38 90 -44 200M-10 20C-18 70 -22 140 -26 230" fill="none" stroke="#b9c6f2" stroke-width="1.6" opacity=".35"/>`);
  fig += place(gx, gy, gs, -12, false, rim(HAIR_LOCK, "#0f1438", rimC, -2, 1));
  // arms
  fig += rim(gArm, `url(#${p}-arm)`, "#eef1ff", -1.6, 1.8);
  fig += rim(bArm, `url(#${p}-arm)`, "#eef1ff", 1.6, 1.8);
  b += `<g mask="url(#${p}-m)">${fig}</g>`;

  // ── ring of star-ink around both wrists ──
  const wx = 806, wy = 511;
  b += `<circle cx="${wx}" cy="${wy}" r="190" fill="url(#${p}-ink)" opacity=".4" ${A(p, "pu", 0, 5)}/>`;
  b += `<circle cx="${wx}" cy="${wy}" r="60" fill="url(#${p}-ink)" opacity=".9"/>`;
  b += `<g ${A(p, "pu", 1.5, 3.6)}><ellipse cx="${wx}" cy="${wy}" rx="15" ry="21" transform="rotate(12 ${wx} ${wy})" fill="none" stroke="#8fb8ff" stroke-width="7" opacity=".55"/>` +
    `<ellipse cx="${wx}" cy="${wy}" rx="15" ry="21" transform="rotate(12 ${wx} ${wy})" fill="none" stroke="#f4f7ff" stroke-width="2"/></g>`;
  for (let i = 0; i < 12; i++) {
    const a = r() * Math.PI * 2;
    const d = 34 + r() * 100;
    b += `<circle cx="${n1(wx + Math.cos(a) * d)}" cy="${n1(wy - 24 + Math.sin(a) * d * 0.7)}" r="${n1(1 + r() * 1.8)}" fill="#dce8ff" ${A(p, "tw", r() * 4, 2.5 + r() * 3)}/>`;
  }

  // foreground: leaves + big glowing moonflowers framing the bottom
  let lv = "";
  for (let i = 0; i < 44; i++) {
    const x = r() < 0.5 ? r() * 640 : 960 + r() * 640;
    const y = 620 + r() * 300;
    const l = 40 + r() * 70;
    const a = ((-90 + (r() - 0.5) * 90) * Math.PI) / 180;
    const ex = x + Math.cos(a) * l;
    const ey = y + Math.sin(a) * l;
    const w = l * 0.22;
    lv += `M${n1(x)} ${n1(y)}Q${n1((x + ex) / 2 + w)} ${n1((y + ey) / 2)} ${n1(ex)} ${n1(ey)}Q${n1((x + ex) / 2 - w)} ${n1((y + ey) / 2)} ${n1(x)} ${n1(y)}Z`;
  }
  b += `<path d="${lv}" fill="#0e1434" stroke="#4556a0" stroke-width="1.2" stroke-opacity=".45"/>`;
  const fp: [number, number, number, number][] = [
    [90, 690, 1.9, 10], [250, 770, 2.5, 40], [430, 840, 2.0, 20], [70, 880, 2.8, 5], [600, 890, 1.5, 50],
    [1520, 690, 1.9, 30], [1360, 770, 2.5, 12], [1180, 840, 2.0, 44], [1540, 880, 2.8, 25], [1010, 895, 1.5, 8],
    [360, 640, 1.1, 15], [1250, 650, 1.1, 35], [560, 660, 0.8, 22], [1060, 664, 0.8, 5], [180, 610, 0.9, 18], [1430, 612, 0.9, 50],
  ];
  for (const [x, y, s, rot] of fp) {
    b += `<circle cx="${x}" cy="${y}" r="${n1(s * 62)}" fill="url(#${p}-fglow)" opacity=".45"/>` + useAt(`${p}-fl`, x, y, s, rot, 0.7);
  }
  b += `<rect y="600" width="1600" height="300" fill="url(#${p}-vig)"/>`;
  return svg(p, defs, b);
}

/** chain: dashed catenary with link highlight */
function chain(x1: number, y1: number, x2: number, y2: number, sag: number, color = "#1a1f38", hi = "#6f7fb8", w = 5): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const d = `M${n1(x1)} ${n1(y1)}Q${n1(mx)} ${n1(my)} ${n1(x2)} ${n1(y2)}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${w * 1.8} ${w * 0.5}"/>` +
    `<path d="${d}" fill="none" stroke="${hi}" stroke-width="${w * 0.35}" stroke-dasharray="${w * 1.2} ${w * 1.1}" opacity=".8"/>`;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_meet — Ch1: the cell in the Tower of Silence
// ────────────────────────────────────────────────────────────────────────────
function cgMeet(): string {
  const p = "cg_meet";
  const r = rng(202);
  const defs =
    `<pattern id="${p}-st" width="140" height="64" patternUnits="userSpaceOnUse">` +
    `<rect width="140" height="64" fill="#161b3a"/>` +
    `<path d="M2 2h64v28h-64zM70 2h68v28h-68zM-34 34h66v28h-66zM36 34h64v28h-64zM104 34h66v28h-66z" fill="#1d2448" stroke="#0b0e22" stroke-width="3"/>` +
    `<path d="M4 4h60M72 4h64M38 36h60M106 36h30M0 36h30" stroke="#2c3563" stroke-width="2" opacity=".7"/></pattern>` +
    lg(`${p}-dark`, 0, 0, 0, 1, [
      [0, "#05060f", 0.2],
      [1, "#05060f", 0.85],
    ]) +
    lg(`${p}-beam`, 1, 0, 0, 1, [
      [0, "#dfe8ff", 0.55],
      [0.5, "#b9c9f5", 0.22],
      [1, "#9fb4e8", 0.04],
    ]) +
    lg(`${p}-door`, 0, 0, 0, 1, [
      [0, "#fff1cf"],
      [0.5, "#f6d48f"],
      [1, "#e5a654"],
    ]) +
    lg(`${p}-spill`, 0, 0, 0, 1, [
      [0, "#f6d48f", 0.55],
      [1, "#e5a654", 0],
    ]) +
    glowGrad(`${p}-warm`, "#f6c77a", 0.6, 0.18) +
    glowGrad(`${p}-cool`, "#b9c9f5", 0.55, 0.15) +
    glowGrad(`${p}-ink`, "#8fb8ff", 0.95, 0.3) +
    lg(`${p}-fig`, 0, 0, 1, 0.3, [
      [0, "#2a2a4a"],
      [0.4, "#141730"],
      [1, "#0a0c1e"],
    ]) +
    lg(`${p}-floor`, 0, 0, 0, 1, [
      [0, "#1a1f3e"],
      [1, "#07081a"],
    ]) +
    blurFilter(`${p}-b`, 8);

  let b = `<rect width="1600" height="900" fill="#0b0e22"/>`;
  // back wall
  b += `<rect x="330" y="0" width="960" height="650" fill="url(#${p}-st)"/>`;
  // side walls in perspective
  b += `<path d="M0 0H330V650L0 900Z" fill="url(#${p}-st)"/><path d="M0 0H330V650L0 900Z" fill="#05060f" opacity=".55"/>`;
  b += `<path d="M1290 0H1600V900L1290 650Z" fill="url(#${p}-st)"/><path d="M1290 0H1600V900L1290 650Z" fill="#05060f" opacity=".6"/>`;
  // floor
  b += `<path d="M0 900L330 650H1290L1600 900Z" fill="url(#${p}-floor)"/>`;
  let fl = "";
  for (let i = 1; i < 6; i++) {
    const y = 650 + i * i * 9;
    const t = (y - 650) / 250;
    fl += `M${n1(330 - 330 * t)} ${y}H${n1(1290 + 310 * t)}`;
  }
  for (let i = 0; i <= 12; i++) {
    const x = 330 + i * 80;
    fl += `M${x} 650L${n1(800 + (x - 800) * 1.9)} 900`;
  }
  b += `<path d="${fl}" stroke="#0a0c1e" stroke-width="3" opacity=".8"/>`;

  // door (open, warm corridor light) — back wall left
  const dx0 = 540, dx1 = 740, dtop = 230;
  const door = `M${dx0} 650V${dtop + 80}Q${dx0} ${dtop} ${(dx0 + dx1) / 2} ${dtop}Q${dx1} ${dtop} ${dx1} ${dtop + 80}V650Z`;
  b += `<circle cx="640" cy="480" r="420" fill="url(#${p}-warm)" opacity=".55"/>`;
  b += `<path d="${door}" fill="url(#${p}-door)"/>`;
  // corridor stairs inside door (hint)
  b += `<path d="M540 610H740M540 570H740M560 530H740M580 490H740" stroke="#e5a654" stroke-width="3" opacity=".45"/>`;
  // door leaf swung inward
  b += `<g transform="translate(20 0)"><path d="M720 650V330Q722 270 744 256L790 276V690Z" fill="#2a1d18"/><path d="M728 360H784M728 500H786M728 620H788" stroke="#6b4a2e" stroke-width="5"/><path d="M720 330V650" stroke="#f6d48f" stroke-width="2" opacity=".6"/></g>`;
  // door frame stones
  b += `<path d="${door}" fill="none" stroke="#3b3550" stroke-width="16"/><path d="${door}" fill="none" stroke="#f6d48f" stroke-width="2" opacity=".5"/>`;
  // warm spill on floor
  b += `<path d="M540 650H740L960 900H260Z" fill="url(#${p}-spill)"/>`;

  // Estelle silhouette in the door (standing, facing right, holding a book)
  const eHead = "M640 336C652 336 660 344 661 355C662 360 665 363 666 366C664 367 662 367 661 368C662 372 660 375 657 376C655 381 650 384 645 384L644 392L628 392L628 380C620 374 617 364 618 354C620 342 628 336 640 336Z";
  const eHair = "M636 331C652 329 665 340 665 354L660 350C656 344 648 342 641 345C636 358 636 376 640 396C642 412 638 426 630 434C628 424 622 418 612 416C618 404 614 392 612 380C608 362 614 338 636 331Z";
  const eBody = "M628 388C616 392 608 404 606 424C602 460 604 500 600 540C596 580 592 620 590 650H690C688 620 684 590 680 560C676 520 674 480 672 450C670 424 664 400 648 390Z";
  const eBook = "M654 440L690 448L686 480L650 472Z";
  const eArm = "M660 404C672 414 678 432 680 450C682 464 676 472 664 472C656 470 652 460 652 448Z";
  b += `<g transform="translate(640 650) scale(1.22) translate(-640 -650)"><g filter="url(#${p}-b)" opacity=".7"><path d="${eBody}${eHead}" fill="none" stroke="#fff4d8" stroke-width="7"/></g>`;
  b += `<g fill="#1a1426">${`<path d="${eBody}"/><path d="${eHair}"/><path d="${eHead}"/><path d="${eBook}" fill="#241a24"/><path d="${eArm}"/>`}</g>`;
  b += `<path d="M657 376C662 372 665 368 666 366M664 354C660 344 650 338 640 338" fill="none" stroke="#fff1cf" stroke-width="1.6" opacity=".8"/></g>`;

  // barred window above Cassian + moonbeam
  const wx0 = 900, wx1 = 1040, wy0 = 110, wy1 = 250;
  b += `<path d="M${wx0} ${wy1}V${wy0 + 40}Q${wx0} ${wy0} ${(wx0 + wx1) / 2} ${wy0}Q${wx1} ${wy0} ${wx1} ${wy0 + 40}V${wy1}Z" fill="#8ea3d8"/>`;
  b += `<circle cx="1010" cy="150" r="30" fill="#f2f5ff" opacity=".9"/>`;
  let bars = "";
  for (let x = wx0 + 28; x < wx1; x += 28) bars += `M${x} ${wy0}V${wy1}`;
  bars += `M${wx0} 190H${wx1}`;
  b += `<path d="${bars}" stroke="#141830" stroke-width="7"/>`;
  b += `<path d="M${wx0 - 10} ${wy1 + 6}H${wx1 + 10}" stroke="#2c3563" stroke-width="10"/>`;
  // beam: from window going down-left to the floor
  const beam = `M${wx0} ${wy0 + 30}L${wx1} ${wy0 + 30}L${wx1 - 300} 760L${wx0 - 470} 760Z`;
  b += `<path d="${beam}" fill="url(#${p}-beam)"/>`;
  let bs = "";
  for (let x = wx0 + 28; x < wx1; x += 28) {
    const f = (x - wx0) / (wx1 - wx0);
    bs += `M${x} ${wy0 + 30}L${n1(wx0 - 470 + f * 170 + (x - wx0) * 0)} 760`;
  }
  b += `<path d="${bs}" stroke="#0b0e22" stroke-width="8" opacity=".2"/>`;
  // lit patch on floor
  b += `<path d="M430 736L760 736L720 790L380 790Z" fill="#c9d6ff" opacity=".16"/>`;

  // ── Cassian (sitting against the wall, chained, looking up at the door) ──
  const cx = 905, cy = 368;
  const wr = "#f2c98a"; // warm rim from the door
  const cCloak = "M940 430C990 430 1030 470 1040 540C1050 590 1052 630 1060 660L900 664C910 600 920 520 940 430Z";
  const cBody = "M896 424C872 430 856 450 850 480C844 520 846 560 852 600C856 620 870 640 900 648L1000 652C1010 620 1008 580 1000 540C994 500 986 460 960 436C944 426 918 422 896 424Z";
  const cLegFar = "M900 620C860 628 800 640 740 650C710 656 690 664 700 676C730 680 790 672 850 664C890 660 920 656 940 650Z";
  const cLegNear = "M960 610C930 590 890 560 850 530C830 516 812 520 806 540C800 570 796 610 792 646C790 660 800 668 816 666C826 640 830 600 834 574C870 600 910 630 940 650Z";
  const cArm = "M872 440C858 450 850 470 850 494C850 512 848 526 836 534C820 544 800 546 786 548C776 550 772 560 780 564C800 566 824 562 846 552C868 542 878 522 882 500C886 478 888 456 872 440Z";
  const cCollar = "M886 424L914 454L928 426Z";
  let c = "";
  c += rim(cCloak, `url(#${p}-fig)`, "#5b6aa8", 2, 1);
  c += rim(cBody, `url(#${p}-fig)`, wr, 2.6, 0.6);
  c += rim(cLegFar, `url(#${p}-fig)`, wr, 1, 2);
  c += rim(cLegNear, `url(#${p}-fig)`, wr, 2.4, 0.8);
  c += `<path d="${cCollar}" fill="#2c2f52"/><path d="M886 424L914 454" stroke="${wr}" stroke-width="1.4" opacity=".7"/>`;
  c += place(cx, cy, 0.98, 16, true, rim(HEAD_M, `url(#${p}-fig)`, "#ffe2b0", -2.6, 0.6) + rim(HAIR_M, "#0a0b1a", "#c8d4ff", -1, 2.2) +
    faceMarks(true, 1) + `<path d="M34 25C31 27 29 28 26 27" fill="none" stroke="#ffe2b0" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><path d="M20 -20L30 -4" stroke="#8f7a6a" stroke-width="1.6" opacity=".8"/>`);
  c += rim(cArm, `url(#${p}-fig)`, wr, 2, 0.6);
  // shackles (glowing star-ink) and chains to the wall rings
  c += chain(1060, 470, 800, 552, 120) + chain(1080, 480, 870, 610, 90);
  c += `<circle cx="1062" cy="470" r="9" fill="none" stroke="#3a4168" stroke-width="4"/><circle cx="1082" cy="482" r="9" fill="none" stroke="#3a4168" stroke-width="4"/>`;
  c += `<circle cx="800" cy="553" r="46" fill="url(#${p}-ink)" opacity=".7" ${A(p, "pu", 0, 4)}/><circle cx="872" cy="610" r="40" fill="url(#${p}-ink)" opacity=".6" ${A(p, "pu", 2, 4)}/>`;
  c += `<rect x="792" y="540" width="14" height="24" rx="4" fill="#243060" stroke="#9fc2ff" stroke-width="2"/><rect x="864" y="598" width="14" height="24" rx="4" fill="#243060" stroke="#9fc2ff" stroke-width="2" transform="rotate(-20 871 610)"/>`;
  c += `<circle cx="880" cy="370" r="110" fill="url(#${p}-cool)" opacity=".5"/>`;
  b += `<g transform="translate(940 652) scale(.8) translate(-940 -652)">${c}</g>`;

  // dust motes in beam
  for (let i = 0; i < 26; i++) {
    const t = r();
    const y = wy0 + 60 + t * 600;
    const x0 = wx0 - (y - wy0 - 30) * (470 / 650);
    const x = x0 + r() * (140 + t * 30);
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.8 + r() * 1.6)}" fill="#eef3ff" ${A(p, i % 2 ? "up" : "tw", r() * 8, 5 + r() * 5)}/>`;
  }
  // straw and floor details
  let straw = "";
  for (let i = 0; i < 40; i++) {
    const x = 760 + r() * 420;
    const y = 646 + r() * 30;
    const a = (r() - 0.5) * 0.8;
    straw += `M${n1(x)} ${n1(y)}l${n1(Math.cos(a) * 22)} ${n1(Math.sin(a) * 6)}`;
  }
  b += `<path d="${straw}" stroke="#6b5a48" stroke-width="1.6" opacity=".5"/>`;
  // vignette
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.1], [1, "#02030a", 0.85]], 0.5, 0.45, 0.75), b);
}

/** sky lantern symbol: glowing paper lantern with halo, height ≈40 */
function lanternSym(id: string, halo: string): string {
  return `<g id="${id}"><circle r="46" cy="-2" fill="url(#${halo})"/>` +
    `<path d="M-13 -22Q0 -26 13 -22L10 16Q0 19 -10 16Z" fill="#f6c77a"/>` +
    `<path d="M-6 -21Q0 -23 6 -21L5 15Q0 17 -5 15Z" fill="#fff0c8" opacity=".85"/>` +
    `<ellipse cy="15" rx="10" ry="3" fill="#fff6dc"/></g>`;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_lantern — Ch3: the bridge on the lantern festival night
// ────────────────────────────────────────────────────────────────────────────
function cgLantern(): string {
  const p = "cg_lantern";
  const r = rng(303);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#070a1c"],
      [0.45, "#1a2150"],
      [0.72, "#3b3a78"],
      [0.9, "#7a5a78"],
    ]) +
    glowGrad(`${p}-h`, "#f6c77a", 0.55, 0.14) +
    glowGrad(`${p}-big`, "#f0b86a", 0.5, 0.15) +
    glowGrad(`${p}-ink`, "#8fb8ff", 0.95, 0.3) +
    lg(`${p}-water`, 0, 0, 0, 1, [
      [0, "#3a3666"],
      [1, "#0b0e26"],
    ]) +
    lg(`${p}-fg`, 0, 0, 0, 1, [
      [0, "#07081a", 0],
      [0.5, "#07081a", 0.7],
      [1, "#05060f", 1],
    ]) +
    lg(`${p}-cb`, 0, 0, 1, 0, [
      [0, "#1c1a36"],
      [0.5, "#0d0e22"],
      [1, "#1c1a36"],
    ]) +
    lg(`${p}-eb`, 0, 0, 1, 0, [
      [0, "#3a3456"],
      [0.5, "#211f3c"],
      [1, "#3a3456"],
    ]) +
    blurFilter(`${p}-b`, 7) +
    lanternSym(`${p}-l`, `${p}-h`);

  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  b += starField(r, 150, 0, 0, 1600, 380, "#dfe6ff", 1.7, 0.8);
  b += starRing(p, { cx: 900, cy: 1300, rx: 1600, ry: 1250, rot: 8, t0: 205, t1: 330, n: 420, spread: 24, seed: 33, filter: `${p}-b`, op: 0.7, sparkles: 6 }, 3);
  b += `<ellipse cx="800" cy="420" rx="760" ry="260" fill="url(#${p}-big)" opacity=".55"/>`;

  // far city skyline on both banks
  const city = (x0: number, x1: number, base: number, hmax: number, seed: number, fill: string) => {
    const t = rng(seed);
    let d = `M${x0} ${base}`;
    let win = "";
    let x = x0;
    while (x < x1) {
      const w = 22 + t() * 40;
      const h = hmax * (0.35 + t() * 0.65);
      const roof = 12 + t() * 22;
      d += `V${n1(base - h)}L${n1(x + w / 2)} ${n1(base - h - roof)}L${n1(x + w)} ${n1(base - h)}`;
      if (t() < 0.18) d += `L${n1(x + w * 0.5)} ${n1(base - h - roof - 50 - t() * 40)}L${n1(x + w * 0.62)} ${n1(base - h - roof * 0.6)}`;
      for (let k = 0; k < 2; k++) if (t() < 0.6) win += `M${Math.round(x + 6 + t() * (w - 12))} ${Math.round(base - 8 - t() * (h - 16))}h0`;
      x += w;
      d += `L${n1(x)} ${n1(base - h)}`;
    }
    return `<path d="${d}V${base}Z" fill="${fill}"/><path d="${win}" stroke="#f6d48f" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`;
  };
  b += city(-20, 560, 520, 150, 5, "#2b2d5a") + city(1040, 1640, 520, 160, 6, "#2b2d5a");
  b += city(-20, 420, 540, 200, 7, "#1b1c40") + city(1180, 1640, 540, 210, 8, "#1b1c40");
  // river
  b += `<rect y="520" width="1600" height="380" fill="url(#${p}-water)"/>`;
  let refl = "";
  for (let i = 0; i < 60; i++) {
    const x = r() * 1600;
    const y = 530 + r() * 90;
    refl += `M${Math.round(x)} ${Math.round(y)}h${Math.round(8 + r() * 30)}`;
  }
  b += `<path d="${refl}" stroke="#f6c77a" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`;
  b += `<path d="M560 520Q800 470 1040 520" fill="none" stroke="#2b2d5a" stroke-width="10"/>`;

  // lanterns: far = warm dots, mid/near = symbols (a few drifting)
  const farL: Pt[] = [];
  for (let i = 0; i < 300; i++) farL.push([r() * 1600, 40 + Math.pow(r(), 0.8) * 480]);
  b += dotPath(farL, 3, "#f6c77a", 0.75) + dotPath(farL.slice(0, 140), 7, "#f6c77a", 0.15);
  let lan = "";
  let an = 0;
  for (let i = 0; i < 90; i++) {
    const x = r() * 1600;
    const y = 30 + r() * 470;
    const sc = 0.18 + Math.pow(r(), 2.2) * 0.5;
    const extra = an < 24 && sc > 0.28 ? ` ${A(p, "up", r() * 8, 7 + r() * 6)}` : "";
    if (extra) an++;
    lan += useAt(`${p}-l`, x, y, sc, (r() - 0.5) * 16, 1, extra);
  }
  b += lan;
  // a couple of near lanterns framing
  b += useAt(`${p}-l`, 300, 140, 1.4, -6, 1, ` ${A(p, "up", 1, 10)}`) + useAt(`${p}-l`, 1320, 90, 1.1, 8, 1, ` ${A(p, "up", 4, 11)}`) + useAt(`${p}-l`, 1080, 250, 0.8, 4);

  // bridge balustrade (figures stand in front of it)
  let bal = `M0 600H1600V618H0Z`;
  for (let x = 12; x < 1600; x += 46) bal += `M${x} 618h22v70h-22z`;
  b += `<path d="M0 584H1600V604H0Z" fill="#3a3a64"/><path d="M0 584H1600" stroke="#f0c888" stroke-width="2.4" opacity=".6"/>`;
  b += `<path d="${bal}" fill="#24264a"/><path d="M0 700H1600V900H0Z" fill="#191a36"/><path d="M0 700H1600M0 740H1600M0 800H1600M200 700L60 900M520 700L440 900M1080 700L1160 900M1400 700L1540 900" stroke="#2c2c52" stroke-width="3"/>`;
  b += `<rect y="560" width="1600" height="340" fill="url(#${p}-fg)"/>`;

  // ── figures from behind: Estelle (left) & Cassian (right), very close ──
  const rimW = "#ffd79a";
  const cHead = "M862 256C884 256 900 272 900 296C900 318 890 336 876 342L876 358L848 358L848 342C834 336 824 318 824 296C824 272 840 256 862 256Z";
  const cHair = "M862 250C888 250 906 270 904 298C904 312 900 322 894 330L898 344C890 342 884 338 880 332L874 346C870 340 866 336 862 334L852 346C850 340 848 336 846 330L832 342C832 334 830 326 826 318C818 300 820 270 838 258C844 254 852 250 862 250Z";
  const cBody = "M848 350C818 354 786 364 772 386C760 406 756 444 754 486C752 546 756 640 762 720H968C972 640 972 546 966 486C962 440 954 404 944 386C930 364 904 354 876 350Z";
  const cCloakFold = "M790 400C800 470 800 560 796 700M930 410C924 480 928 580 936 700M862 380C866 460 862 560 866 700";
  const eHead = "M746 296C766 296 780 312 780 334C780 354 770 370 758 374L758 388L734 388L734 374C722 368 712 354 712 334C712 312 726 296 746 296Z";
  const eHair = "M746 290C770 290 786 308 786 334C786 360 784 390 790 416C780 420 770 418 764 414C766 424 762 432 756 436C752 428 746 424 740 424C736 432 728 436 718 436C722 426 722 416 718 408C708 412 700 410 694 404C704 390 706 372 706 350C704 314 720 290 746 290Z";
  const eMuff = "M716 386C732 392 766 392 784 384C792 394 792 408 784 414C766 422 734 422 716 414C708 406 708 394 716 386Z";
  const eBody = "M724 400C700 406 686 424 680 450C674 490 674 560 676 720H812C814 600 812 520 806 470C802 440 796 418 776 404Z";
  let fg = `<g filter="url(#${p}-b)" opacity=".55"><path d="${cBody}${cHair}${eBody}${eHair}" fill="none" stroke="#ffcf8a" stroke-width="9"/></g>`;
  fg += rim(cBody, `url(#${p}-cb)`, rimW, 0, 2.4);
  fg += `<path d="${cCloakFold}" fill="none" stroke="#2c2a4c" stroke-width="3"/>`;
  fg += rim(cHead, "#12122a", rimW, 0, 2) + rim(cHair, "#0a0a1c", rimW, 0, 2.2);
  fg += `<path d="M846 272C852 262 866 258 878 262M836 290C840 278 846 270 856 266" fill="none" stroke="#6a5a78" stroke-width="1.6" opacity=".7"/>`;
  fg += rim(eBody, `url(#${p}-eb)`, rimW, 0, 2.4);
  fg += `<g transform="rotate(12 746 380)">${rim(eHead, "#1a1428", rimW, 0, 2)}${rim(eHair, "#1e1420", rimW, 0, 2.2)}` +
    `<path d="M732 300C716 320 712 360 718 400M756 298C770 320 774 360 772 400M744 296C742 340 740 380 742 420" fill="none" stroke="#8a6a6a" stroke-width="1.6" opacity=".6"/>` +
    `<path d="M720 410C730 420 750 420 762 414C768 420 776 418 784 412" fill="none" stroke="#dfe6ff" stroke-width="1.6" opacity=".7"/>` +
    `${rim(eMuff, "#d9cbb8", "#fff4e0", 0, 2)}<path d="M722 398C740 404 764 404 780 396" fill="none" stroke="#a89886" stroke-width="2" opacity=".7"/></g>`;
  // arms down, hands almost touching; star-ink chain between wrists
  fg += rim("M800 430C810 470 812 520 806 560C804 572 794 574 790 564C790 530 790 480 786 440Z", "#2a2644", rimW, 1.5, 1.5);
  fg += rim("M778 436C764 480 762 530 772 566C776 576 786 574 786 562C786 520 790 480 796 440Z", "#1a1830", rimW, -1.5, 1.5);
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  b += `<path d="M787 566Q792 596 800 566" fill="none" stroke="#8fb8ff" stroke-width="5" opacity=".45" ${A(p, "pu", 0, 3.5)}/><path d="M787 566Q792 596 800 566" fill="none" stroke="#e8f0ff" stroke-width="1.4"/>`;
  b += `<circle cx="793" cy="576" r="40" fill="url(#${p}-ink)" opacity=".7" ${A(p, "pu", 1.2, 3.5)}/>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [
    [0, "#fff"],
    [0.7, "#fff"],
    [1, "#fff", 0],
  ]) + `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="600" y="220" width="420" height="500" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_confession — Ch5: hands clasped through the bars
// ────────────────────────────────────────────────────────────────────────────
function cgConfession(): string {
  const p = "cg_confession";
  const r = rng(404);
  const defs =
    rg(`${p}-bg`, [
      [0, "#2a3470"],
      [0.5, "#121838"],
      [1, "#05060f"],
    ], 0.45, 0.35, 0.75) +
    lg(`${p}-bar`, 0, 0, 1, 0, [
      [0, "#0a0c1a"],
      [0.3, "#3c4670"],
      [0.42, "#9aa8d8"],
      [0.55, "#2a3150"],
      [1, "#07080f"],
    ]) +
    lg(`${p}-beam`, 0, 0, 1, 1, [
      [0, "#dfe8ff", 0.35],
      [1, "#b9c9f5", 0],
    ]) +
    lg(`${p}-hisA`, 0, 0, 0, 1, [
      [0, "#4a4f78"],
      [0.4, "#262a4a"],
      [1, "#101226"],
    ]) +
    lg(`${p}-herA`, 0, 0, 0, 1, [
      [0, "#9098c8"],
      [0.35, "#545c90"],
      [1, "#1e2244"],
    ]) +
    lg(`${p}-sleeve`, 0, 0, 0, 1, [
      [0, "#cdd3ee"],
      [0.5, "#7b84b4"],
      [1, "#2a3060"],
    ]) +
    glowGrad(`${p}-ink`, "#8fb8ff", 0.95, 0.3) +
    glowGrad(`${p}-sil`, "#eef2ff", 0.9, 0.3) +
    lg(`${p}-sill`, 0, 0, 0, 1, [
      [0, "#3a4270"],
      [0.15, "#1e2446"],
      [1, "#07081a"],
    ]) +
    blurFilter(`${p}-b`, 10);

  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // stone wall texture behind (soft)
  let st = "";
  for (let y = 40; y < 620; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 1600; x += 150) st += `M${x} ${y}h140v62h-140z`;
  b += `<path d="${st}" fill="none" stroke="#070812" stroke-width="4" opacity=".6"/>`;
  // moonbeam from upper left
  b += `<path d="M180 -20L560 -20L1100 900L420 900Z" fill="url(#${p}-beam)"/>`;
  // bokeh (static) in the dark cell
  for (let i = 0; i < 14; i++) b += `<circle cx="${n1(r() * 1600)}" cy="${n1(r() * 500)}" r="${n1(10 + r() * 30)}" fill="#9fb4e8" opacity="${n1(0.04 + r() * 0.08)}"/>`;

  // his arm (inside the cell, from the right, behind the bars)
  const hisArm = "M1640 190C1480 230 1300 280 1120 330C1040 352 960 368 900 378L884 440C950 432 1040 420 1130 400C1310 360 1480 320 1640 300Z";
  const hisHand = "M906 376C880 372 850 372 826 378C806 384 790 396 780 410C774 420 776 430 786 432C790 442 796 450 806 450C812 456 822 458 830 454C840 458 850 456 856 450C868 448 880 446 890 440Z";
  b += `<g filter="url(#${p}-b)" opacity=".5"><path d="${hisArm}" fill="none" stroke="#9fb4d8" stroke-width="10"/></g>`;
  b += rim(hisArm, `url(#${p}-hisA)`, "#9fb4d8", 0, 3);
  // shackle + chain
  b += `<circle cx="960" cy="400" r="120" fill="url(#${p}-ink)" opacity=".55" ${A(p, "pu", 0, 4.5)}/>`;
  b += `<path d="M944 360L988 352L1000 418L956 426Z" fill="#232c58" stroke="#a9c8ff" stroke-width="2.5"/><path d="M952 372L990 366M958 408L996 402" stroke="#6f95e8" stroke-width="2"/>`;
  b += chain(978, 420, 1040, 900, 60, "#141830", "#5a6aa8", 9);
  b += rim(hisHand, `url(#${p}-hisA)`, "#b9c6f2", 0, 2.6);
  // his silver ring scar (between hand and shackle)
  b += `<g ${A(p, "pu", 1, 3)}><ellipse cx="918" cy="408" rx="8" ry="32" transform="rotate(-8 918 408)" fill="none" stroke="#dfe6ff" stroke-width="2"/></g>`;

  // bars (vertical, rounded iron)
  const bars = [300, 680, 1060, 1440];
  let bar = "";
  for (const x of bars) bar += `<rect x="${x - 26}" y="-10" width="52" height="700" fill="url(#${p}-bar)"/>`;
  bar += `<rect x="0" y="92" width="1600" height="34" fill="#141830"/><rect x="0" y="92" width="1600" height="4" fill="#8a98c8" opacity=".6"/>`;
  b += bar;
  // stone sill
  b += `<path d="M0 600H1600V900H0Z" fill="url(#${p}-sill)"/><path d="M0 600H1600" stroke="#7d8ac0" stroke-width="2" opacity=".6"/>`;

  // her arm (outside, from the lower left, in front of the bars)
  const herSleeve = "M-40 760C60 700 200 610 330 540C400 504 470 470 540 446L584 520C520 548 450 580 380 620C250 690 120 780 20 900H-40Z";
  const herArm = "M540 450C600 432 660 418 720 410L736 466C670 478 610 496 560 516Z";
  const herHand = "M716 408C736 400 758 396 780 396C800 396 820 398 838 394C852 392 864 396 866 404C866 410 860 414 850 414C864 418 870 426 864 432C858 438 846 436 836 432C846 440 846 450 838 454C828 458 816 452 808 446C800 452 790 454 780 450C764 456 748 462 732 466Z";
  b += rim(herArm, `url(#${p}-herA)`, "#eef1ff", 0, 3);
  b += rim(herSleeve, `url(#${p}-sleeve)`, "#ffffff", 0, 3);
  b += `<path d="M120 780C200 700 300 630 420 570M200 760C280 690 380 630 480 590" fill="none" stroke="#3c4478" stroke-width="3" opacity=".6"/>`;
  b += rim(herHand, `url(#${p}-herA)`, "#f4f6ff", 0, 2.4);
  // finger separations & ink stains
  b += `<path d="M850 414C836 416 822 418 808 420M836 432C824 432 812 432 800 432M808 446C800 444 790 442 782 440" fill="none" stroke="#1e2244" stroke-width="2.2" stroke-linecap="round"/>`;
  b += `<g fill="#27407a" opacity=".85"><ellipse cx="846" cy="402" rx="6" ry="3"/><ellipse cx="826" cy="438" rx="4" ry="2.4"/><ellipse cx="788" cy="408" rx="3" ry="2"/></g>`;
  // his thumb over the back of her hand, his fingertips curling up under her palm
  b += rim("M896 386C878 380 858 380 842 386C832 390 828 398 834 402C846 400 862 398 878 400C888 402 896 398 896 386Z", `url(#${p}-hisA)`, "#b9c6f2", 0, 2);
  b += rim("M784 452C778 462 780 472 790 474C800 476 808 468 810 458ZM806 456C802 468 806 478 816 478C826 478 832 470 832 460ZM832 458C830 468 836 476 846 474C854 472 856 462 854 454Z", `url(#${p}-hisA)`, "#9fb4d8", 0, 2);
  // her ring scar
  b += `<circle cx="712" cy="440" r="70" fill="url(#${p}-sil)" opacity=".35" ${A(p, "pu", 2, 3)}/>`;
  b += `<ellipse cx="712" cy="438" rx="8" ry="30" transform="rotate(-10 712 438)" fill="none" stroke="#eef2ff" stroke-width="2.2"/>`;
  b += `<ellipse cx="712" cy="438" rx="8" ry="30" transform="rotate(-10 712 438)" fill="none" stroke="#8fb8ff" stroke-width="6" opacity=".35"/>`;
  // glow where the hands meet
  b += `<circle cx="820" cy="424" r="170" fill="url(#${p}-sil)" opacity=".16"/>`;

  // tears: drops on the stone sill + one falling
  let tears = "";
  const tp: [number, number, number][] = [[760, 640, 7], [812, 660, 5], [700, 668, 4], [850, 636, 4], [790, 690, 3], [742, 612, 3]];
  for (const [x, y, s2] of tp) tears += `<ellipse cx="${x}" cy="${y}" rx="${s2 * 1.8}" ry="${s2 * 0.6}" fill="#9fb4e8" opacity=".5"/><ellipse cx="${x - s2 * 0.5}" cy="${y - s2 * 0.2}" rx="${s2 * 0.6}" ry="${s2 * 0.2}" fill="#fff"/>`;
  b += tears;
  b += `<path d="M806 488Q812 500 806 506Q800 500 806 488Z" fill="#eaf0ff" ${A(p, "tw", 0, 2.4)}/><path d="M770 530Q775 540 770 545Q765 540 770 530Z" fill="#eaf0ff" ${A(p, "tw", 1.2, 2.4)}/>`;
  // motes in the beam
  for (let i = 0; i < 18; i++) {
    const y = r() * 600;
    const x = 200 + y * 0.6 + r() * 380;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.8 + r() * 1.5)}" fill="#eef3ff" ${A(p, "up", r() * 8, 6 + r() * 5)}/>`;
  }
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.65, "#000", 0.15], [1, "#02030a", 0.9]], 0.5, 0.45, 0.72), b);
}

export const CGS: Record<string, string> = {
  cg_oath: cgOath(),
  cg_meet: cgMeet(),
  cg_lantern: cgLantern(),
  cg_confession: cgConfession(),
};
