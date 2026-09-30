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
  band?: boolean;
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
  let out = c.band === false ? `<g opacity="${op}">` : `<g opacity="${op}"><g fill="none" stroke="${glow}" stroke-linecap="round"${f}>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 6)}" opacity=".07"/>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 3.4)}" opacity=".1"/>` +
    `<path d="${arc}" stroke-width="${n1(c.spread * 1.6)}" opacity=".14"/>` +
    `<path d="${arc}" stroke="${color}" stroke-width="${n1(c.spread * 0.6)}" opacity=".12"/></g>`;
  if (c.band === false) out = `<g opacity="${op}">`;
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

/** letter-like rune: 2–4 short strokes (jamo / ancient script feel) */
function runeD(r: () => number, x: number, y: number, s: number): string {
  let d = "";
  let cx = x;
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(r() * 6);
    const X = n1(cx), Y = n1(y + (r() - 0.5) * s * 0.3);
    if (k === 0) d += `M${X} ${n1(y - s * 0.5)}v${n1(s)}`;
    else if (k === 1) d += `M${n1(cx - s * 0.3)} ${Y}h${n1(s * 0.7)}`;
    else if (k === 2) d += `M${n1(cx - s * 0.3)} ${n1(y - s * 0.4)}h${n1(s * 0.6)}v${n1(s * 0.8)}`;
    else if (k === 3) d += `M${X} ${Y}m-${n1(s * 0.3)} 0a${n1(s * 0.3)} ${n1(s * 0.3)} 0 1 0 ${n1(s * 0.6)} 0a${n1(s * 0.3)} ${n1(s * 0.3)} 0 1 0 -${n1(s * 0.6)} 0`;
    else if (k === 4) d += `M${n1(cx - s * 0.3)} ${n1(y + s * 0.4)}q${n1(s * 0.3)} -${n1(s * 0.9)} ${n1(s * 0.6)} 0`;
    else d += `M${n1(cx - s * 0.3)} ${n1(y - s * 0.4)}l${n1(s * 0.6)} ${n1(s * 0.8)}`;
    cx += s * (0.35 + r() * 0.4);
  }
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
function faceMarks(m: boolean, op = 1, smile = false, closed = false): string {
  if (closed) {
    return `<g opacity="${op}"><path d="M21 -8C25 -5 29 -5 33 -8" fill="none" stroke="#070a1c" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M26 4C29 10 29 18 26 24" fill="none" stroke="#e8c8d0" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></g>`;
  }
  const sm = smile ? `<path d="M35 23C33 26 30 27 27 26" fill="none" stroke="#070a1c" stroke-width="1.8" stroke-linecap="round"/>` : "";
  const eye = m ? "M21 -9C25 -12 29 -12 32 -9" : "M21 -8C25 -12 29 -12 33 -8L34 -10";
  return `<g opacity="${op}"><path d="${eye}" fill="none" stroke="#070a1c" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="28.5" cy="-7.5" r="1.7" fill="#eef2ff"/>` +
    `<path d="M26 4C29 10 29 18 26 24" fill="none" stroke="#b9c6f2" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>${sm}</g>`;
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
      [0, "#2a2a58"],
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

// standing bodies in head-local units (head height 100, facing +x)
const F_BODY = "M-16 68C-34 78 -46 96 -48 122C-50 162 -44 210 -44 262C-46 332 -54 402 -62 480H62C56 402 48 334 44 272C42 230 46 190 42 160C38 130 32 110 24 96C18 86 14 78 12 68Z";
const M_BODY = "M-22 70C-46 80 -64 100 -68 132C-72 182 -64 242 -60 302C-58 362 -62 422 -64 480H64C62 422 60 362 58 302C56 242 62 182 52 132C48 106 32 88 12 72Z";

/** world position of a head-local point */
function wpt(lx: number, ly: number, x: number, y: number, s: number, rot: number, flip: boolean): Pt {
  const a = (rot * Math.PI) / 180;
  const X = (flip ? -lx : lx) * s;
  const Y = ly * s;
  return [x + X * Math.cos(a) - Y * Math.sin(a), y + X * Math.sin(a) + Y * Math.cos(a)];
}

/** fir tree silhouette with snow ledges */
function fir(x: number, base: number, h: number, w: number, fill: string, snow: string | null): string {
  let d = `M${n1(x)} ${n1(base - h)}`;
  const tiers = 5;
  let sn = "";
  for (let i = 1; i <= tiers; i++) {
    const y = base - h + (h * 0.9 * i) / tiers;
    const hw = (w / 2) * (0.35 + (0.65 * i) / tiers);
    d += `L${n1(x + hw)} ${n1(y)}L${n1(x + hw * 0.45)} ${n1(y - h * 0.04)}`;
    if (snow) sn += `M${n1(x + hw * 0.1)} ${n1(y - h * 0.1)}Q${n1(x + hw * 0.6)} ${n1(y - h * 0.06)} ${n1(x + hw)} ${n1(y)}`;
  }
  d += `L${n1(x + w * 0.06)} ${n1(base)}L${n1(x - w * 0.06)} ${n1(base)}`;
  for (let i = tiers; i >= 1; i--) {
    const y = base - h + (h * 0.9 * i) / tiers;
    const hw = (w / 2) * (0.35 + (0.65 * i) / tiers);
    d += `L${n1(x - hw * 0.45)} ${n1(y - h * 0.04)}L${n1(x - hw)} ${n1(y)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>` + (snow ? `<path d="${sn}" fill="none" stroke="${snow}" stroke-width="${n1(Math.max(1.5, w * 0.03))}" stroke-linecap="round"/>` : "");
}

// ────────────────────────────────────────────────────────────────────────────
// cg_snow_kiss — Cassian route: first kiss in the snowfield at blue dusk
// ────────────────────────────────────────────────────────────────────────────
function cgSnowKiss(): string {
  const p = "cg_snow_kiss";
  const r = rng(505);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#141c48"],
      [0.35, "#2e3c7c"],
      [0.55, "#6a6aa6"],
      [0.66, "#c8a0b8"],
      [0.7, "#e8c0c0"],
    ]) +
    glowGrad(`${p}-glow`, "#ffe0e0", 0.8, 0.25) +
    lg(`${p}-snow`, 0, 0, 0, 1, [
      [0, "#c9d2ec"],
      [0.3, "#8e9cc8"],
      [1, "#3a4680"],
    ]) +
    lg(`${p}-bank`, 0, 0, 0, 1, [
      [0, "#aebbd6"],
      [0.4, "#6a78ac"],
      [1, "#2a3468"],
    ]) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#232a58"],
      [0.6, "#161b40"],
      [1, "#0e1230"],
    ]) +
    lg(`${p}-cloak`, 0, 0, 1, 1, [
      [0, "#262c5c"],
      [1, "#0c0f2a"],
    ]) +
    blurFilter(`${p}-b`, 7);

  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  b += starField(r, 120, 0, 0, 1600, 320, "#e6ecff", 1.5, 0.8);
  b += starRing(p, { cx: 800, cy: 1400, rx: 1600, ry: 1300, rot: -6, t0: 205, t1: 335, n: 280, spread: 22, seed: 55, filter: `${p}-b`, op: 0.45, sparkles: 5 }, 3);
  b += `<ellipse cx="800" cy="480" rx="700" ry="260" fill="url(#${p}-glow)" opacity=".7"/>`;
  // distant hills + far fir lines
  b += `<path d="M0 470Q200 420 420 452T820 440T1240 446T1600 430V620H0Z" fill="#7d86bc" opacity=".7"/>`;
  let far = "";
  for (let x = -20; x < 1620; x += 26 + r() * 22) {
    if (x > 560 && x < 1040 && r() < 0.8) continue;
    far += fir(x, 500 + r() * 14, 40 + r() * 50, 18 + r() * 10, "#4c5690", null);
  }
  b += far;
  b += `<path d="M0 510Q400 486 800 500T1600 496V900H0Z" fill="url(#${p}-snow)"/>`;
  // mid firs (left/right framing, snow-laden)
  let mid = "";
  const mids: [number, number, number, number][] = [[120, 560, 300, 130], [250, 540, 230, 100], [40, 600, 380, 160], [370, 530, 160, 70], [1480, 570, 320, 140], [1340, 540, 240, 100], [1580, 610, 400, 170], [1230, 530, 170, 72], [470, 520, 110, 50], [1130, 520, 120, 52]];
  for (const [x, base, h, w] of mids) mid += fir(x, base, h, w, "#1a2254", "#c9d4f0");
  b += mid;
  // footprints trail
  let fp = "";
  for (let i = 0; i < 9; i++) fp += `<ellipse cx="${n1(540 - i * 46 + (i % 2) * 10)}" cy="${n1(600 + i * 16)}" rx="${n1(6 + i * 0.8)}" ry="${n1(2.4 + i * 0.3)}" fill="#5a66a0" opacity=".6"/>`;
  b += fp;

  // ── the couple, profiles meeting ──
  const cx = 852, cyy = 296, cs = 1.02, crot = -16; // Cassian, facing left
  const lip = wpt(38, 26, cx, cyy, cs, crot, true);
  const es = 0.9, erot = -20;
  const el = wpt(37, 24, 0, 0, es, erot, false);
  const ex = lip[0] - el[0] + 3, ey = lip[1] - el[1] + 1;
  const rimC = "#ffe8ec";
  let fg = `<circle cx="${n1(lip[0])}" cy="${n1(lip[1])}" r="230" fill="url(#${p}-glow)" opacity=".75"/>`;
  const cloak = `M${n1(cx + 40)} ${n1(cyy + 70)}C${n1(cx + 110)} ${n1(cyy + 90)} ${n1(cx + 140)} ${n1(cyy + 200)} ${n1(cx + 150)} ${n1(cyy + 400)}L${n1(ex - 110)} ${n1(cyy + 400)}C${n1(ex - 100)} ${n1(cyy + 300)} ${n1(ex - 70)} ${n1(cyy + 180)} ${n1(ex - 40)} ${n1(cyy + 150)}C${n1(ex - 10)} ${n1(cyy + 120)} ${n1(ex + 20)} ${n1(cyy + 118)} ${n1(ex + 40)} ${n1(cyy + 128)}C${n1(cx - 30)} ${n1(cyy + 110)} ${n1(cx - 10)} ${n1(cyy + 74)} ${n1(cx + 40)} ${n1(cyy + 70)}Z`;
  fg += `<g opacity=".5" filter="url(#${p}-b)"><path d="${cloak}" fill="none" stroke="#ffe0e8" stroke-width="10"/></g>`;
  // Estelle body + hair (behind cloak)
  fg += place(ex, ey, es, erot * 0.3, false, rim(F_BODY, `url(#${p}-fig)`, rimC, -2.4, 1));
  fg += place(ex, ey, es, erot, false, rim(HAIR_MID, "#1c1830", rimC, -2.4, 1.2));
  // Cassian body
  fg += place(cx, cyy, cs, crot * 0.25, true, rim(M_BODY, `url(#${p}-fig)`, rimC, -2.4, 1));
  // heads
  fg += place(ex, ey, es, erot, false, rim(HEAD_F, "#1a1d44", rimC, -2.4, 0.8) + rim(BANGS_F, "#1a1428", rimC, -1.6, 1) + faceMarks(false, 1, false, true));
  fg += place(cx, cyy, cs, crot, true, rim(HEAD_M, "#161a3e", rimC, -2.4, 0.8) + rim(HAIR_M, "#0b0d24", rimC, -1.6, 1.4) + faceMarks(true, 1, false, true));
  // his cloak wrapping around her
  fg += rim(cloak, `url(#${p}-cloak)`, "#c8c8ec", 1.6, 1.8);
  fg += `<path d="M${n1(cx + 60)} ${n1(cyy + 110)}C${n1(cx + 80)} ${n1(cyy + 200)} ${n1(cx + 90)} ${n1(cyy + 300)} ${n1(cx + 96)} ${n1(cyy + 400)}M${n1(ex - 20)} ${n1(cyy + 170)}C${n1(ex - 40)} ${n1(cyy + 240)} ${n1(ex - 50)} ${n1(cyy + 320)} ${n1(ex - 56)} ${n1(cyy + 400)}" fill="none" stroke="#3a4278" stroke-width="3"/>`;
  // his hand on her back, fur trim
  fg += `<path d="M${n1(ex - 30)} ${n1(cyy + 150)}C${n1(ex - 20)} ${n1(cyy + 130)} ${n1(ex + 10)} ${n1(cyy + 124)} ${n1(ex + 40)} ${n1(cyy + 130)}" fill="none" stroke="#dcd6e8" stroke-width="7" stroke-linecap="round" opacity=".85"/>`;
  // her hair tips lit
  fg += place(ex, ey, es, erot, false, `<path d="M-60 90C-62 104 -58 116 -52 124M-40 100C-38 112 -32 122 -26 128" fill="none" stroke="#e8d8e8" stroke-width="2" opacity=".6"/>`);
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  // foreground snowbank
  b += `<path d="M-20 700Q300 620 620 668T1000 650T1620 690V900H-20Z" fill="url(#${p}-bank)"/>`;
  b += `<path d="M-20 700Q300 620 620 668T1000 650T1620 690" fill="none" stroke="#e9eef8" stroke-width="3" opacity=".7"/>`;
  b += fir(-30, 900, 620, 260, "#0e1336", "#aebbd6") + fir(1640, 900, 660, 280, "#0e1336", "#aebbd6");
  // falling snow: static + drifting
  b += starField(r, 140, 0, 0, 1600, 900, "#f4f7ff", 1, 0.8);
  for (let i = 0; i < 30; i++) b += `<circle cx="${n1(r() * 1600)}" cy="${n1(r() * 800)}" r="${n1(1.6 + r() * 2.6)}" fill="#fff" opacity=".85" ${A(p, i % 2 ? "sw" : "up", r() * 7, 6 + r() * 6)}/>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [[0, "#fff"], [0.7, "#fff"], [1, "#fff", 0]]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="0" y="0" width="1600" height="720" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_true — True ending: dawn, the old ring dissolving, a sky of new stars
// ────────────────────────────────────────────────────────────────────────────
function cgTrue(): string {
  const p = "cg_true";
  const r = rng(606);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#141a4a"],
      [0.3, "#3a3a82"],
      [0.46, "#8a6aa0"],
      [0.56, "#e0a0a4"],
      [0.62, "#f6d48f"],
    ]) +
    glowGrad(`${p}-sun`, "#fff0c8", 1, 0.4) +
    glowGrad(`${p}-sunH`, "#f6c88a", 0.7, 0.2) +
    lg(`${p}-city`, 0, 0, 0, 1, [
      [0, "#8a7aa8"],
      [1, "#4a4a80"],
    ]) +
    lg(`${p}-roof`, 0, 0, 0, 1, [
      [0, "#b4aac8"],
      [0.3, "#6e6890"],
      [1, "#26244a"],
    ]) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#3a2e52"],
      [0.6, "#241e3e"],
      [1, "#16142c"],
    ]) +
    lg(`${p}-robe`, 0, 0, 0, 1, [
      [0, "#8a7ea8"],
      [0.4, "#51466e"],
      [1, "#2a2448"],
    ]) +
    `<path id="${p}-pt" d="M0 -7C4 -4 4 4 0 7C-4 4 -4 -4 0 -7Z" fill="#fbf6ee"/>` +
    blurFilter(`${p}-b`, 6);

  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  // thousands of new stars (white + warm), strongest high up
  b += starField(r, 460, 0, 0, 1600, 470, "#f4f6ff", 1.4, 1);
  b += starField(r, 160, 0, 0, 1600, 420, "#ffe2b0", 1.2, 0.9);
  // dissolving old ring: broken segments drifting apart
  const segs: [number, number][] = [[200, 224], [232, 250], [262, 274], [290, 300], [312, 330]];
  let ring = "";
  segs.forEach(([t0, t1], i) => {
    ring += starRing(p, { cx: 800, cy: 1500, rx: 1650, ry: 1340, rot: -8, t0, t1, n: 150, spread: 20 + i * 3, seed: 60 + i, op: 0.85, sparkles: 1, band: false }, 1);
    const [fx, fy] = ellPt({ cx: 800, cy: 1500, rx: 1650, ry: 1340, rot: -8, t0, t1, n: 0, spread: 0 }, (t0 + t1) / 2);
    const fall: Pt[] = [];
    for (let k = 0; k < 40; k++) fall.push([fx + gauss(r) * 160, fy + 20 + Math.pow(r(), 1.5) * 160]);
    ring += dotPath(fall, 2, "#dfe6ff", 0.45);
  });
  b += ring;
  // new stars igniting (sparkles, animated)
  for (let i = 0; i < 18; i++) {
    const x = r() * 1600;
    const y = 20 + Math.pow(r(), 1.3) * 400;
    b += `<path d="${sparkle(x, y, 5 + r() * 9)}" fill="${r() < 0.4 ? "#ffe8c0" : "#ffffff"}" ${A(p, "tw", r() * 4, 3 + r() * 3)}/>`;
  }
  // dawn sun at horizon, center
  b += `<ellipse cx="800" cy="540" rx="900" ry="300" fill="url(#${p}-sunH)" opacity=".8"/>`;
  b += `<circle cx="800" cy="545" r="150" fill="url(#${p}-sun)"/>`;
  // light rays
  let rays = "";
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i + 0.5) * (Math.PI / 9);
    rays += `M800 545L${n1(800 + Math.cos(a - 0.03) * 1200)} ${n1(545 + Math.sin(a - 0.03) * 1200)}L${n1(800 + Math.cos(a + 0.03) * 1200)} ${n1(545 + Math.sin(a + 0.03) * 1200)}Z`;
  }
  b += `<path d="${rays}" fill="#fff0d0" opacity=".04"/>`;
  // capital skyline at horizon
  const t = rng(9);
  let city = "M0 600V560";
  let win = "";
  for (let x = 0; x < 1600; ) {
    const w = 18 + t() * 34;
    const h = 20 + t() * 50 * (1 - Math.abs(x - 800) / 1400);
    city += `V${n1(560 - h)}L${n1(x + w / 2)} ${n1(546 - h - t() * 16)}L${n1(x + w)} ${n1(560 - h)}`;
    if (t() < 0.12) city += `L${n1(x + w * 0.5)} ${n1(500 - h - t() * 60)}L${n1(x + w * 0.6)} ${n1(556 - h)}`;
    if (t() < 0.5) win += `M${Math.round(x + w / 2)} ${Math.round(566 - h * 0.4)}h0`;
    x += w;
    city += `L${n1(x)} ${n1(560 - h)}`;
  }
  b += `<path d="${city}V600H0Z" fill="url(#${p}-city)" opacity=".85"/><path d="${win}" stroke="#ffe2a0" stroke-width="3" stroke-linecap="round"/>`;
  // archive rooftop terrace
  b += `<path d="M0 586L1600 586V900H0Z" fill="url(#${p}-roof)"/>`;
  let bal = "";
  for (let x = 8; x < 1600; x += 30) bal += `M${x} 556h14v30h-14z`;
  b += `<path d="M0 554H1600V588H0Z" fill="#6a5a86"/><path d="M0 546H1600V558H0Z${bal}" fill="#c8c0dc"/><path d="M0 546H1600" stroke="#fff0d0" stroke-width="2"/>`;
  b += `<path d="M0 660H1600M0 760H1600M300 586L120 900M620 586L560 900M980 586L1040 900M1300 586L1480 900" stroke="#6a668e" stroke-width="2" opacity=".5"/>`;
  b += `<ellipse cx="640" cy="668" rx="120" ry="12" fill="#2a2448" opacity=".45"/><ellipse cx="950" cy="664" rx="90" ry="10" fill="#2a2448" opacity=".45"/>`;
  // spires framing left/right
  b += `<path d="M60 900V340L110 180L160 340V900ZM1440 900V300L1500 120L1560 300V900Z" fill="#3a3662"/><path d="M110 180L160 340V900M1500 120L1560 300V900" fill="none" stroke="#f6d48f" stroke-width="3" opacity=".6"/>`;

  // ── figures: Cassian (left) calling; Estelle (right) turning with a smile ──
  const rimC = "#ffe0a8";
  const kx = 660, ky = 378, ks = 0.6; // Cassian facing right
  const ex = 930, ey = 404, es = 0.54; // Estelle facing left (turned back)
  let fg = `<g filter="url(#${p}-b)" opacity=".6">` +
    place(kx, ky, ks, 3, false, `<path d="${M_BODY}${HEAD_M}" fill="none" stroke="#fff0c8" stroke-width="14"/>`) +
    place(ex, ey, es, 0, true, `<path d="${F_BODY}${HEAD_F}" fill="none" stroke="#fff0c8" stroke-width="14"/>`) + `</g>`;
  // Cassian cloak blowing to the left
  const kCloak = "M-30 70C-70 90 -100 150 -120 240C-136 310 -150 400 -170 480H40C20 380 0 260 -30 70Z";
  fg += place(kx, ky, ks, 3, false, rim(kCloak, `url(#${p}-fig)`, rimC, -2, 1) + rim(M_BODY, `url(#${p}-fig)`, rimC, -3, 1));
  // his arm half-raised toward her
  fg += place(kx, ky, ks, 3, false, rim("M30 110C54 128 76 142 98 146C110 148 118 142 124 136C130 132 134 138 130 144C122 156 110 164 94 164C70 164 48 152 20 140Z", `url(#${p}-fig)`, rimC, -2, 1.4));
  fg += place(kx, ky, ks, -6, false, rim(HEAD_M, `url(#${p}-fig)`, "#fff0c8", -3, 0.6) + rim(HAIR_M, "#140f22", rimC, -2, 1.4) + faceMarks(true, 1) +
    `<path d="M36 22C34 26 34 28 36 30" fill="none" stroke="#070a1c" stroke-width="2.4" stroke-linecap="round"/>`);
  // Estelle: robe flowing right (wind), hair streaming
  const eRobe = "M-40 80C-60 140 -70 260 -60 480H140C170 420 200 360 240 330C200 330 150 320 110 280C70 240 50 160 30 80Z";
  const eHairFly = "M20 -40C0 -60 -40 -58 -56 -30C-64 -10 -62 20 -56 50C-50 80 -40 110 -30 130C-10 120 20 110 60 116C100 122 140 110 170 86C130 90 100 80 70 60C50 46 40 20 30 0Z";
  fg += place(ex, ey, es, 0, true, rim(eHairFly, "#2a1e30", rimC, -2, 1));
  fg += place(ex, ey, es, 0, true, rim(eRobe, `url(#${p}-robe)`, "#fff4dc", -3, 1));
  fg += place(ex, ey, es, 0, true, `<path d="M-10 120C0 220 10 340 0 480M40 130C70 220 100 300 150 350" fill="none" stroke="#a89ac0" stroke-width="3" opacity=".6"/>`);
  fg += place(ex, ey, es, -4, true, rim(HEAD_F, `url(#${p}-fig)`, "#fff0c8", -3, 0.6) + rim(BANGS_F, "#2a1e30", rimC, -2, 1) + faceMarks(false, 1, true) +
    `<path d="M20 4C24 8 28 8 32 6" fill="none" stroke="#f0a0a0" stroke-width="4" stroke-linecap="round" opacity=".35"/>`);
  fg += place(ex, ey, es, 0, true, `<path d="M40 70C80 90 120 90 160 80M50 50C90 70 130 70 160 60" fill="none" stroke="#e8d0d8" stroke-width="3" opacity=".6"/>`);
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  // petals (static + drifting)
  let pet = "";
  for (let i = 0; i < 24; i++) pet += `<use href="#${p}-pt" transform="translate(${n1(r() * 1600)} ${n1(120 + r() * 700)}) rotate(${Math.round(r() * 180)}) scale(${Math.round((0.6 + r()) * 100) / 100})" opacity="${n1(0.5 + r() * 0.5)}"/>`;
  b += pet;
  for (let i = 0; i < 14; i++) b += `<g ${A(p, i % 2 ? "sw" : "up", r() * 7, 6 + r() * 5)}><use href="#${p}-pt" transform="translate(${n1(520 + r() * 560)} ${n1(200 + r() * 420)}) rotate(${Math.round(r() * 180)}) scale(${Math.round((0.8 + r()) * 100) / 100})"/></g>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [[0, "#fff"], [0.82, "#fff"], [1, "#fff", 0]]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="0" y="0" width="1600" height="740" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2, b);
}

/** rows of glowing handwriting strokes in a quad (tl, tr, br, bl) */
function scriptRows(r: () => number, q: [Pt, Pt, Pt, Pt], rows: number, size: number, fill = 0.9): string {
  let d = "";
  const lerp = (a: Pt, b2: Pt, t: number): Pt => [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];
  for (let i = 0; i < rows; i++) {
    const v = (i + 0.7) / (rows + 0.4);
    const L = lerp(q[0], q[3], v);
    const R = lerp(q[1], q[2], v);
    let u = 0.04;
    const end = 0.5 + r() * (fill - 0.5) + (i < rows - 1 ? 0.4 : 0);
    while (u < Math.min(0.96, end)) {
      const [x, y] = lerp(L, R, u);
      d += glyphD(r, x, y, size * (0.7 + r() * 0.5));
      u += (size * (1.8 + r() * 1.6)) / Math.hypot(R[0] - L[0], R[1] - L[1]);
    }
  }
  return d;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_newborn — Ch1: writing a baby's name; a new star ignites through the dome
// ────────────────────────────────────────────────────────────────────────────
function cgNewborn(): string {
  const p = "cg_newborn";
  const r = rng(707);
  const defs =
    rg(`${p}-room`, [
      [0, "#2c3a80"],
      [0.5, "#141b46"],
      [1, "#060918"],
    ], 0.5, 0.2, 0.9) +
    lg(`${p}-page`, 0, 0, 0, 1, [
      [0, "#ffffff"],
      [0.5, "#e6ecff"],
      [1, "#aebde8"],
    ]) +
    glowGrad(`${p}-g`, "#bcd4ff", 0.9, 0.3) +
    glowGrad(`${p}-star`, "#ffffff", 1, 0.4) +
    lg(`${p}-hand`, 0, 0, 1, 1, [
      [0, "#e8dcec"],
      [0.4, "#9a94c0"],
      [1, "#34366a"],
    ]) +
    lg(`${p}-sleeve`, 0, 0, 1, 1, [
      [0, "#eef0fa"],
      [0.5, "#9aa4d0"],
      [1, "#3a4478"],
    ]) +
    lg(`${p}-beam`, 0, 0, 0, 1, [
      [0, "#dfe8ff", 0.3],
      [1, "#dfe8ff", 0],
    ]) +
    blurFilter(`${p}-b`, 5);
  let b = `<rect width="1600" height="900" fill="url(#${p}-room)"/>`;
  // dome: coffered rings converging to the oculus
  const ox = 800, oy = 130;
  let ribs = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ribs += `M${n1(ox + Math.cos(a) * 170)} ${n1(oy + Math.sin(a) * 60)}L${n1(ox + Math.cos(a) * 1500)} ${n1(oy + Math.sin(a) * 900)}`;
  }
  let rings = "";
  for (const k of [1.5, 2.3, 3.4, 5]) rings += `<ellipse cx="${ox}" cy="${oy + 20 * k}" rx="${170 * k}" ry="${60 * k}" fill="none" stroke="#3a4a90" stroke-width="${2 + k}" opacity=".6"/>`;
  b += `<path d="${ribs}" stroke="#2c3a7a" stroke-width="4" opacity=".8"/>` + rings;
  // oculus with the star ring visible through it
  b += `<ellipse cx="${ox}" cy="${oy}" rx="190" ry="72" fill="#dfe6ff" opacity=".35"/>`;
  b += `<clipPath id="${p}-oc"><ellipse cx="${ox}" cy="${oy}" rx="172" ry="62"/></clipPath>`;
  b += `<g clip-path="url(#${p}-oc)"><rect x="600" y="60" width="400" height="140" fill="#0a0f2e"/>` +
    starField(r, 80, 620, 60, 980, 200, "#dfe6ff", 1, 1) +
    starRing(p, { cx: 800, cy: 700, rx: 700, ry: 600, rot: -12, t0: 240, t1: 300, n: 260, spread: 16, seed: 71, sparkles: 3 }, 2) + `</g>`;
  b += `<ellipse cx="${ox}" cy="${oy}" rx="172" ry="62" fill="none" stroke="#b9c6f2" stroke-width="3"/>`;
  // the new star igniting
  b += `<circle cx="826" cy="118" r="70" fill="url(#${p}-star)" opacity=".6" ${A(p, "pu", 0, 3)}/>`;
  b += `<g ${A(p, "tw", 0.5, 3)}><path d="${sparkle(826, 118, 26)}" fill="#fff"/></g><path d="${sparkle(826, 118, 12)}" fill="#fff"/>`;
  b += `<ellipse cx="826" cy="118" rx="30" ry="30" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6" ${A(p, "pu", 1, 3)}/>`;
  // shaft of starlight down to the Register
  b += `<path d="M700 150L900 150L1060 620L560 620Z" fill="url(#${p}-beam)"/>`;
  // shelves on side walls
  let sh = "";
  for (let y = 300; y < 700; y += 64) {
    sh += `M0 ${y}H${n1(360 - (y - 300) * 0.2)}M${n1(1240 + (y - 300) * 0.2)} ${y}H1600`;
  }
  let books = "";
  for (let i = 0; i < 90; i++) {
    const left = r() < 0.5;
    const row = Math.floor(r() * 6);
    const y = 300 + row * 64;
    const x = left ? r() * 320 : 1280 + r() * 320;
    books += `M${Math.round(x)} ${y - 4}v${-Math.round(30 + r() * 20)}`;
  }
  b += `<path d="${books}" stroke="#34448a" stroke-width="9" opacity=".7"/><path d="${sh}" stroke="#0a0d24" stroke-width="6"/>`;
  // lectern + the Register (giant open book)
  b += `<path d="M640 900L700 640H900L960 900Z" fill="#141a40"/><path d="M700 640H900" stroke="#6a7ac0" stroke-width="3"/>`;
  b += `<ellipse cx="800" cy="545" rx="420" ry="150" fill="url(#${p}-g)" opacity=".7"/>`;
  const lp = "M800 468C720 444 600 446 480 462L440 640C560 626 690 630 800 656Z";
  const rpg = "M800 468C880 444 1000 446 1120 462L1160 640C1040 626 910 630 800 656Z";
  b += `<path d="M430 650C560 636 700 642 800 668C900 642 1040 636 1170 650L1164 634C1040 622 900 628 800 650C700 628 560 622 436 634Z" fill="#c9cfe8"/>`;
  b += `<path d="${lp}" fill="url(#${p}-page)"/><path d="${rpg}" fill="url(#${p}-page)"/>`;
  b += `<path d="M800 468V656" stroke="#8a98c8" stroke-width="3"/>`;
  // names already written (glowing blue ink)
  const wr = scriptRows(r, [[500, 478], [780, 480], [790, 640], [470, 626]], 7, 8);
  const wr2 = scriptRows(r, [[820, 480], [1100, 478], [1130, 626], [812, 632]], 4, 8, 0.6);
  b += `<path d="${wr}${wr2}" fill="none" stroke="#5e8fe8" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>`;
  // the name being written right now (bright)
  const fresh = glyphD(r, 850, 574, 11) + glyphD(r, 872, 572, 10) + glyphD(r, 893, 574, 11);
  b += `<g filter="url(#${p}-b)"><path d="${fresh}" fill="none" stroke="#8fb8ff" stroke-width="6" stroke-linecap="round"/></g>`;
  b += `<path d="${fresh}" fill="none" stroke="#eef4ff" stroke-width="2" stroke-linecap="round"/>`;
  b += `<circle cx="918" cy="574" r="36" fill="url(#${p}-g)" ${A(p, "pu", 0, 2.4)}/>`;
  // thread of light from the pen up to the new star
  b += `<path d="M918 574C900 420 860 260 826 130" fill="none" stroke="#dfe8ff" stroke-width="1.4" stroke-dasharray="2 10" stroke-linecap="round" opacity=".6"/>`;
  // Estelle's hand with the pen (from lower right), ink-stained
  const sleeve = "M1150 900C1120 820 1090 740 1050 676C1080 640 1140 610 1200 600C1240 660 1300 760 1360 900Z";
  const hand = "M1090 688C1064 662 1034 638 1002 620C984 610 966 602 948 596C936 592 926 592 926 598C928 604 940 606 952 610C944 614 938 620 940 626C944 632 956 630 966 628C966 636 972 644 982 646C986 654 996 658 1008 660C1030 668 1050 684 1068 700Z";
  const pen = "M916 580L1040 430L1046 434L924 586Z";
  b += `<path d="${pen}" fill="#2c3464"/><path d="M1040 430C1060 400 1090 380 1120 376C1100 400 1080 420 1046 434Z" fill="#dfe6ff" opacity=".85"/>`;
  b += `<path d="M916 580L924 586L918 576Z" fill="#8fb8ff"/>`;
  b += rim(hand, `url(#${p}-hand)`, "#eef3ff", 1.5, 2) + rim(sleeve, `url(#${p}-sleeve)`, "#ffffff", 1.5, 2);
  b += `<path d="M1050 676C1090 650 1140 626 1200 600M1110 700C1140 760 1170 820 1190 900M1220 680C1250 740 1280 820 1300 900" fill="none" stroke="#6a74a8" stroke-width="3" opacity=".7"/><path d="M952 610C962 614 972 618 980 624M966 628C974 632 980 638 984 646" fill="none" stroke="#3a4274" stroke-width="1.8" stroke-linecap="round"/>`;
  b += `<g fill="#34489a" opacity=".85"><ellipse cx="934" cy="596" rx="5" ry="2.5"/><ellipse cx="940" cy="640" rx="4" ry="2"/><ellipse cx="966" cy="606" rx="3" ry="1.6"/></g>`;
  // drifting motes in the shaft
  for (let i = 0; i < 18; i++) b += `<circle cx="${n1(640 + r() * 320)}" cy="${n1(180 + r() * 400)}" r="${n1(1 + r() * 1.6)}" fill="#eef3ff" ${A(p, "up", r() * 8, 6 + r() * 4)}/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.7, "#000", 0.1], [1, "#02030a", 0.8]], 0.5, 0.4, 0.75), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_letter — Ch2: a letter burning in the candle flame
// ────────────────────────────────────────────────────────────────────────────
function cgLetter(): string {
  const p = "cg_letter";
  const r = rng(808);
  const defs =
    rg(`${p}-bg`, [
      [0, "#3a2a2a"],
      [0.4, "#1a1428"],
      [1, "#06060f"],
    ], 0.45, 0.5, 0.7) +
    glowGrad(`${p}-fire`, "#ffb060", 0.9, 0.3) +
    glowGrad(`${p}-warm`, "#f6c77a", 0.55, 0.15) +
    lg(`${p}-flame`, 0, 1, 0, 0, [
      [0, "#fff6dc"],
      [0.35, "#f6d48f"],
      [0.75, "#e5a654"],
      [1, "#b8742e", 0],
    ]) +
    lg(`${p}-paper`, 0, 1, 1, 0, [
      [0, "#f6d8a8"],
      [0.4, "#efe4cf"],
      [1, "#b8ae9c"],
    ]) +
    lg(`${p}-desk`, 0, 0, 0, 1, [
      [0, "#3a2418"],
      [1, "#120a08"],
    ]) +
    lg(`${p}-wax`, 0, 0, 1, 0, [
      [0, "#e8dcc8"],
      [0.4, "#fff4e0"],
      [1, "#9a8a78"],
    ]) +
    blurFilter(`${p}-b`, 5);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // stone wall hint + bokeh
  for (let i = 0; i < 12; i++) b += `<circle cx="${n1(r() * 1600)}" cy="${n1(r() * 520)}" r="${n1(14 + r() * 40)}" fill="#f6c77a" opacity="${n1(0.03 + r() * 0.06)}"/>`;
  b += `<circle cx="760" cy="440" r="620" fill="url(#${p}-warm)" opacity=".7"/>`;
  // desk
  b += `<path d="M0 620Q800 600 1600 620V900H0Z" fill="url(#${p}-desk)"/><path d="M0 620Q800 600 1600 620" stroke="#8a5a34" stroke-width="2" opacity=".6"/>`;
  b += `<path d="M0 680Q800 664 1600 690M0 760Q800 744 1600 770" stroke="#241410" stroke-width="3" opacity=".6"/>`;
  // candle
  b += `<ellipse cx="700" cy="640" rx="80" ry="16" fill="#1a0f0a" opacity=".7"/>`;
  b += `<path d="M660 520V630Q700 646 740 630V520Z" fill="url(#${p}-wax)"/><ellipse cx="700" cy="520" rx="40" ry="10" fill="#fff4e0"/><path d="M674 522Q672 560 678 574Q684 560 682 524Z" fill="#fff4e0"/>`;
  b += `<path d="M640 630Q700 660 760 630L770 640Q700 672 630 640Z" fill="#6a4a2a"/>`;
  b += `<path d="M700 520V500" stroke="#2a1a10" stroke-width="3"/>`;
  // flame
  b += `<circle cx="700" cy="470" r="200" fill="url(#${p}-fire)" opacity=".55"/>`;
  b += `<g ${A(p, "fl", 0, 2.2)}><path d="M700 402C712 430 728 452 726 478C724 498 712 508 700 508C688 508 676 498 674 478C672 452 688 430 700 402Z" fill="url(#${p}-flame)"/>` +
    `<path d="M700 450C706 464 712 476 710 488C708 498 704 502 700 502C696 502 692 498 690 488C688 476 694 464 700 450Z" fill="#fffaf0"/></g>`;
  // the letter, lower-left corner burning into the flame
  const T = "translate(548 250) rotate(-14)";
  const paperD = "M60 0L420 20L400 300L200 290C180 270 190 250 160 240C140 230 150 210 120 200C100 190 110 160 80 150C60 140 70 120 48 110Z";
  const charD = "M200 290C180 270 190 250 160 240C140 230 150 210 120 200C100 190 110 160 80 150C60 140 70 120 48 110L62 106C82 118 76 136 96 146C124 158 116 184 136 194C164 204 160 226 176 234C202 246 196 268 214 284Z";
  b += `<g transform="${T}"><path d="M70 10L430 32L410 310L210 300Z" fill="#000" opacity=".25" transform="translate(12 16)"/>` +
    `<path d="${paperD}" fill="url(#${p}-paper)"/>` +
    `<path d="M400 20C412 120 408 220 400 300" fill="none" stroke="#8a7a68" stroke-width="3" opacity=".5"/>` +
    `<path d="${charD}" fill="#1a0e0a"/>` +
    `<g filter="url(#${p}-b)"><path d="M204 294C184 272 192 252 162 242C142 232 152 212 122 202C102 192 112 162 82 152C62 142 72 122 50 112" fill="none" stroke="#ff9a40" stroke-width="7"/></g>` +
    `<path d="M204 294C184 272 192 252 162 242C142 232 152 212 122 202C102 192 112 162 82 152C62 142 72 122 50 112" fill="none" stroke="#ffe0a0" stroke-width="2"/>`;
  // first line: glowing golden strokes (the title line); other lines ink
  const first = scriptRows(r, [[110, 40], [360, 52], [360, 82], [110, 70]], 1, 13, 0.95);
  const rest = scriptRows(r, [[150, 90], [390, 104], [380, 290], [210, 280]], 7, 7, 0.9);
  b += `<path d="${first}" fill="none" stroke="#e5a654" stroke-width="5" stroke-linecap="round" opacity=".5"/><path d="${first}" fill="none" stroke="#fff0c8" stroke-width="2" stroke-linecap="round"/>`;
  b += `<path d="${rest}" fill="none" stroke="#3a2a30" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>` +
    // curling top-right corner
    `<path d="M360 16L420 20L416 78C400 60 380 40 360 16Z" fill="#8a7a64"/><path d="M360 16C384 30 400 52 416 78C396 70 372 50 360 16Z" fill="#d8ccb4"/>` +
    // flames licking along the burning edge
    `<g ${A(p, "fl", 1, 1.8)}><path d="M90 150C70 120 84 90 76 60C100 86 104 110 118 130C124 110 120 96 128 80C146 110 140 150 132 176Z" fill="url(#${p}-flame)" opacity=".9"/></g>` +
    `<g ${A(p, "fl", 0.4, 2.1)}><path d="M150 236C136 210 146 186 142 164C160 186 164 204 176 222C180 206 178 194 184 182C198 208 194 236 186 256Z" fill="url(#${p}-flame)" opacity=".85"/></g></g>`;
  // embers rising
  for (let i = 0; i < 26; i++) {
    const x = 640 + r() * 260;
    const y = 120 + r() * 360;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.2 + r() * 2.2)}" fill="${r() < 0.5 ? "#ffcf80" : "#ff9a40"}" ${A(p, i % 3 ? "up" : "tw", r() * 8, 3 + r() * 4)}/>`;
  }
  // ash flakes
  let ash = "";
  for (let i = 0; i < 10; i++) ash += `M${n1(700 + r() * 200)} ${n1(200 + r() * 260)}l${n1(4 + r() * 6)} ${n1(-2 + r() * 4)}l-3 4z`;
  b += `<path d="${ash}" fill="#2a1a14" opacity=".8"/>`;
  // chains at the right edge of frame (on the desk, rising out of shot)
  b += chain(1180, 900, 1240, 560, -40, "#1a1418", "#8a6a50", 14) + chain(1260, 610, 1600, 540, 60, "#1a1418", "#8a6a50", 14);
  b += `<path d="M1150 600C1150 570 1190 556 1220 560C1250 564 1272 584 1270 610C1268 636 1230 646 1200 642C1170 638 1150 626 1150 600ZM1170 602C1172 620 1196 628 1214 626C1236 624 1250 612 1250 600C1248 584 1232 576 1212 576C1190 576 1168 586 1170 602Z" fill="#1c1418" fill-rule="evenodd" stroke="#6f95e8" stroke-width="2" stroke-opacity=".6"/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.15], [1, "#020203", 0.9]], 0.45, 0.45, 0.72), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_vault — Ch4: the blank book and its ghostly traces
// ────────────────────────────────────────────────────────────────────────────
function cgVault(): string {
  const p = "cg_vault";
  const r = rng(909);
  const defs =
    rg(`${p}-bg`, [
      [0, "#1e2e6a"],
      [0.5, "#0e1638"],
      [1, "#04060f"],
    ], 0.5, 0.45, 0.8) +
    glowGrad(`${p}-g`, "#dfe8ff", 0.95, 0.35) +
    glowGrad(`${p}-bl`, "#5e8fe8", 0.6, 0.2) +
    lg(`${p}-page`, 0, 0, 0, 1, [
      [0, "#ffffff"],
      [1, "#b9c6f2"],
    ]) +
    lg(`${p}-ghost`, 0, 1, 0, 0, [
      [0, "#eef3ff", 0.75],
      [1, "#b9c9f5", 0.08],
    ]) +
    lg(`${p}-hand`, 0, 0, 1, 1, [
      [0, "#aab4e0"],
      [1, "#232a58"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // endless chained shelves receding
  let sh = "";
  let bk = "";
  for (const [x0, x1, s2] of [[0, 480, 1], [1120, 1600, 1], [380, 600, 0.6], [1000, 1220, 0.6]] as [number, number, number][]) {
    for (let y = 40; y < 800; y += 90 * s2) {
      sh += `M${x0} ${Math.round(y)}H${x1}`;
      for (let x = x0 + 4; x < x1 - 8; x += (10 + r() * 10) * s2) bk += `M${Math.round(x)} ${Math.round(y - 4)}v${-Math.round((40 + r() * 30) * s2)}`;
    }
  }
  b += `<path d="${bk}" stroke="#23306b" stroke-width="7" opacity=".55"/><path d="${sh}" stroke="#070a1c" stroke-width="8"/>`;
  let ch = "";
  for (let i = 0; i < 6; i++) ch += chain(r() < 0.5 ? r() * 460 : 1140 + r() * 460, 60 + r() * 300, r() < 0.5 ? r() * 460 : 1140 + r() * 460, 200 + r() * 500, 60, "#0b0f26", "#5e8fe8", 5);
  b += `<g opacity=".7">${ch}</g>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-bl)" opacity=".25"/>`;
  // floating star-ink glyphs in the vault air
  let gl = "";
  for (let i = 0; i < 40; i++) gl += glyphD(r, r() * 1600, 60 + r() * 700, 8 + r() * 8);
  b += `<path d="${gl}" fill="none" stroke="#8fb8ff" stroke-width="1.4" stroke-linecap="round" opacity=".2"/>`;
  // lectern
  b += `<path d="M720 900L760 640H840L880 900Z" fill="#0e1330"/><path d="M620 620L980 620L940 660L660 660Z" fill="#1a2250"/>`;
  // glow and open blank book
  b += `<circle cx="800" cy="560" r="360" fill="url(#${p}-g)" opacity=".5"/>`;
  b += `<path d="M800 556C730 532 640 534 560 548L540 630C630 618 720 622 800 644Z" fill="url(#${p}-page)"/><path d="M800 556C870 532 960 534 1040 548L1060 630C970 618 880 622 800 644Z" fill="url(#${p}-page)"/><path d="M800 556V644" stroke="#8a98c8" stroke-width="2"/>`;
  // ghostly images rising from the pages
  const ghost = `url(#${p}-ghost)`;
  b += `<path d="M700 560C660 460 700 360 800 300C900 360 940 460 900 560Z" fill="${ghost}" opacity=".35"/>`;
  // boy's silhouette (young squire, faceless)
  b += `<g opacity=".6" ${A(p, "up", 0, 9)}>${place(800, 330, 0.66, 0, true, `<path d="${HEAD_M}${HAIR_M}M-22 70C-60 84 -96 110 -110 160C-116 190 -118 220 -118 250H118C118 220 116 190 108 160C96 116 60 88 16 72Z" fill="${ghost}"/>`)}</g>`;
  // ring
  b += `<g ${A(p, "pu", 1, 4)}><ellipse cx="930" cy="330" rx="30" ry="11" transform="rotate(-24 930 330)" fill="none" stroke="#eef3ff" stroke-width="3"/><ellipse cx="930" cy="330" rx="30" ry="11" transform="rotate(-24 930 330)" fill="none" stroke="#8fb8ff" stroke-width="9" opacity=".3"/></g>`;
  // white flowers drifting up from the pages
  const flower = (x: number, y: number, sc: number) => {
    let d = "";
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 * Math.PI) / 180;
      const ex = x + Math.cos(a) * 20 * sc;
      const ey = y + Math.sin(a) * 12 * sc;
      d += `M${n1(x)} ${n1(y)}Q${n1(x + Math.cos(a + 0.5) * 14 * sc)} ${n1(y + Math.sin(a + 0.5) * 9 * sc)} ${n1(ex)} ${n1(ey)}Q${n1(x + Math.cos(a - 0.5) * 14 * sc)} ${n1(y + Math.sin(a - 0.5) * 9 * sc)} ${n1(x)} ${n1(y)}Z`;
    }
    return d;
  };
  const fl: [number, number, number][] = [[680, 470, 1.3], [930, 440, 1.1], [720, 360, 0.9], [880, 330, 1], [640, 290, 0.7], [960, 260, 0.8], [760, 180, 0.6], [850, 150, 0.5]];
  fl.forEach(([x, y, sc], i) => {
    b += `<g ${A(p, "up", i * 1.1, 7 + i)}><path d="${flower(x, y, sc)}" fill="#f4f1ea" opacity="${n1(0.9 - i * 0.07)}"/></g>`;
  });
  // rising glyph sparks
  for (let i = 0; i < 16; i++) b += `<circle cx="${n1(680 + r() * 240)}" cy="${n1(200 + r() * 360)}" r="${n1(1 + r() * 2)}" fill="#eef3ff" ${A(p, "up", r() * 8, 5 + r() * 4)}/>`;
  // Estelle's hand reaching in from the lower left, drop of blood
  const hand = "M300 900C380 800 470 720 560 670C600 648 640 634 672 628C690 624 704 628 708 636C712 644 704 650 690 652C706 654 720 658 724 666C726 674 716 678 700 676C712 682 716 690 708 694C698 698 684 694 672 690C660 700 640 706 620 708C560 740 480 810 430 900Z";
  b += rim(hand, `url(#${p}-hand)`, "#eef3ff", 0, 2.4);
  b += `<path d="M560 670C520 700 480 740 440 790" stroke="#dfe6ff" stroke-width="3" opacity=".4"/>`;
  b += `<g fill="#27407a" opacity=".85"><ellipse cx="696" cy="640" rx="4" ry="2"/><ellipse cx="704" cy="668" rx="3" ry="1.6"/></g>`;
  b += `<path d="M760 580Q768 596 760 604Q752 596 760 580Z" fill="#a8344a"/><ellipse cx="770" cy="620" rx="9" ry="3" fill="#7c1f33" opacity=".9"/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.15], [1, "#010208", 0.9]], 0.5, 0.45, 0.72), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_l_bad — Lucien bad ending: spectacles alone on a windowsill
// ────────────────────────────────────────────────────────────────────────────
function cgLBad(): string {
  const p = "cg_l_bad";
  const r = rng(1010);
  const defs =
    lg(`${p}-out`, 0, 0, 0, 1, [
      [0, "#a9b8e4"],
      [0.5, "#dfe4f4"],
      [0.8, "#f6e2cc"],
      [1, "#f0d2b0"],
    ]) +
    lg(`${p}-wall`, 0, 0, 1, 0, [
      [0, "#262a4e"],
      [0.5, "#565a84"],
      [1, "#222648"],
    ]) +
    lg(`${p}-beam`, 0, 0, 1, 1, [
      [0, "#fff8e8", 0.4],
      [1, "#fff8e8", 0],
    ]) +
    lg(`${p}-cur`, 0, 0, 1, 0, [
      [0, "#f4f1ea", 0.9],
      [0.5, "#f4f1ea", 0.5],
      [1, "#f4f1ea", 0.85],
    ]) +
    lg(`${p}-sill`, 0, 0, 0, 1, [
      [0, "#f6ecd8"],
      [1, "#8a8aa8"],
    ]) +
    glowGrad(`${p}-sun`, "#fff4dc", 0.8, 0.25) +
    blurFilter(`${p}-b`, 3) + rg(`${p}-vg`, [[0, "#000", 0], [0.65, "#000", 0.05], [1, "#0a0c20", 0.6]], 0.5, 0.5, 0.75);
  let b = `<rect width="1600" height="900" fill="url(#${p}-wall)"/><g transform="translate(800 480) scale(1.75) translate(-790 -540)">`;
  // wall paneling
  b += `<path d="M80 80H440V800H80ZM1160 80H1520V800H1160Z" fill="none" stroke="#9a9ec0" stroke-width="4" opacity=".4"/>`;
  // tall arched window
  const win = "M560 540V200Q560 60 800 60Q1040 60 1040 200V540Z";
  b += `<path d="${win}" fill="url(#${p}-out)"/>`;
  // distant palace spires + faint daytime ring
  b += `<path d="M560 540V440L600 436V400L612 370L624 400V434L680 430V380L700 330L720 380V428L760 424V330L776 280L792 330V424L850 428V396L866 360L882 396V430L940 432V410L952 384L964 410V436L1040 440V540Z" fill="#9aa4cc" opacity=".75"/>` +
    `<path d="M560 540V470Q640 456 720 470T880 466T1040 474V540Z" fill="#7d86b0" opacity=".8"/>` +
    `<g fill="#fff" opacity=".5"><ellipse cx="660" cy="250" rx="70" ry="10"/><ellipse cx="960" cy="300" rx="50" ry="8"/></g>`;
  b += `<path d="M560 320Q800 200 1040 260" fill="none" stroke="#fff" stroke-width="24" opacity=".25" stroke-linecap="round"/>`;
  b += `<circle cx="900" cy="170" r="220" fill="url(#${p}-sun)"/>`;
  // mullions
  b += `<path d="M800 60V540M560 300H1040M560 420H1040" stroke="#6a6e94" stroke-width="10"/>`;
  b += `<path d="${win}" fill="none" stroke="#3a3e64" stroke-width="22"/>`;
  // curtains (sheer)
  b += `<path d="M500 40C540 200 540 400 520 640L600 640C620 420 600 200 560 40Z" fill="url(#${p}-cur)"/><path d="M1100 40C1060 200 1060 400 1080 640L1000 640C980 420 1000 200 1040 40Z" fill="url(#${p}-cur)"/>`;
  b += `<path d="M520 60C550 200 550 400 540 620M1080 60C1050 200 1050 400 1060 620" fill="none" stroke="#cfcadc" stroke-width="3"/>`;
  // light shaft into the room
  b += `<path d="M560 60L1040 60L1300 900L700 900Z" fill="url(#${p}-beam)"/>`;
  // windowsill
  b += `<path d="M500 540H1100L1140 580H460Z" fill="url(#${p}-sill)"/><path d="M460 580H1140V606H460Z" fill="#6a6e90"/>`;
  // blank notebook (open) beside
  b += `<path d="M860 552L1000 548L1020 572L872 578Z" fill="#fbf8f0"/><path d="M866 556L940 553L946 576L874 578Z" fill="#fff"/><path d="M940 552L946 576" stroke="#c8c2b8" stroke-width="1.5"/><path d="M872 578L1020 572L1020 576L872 582Z" fill="#b8b0a4"/>`;
  // spectacles: thin silver frames, one arm folded
  b += `<ellipse cx="746" cy="558" rx="64" ry="9" fill="#5a5e84" opacity=".45" filter="url(#${p}-b)"/><path d="M620 548L660 540M900 548L940 540" stroke="#8a86a8" stroke-width="6" opacity=".25"/>`;
  b += `<g fill="none" stroke="#dfe3f2" stroke-width="2.4"><ellipse cx="712" cy="548" rx="24" ry="12"/><ellipse cx="770" cy="550" rx="24" ry="12"/>` +
    `<path d="M736 546Q741 540 746 546M688 546L660 538M794 548L820 556L800 562"/></g>`;
  b += `<g fill="#fff" opacity=".7"><ellipse cx="704" cy="544" rx="8" ry="3"/><ellipse cx="762" cy="546" rx="8" ry="3"/></g>`;
  b += `<path d="M712 548m-24 0a24 12 0 0 0 48 0" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>`;
  // dust motes in the light
  for (let i = 0; i < 22; i++) b += `<circle cx="${n1(640 + r() * 460)}" cy="${n1(120 + r() * 560)}" r="${n1(0.8 + r() * 1.6)}" fill="#fffaf0" ${A(p, i % 2 ? "up" : "tw", r() * 8, 6 + r() * 5)}/>`;
  // floor
  b += `</g><rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs, b);
}

/** pile of folded letters: returns [fillPath, linePath] */
function letterPile(r: () => number, n: number, cx: number, cy: number, rx: number, ry: number, sz: number): [string, string] {
  let fd = "";
  let ld = "";
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d - (1 - d) * ry * 0.6;
    const w = sz * (0.8 + r() * 0.5);
    const h = w * 0.62;
    const t = (r() - 0.5) * 1.6;
    const c = Math.cos(t), s2 = Math.sin(t);
    const P = (u: number, v: number): string => `${Math.round(x + u * c - v * s2)} ${Math.round(y + u * s2 + v * c)}`;
    fd += `M${P(-w / 2, -h / 2)}L${P(w / 2, -h / 2)}L${P(w / 2, h / 2)}L${P(-w / 2, h / 2)}Z`;
    ld += `M${P(-w / 2, -h / 2)}L${P(0, h * 0.1)}L${P(w / 2, -h / 2)}`;
  }
  return [fd, ld];
}

// ────────────────────────────────────────────────────────────────────────────
// cg_c_bad — Cassian normal ending: the box of 2,555 letters in the attic
// ────────────────────────────────────────────────────────────────────────────
function cgCBad(): string {
  const p = "cg_c_bad";
  const r = rng(1111);
  const defs =
    lg(`${p}-wall`, 0, 0, 1, 1, [
      [0, "#3a2c3e"],
      [0.6, "#241c30"],
      [1, "#120e1a"],
    ]) +
    lg(`${p}-beam`, 1, 0, 0, 1, [
      [0, "#fff0c8", 0.55],
      [0.6, "#f6d48f", 0.18],
      [1, "#f6d48f", 0],
    ]) +
    glowGrad(`${p}-sun`, "#fff0c8", 0.8, 0.25) +
    lg(`${p}-wood`, 0, 0, 0, 1, [
      [0, "#8a5a34"],
      [1, "#3a2418"],
    ]) +
    lg(`${p}-fig`, 1, 0, 0, 1, [
      [0, "#5a4458"],
      [0.5, "#2e2438"],
      [1, "#1a1424"],
    ]) +
    lg(`${p}-paper`, 0, 0, 0, 1, [
      [0, "#fbf3e2"],
      [1, "#c8b8a0"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-wall)"/>`;
  // slanted roof boards + rafters
  let boards = "";
  for (let i = -8; i < 20; i++) boards += `M${i * 90} 0L${i * 90 + 520} 900`;
  b += `<path d="${boards}" stroke="#1a1420" stroke-width="3" opacity=".6"/>`;
  b += `<path d="M-100 120L1700 -60M-100 360L1700 180" stroke="#2a1e24" stroke-width="40"/><path d="M-100 100L1700 -80M-100 340L1700 160" stroke="#8a5a34" stroke-width="3" opacity=".5"/>`;
  b += `<path d="M180 0L60 900M1420 0L1540 900" stroke="#1e1620" stroke-width="54"/>`;
  // round dormer window upper right with sunlight
  b += `<circle cx="1180" cy="190" r="200" fill="url(#${p}-sun)"/><circle cx="1180" cy="190" r="84" fill="#fff6dc"/>`;
  b += `<path d="M1096 190H1264M1180 106V274" stroke="#3a2a28" stroke-width="10"/><circle cx="1180" cy="190" r="84" fill="none" stroke="#3a2a28" stroke-width="14"/>`;
  b += `<path d="M1110 150L1250 230L880 900L360 900Z" fill="url(#${p}-beam)"/>`;
  // clutter silhouettes: crates, a covered chair, stacked books
  b += `<path d="M1240 640V500H1420V640ZM1260 500V430H1400V500ZM120 640V470L200 420L300 470V640Z" fill="#1c1622"/><path d="M1240 500H1420M1260 430H1400" stroke="#8a6a4a" stroke-width="2" opacity=".5"/>`;
  b += `<path d="M300 640C300 560 330 520 380 510C430 520 450 560 452 640Z" fill="#2e2638"/>`;
  // floor
  b += `<path d="M0 630H1600V900H0Z" fill="#1e1620"/><path d="M0 630H1600" stroke="#6a4a34" stroke-width="2" opacity=".6"/>`;
  b += `<path d="M0 690H1600M0 770H1600" stroke="#140f16" stroke-width="3"/>`;
  b += `<path d="M560 640L1080 640L1160 760L480 760Z" fill="#f6d48f" opacity=".12"/>`;
  // the box (open) with overflowing letters
  b += `<path d="M820 470L1060 470L1080 640L840 650Z" fill="url(#${p}-wood)"/><path d="M820 470L840 650L780 630L766 468Z" fill="#4a2e1e"/>`;
  b += `<path d="M846 520H1066M850 580H1072" stroke="#3a2418" stroke-width="3"/>`;
  // lid leaning against the box
  b += `<path d="M1060 470L1130 330L1180 350L1110 490Z" fill="#6a4228"/><path d="M1060 470L1130 330" stroke="#c89a64" stroke-width="2"/>`;
  const [pf, pl] = letterPile(r, 130, 920, 468, 150, 34, 30);
  const [sf, sl] = letterPile(r, 40, 900, 668, 240, 22, 28);
  b += `<path d="${sf}" fill="url(#${p}-paper)" stroke="#8a7a64" stroke-width="1"/><path d="${sl}" fill="none" stroke="#9a8a74" stroke-width="1"/>`;
  b += `<path d="${pf}" fill="url(#${p}-paper)" stroke="#8a7a64" stroke-width="1"/><path d="${pl}" fill="none" stroke="#9a8a74" stroke-width="1"/>`;
  // dust in the beam
  for (let i = 0; i < 26; i++) {
    const t = r();
    const y = 220 + t * 560;
    const x = 1120 - t * 450 + (r() - 0.3) * 260;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.8 + r() * 1.8)}" fill="#fff6dc" ${A(p, i % 2 ? "up" : "sw", r() * 8, 6 + r() * 5)}/>`;
  }
  // Estelle (older), kneeling, a letter in her hands
  const hx = 686, hy = 350, hs = 0.66;
  const body = "M650 390C630 400 616 420 612 450C606 490 604 530 598 570C592 600 580 624 572 646H790C792 624 780 610 760 600C740 590 724 574 716 552C712 530 716 500 716 474C716 444 708 414 690 396Z";
  const arm = "M700 410C712 426 720 450 730 470C738 482 750 488 764 486L766 500C748 506 728 500 714 486C700 470 692 446 688 424Z";
  let fg = `<g filter="url(#${p}-b)" opacity=".45"><path d="${body}" fill="none" stroke="#ffe0a8" stroke-width="8"/></g>`;
  fg += place(hx, hy, hs, 20, false, rim(HAIR_MID, "#2a1c24", "#ffd89a", -2.4, 1.2));
  fg += rim(body, `url(#${p}-fig)`, "#ffd89a", -2.6, 1);
  fg += `<path d="M640 440C636 500 630 560 616 630M680 450C684 520 700 580 740 620" fill="none" stroke="#6a5468" stroke-width="2" opacity=".6"/>`;
  fg += place(hx, hy, hs, 20, false, rim(HEAD_F, `url(#${p}-fig)`, "#ffe6b8", -2.6, 0.8) + rim(BANGS_F, "#2a1c24", "#ffd89a", -1.6, 1) + faceMarks(false, 1, false, true));
  // the letter she holds (open, lit)
  fg += `<path d="M752 454L806 442L814 490L760 500Z" fill="#fbf3e2"/><path d="M760 462L802 454M762 472L804 464M764 482L798 476" stroke="#6a5a5a" stroke-width="1.4" opacity=".6"/>`;
  fg += rim(arm, `url(#${p}-fig)`, "#ffd89a", -1.2, 1.6);
  fg += `<path d="M760 486C766 482 772 484 774 490C770 496 762 498 758 494Z" fill="#3a2c3a"/>`;
  b += fg;
  // tear on her cheek
  const tp = wpt(27, 14, hx, hy, hs, 20, false);
  b += `<path d="M${n1(tp[0])} ${n1(tp[1])}q3 6 0 9q-3 -3 0 -9z" fill="#fff" ${A(p, "tw", 0, 3)}/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.1], [1, "#0a0608", 0.8]], 0.55, 0.45, 0.75), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_depth — True route: sinking through the sea of names
// ────────────────────────────────────────────────────────────────────────────
function cgDepth(): string {
  const p = "cg_depth";
  const r = rng(1212);
  const defs =
    lg(`${p}-sea`, 0, 0, 0, 1, [
      [0, "#6a8ad0"],
      [0.18, "#2a4488"],
      [0.5, "#101a44"],
      [1, "#03050c"],
    ]) +
    lg(`${p}-shaft`, 0, 0, 0, 1, [
      [0, "#dfe8ff", 0.45],
      [1, "#dfe8ff", 0],
    ]) +
    glowGrad(`${p}-g`, "#b9d0ff", 0.8, 0.25) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#4a5a9a"],
      [0.4, "#1e2856"],
      [1, "#0a0f2a"],
    ]) +
    lg(`${p}-hair`, 0, 1, 0, 0, [
      [0, "#141634"],
      [0.6, "#1e2458"],
      [1, "#2a3a7a", 0.5],
    ]) +
    lg(`${p}-dress`, 0, 0, 0, 1, [
      [0, "#aab8e8"],
      [0.4, "#4a5a98"],
      [1, "#0e1438", 0.3],
    ]) +
    blurFilter(`${p}-b`, 8);
  let b = `<rect width="1600" height="900" fill="url(#${p}-sea)"/>`;
  // surface ripple light
  b += `<path d="M0 0H1600V60Q1400 90 1200 60T800 64T400 58T0 70Z" fill="#b9d0ff" opacity=".35"/>`;
  // light shafts from above
  let sh = "";
  for (let i = 0; i < 7; i++) {
    const x = 300 + i * 170 + r() * 60;
    const w = 30 + r() * 60;
    sh += `M${n1(x)} 0L${n1(x + w)} 0L${n1(x + w * 0.4 + (x - 800) * 0.5)} 900L${n1(x - w * 0.6 + (x - 800) * 0.5)} 900Z`;
  }
  b += `<path d="${sh}" fill="url(#${p}-shaft)"/>`;
  // millions of letters: far dots + mid glyphs + near bright glyphs
  const far: Pt[] = [];
  for (let i = 0; i < 480; i++) far.push([r() * 1600, r() * 900]);
  b += dotPath(far, 2, "#9fc0ff", 0.5);
  let mid = "";
  for (let i = 0; i < 170; i++) mid += runeD(r, r() * 1600, r() * 900, 6 + r() * 6);
  b += `<path d="${mid}" fill="none" stroke="#8fb8ff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`;
  let near = "";
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = 160 + r() * 520;
    near += runeD(r, 800 + Math.cos(a) * d, 420 + Math.sin(a) * d * 0.7, 14 + r() * 10);
  }
  b += `<g filter="url(#${p}-b)"><path d="${near}" fill="none" stroke="#8fb8ff" stroke-width="5" stroke-linecap="round" opacity=".6"/></g><path d="${near}" fill="none" stroke="#eef4ff" stroke-width="1.8" stroke-linecap="round"/>`;
  // animated drifting glyphs
  for (let i = 0; i < 18; i++) b += `<path d="${runeD(r, 500 + r() * 600, 120 + r() * 560, 10 + r() * 6)}" fill="none" stroke="#dfe8ff" stroke-width="1.6" stroke-linecap="round" ${A(p, i % 2 ? "up" : "pu", r() * 8, 6 + r() * 5)}/>`;
  // glow around her
  b += `<circle cx="800" cy="380" r="330" fill="url(#${p}-g)" opacity=".45"/>`;
  // Estelle sinking: head tipped back, hair floating up, one arm reaching up
  const hx = 790, hy = 330, hs = 0.7;
  const hairM = "M806 306C796 270 826 236 818 196C812 164 836 136 830 100C846 136 846 170 840 200C852 180 874 170 892 150C888 182 870 206 850 230C840 254 834 280 822 304ZM800 300C786 266 792 230 780 196C770 166 780 130 766 96C752 130 756 164 758 196C746 170 724 150 700 132C708 168 724 196 734 226C712 212 684 208 656 214C680 232 704 252 716 280C728 304 748 322 772 330Z";
  const dress = "M782 376L800 376C810 388 826 392 842 398C848 420 842 450 838 472C848 520 870 566 900 606C926 642 948 676 968 694C948 690 930 694 912 690C894 706 866 712 842 700C824 716 796 716 776 700C756 716 730 710 716 690C690 700 672 684 640 690C668 648 700 610 722 572C740 532 750 492 748 470C742 448 736 420 742 400C758 394 774 390 782 376Z";
  const arm = "M826 398C836 370 848 330 858 290C866 250 874 206 880 166C882 152 894 150 896 164C896 208 888 254 878 298C868 338 856 374 842 404Z";
  const armL = "M748 404C730 430 712 460 690 486C682 496 690 506 700 498C724 474 744 446 762 418Z";
  let fg = `<g filter="url(#${p}-b)" opacity=".45"><path d="${dress}${arm}" fill="none" stroke="#dfe8ff" stroke-width="10"/></g>`;
  fg += rim(hairM, `url(#${p}-hair)`, "#cfe0ff", 1.4, 2.4);
  fg += `<path d="M818 290C822 250 832 220 830 190M790 290C784 250 780 210 772 170M760 300C744 270 726 250 704 236" fill="none" stroke="#9fb4e8" stroke-width="1.6" opacity=".6"/>`;
  fg += `<path d="M780 346L800 346L802 384L780 384Z" fill="#1e2856"/>`;
  fg += rim(dress, `url(#${p}-dress)`, "#eef3ff", 0, 2.6);
  fg += `<path d="M784 420C778 500 756 600 716 690M810 420C818 500 850 600 912 690M796 430C796 520 790 620 776 700" fill="none" stroke="#dfe6ff" stroke-width="1.6" opacity=".35"/>`;
  fg += rim(armL, `url(#${p}-fig)`, "#dfe8ff", 0, 2);
  fg += place(hx, hy, hs, -42, false, rim(HEAD_F, `url(#${p}-fig)`, "#eef3ff", 0, 2.4) + rim("M30 -40C22 -54 0 -60 -20 -54C-42 -46 -54 -24 -54 4C-54 20 -50 34 -44 42C-30 30 -14 20 -4 0C4 -10 12 -22 18 -28C22 -26 28 -28 30 -40Z", "#141634", "#cfe0ff", 0, 2) + faceMarks(false, 1, false, true));
  fg += rim(arm, `url(#${p}-fig)`, "#eef3ff", -1.5, 2);
  // bubbles from her lips drifting up
  b += fg;
  const lp = wpt(38, 22, hx, hy, hs, -42, false);
  for (let i = 0; i < 5; i++) b += `<circle cx="${n1(lp[0] + 6 + i * 3)}" cy="${n1(lp[1] - 12 - i * 22)}" r="${n1(2 + i * 0.8)}" fill="none" stroke="#eef3ff" stroke-width="1.2" ${A(p, "up", i, 4 + i)}/>`;
  // her reaching hand touches a bright name
  b += `<circle cx="888" cy="150" r="60" fill="url(#${p}-g)" ${A(p, "pu", 0, 3)}/><path d="${sparkle(888, 146, 12)}" fill="#fff"/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.1], [1, "#010206", 0.85]], 0.5, 0.4, 0.75), b);
}

// extra hair / accessory parts (head-local, facing +x)
const HAIR_LUC_CAP = "M33 -36C26 -54 2 -61 -20 -57C-43 -50 -53 -27 -53 0C-53 20 -49 36 -41 48C-31 40 -21 30 -15 20C-9 8 -3 -6 4 -16C12 -22 20 -26 27 -24C31 -28 35 -31 33 -36Z";
const HAIR_LUC_TAIL = "M-32 42C-20 70 -4 98 6 132C14 164 12 204 22 246C8 242 -2 224 -6 204C-12 164 -26 124 -44 92Z";
const HAIR_UPDO = "M34 -30C30 -52 8 -62 -16 -58C-40 -54 -54 -34 -52 -10C-50 6 -46 16 -40 24C-34 12 -30 4 -26 -2C-16 -14 0 -22 14 -24C22 -26 30 -26 34 -30ZM-30 -58m-22 0a22 20 0 1 0 44 0a22 20 0 1 0 -44 0Z";
function glasses(fog = false): string {
  return `<g fill="${fog ? "#dfe6f4" : "none"}" fill-opacity=".35" stroke="#e6e8f6" stroke-width="2"><ellipse cx="28" cy="-8" rx="10" ry="8"/></g><path d="M18 -9L-14 -4" stroke="#e6e8f6" stroke-width="1.6"/>` +
    (fog ? `<g fill="#fff"><circle cx="25" cy="-11" r="1.4"/><circle cx="31" cy="-5" r="1"/><circle cx="29" cy="-12" r=".8"/></g>` : "");
}
const CIRCLET = `<path d="M-42 -40Q-4 -54 34 -36" fill="none" stroke="#e8ecf6" stroke-width="3"/><path d="M24 -40l4 -6 4 6 -4 6z" fill="#f4f6ff"/>`;

// ────────────────────────────────────────────────────────────────────────────
// cg_umbrella — Ch4: rainy dawn street, Lucien's umbrella
// ────────────────────────────────────────────────────────────────────────────
function cgUmbrella(): string {
  const p = "cg_umbrella";
  const r = rng(1313);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#2a3260"],
      [0.5, "#5a6490"],
      [0.8, "#b8a0b0"],
      [1, "#d8b8b0"],
    ]) +
    glowGrad(`${p}-lamp`, "#f6c77a", 0.8, 0.22) +
    lg(`${p}-street`, 0, 0, 0, 1, [
      [0, "#4a5078"],
      [1, "#141830"],
    ]) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#3a3a62"],
      [0.6, "#22244a"],
      [1, "#15172e"],
    ]) +
    lg(`${p}-robe`, 0, 0, 0, 1, [
      [0, "#7a7aa4"],
      [0.5, "#4a4c78"],
      [1, "#2a2c50"],
    ]) +
    lg(`${p}-refl`, 0, 0, 0, 1, [
      [0, "#f6c77a", 0.45],
      [1, "#f6c77a", 0],
    ]) +
    lg(`${p}-umb`, 0, 0, 0, 1, [
      [0, "#2a2c48"],
      [1, "#101226"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  // buildings receding on both sides (one-point perspective)
  const bl = (side: number) => {
    let d = "";
    let win = "";
    for (let i = 0; i < 6; i++) {
      const x0 = side < 0 ? i * 90 : 1600 - i * 90;
      const x1 = side < 0 ? x0 + 90 : x0 - 90;
      const top0 = 40 + i * 50 + r() * 30;
      const top1 = top0 + 40;
      const roof = 40 + r() * 40;
      d += `M${x0} 620L${x0} ${n1(top0)}L${n1((x0 + x1) / 2)} ${n1(top0 - roof)}L${x1} ${n1(top1)}L${x1} ${n1(600 - i * 6)}Z`;
      if (r() < 0.7) win += `M${n1((x0 + x1) / 2 - 10)} ${n1(top0 + 60 + r() * 100)}h20v28h-20z`;
    }
    return `<path d="${d}" fill="#262a4c"/><path d="${d}" fill="none" stroke="#6a6e98" stroke-width="2" opacity=".5"/><path d="${win}" fill="#f6c77a" opacity=".8"/>`;
  };
  b += bl(-1) + bl(1);
  b += `<path d="M540 620L540 360L600 300L660 360L660 620ZM940 620L940 340L1000 270L1060 340L1060 620Z" fill="#3a3e66" opacity=".8"/>`;
  // street
  b += `<path d="M0 600H1600V900H0Z" fill="url(#${p}-street)"/>`;
  let cob = "";
  for (let y = 620; y < 900; y += 18 + (y - 600) * 0.12) cob += `M0 ${Math.round(y)}H1600`;
  b += `<path d="${cob}" stroke="#1a1e38" stroke-width="2" opacity=".6"/>`;
  // lamps + reflections
  const lamps: [number, number, number][] = [[380, 300, 1], [1220, 300, 1], [600, 420, 0.6], [1000, 420, 0.6]];
  for (const [x, y, sc] of lamps) {
    b += `<path d="M${x} ${y}V${n1(y + 320 * sc)}" stroke="#141630" stroke-width="${n1(8 * sc)}"/>`;
    b += `<circle cx="${x}" cy="${y}" r="${n1(160 * sc)}" fill="url(#${p}-lamp)"/><path d="M${n1(x - 14 * sc)} ${n1(y - 20 * sc)}h${n1(28 * sc)}l${n1(-4 * sc)} ${n1(36 * sc)}h${n1(-20 * sc)}z" fill="#fff0c8"/>`;
    b += `<path d="M${n1(x - 20 * sc)} ${n1(640 + 20 * sc)}h${n1(40 * sc)}l${n1(20 * sc)} ${n1(260 * sc)}h${n1(-80 * sc)}z" fill="url(#${p}-refl)"/>`;
  }
  // rain: static streaks + a few animated
  let rain = "";
  for (let i = 0; i < 260; i++) {
    const x = r() * 1700 - 50;
    const y = r() * 900;
    const l = 14 + r() * 26;
    rain += `M${Math.round(x)} ${Math.round(y)}l${n1(-l * 0.18)} ${Math.round(l)}`;
  }
  b += `<path d="${rain}" stroke="#dfe6f4" stroke-width="1.2" opacity=".35"/>`;
  // puddle ripples
  let rip = "";
  for (let i = 0; i < 12; i++) rip += `<ellipse cx="${n1(r() * 1600)}" cy="${n1(650 + r() * 220)}" rx="${n1(10 + r() * 20)}" ry="${n1(3 + r() * 4)}" fill="none" stroke="#b8c0e0" stroke-width="1.2" opacity=".5" ${A(p, "pu", r() * 4, 2 + r() * 2)}/>`;
  b += rip;
  // ── figures ──
  const ex = 732, ey = 352, es = 0.6, erot = -16;
  const lx = 872, ly = 290, ls = 0.66, lrot = -10;
  const rimE = "#f6d8b8", rimL = "#c8c3e8";
  let fg = `<g filter="url(#${p}-b)" opacity=".4">` + place(ex, ey, es, 0, false, `<path d="${F_BODY}" fill="none" stroke="#ffe8d0" stroke-width="12"/>`) + place(lx, ly, ls, 0, true, `<path d="${M_BODY}" fill="none" stroke="#e0dcff" stroke-width="12"/>`) + `</g>`;
  fg += place(ex, ey, es, erot, false, rim(HAIR_MID, "#241a28", rimE, -2, 1));
  fg += place(ex, ey, es, 0, false, rim(F_BODY, `url(#${p}-fig)`, rimE, -2.4, 1));
  fg += place(lx, ly, ls, 0, true, rim(M_BODY, `url(#${p}-robe)`, rimL, -2.4, 1));
  // soaked far shoulder: darker wet patch + droplets
  fg += place(lx, ly, ls, 0, true, `<path d="M-22 70C-46 80 -64 100 -68 132C-70 160 -68 200 -64 240C-54 200 -48 150 -40 120C-34 100 -26 84 -22 70Z" fill="#26284c" opacity=".8"/><g fill="#eef0ff"><circle cx="-60" cy="130" r="2.4"/><circle cx="-56" cy="170" r="2"/><circle cx="-64" cy="210" r="2.6"/><circle cx="-50" cy="100" r="1.8"/></g>`);
  fg += place(ex, ey, es, erot, false, rim(HEAD_F, `url(#${p}-fig)`, "#ffe8d0", -2.4, 0.8) + rim(BANGS_F, "#241a28", rimE, -1.6, 1) + faceMarks(false, 1));
  fg += place(lx, ly, ls, lrot, true, rim(HEAD_M, `url(#${p}-fig)`, "#f0ecff", -2.4, 0.8) + rim(HAIR_LUC_CAP, "#b4b8d8", "#ffffff", -2, 1) + `<path d="M20 -40C0 -52 -30 -48 -44 -20M10 -46C-10 -54 -34 -40 -46 -8" fill="none" stroke="#e8eaf8" stroke-width="2" opacity=".7"/>` + faceMarks(true, 1) + glasses(true));
  fg += place(lx, ly, ls, lrot * 0.4, true, rim(HAIR_LUC_TAIL, "#b4b8d8", "#ffffff", -2, 1) + `<path d="M-20 80C-8 120 4 170 8 220" fill="none" stroke="#d8dcf0" stroke-width="2" opacity=".7"/>`);
  // his arm holding the umbrella shaft
  const hand: Pt = [840, 452];
  fg += rim("M880 372C868 400 858 426 846 446C842 456 850 462 858 456C872 436 884 410 896 384Z", `url(#${p}-robe)`, rimL, 1.5, 1.5);
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  // umbrella tilted toward her
  const ux = 728, uy = 200;
  b += `<path d="M${hand[0]} ${hand[1]}L${ux} ${uy - 40}" stroke="#0e1024" stroke-width="5"/><path d="M${hand[0]} ${hand[1]}q-6 18 -18 12" fill="none" stroke="#0e1024" stroke-width="5"/>`;
  b += `<g transform="rotate(-20 ${ux} ${uy})"><path d="M${ux - 250} ${uy + 60}C${ux - 230} ${uy - 80} ${ux - 110} ${uy - 130} ${ux} ${uy - 132}C${ux + 110} ${uy - 130} ${ux + 230} ${uy - 80} ${ux + 250} ${uy + 60}Q${ux + 200} ${uy + 40} ${ux + 150} ${uy + 64}Q${ux + 100} ${uy + 40} ${ux + 50} ${uy + 66}Q${ux} ${uy + 44} ${ux - 50} ${uy + 66}Q${ux - 100} ${uy + 40} ${ux - 150} ${uy + 64}Q${ux - 200} ${uy + 40} ${ux - 250} ${uy + 60}Z" fill="url(#${p}-umb)"/>` +
    `<path d="M${ux} ${uy - 132}Q${ux - 90} ${uy - 60} ${ux - 150} ${uy + 64}M${ux} ${uy - 132}Q${ux - 30} ${uy - 40} ${ux - 50} ${uy + 66}M${ux} ${uy - 132}Q${ux + 30} ${uy - 40} ${ux + 50} ${uy + 66}M${ux} ${uy - 132}Q${ux + 90} ${uy - 60} ${ux + 150} ${uy + 64}" fill="none" stroke="#3a3c62" stroke-width="2"/>` +
    `<path d="M${ux - 250} ${uy + 60}C${ux - 230} ${uy - 80} ${ux - 110} ${uy - 130} ${ux} ${uy - 132}C${ux + 110} ${uy - 130} ${ux + 230} ${uy - 80} ${ux + 250} ${uy + 60}" fill="none" stroke="#f6d8b8" stroke-width="2" opacity=".7"/>` +
    `<path d="M${ux} ${uy - 132}v-24" stroke="#0e1024" stroke-width="5"/></g>`;
  // drips off the umbrella edge (animated) — right edge falls on his shoulder
  for (let i = 0; i < 16; i++) {
    const x = 540 + i * 32;
    const y = 250 + Math.abs(i - 8) * -6 + (i > 8 ? -(i - 8) * 14 : (8 - i) * 12);
    b += `<path d="M${n1(x)} ${n1(y + 20)}q2 6 0 8q-2 -2 0 -8z" fill="#eef0ff" ${A(p, "tw", r() * 3, 1.6 + r())}/>`;
  }
  b += `<path d="M900 250l-4 30M920 262l-4 34M940 280l-4 30" stroke="#eef0ff" stroke-width="1.6" opacity=".6"/>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [[0, "#fff"], [0.72, "#fff"], [1, "#fff", 0]]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="0" y="0" width="1600" height="700" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_book — Cassian route: writing while he holds the door
// ────────────────────────────────────────────────────────────────────────────
function cgBook(): string {
  const p = "cg_book";
  const r = rng(1414);
  const defs =
    lg(`${p}-wall`, 0, 0, 0, 1, [
      [0, "#1a1420"],
      [1, "#0a080e"],
    ]) +
    lg(`${p}-out`, 0, 0, 0, 1, [
      [0, "#2a2244"],
      [0.5, "#a8543a"],
      [1, "#f0a050"],
    ]) +
    glowGrad(`${p}-torch`, "#ff9a40", 0.8, 0.25) +
    glowGrad(`${p}-book`, "#bcd4ff", 0.95, 0.3) +
    lg(`${p}-fig`, 0, 1, 0, 0, [
      [0, "#2a3470"],
      [0.5, "#161a3a"],
      [1, "#0c0e22"],
    ]) +
    lg(`${p}-page`, 0, 0, 0, 1, [
      [0, "#ffffff"],
      [1, "#b9c6f2"],
    ]) +
    lg(`${p}-table`, 0, 0, 0, 1, [
      [0, "#4a3428"],
      [1, "#160e0a"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-wall)"/>`;
  // log walls
  let logs = "";
  for (let y = 20; y < 640; y += 52) logs += `M0 ${y}H1600`;
  b += `<path d="${logs}" stroke="#2c2028" stroke-width="40" opacity=".7"/><path d="${logs}" stroke="#4a3430" stroke-width="2" opacity=".6" transform="translate(0 -18)"/>`;
  // doorway (back, right of centre) — torches and snow outside
  const dx0 = 900, dx1 = 1080, dy0 = 170, dy1 = 600;
  b += `<rect x="${dx0}" y="${dy0}" width="${dx1 - dx0}" height="${dy1 - dy0}" fill="url(#${p}-out)"/>`;
  b += `<path d="M${dx0} 470L960 450L1020 470L${dx1} 452V${dy1}H${dx0}Z" fill="#e8d0c0" opacity=".8"/>`;
  b += `<g fill="#1a1016"><path d="M920 480l6 -60 6 60zM1050 470l6 -70 6 70z"/></g>`;
  for (const [x, y] of [[926, 420], [1056, 400]] as Pt[]) b += `<circle cx="${x}" cy="${y}" r="70" fill="url(#${p}-torch)"/><g ${A(p, "fl", r() * 2, 1.6)}><path d="M${x} ${y - 22}c8 10 10 20 0 26c-10 -6 -8 -16 0 -26z" fill="#ffd080"/></g>`;
  let snow = "";
  for (let i = 0; i < 50; i++) snow += `M${Math.round(dx0 + r() * (dx1 - dx0))} ${Math.round(dy0 + r() * (dy1 - dy0))}h0`;
  b += `<path d="${snow}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  b += `<path d="M${dx0 - 14} ${dy1}V${dy0 - 14}H${dx1 + 14}V${dy1}" fill="none" stroke="#2c1e1a" stroke-width="28"/>`;
  b += `<circle cx="990" cy="420" r="340" fill="url(#${p}-torch)" opacity=".35"/>`;
  // Cassian silhouetted in the doorway, sword lowered, back to us
  const cas = "M990 262C1006 262 1016 274 1016 290C1016 304 1010 314 1002 318L1004 330C1026 336 1044 350 1050 376C1056 410 1056 450 1054 490C1052 530 1054 570 1058 600H930C932 570 934 530 932 490C930 450 930 410 936 376C942 350 958 336 978 330L980 318C970 314 964 304 964 290C964 274 976 262 990 262Z";
  const casHair = "M990 256C1010 256 1022 272 1020 292L1012 300L1008 290L1000 296L992 288L984 296L978 288L970 298C962 290 962 270 972 262C978 258 984 256 990 256Z";
  b += rim(cas, "#0c0a12", "#ffb870", 0, 2.4) + rim(casHair, "#08060c", "#ffb870", 0, 2);
  b += `<path d="M1046 420L1118 590" stroke="#d8dce8" stroke-width="5"/><path d="M1046 420L1118 590" stroke="#fff" stroke-width="1.4"/><path d="M1036 426L1058 414" stroke="#2a2030" stroke-width="7"/>`;
  b += `<path d="M936 380C920 420 910 470 904 520L920 522C926 480 936 440 948 400Z" fill="#0c0a12"/>`;
  // fireplace glow on the left
  b += `<circle cx="120" cy="620" r="300" fill="url(#${p}-torch)" opacity=".35"/>`;
  // table (foreground)
  b += `<path d="M300 560H1300L1400 900H200Z" fill="url(#${p}-table)"/><path d="M300 560H1300" stroke="#8a6a50" stroke-width="3"/>`;
  // the glowing book
  b += `<path d="M300 620H1320M290 680H1340M270 760H1360" stroke="#2a1c16" stroke-width="3" opacity=".7"/>`;
  b += `<ellipse cx="760" cy="520" rx="520" ry="330" fill="url(#${p}-book)" opacity=".4"/><ellipse cx="780" cy="580" rx="360" ry="190" fill="url(#${p}-book)" opacity=".6"/>`;
  b += `<path d="M780 560C730 540 660 540 600 552L586 626C650 616 720 620 780 640Z" fill="url(#${p}-page)"/><path d="M780 560C830 540 900 540 960 552L974 626C910 616 840 620 780 640Z" fill="url(#${p}-page)"/>`;
  const wrt = scriptRows(r, [[606, 560], [772, 564], [776, 632], [594, 618]], 5, 7) + scriptRows(r, [[790, 564], [950, 560], [962, 618], [786, 632]], 3, 7, 0.6);
  b += `<path d="${wrt}" fill="none" stroke="#5e8fe8" stroke-width="1.6" stroke-linecap="round"/>`;
  for (let i = 0; i < 16; i++) b += `<path d="${runeD(r, 640 + r() * 300, 300 + r() * 240, 10 + r() * 6)}" fill="none" stroke="#cfe0ff" stroke-width="1.6" stroke-linecap="round" ${A(p, "up", r() * 8, 5 + r() * 4)}/>`;
  // Estelle writing, leaning over the book (profile facing right, lit from below)
  const hx = 640, hy = 380, hs = 0.64, hr = 26;
  const body = "M612 418C590 430 576 454 574 486C572 520 578 556 584 590H720C730 574 740 560 752 552C730 536 710 516 694 494C680 470 668 444 650 426Z";
  const arm = "M650 430C670 460 690 490 716 516C730 530 748 540 770 544C778 546 780 556 772 558C748 562 724 552 704 536C680 514 660 486 640 452Z";
  let fg = rim(body, `url(#${p}-fig)`, "#cfe0ff", -2.4, -1.4);
  fg += place(hx, hy, hs, hr, false, rim(HAIR_MID, "#1a1224", "#cfe0ff", -2, -1));
  fg += place(hx, hy, hs, hr, false, rim(HEAD_F, `url(#${p}-fig)`, "#eef3ff", -2.4, -1.6) + rim(BANGS_F, "#1a1224", "#cfe0ff", -1.6, -1) + faceMarks(false, 1));
  fg += rim(arm, `url(#${p}-fig)`, "#eef3ff", -1, -2);
  fg += `<path d="M770 548L812 510" stroke="#1a1e3a" stroke-width="4"/><path d="M770 548l4 2 -2 -6z" fill="#8fb8ff"/><circle cx="772" cy="550" r="22" fill="url(#${p}-book)" ${A(p, "pu", 0, 1.8)}/>`;
  b += fg;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.1], [1, "#030206", 0.85]], 0.55, 0.5, 0.75), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_c_good — Cassian good ending: the dawn-star reignites; embrace
// ────────────────────────────────────────────────────────────────────────────
function cgCGood(): string {
  const p = "cg_c_good";
  const r = rng(1515);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#070a1c"],
      [0.4, "#1a2152"],
      [0.7, "#3a3a7a"],
      [1, "#5a4a80"],
    ]) +
    glowGrad(`${p}-star`, "#fff4dc", 1, 0.35) +
    glowGrad(`${p}-sg`, "#f6d48f", 0.6, 0.15) +
    lg(`${p}-stream`, 0, 1, 0, 0, [
      [0, "#8fb8ff", 0],
      [0.4, "#b9d0ff", 0.6],
      [1, "#ffffff", 0],
    ]) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#2a2a5a"],
      [0.6, "#161838"],
      [1, "#0c0e24"],
    ]) +
    lg(`${p}-roof`, 0, 0, 0, 1, [
      [0, "#3a3e70"],
      [1, "#0c0e22"],
    ]) +
    glowGrad(`${p}-circ`, "#8fb8ff", 0.7, 0.2) +
    blurFilter(`${p}-b`, 7);
  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  b += starField(r, 260, 0, 0, 1600, 520, "#dfe6ff", 1.6);
  b += starRing(p, { cx: 800, cy: 1400, rx: 1600, ry: 1300, rot: 10, t0: 205, t1: 335, n: 360, spread: 24, seed: 151, op: 0.6, filter: `${p}-b`, sparkles: 4 }, 2);
  // falling stars (meteor shower)
  let met = "";
  for (let i = 0; i < 22; i++) {
    const x = r() * 1700;
    const y = r() * 380;
    const l = 60 + r() * 140;
    met += `M${Math.round(x)} ${Math.round(y)}l${Math.round(-l)} ${Math.round(l * 0.55)}`;
  }
  b += `<path d="${met}" stroke="#eef3ff" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`;
  // the new dawn-star
  const sx = 800, sy = 150;
  b += `<circle cx="${sx}" cy="${sy}" r="420" fill="url(#${p}-sg)" opacity=".7"/><circle cx="${sx}" cy="${sy}" r="130" fill="url(#${p}-star)" ${A(p, "pu", 0, 3)}/>`;
  let rays = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const L = i % 3 === 0 ? 320 : 150;
    const w = 0.03;
    rays += `M${sx} ${sy}L${n1(sx + Math.cos(a - w) * L)} ${n1(sy + Math.sin(a - w) * L)}L${n1(sx + Math.cos(a + w) * L)} ${n1(sy + Math.sin(a + w) * L)}Z`;
  }
  b += `<path d="${rays}" fill="#fff4dc" opacity=".35"/><ellipse cx="${sx}" cy="${sy}" rx="520" ry="3" fill="#fff4dc" opacity=".5"/>`;
  b += `<path d="${sparkle(sx, sy, 56)}" fill="#fff8e8"/><circle cx="${sx}" cy="${sy}" r="14" fill="#fff"/>`;
  // ritual rooftop
  b += `<path d="M0 560L1600 560V900H0Z" fill="url(#${p}-roof)"/>`;
  b += `<path d="M0 520H260V560H0ZM1340 520H1600V560H1340Z" fill="#23284e"/><path d="M40 560V300L90 200L140 300V560ZM1460 560V280L1510 170L1560 280V560Z" fill="#1a1e40"/>`;
  b += `<ellipse cx="800" cy="640" rx="460" ry="80" fill="url(#${p}-circ)"/>`;
  b += `<ellipse cx="800" cy="640" rx="380" ry="64" fill="none" stroke="#b9d0ff" stroke-width="3" opacity=".8"/><ellipse cx="800" cy="640" rx="320" ry="52" fill="none" stroke="#8fb8ff" stroke-width="1.6" opacity=".6"/>`;
  let runes = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    runes += runeD(r, 800 + Math.cos(a) * 350, 640 + Math.sin(a) * 58, 10);
  }
  b += `<path d="${runes}" fill="none" stroke="#dfe8ff" stroke-width="1.6" opacity=".8"/>`;
  // streams of light rising around them
  let st = "";
  for (let i = 0; i < 12; i++) {
    const x = 520 + i * 52 + (r() - 0.5) * 20;
    if (x > 720 && x < 880) continue;
    const w = 6 + r() * 12;
    st += `M${n1(x)} 660C${n1(x + 30)} 500 ${n1(x - 30)} 360 ${n1(x + 10)} ${n1(120 + r() * 120)}l${n1(w)} 0C${n1(x - 20 + w)} 360 ${n1(x + 40 + w)} 500 ${n1(x + w)} 660Z`;
  }
  b += `<path d="${st}" fill="url(#${p}-stream)" opacity=".8"/>`;
  // the embrace: Cassian (right, facing left, head bowed over hers), Estelle (left) face against his chest
  const cx = 836, cy = 300, cs = 0.74, crot = -24;
  const ex = 770, ey = 350, es = 0.64, erot = 10;
  const rimC = "#fff0d0";
  let fg = `<g filter="url(#${p}-b)" opacity=".55">` + place(cx, cy, cs, 0, true, `<path d="${M_BODY}" fill="none" stroke="#fff4dc" stroke-width="14"/>`) + place(ex, ey, es, 0, false, `<path d="${F_BODY}" fill="none" stroke="#fff4dc" stroke-width="14"/>`) + `</g>`;
  fg += place(cx, cy, cs, 0, true, rim("M40 80C90 100 120 180 130 300C136 380 140 440 146 480H-20Z", `url(#${p}-fig)`, "#c8d0f0", -2, 1));
  fg += place(cx, cy, cs, 0, true, rim(M_BODY, `url(#${p}-fig)`, rimC, -2.4, 0.8));
  fg += place(ex, ey, es, erot, false, rim(HAIR_MID, "#1c1830", rimC, -2, 1));
  fg += place(ex, ey, es, 0, false, rim(F_BODY, `url(#${p}-fig)`, rimC, -2.4, 0.8));
  fg += place(ex, ey, es, erot, false, rim(HEAD_F, `url(#${p}-fig)`, "#fff4dc", -2.4, 0.8) + rim(BANGS_F, "#1c1830", rimC, -1.6, 1) + faceMarks(false, 1, true, true));
  fg += place(cx, cy, cs, crot, true, rim(HEAD_M, `url(#${p}-fig)`, "#fff4dc", -2.4, 0.8) + rim(HAIR_M, "#0b0d24", rimC, -1.6, 1.4) + faceMarks(true, 1, false, true));
  // his arms around her back
  fg += rim("M860 400C820 410 770 420 730 436C712 444 704 460 714 468C750 458 800 446 850 440Z", `url(#${p}-fig)`, rimC, 1, -1.6);
  fg += rim("M870 470C826 480 776 490 734 500C718 506 714 520 726 524C770 516 820 508 866 504Z", `url(#${p}-fig)`, rimC, 1, -1.6);
  // her hand on his chest with the ring scar glowing
  fg += `<path d="M806 420c10 -6 20 -4 24 4c-6 10 -18 12 -24 -4z" fill="#4a4c80"/><ellipse cx="800" cy="428" rx="4" ry="10" fill="none" stroke="#eef3ff" stroke-width="1.8"/>`;
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  // rising motes
  for (let i = 0; i < 26; i++) b += `<circle cx="${n1(480 + r() * 640)}" cy="${n1(160 + r() * 480)}" r="${n1(1 + r() * 2.2)}" fill="${r() < 0.5 ? "#fff4dc" : "#cfe0ff"}" ${A(p, "up", r() * 8, 5 + r() * 5)}/>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [[0, "#fff"], [0.75, "#fff"], [1, "#fff", 0]]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="0" y="0" width="1600" height="700" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_lucien_teach — memory: young Lucien guiding a child's hand (sepia)
// ────────────────────────────────────────────────────────────────────────────
function cgLucienTeach(): string {
  const p = "cg_lucien_teach";
  const r = rng(1616);
  const defs =
    rg(`${p}-room`, [
      [0, "#6a4a30"],
      [0.5, "#3a2618"],
      [1, "#140c08"],
    ], 0.3, 0.35, 0.9) +
    glowGrad(`${p}-lamp`, "#f6d48f", 0.9, 0.3) +
    lg(`${p}-desk`, 0, 0, 0, 1, [
      [0, "#6a4428"],
      [1, "#1e120a"],
    ]) +
    lg(`${p}-paper`, 0, 0, 1, 1, [
      [0, "#fff4dc"],
      [1, "#d8c0a0"],
    ]) +
    lg(`${p}-fig`, 1, 0, 0, 1, [
      [0, "#6a5040"],
      [0.5, "#3e2c24"],
      [1, "#20160e"],
    ]) +
    lg(`${p}-robe`, 1, 0, 0, 1, [
      [0, "#c8b8a0"],
      [0.5, "#7a6450"],
      [1, "#3a2a1e"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-room)"/>`;
  // bookshelves (warm, soft)
  let bk = "";
  let sh = "";
  for (let y = 120; y < 560; y += 86) {
    sh += `M0 ${y}H460M1140 ${y}H1600`;
    for (let x = 6; x < 1600; x += 12 + r() * 14) {
      if (x > 460 && x < 1140) continue;
      bk += `M${Math.round(x)} ${y - 4}v${-Math.round(44 + r() * 30)}`;
    }
  }
  b += `<path d="${bk}" stroke="#5a3a24" stroke-width="9" opacity=".75"/><path d="${sh}" stroke="#1e120a" stroke-width="8"/>`;
  // window with night (behind, centre) — soft
  b += `<path d="M620 460V170Q620 90 800 90Q980 90 980 170V460Z" fill="#2a2440"/><path d="M800 90V460M620 280H980" stroke="#3a2618" stroke-width="10"/>`;
  b += starField(r, 40, 630, 100, 970, 450, "#f6e4c0", 1, 0.7);
  // oil lamp (left of desk)
  b += `<circle cx="520" cy="440" r="420" fill="url(#${p}-lamp)" opacity=".7"/>`;
  b += `<path d="M500 560H540L534 520H506Z" fill="#8a5a30"/><path d="M506 520C490 500 490 470 506 450H534C550 470 550 500 534 520Z" fill="#f6d48f" opacity=".6"/><g ${A(p, "fl", 0, 2.4)}><path d="M520 450c8 -12 8 -26 0 -40c-8 14 -8 28 0 40z" fill="#fff4d0"/></g>`;
  // desk + paper
  b += `<path d="M260 560H1340L1440 900H160Z" fill="url(#${p}-desk)"/><path d="M260 560H1340" stroke="#b88a58" stroke-width="3"/>`;
  b += `<path d="M700 572L940 566L964 640L680 648Z" fill="url(#${p}-paper)"/>`;
  // her first word, written just now: a short glowing line
  const word = glyphD(r, 740, 606, 12) + glyphD(r, 770, 604, 11);
  b += `<path d="${word}" fill="none" stroke="#3a2a40" stroke-width="2.4" stroke-linecap="round"/><path d="${scriptRows(r, [[720, 580], [930, 576], [940, 596], [714, 600]], 1, 6, 0.6)}" fill="none" stroke="#8a7a70" stroke-width="1.4" opacity=".6"/>`;
  // ── the girl (12, seated, facing right, looking down) ──
  const gx = 666, gy = 410, gs = 0.56, gr = 22;
  const gBody = "M650 446C630 454 618 474 616 504C614 530 616 556 620 580H752C748 566 738 552 722 540C706 526 694 502 686 480C678 460 666 448 650 446Z";
  const gArm = "M672 470C686 492 700 516 722 540C736 556 756 574 776 590C786 598 782 610 770 606C748 596 722 574 702 552C684 530 668 504 660 484Z";
  // ── Lucien (20, standing behind-right, bending over, facing left) ──
  const lx = 880, ly = 300, ls = 0.66, lr = -26;
  const lBody = "M900 336C930 346 952 370 962 404C972 440 972 490 970 540L974 600H820C826 560 830 520 840 480C850 440 866 404 884 350Z";
  const lArm = "M880 380C866 420 846 470 826 520C812 552 796 574 780 588C772 596 780 606 790 600C810 588 832 566 850 536C870 500 888 450 902 400Z";
  const warm = "#ffd89a";
  let fg = `<g filter="url(#${p}-b)" opacity=".4"><path d="${gBody}${lBody}" fill="none" stroke="#ffe4b0" stroke-width="10"/></g>`;
  fg += rim(lBody, `url(#${p}-robe)`, warm, 2, 1);
  fg += place(lx, ly, ls, lr * 0.5, true, rim(HAIR_LUC_TAIL, "#d8ccb8", "#fff4dc", -1.6, 1));
  fg += place(lx, ly, ls, lr, true, rim(HEAD_M, `url(#${p}-fig)`, "#ffe8c0", -2, 0.8) + rim(HAIR_LUC_CAP, "#d8ccb8", "#fff4dc", -1.6, 1) +
    `<path d="M20 -40C0 -52 -30 -48 -44 -20" fill="none" stroke="#fff4dc" stroke-width="2" opacity=".7"/>` + faceMarks(true, 1, true, true) + glasses(false));
  fg += place(gx, gy, gs, gr, false, rim(HAIR_LONG, "#2a1a14", warm, -2, 1));
  fg += rim(gBody, `url(#${p}-robe)`, warm, -2, 1);
  fg += place(gx, gy, gs, gr, false, rim(HEAD_F, `url(#${p}-fig)`, "#ffe8c0", -2, 0.8) + rim(BANGS_F, "#2a1a14", warm, -1.4, 1) + faceMarks(false, 1));
  fg += rim(gArm, `url(#${p}-fig)`, warm, -1, 1.6);
  // pen held by both hands: his hand over hers
  fg += `<path d="M770 604L804 560" stroke="#2a1a14" stroke-width="3.2"/><path d="M804 560C812 540 830 526 848 520C838 538 824 552 806 562Z" fill="#fff4dc"/>`;
  fg += rim(lArm, `url(#${p}-robe)`, warm, 1, 1.6);
  fg += `<path d="M784 596C776 590 776 580 786 576C796 574 806 580 806 590C804 598 792 602 784 596Z" fill="#8a6a54"/><path d="M786 578C794 574 804 578 806 588" fill="none" stroke="#f0e8f8" stroke-width="1.6"/>`;
  b += fg;
  // floating dust in lamplight
  for (let i = 0; i < 20; i++) b += `<circle cx="${n1(420 + r() * 600)}" cy="${n1(200 + r() * 360)}" r="${n1(0.8 + r() * 1.6)}" fill="#fff0c8" ${A(p, "up", r() * 8, 6 + r() * 5)}/>`;
  // sepia memory vignette
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#f6d48f", 0.06], [0.55, "#3a2618", 0.1], [1, "#0a0604", 0.9]], 0.5, 0.5, 0.72), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_l_good — Lucien good ending: two hands on one pen, light from the pages
// ────────────────────────────────────────────────────────────────────────────
function cgLGood(): string {
  const p = "cg_l_good";
  const r = rng(1717);
  const defs =
    rg(`${p}-bg`, [
      [0, "#4a4a8a"],
      [0.5, "#1e2250"],
      [1, "#080a1c"],
    ], 0.5, 0.6, 0.8) +
    glowGrad(`${p}-g`, "#fff4dc", 1, 0.4) +
    glowGrad(`${p}-g2`, "#c8c3e8", 0.7, 0.2) +
    lg(`${p}-page`, 0, 0, 0, 1, [
      [0, "#ffffff"],
      [1, "#e8e0f0"],
    ]) +
    lg(`${p}-ray`, 0, 1, 0, 0, [
      [0, "#fff8e8", 0.6],
      [1, "#fff8e8", 0],
    ]) +
    lg(`${p}-his`, 1, 0, 0, 1, [
      [0, "#e8e4f8"],
      [0.5, "#9a96c4"],
      [1, "#3a3a6a"],
    ]) +
    lg(`${p}-her`, 0, 0, 1, 1, [
      [0, "#f0e0e4"],
      [0.5, "#a890b0"],
      [1, "#3a3060"],
    ]) +
    lg(`${p}-robeL`, 1, 0, 0, 1, [
      [0, "#f4f2fa"],
      [1, "#8a88b8"],
    ]) +
    lg(`${p}-robeE`, 0, 0, 1, 1, [
      [0, "#e8e6f4"],
      [1, "#6a6aa0"],
    ]) +
    blurFilter(`${p}-b`, 8);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // light pouring up from the pages
  let rays = "";
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI / 2 + (i - 5) * 0.2;
    const w = 0.05 + r() * 0.05;
    rays += `M800 560L${n1(800 + Math.cos(a - w) * 900)} ${n1(560 + Math.sin(a - w) * 900)}L${n1(800 + Math.cos(a + w) * 900)} ${n1(560 + Math.sin(a + w) * 900)}Z`;
  }
  b += `<path d="${rays}" fill="url(#${p}-ray)"/>`;
  b += `<ellipse cx="800" cy="540" rx="560" ry="360" fill="url(#${p}-g)" opacity=".55"/>`;
  // hair locks framing the top: his silver (right), her dark (left)
  b += `<path d="M1180 -20C1150 120 1120 220 1080 300C1060 340 1060 380 1080 420C1040 400 1020 350 1030 300C1040 220 1080 120 1100 -20Z" fill="#c8c3e8" opacity=".85"/><path d="M1150 -20C1130 120 1100 230 1066 310" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`;
  b += `<path d="M380 -20C400 120 440 220 480 280C500 320 500 360 480 400C530 380 550 330 540 280C530 200 490 100 470 -20Z" fill="#2a1e30"/><path d="M420 -20C440 120 470 220 506 290" fill="none" stroke="#dfe0f4" stroke-width="2" opacity=".5"/>`;
  // the book
  b += `<path d="M800 520C700 490 560 492 440 510L400 640C540 626 680 632 800 660Z" fill="url(#${p}-page)"/><path d="M800 520C900 490 1040 492 1160 510L1200 640C1060 626 920 632 800 660Z" fill="url(#${p}-page)"/><path d="M800 520V660" stroke="#b8b0d0" stroke-width="2"/>`;
  b += `<path d="M396 648C540 634 680 640 800 668C920 640 1060 634 1204 648L1200 662C1060 650 920 656 800 682C680 656 540 650 400 662Z" fill="#6a6490"/>`;
  const wr = scriptRows(r, [[460, 520], [780, 524], [786, 648], [430, 630]], 6, 8) + scriptRows(r, [[820, 524], [1000, 516], [1010, 560], [816, 570]], 2, 8, 0.7);
  b += `<path d="${wr}" fill="none" stroke="#b89a54" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`;
  // the line they are writing together (glowing gold)
  const fresh = glyphD(r, 840, 596, 12) + glyphD(r, 868, 594, 12) + glyphD(r, 896, 596, 12);
  b += `<g filter="url(#${p}-b)"><path d="${fresh}" fill="none" stroke="#f6d48f" stroke-width="7" stroke-linecap="round"/></g><path d="${fresh}" fill="none" stroke="#fffaf0" stroke-width="2.2" stroke-linecap="round"/>`;
  // glyphs rising out of the pages
  for (let i = 0; i < 20; i++) b += `<path d="${runeD(r, 560 + r() * 480, 180 + r() * 320, 10 + r() * 8)}" fill="none" stroke="#fff4dc" stroke-width="1.8" stroke-linecap="round" ${A(p, i % 2 ? "up" : "pu", r() * 8, 5 + r() * 5)}/>`;
  // hands: hers from lower left holding the pen, his from lower right over hers
  const penTip: Pt = [926, 598];
  b += `<path d="M${penTip[0]} ${penTip[1]}L1010 450" stroke="#2a2a4a" stroke-width="5"/><path d="M1010 450C1030 410 1060 390 1100 380C1080 420 1050 440 1016 456Z" fill="#fff" opacity=".9"/><circle cx="${penTip[0]}" cy="${penTip[1]}" r="30" fill="url(#${p}-g)" ${A(p, "pu", 0, 2)}/>`;
  const herSleeve = "M300 900C380 800 460 730 560 680L620 740C540 780 470 840 420 900Z";
  const herHand = "M560 680C640 640 720 620 800 612C840 608 880 606 910 604C924 604 930 612 922 618C900 626 880 628 866 632C880 638 884 648 874 652C850 656 828 654 810 650C780 666 720 700 620 740Z";
  const hisSleeve = "M1320 900C1260 800 1190 720 1110 670L1060 740C1120 780 1180 840 1220 900Z";
  const hisHand = "M1110 670C1060 640 1010 616 968 604C952 598 936 596 924 600C914 604 918 614 930 616C946 618 958 622 968 628C952 634 940 640 944 648C950 654 966 652 980 648C1000 664 1030 690 1060 740Z";
  b += rim(herHand, `url(#${p}-her)`, "#fff4dc", 0, 2.4) + rim(herSleeve, `url(#${p}-robeE)`, "#ffffff", 0, 2.4);
  b += `<g fill="#27407a" opacity=".85"><ellipse cx="900" cy="610" rx="5" ry="2.4"/><ellipse cx="850" cy="640" rx="4" ry="2"/></g>`;
  b += `<ellipse cx="590" cy="700" rx="8" ry="30" transform="rotate(40 590 700)" fill="none" stroke="#eef3ff" stroke-width="2"/>`;
  b += rim(hisHand, `url(#${p}-his)`, "#ffffff", 0, 2.4) + rim(hisSleeve, `url(#${p}-robeL)`, "#ffffff", 0, 2.4);
  b += `<path d="M1106 676C1150 720 1190 780 1220 840" fill="none" stroke="#c8c3e8" stroke-width="3" opacity=".7"/>`;
  // silver-tinted fingertips
  b += `<g fill="#e8eaff"><ellipse cx="926" cy="608" rx="5" ry="3"/><ellipse cx="946" cy="646" rx="5" ry="3"/></g>`;
  for (let i = 0; i < 14; i++) b += `<circle cx="${n1(600 + r() * 400)}" cy="${n1(260 + r() * 300)}" r="${n1(1 + r() * 2)}" fill="#fff8e8" ${A(p, "up", r() * 8, 5 + r() * 5)}/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.65, "#000", 0.1], [1, "#04050e", 0.8]], 0.5, 0.55, 0.75), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_sea — True route: the ferry across the Nameless Sea
// ────────────────────────────────────────────────────────────────────────────
function cgSea(): string {
  const p = "cg_sea";
  const r = rng(1818);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#05070d"],
      [0.5, "#101826"],
      [1, "#1e2a3a"],
    ]) +
    lg(`${p}-sea`, 0, 0, 0, 1, [
      [0, "#1b2330"],
      [0.3, "#0a0e16"],
      [1, "#05070d"],
    ]) +
    glowGrad(`${p}-fog`, "#88c0c0", 0.35, 0.1) +
    glowGrad(`${p}-g`, "#dfe6ff", 0.8, 0.25) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#1e2a38"],
      [1, "#0a0e16"],
    ]) +
    lg(`${p}-mask`, 0, 0, 1, 1, [
      [0, "#f4f1ea"],
      [1, "#9aa4a8"],
    ]) +
    blurFilter(`${p}-b`, 5);
  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  b += starField(r, 120, 0, 0, 1600, 380, "#b9c6d8", 1.4, 0.6);
  b += starRing(p, { cx: 800, cy: 1300, rx: 1600, ry: 1220, rot: -5, t0: 208, t1: 332, n: 320, spread: 22, seed: 181, op: 0.35, color: "#b9c6d8", glow: "#6a8a9a", filter: `${p}-b`, sparkles: 4 }, 2);
  // horizon fog
  b += `<ellipse cx="800" cy="420" rx="900" ry="120" fill="url(#${p}-fog)"/>`;
  // sea
  b += `<rect y="410" width="1600" height="490" fill="url(#${p}-sea)"/>`;
  let wv = "";
  for (let i = 0; i < 70; i++) {
    const y = 420 + Math.pow(r(), 1.5) * 470;
    const x = r() * 1600;
    const l = 20 + (y - 410) * 0.25 * (0.5 + r());
    wv += `M${Math.round(x)} ${Math.round(y)}q${n1(l / 2)} -3 ${n1(l)} 0`;
  }
  b += `<path d="${wv}" fill="none" stroke="#3a4a5a" stroke-width="1.6" opacity=".7"/>`;
  // silver glyphs floating on the water (perspective scale)
  let gl = "";
  for (let i = 0; i < 90; i++) {
    const y = 426 + Math.pow(r(), 1.3) * 460;
    gl += runeD(r, r() * 1600, y, 4 + (y - 410) * 0.035);
  }
  b += `<g filter="url(#${p}-b)"><path d="${gl}" fill="none" stroke="#b9c6f2" stroke-width="3" opacity=".35"/></g><path d="${gl}" fill="none" stroke="#e8eeff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>`;
  for (let i = 0; i < 18; i++) b += `<path d="${runeD(r, r() * 1600, 440 + r() * 400, 10 + r() * 6)}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" ${A(p, i % 2 ? "sw" : "pu", r() * 6, 5 + r() * 5)}/>`;
  // the boat
  const hull = "M600 470C640 500 720 512 800 512C880 512 960 500 1010 466L996 488C960 520 880 536 800 536C720 536 646 524 612 492Z";
  b += `<path d="M600 474C640 506 720 518 800 518C880 518 960 506 1010 470L1016 470C990 520 880 546 800 546C720 546 620 530 596 476Z" fill="#141a24"/>`;
  b += `<path d="${hull}" fill="#2a3440"/><path d="M600 470C640 500 720 512 800 512C880 512 960 500 1010 466" fill="none" stroke="#88c0c0" stroke-width="2"/>`;
  // lantern on the bow
  b += `<path d="M612 470V430" stroke="#1a2230" stroke-width="3"/><circle cx="612" cy="426" r="44" fill="url(#${p}-g)"/><circle cx="612" cy="426" r="5" fill="#f4f6ff" ${A(p, "pu", 0, 3)}/>`;
  // reflection
  b += `<path d="M640 548C700 560 900 560 980 540L960 600C880 610 720 610 660 600Z" fill="#88c0c0" opacity=".06"/>`;
  // passengers: Estelle standing at the bow looking ahead; Cassian and Lucien seated
  const rimT = "#88c0c0";
  const eS = "M672 364C682 364 688 372 688 382C688 388 692 392 692 396L688 398C688 404 684 408 678 408L678 418C690 424 696 436 698 452L702 490H650L654 450C656 434 662 424 668 418L666 406C660 400 658 392 660 382C662 372 666 364 672 364Z";
  const eHair = "M672 360C684 360 692 370 690 384L684 380C680 378 676 380 674 390C672 404 668 420 660 430C656 416 658 400 658 388C658 372 664 360 672 360Z";
  b += rim(eS, "#0e1420", rimT, 1.4, 1) + rim(eHair, "#0a0e16", rimT, 1.4, 1);
  const cS = "M790 400C804 400 812 410 812 424C812 434 808 440 802 444L804 452C822 458 834 472 836 494L760 496C762 474 772 460 784 452L780 444C772 438 768 432 768 422C768 410 778 400 790 400Z";
  const cHair = "M790 396C806 396 816 408 814 424L808 428L804 418L798 422L792 414L784 420L778 414L770 424C766 408 774 396 790 396Z";
  b += rim(cS, "#0e1420", rimT, 1.4, 1) + rim(cHair, "#080c14", rimT, 1.4, 1);
  const lS = "M868 404C880 404 888 414 888 426C888 436 884 442 878 446L880 454C896 460 906 474 906 494H836C838 474 846 460 858 454L858 446C852 442 848 436 848 426C848 414 856 404 868 404Z";
  const lHair = "M868 400C882 400 892 410 890 426L884 420C878 424 870 428 862 428L858 450C850 446 846 436 846 424C846 410 854 400 868 400Z";
  b += rim(lS, "#0e1420", rimT, 1.4, 1) + rim(lHair, "#8a96a8", "#dfe6ff", 1.4, 1);
  b += `<path d="M880 444C890 448 894 454 892 470" stroke="#8a96a8" stroke-width="5" stroke-linecap="round"/><ellipse cx="880" cy="424" rx="5" ry="4" fill="none" stroke="#dfe6ff" stroke-width="1.4"/>`;
  // the ferrywoman at the stern: tall, masked, white hair streaming, pole into the water
  const fw = "M960 250C976 250 986 262 986 280C986 296 978 308 968 312L970 326C990 334 1004 352 1008 380C1014 420 1012 460 1006 480H930C926 450 926 410 930 380C934 352 946 334 962 326L960 312C950 306 944 296 944 280C944 262 950 250 960 250Z";
  const fHair = "M962 244C980 242 994 256 992 276C1010 290 1040 300 1080 300C1060 312 1030 316 1004 312C1030 330 1070 346 1110 350C1080 362 1040 360 1000 344C996 330 990 320 984 316C978 300 970 290 960 286Z";
  const fMask = "M946 262C946 252 954 246 962 246C972 246 980 254 980 268C980 282 976 294 968 300C958 302 948 296 946 284Z";
  b += `<g filter="url(#${p}-b)" opacity=".6"><path d="${fw}${fHair}" fill="none" stroke="#88c0c0" stroke-width="6"/></g>`;
  b += rim(fHair, "#c8ccd0", "#ffffff", 1, 1.4) + rim(fw, `url(#${p}-fig)`, rimT, 1.6, 1);
  b += `<path d="${fMask}" fill="url(#${p}-mask)"/><path d="M952 266C956 278 960 288 966 294" fill="none" stroke="#6a7478" stroke-width="1.6" opacity=".7"/>`;
  b += `<path d="M940 380C960 400 990 420 1010 440" fill="none" stroke="#3a4a5a" stroke-width="2"/>`;
  // tattered hem
  b += `<path d="M930 480l8 14 8 -12 8 16 10 -14 8 12 10 -16 10 12 10 -12" fill="none" stroke="#0e1420" stroke-width="4"/>`;
  // pole
  b += `<path d="M1060 150L920 620" stroke="#1a2230" stroke-width="7"/><path d="M1060 150L920 620" stroke="#88c0c0" stroke-width="1.4" opacity=".6"/>`;
  b += `<path d="M1000 380C990 370 986 356 994 348L1008 356Z" fill="#0e1420"/>`;
  b += `<ellipse cx="930" cy="590" rx="40" ry="6" fill="none" stroke="#88c0c0" stroke-width="1.4" opacity=".5" ${A(p, "pu", 1, 3)}/>`;
  b += `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`;
  return svg(p, defs + rg(`${p}-vg`, [[0, "#000", 0], [0.6, "#000", 0.1], [1, "#010204", 0.85]], 0.5, 0.45, 0.72), b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_sisters — True route: Isolde embraces her sister; a teacup falls
// ────────────────────────────────────────────────────────────────────────────
function cgSisters(): string {
  const p = "cg_sisters";
  const r = rng(1919);
  const defs =
    lg(`${p}-wall`, 0, 0, 0, 1, [
      [0, "#2a1420"],
      [1, "#140a12"],
    ]) +
    lg(`${p}-drape`, 0, 0, 1, 0, [
      [0, "#4a1424"],
      [0.5, "#a8344a"],
      [1, "#4a1424"],
    ]) +
    lg(`${p}-win`, 0, 0, 0, 1, [
      [0, "#141a44"],
      [1, "#2a3470"],
    ]) +
    glowGrad(`${p}-can`, "#f6d48f", 0.8, 0.25) +
    lg(`${p}-gown`, 0, 0, 0, 1, [
      [0, "#7c1f33"],
      [0.4, "#4a1020"],
      [1, "#14060c"],
    ]) +
    lg(`${p}-fig`, 0, 0, 0, 1, [
      [0, "#3a2a3a"],
      [1, "#140c14"],
    ]) +
    lg(`${p}-robe`, 0, 0, 0, 1, [
      [0, "#c8c0d0"],
      [0.5, "#6e6480"],
      [1, "#2a2438"],
    ]) +
    lg(`${p}-floor`, 0, 0, 0, 1, [
      [0, "#3a2028"],
      [1, "#0e0608"],
    ]) +
    blurFilter(`${p}-b`, 6);
  let b = `<rect width="1600" height="900" fill="url(#${p}-wall)"/>`;
  // tall windows with night + moon glow; crimson drapes
  for (const x of [300, 1300]) {
    b += `<path d="M${x - 110} 600V180Q${x - 110} 60 ${x} 60Q${x + 110} 60 ${x + 110} 180V600Z" fill="url(#${p}-win)"/><path d="M${x} 60V600M${x - 110} 330H${x + 110}" stroke="#1a0c14" stroke-width="10"/>`;
    b += `<path d="M${x - 170} 20C${x - 130} 200 ${x - 140} 420 ${x - 160} 640H${x - 90}C${x - 80} 400 ${x - 100} 200 ${x - 110} 20ZM${x + 170} 20C${x + 130} 200 ${x + 140} 420 ${x + 160} 640H${x + 90}C${x + 80} 400 ${x + 100} 200 ${x + 110} 20Z" fill="url(#${p}-drape)"/>`;
  }
  b += starField(r, 50, 190, 70, 410, 590, "#dfe6ff", 1, 0.7) + starField(r, 50, 1190, 70, 1410, 590, "#dfe6ff", 1, 0.7);
  // gilded wall panels
  b += `<path d="M520 120H1080V600H520Z" fill="none" stroke="#b8742e" stroke-width="3" opacity=".4"/><path d="M560 160H1040V560H560Z" fill="#3a1a26" opacity=".4"/>`;
  // candelabra glow
  b += `<circle cx="560" cy="360" r="380" fill="url(#${p}-can)" opacity=".6"/>`;
  for (const x of [530, 560, 590]) b += `<path d="M${x} 420V380" stroke="#b8742e" stroke-width="4"/><g ${A(p, "fl", x / 100, 2.4)}><path d="M${x} 378c5 -8 5 -16 0 -24c-5 8 -5 16 0 24z" fill="#fff0c8"/></g>`;
  b += `<path d="M520 420H600M560 420V520M536 520H584" stroke="#b8742e" stroke-width="5"/>`;
  // floor
  b += `<path d="M0 600H1600V900H0Z" fill="url(#${p}-floor)"/><path d="M0 600H1600" stroke="#b8742e" stroke-width="2" opacity=".5"/>`;
  // small table with two cups (left-front)
  b += `<ellipse cx="520" cy="560" rx="130" ry="26" fill="#5a2a2a"/><path d="M390 560V572Q520 600 650 572V560Q520 588 390 560Z" fill="#3a1a1a"/><path d="M510 586V660M530 586V660" stroke="#2a1214" stroke-width="8"/>`;
  const cup = (x: number, y: number) => `<path d="M${x - 16} ${y - 20}H${x + 16}L${x + 12} ${y - 2}Q${x} ${y + 4} ${x - 12} ${y - 2}Z" fill="#f4f1ea"/><path d="M${x + 15} ${y - 16}q10 2 6 10q-4 4 -8 2" fill="none" stroke="#f4f1ea" stroke-width="2.4"/><ellipse cx="${x}" cy="${y}" rx="26" ry="6" fill="#dcd6cb"/><ellipse cx="${x}" cy="${y - 20}" rx="16" ry="4" fill="#8a4a2a"/><path d="M${x - 10} ${y - 16}h6" stroke="#b8742e" stroke-width="1.6"/>`;
  b += cup(470, 560) + cup(560, 556);
  b += `<path d="M470 530c4 -10 -4 -16 0 -26M560 526c4 -10 -4 -16 0 -26" fill="none" stroke="#f4f1ea" stroke-width="1.6" opacity=".35" ${A(p, "up", 0, 5)}/>`;
  // ── embrace: Isolde (right, facing left, taller) holds Estelle (left, facing right) ──
  const ix = 846, iy = 270, is = 0.66, irot = -22;
  const ex = 770, ey = 320, es = 0.58, erot = -4;
  const rimR = "#e08a9a", rimE = "#f6d8b8";
  let fg = `<g filter="url(#${p}-b)" opacity=".45">` + place(ix, iy, is, 0, true, `<path d="${F_BODY}" fill="none" stroke="#ffc0c8" stroke-width="12"/>`) + place(ex, ey, es, 0, false, `<path d="${F_BODY}" fill="none" stroke="#ffe8d0" stroke-width="12"/>`) + `</g>`;
  // Isolde gown (wider skirt) + high lace collar
  fg += place(ix, iy, is, 0, true, rim("M-16 68C-34 78 -46 96 -48 122C-50 162 -46 200 -48 240C-70 320 -110 400 -140 480H150C120 400 80 320 50 250C44 210 46 180 42 160C38 130 32 110 24 96C18 86 14 78 12 68Z", `url(#${p}-gown)`, rimR, -2.4, 1));
  fg += place(ix, iy, is, 0, true, `<path d="M-40 130C-20 200 0 300 -10 480M20 140C40 220 70 330 110 480" fill="none" stroke="#14060c" stroke-width="4" opacity=".7"/><path d="M-18 64L-14 88L0 80L12 90L16 64" fill="#e8e0e0" opacity=".85"/>`);
  fg += place(ex, ey, es, erot, false, rim(HAIR_MID, "#2a1a20", rimE, -2, 1));
  fg += place(ex, ey, es, 0, false, rim(F_BODY, `url(#${p}-robe)`, rimE, -2.4, 1));
  fg += place(ex, ey, es, erot, false, rim(HEAD_F, `url(#${p}-fig)`, "#ffe8d0", -2.4, 0.8) + rim(BANGS_F, "#2a1a20", rimE, -1.6, 1) + faceMarks(false, 1, false, true));
  fg += place(ix, iy, is, irot, true, rim(HEAD_F, `url(#${p}-fig)`, "#ffd0d8", -2.4, 0.8) + rim(HAIR_UPDO, "#1a0c10", rimR, -1.6, 1) + CIRCLET + faceMarks(false, 1, false, true));
  // tear on Isolde's cheek
  const tp = wpt(26, 16, ix, iy, is, irot, true);
  fg += `<path d="M${n1(tp[0])} ${n1(tp[1])}q3 6 0 9q-3 -3 0 -9z" fill="#fff" ${A(p, "tw", 0, 3)}/>`;
  // Isolde's arms around Estelle's back
  fg += rim("M860 360C820 368 770 380 730 398C714 406 708 420 718 428C756 414 806 404 852 400Z", `url(#${p}-gown)`, rimR, 1, -1.6);
  fg += rim("M864 430C820 440 772 452 736 466C722 472 720 486 732 490C772 480 820 470 862 466Z", `url(#${p}-gown)`, rimR, 1, -1.6);
  fg += `<path d="M718 428c-8 -2 -12 -10 -6 -16c6 -2 12 2 12 8z" fill="#c8a0a8"/>`;
  b += `<g mask="url(#${p}-m)">${fg}</g>`;
  // the fallen teacup and the spill on the floor (right-front)
  b += `<ellipse cx="1010" cy="648" rx="110" ry="16" fill="#8a4a2a" opacity=".7"/><ellipse cx="1000" cy="646" rx="70" ry="9" fill="#b8742e" opacity=".4"/>`;
  b += `<g transform="rotate(-100 980 636)"><path d="M964 616H996L992 634Q980 640 968 634Z" fill="#f4f1ea"/><path d="M995 620q10 2 6 10q-4 4 -8 2" fill="none" stroke="#f4f1ea" stroke-width="2.4"/></g>`;
  b += `<ellipse cx="1060" cy="650" rx="26" ry="6" fill="#dcd6cb" transform="rotate(12 1060 650)"/><path d="M1040 630l6 -4M1078 628l-4 -6" stroke="#f4f1ea" stroke-width="2"/>`;
  const defs2 = defs + lg(`${p}-mg`, 0, 0, 0, 1, [[0, "#fff"], [0.8, "#fff"], [1, "#fff", 0]]) +
    `<mask id="${p}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect x="0" y="0" width="1600" height="680" fill="url(#${p}-mg)"/></mask>`;
  return svg(p, defs2 + rg(`${p}-vg`, [[0, "#000", 0], [1, "#000", 0.7]], 0.5, 0.45, 0.75), b + `<rect width="1600" height="900" fill="url(#${p}-vg)"/>`);
}

export const CGS: Record<string, string> = {
  cg_oath: cgOath(),
  cg_newborn: cgNewborn(),
  cg_meet: cgMeet(),
  cg_letter: cgLetter(),
  cg_lantern: cgLantern(),
  cg_vault: cgVault(),
  cg_umbrella: cgUmbrella(),
  cg_confession: cgConfession(),
  cg_snow_kiss: cgSnowKiss(),
  cg_book: cgBook(),
  cg_c_good: cgCGood(),
  cg_c_bad: cgCBad(),
  cg_lucien_teach: cgLucienTeach(),
  cg_l_good: cgLGood(),
  cg_l_bad: cgLBad(),
  cg_sea: cgSea(),
  cg_depth: cgDepth(),
  cg_sisters: cgSisters(),
  cg_true: cgTrue(),
};
