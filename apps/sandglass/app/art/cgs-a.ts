// 이벤트 CG (A 묶음) — 「천 번째 새벽, 당신에게」
// 모든 CG는 SVG 문자열(viewBox 0 0 1600 900, slice). id·클래스·키프레임은 CG마다 접두어(cg-fall- 등).
// 규칙: 필터 2개 이하, 움직이는 요소 40개 이하(CSS keyframes, opacity/transform만), <text> 금지,
// 무작위는 시드 고정, CG 하나 45KB 이하. 화풍: TV 애니 키 비주얼(셀 셰이딩 + 색 외곽선 + 블룸).

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

function stops(s: Stop[]): string {
  return s
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined || a === 1 ? "" : ` stop-opacity="${a}"`}/>`)
    .join("");
}
function lg(id: string, x1: number, y1: number, x2: number, y2: number, s: Stop[]): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
}
function rg(id: string, s: Stop[], cx = 0.5, cy = 0.5, r = 0.5): string {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;
}
/** color → transparent glow */
function glow(id: string, color: string, core = 0.9, mid = 0.3): string {
  return rg(id, [
    [0, color, core],
    [0.3, color, mid],
    [1, color, 0],
  ]);
}
function blur(id: string, sd: number): string {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
}

/** animation CSS: animated elements get `${p}-a ${p}-<kind>` */
function css(p: string, extra = ""): string {
  return (
    `<style>.${p}-a{transform-box:fill-box;transform-origin:center}` +
    `.${p}-tw{animation:${p}-tw 4s ease-in-out infinite}@keyframes ${p}-tw{0%,100%{opacity:1}50%{opacity:.25}}` +
    `.${p}-pu{animation:${p}-pu 5s ease-in-out infinite}@keyframes ${p}-pu{0%,100%{opacity:.55}50%{opacity:1}}` +
    `.${p}-fl{animation:${p}-fl 2.4s ease-in-out infinite}@keyframes ${p}-fl{0%,100%{transform:scale(1);opacity:1}35%{transform:scale(.92,1.08);opacity:.8}70%{transform:scale(1.05,.95);opacity:.95}}` +
    `.${p}-up{animation:${p}-up 6s linear infinite}@keyframes ${p}-up{0%{transform:translateY(40px);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateY(-120px);opacity:0}}` +
    `.${p}-dn{animation:${p}-dn 7s linear infinite}@keyframes ${p}-dn{0%{transform:translateY(-30px);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateY(90px);opacity:0}}` +
    `.${p}-bob{animation:${p}-bob 6s ease-in-out infinite}@keyframes ${p}-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}` +
    `.${p}-sw{animation:${p}-sw 5s ease-in-out infinite}@keyframes ${p}-sw{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}` +
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

/** many tiny round dots as one stroked path */
function dots(pts: Pt[], w: number, color: string, op: number, extra = ""): string {
  const q = pts.filter(([x, y]) => x > -10 && x < 1610 && y > -10 && y < 910);
  if (!q.length) return "";
  const d = q.map(([x, y]) => `M${n1(x)} ${n1(y)}h0`).join("");
  return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"${extra}/>`;
}
/** 4-point sparkle */
function sparkle(x: number, y: number, s: number): string {
  const k = s * 0.16;
  return `M${n1(x)} ${n1(y - s)}Q${n1(x + k)} ${n1(y - k)} ${n1(x + s)} ${n1(y)}Q${n1(x + k)} ${n1(y + k)} ${n1(x)} ${n1(y + s)}Q${n1(x - k)} ${n1(y + k)} ${n1(x - s)} ${n1(y)}Q${n1(x - k)} ${n1(y - k)} ${n1(x)} ${n1(y - s)}Z`;
}
function place(x: number, y: number, s: number, rot: number, flip: boolean, inner: string): string {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
}
/** cel piece: fill + coloured outline */
function cel(d: string, fill: string, line: string, w = 2.5, extra = ""): string {
  return `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round"${extra}/>`;
}
function ln(d: string, color: string, w: number, op = 1, extra = ""): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}${extra}/>`;
}

/** streams of rising sand: returns static dust dots (many) */
function sandStream(r: () => number, n: number, x0: number, x1: number, y0: number, y1: number, sway: number, phase: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = r();
    const y = y0 + (y1 - y0) * t;
    const x = x0 + (x1 - x0) * t + Math.sin(t * 6 + phase) * sway + (r() - 0.5) * sway * 0.5;
    out.push([x, y]);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Anime head kit. Local coords: head facing viewer-left (3/4), skull top y≈-102,
// chin y≈95, near side (+x) is the character's LEFT side when not flipped.
// ────────────────────────────────────────────────────────────────────────────
interface Skin {
  base: string;
  shade: string;
  line: string;
  blush: string;
}
interface Iris {
  dark: string;
  mid: string;
  light: string;
}
interface HeadOpt {
  p: string;
  id: string; // unique per head in CG
  skin: Skin;
  lash: string;
  near: Iris;
  far: Iris;
  open?: number; // 1 normal, .5 half, 0 closed
  closed?: "happy" | "sad";
  look?: Pt; // iris offset in eye units (-1..1)
  brow?: number; // + worried (inner up), - angry
  browColor?: string;
  mouth?: "n" | "o" | "smile" | "sad" | "part" | "grin" | "soft";
  blush?: number;
  tears?: number; // 0 none, 1 welling, 2 streaming
  shadeSide?: 1 | -1; // which side is in shadow (+1 near side)
  rim?: string; // rim light colour on lit contour
  noNeck?: boolean;
  gaunt?: boolean;
  back?: string; // hair behind head (path in local coords)
  backFill?: string;
  front?: string; // bangs (path)
  frontFill?: string;
  hairLine?: string;
  hairShade?: string; // colour of shadow cast on face by bangs
  extraUnder?: string; // drawn after face, before bangs (ears, horns behind etc)
  extraOver?: string; // drawn after bangs
  side?: string; // side locks in front of the face
  hi?: string; // angel-ring highlight colour
  strands?: string; // strand line colour
  extraBack?: string; // drawn before back hair
}

const FACE =
  "M-50 -40C-54 -8 -56 16 -52 34C-48 52 -36 74 -22 88C-16 94 -8 96 -2 93C18 83 40 64 52 42C60 28 64 4 62 -30C60 -80 30 -102 0 -102C-30 -102 -50 -78 -50 -40Z";
const FACE_GAUNT =
  "M-50 -40C-54 -10 -54 10 -52 26C-50 46 -34 72 -20 88C-14 94 -8 96 -2 93C16 82 34 62 46 42C54 26 62 4 62 -30C60 -80 30 -102 0 -102C-30 -102 -50 -78 -50 -40Z";
const EAR = "M57 -4C68 -12 78 -2 74 14C72 28 64 36 55 34";
const NECK = "M-14 78L-18 150L38 150L34 50Z";

let clipN = 0;

function eye(o: HeadOpt, cx: number, cy: number, w: number, h: number, dir: number, iris: string, ir: Iris): string {
  const open = o.open ?? 1;
  const X = (v: number) => n1(cx + dir * v * w);
  const Y = (v: number) => n1(cy + v * h);
  const lashC = o.lash;
  if (open <= 0.05) {
    const happy = o.closed === "happy";
    const d = happy
      ? `M${X(-0.5)} ${Y(0.12)}C${X(-0.2)} ${Y(-0.26)} ${X(0.3)} ${Y(-0.28)} ${X(0.56)} ${Y(0.06)}`
      : `M${X(-0.5)} ${Y(0.02)}C${X(-0.2)} ${Y(0.3)} ${X(0.3)} ${Y(0.32)} ${X(0.58)} ${Y(0.0)}`;
    return ln(d, lashC, 4.2) + ln(`M${X(0.5)} ${Y(0.04)}l${n1(dir * 7)} -3`, lashC, 2.4);
  }
  const k = open;
  const top = (v: number) => Y(v * k + (1 - k) * 0.12);
  const cid = `${o.p}-ec${clipN++}`;
  const sclera = `M${X(-0.5)} ${Y(0.02)}C${X(-0.32)} ${top(-0.44)} ${X(0.3)} ${top(-0.52)} ${X(0.54)} ${top(-0.28)}C${X(0.58)} ${Y(0.1)} ${X(0.42)} ${Y(0.44)} ${X(0.06)} ${Y(0.47)}C${X(-0.24)} ${Y(0.48)} ${X(-0.44)} ${Y(0.3)} ${X(-0.5)} ${Y(0.02)}Z`;
  const [lx, ly] = o.look ?? [0, 0];
  const icx = cx + dir * 0.02 * w + lx * w * 0.12;
  const icy = cy + 0.06 * h + ly * h * 0.08;
  const rx = 0.31 * w;
  const ry = 0.46 * h;
  let s = `<clipPath id="${cid}"><path d="${sclera}"/></clipPath>`;
  s += `<path d="${sclera}" fill="#fbf9fb"/>`;
  s += `<g clip-path="url(#${cid})">`;
  s += `<ellipse cx="${n1(icx)}" cy="${n1(icy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="url(#${iris})" stroke="${ir.dark}" stroke-width="1.6"/>`;
  s += `<ellipse cx="${n1(icx)}" cy="${n1(icy - ry * 0.06)}" rx="${n1(rx * 0.44)}" ry="${n1(ry * 0.5)}" fill="${ir.dark}" opacity=".9"/>`;
  s += `<path d="M${n1(icx - rx * 0.7)} ${n1(icy + ry * 0.35)}Q${n1(icx)} ${n1(icy + ry * 0.95)} ${n1(icx + rx * 0.7)} ${n1(icy + ry * 0.35)}Q${n1(icx)} ${n1(icy + ry * 0.62)} ${n1(icx - rx * 0.7)} ${n1(icy + ry * 0.35)}Z" fill="${ir.light}" opacity=".75"/>`;
  // lid shadow
  s += `<path d="M${X(-0.6)} ${Y(-0.7)}L${X(0.7)} ${Y(-0.7)}L${X(0.6)} ${top(-0.2)}C${X(0.2)} ${top(-0.38)} ${X(-0.3)} ${top(-0.3)} ${X(-0.6)} ${Y(0.1)}Z" fill="${ir.dark}" opacity=".32"/>`;
  s += `</g>`;
  // highlights
  s += `<ellipse cx="${n1(icx - dir * rx * 0.3)}" cy="${n1(icy - ry * 0.36)}" rx="${n1(rx * 0.34)}" ry="${n1(ry * 0.25)}" fill="#fff" transform="rotate(${-20 * dir} ${n1(icx - dir * rx * 0.3)} ${n1(icy - ry * 0.36)})"/>`;
  s += `<circle cx="${n1(icx + dir * rx * 0.4)}" cy="${n1(icy + ry * 0.36)}" r="${n1(rx * 0.14)}" fill="#fff" opacity=".95"/>`;
  if ((o.tears ?? 0) >= 1) s += `<path d="M${X(-0.3)} ${Y(0.42)}Q${X(0.1)} ${Y(0.56)} ${X(0.45)} ${Y(0.3)}" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8" stroke-linecap="round"/>`;
  // lashes
  s += `<path d="M${X(-0.54)} ${Y(0.04)}C${X(-0.34)} ${top(-0.5)} ${X(0.3)} ${top(-0.6)} ${X(0.6)} ${top(-0.32)}L${X(0.72)} ${top(-0.3)}L${X(0.6)} ${top(-0.18)}C${X(0.3)} ${top(-0.44)} ${X(-0.3)} ${top(-0.38)} ${X(-0.47)} ${Y(0.06)}Z" fill="${lashC}" stroke="${lashC}" stroke-width="1" stroke-linejoin="round"/>`;
  s += ln(`M${X(0.5)} ${Y(0.18)}C${X(0.38)} ${Y(0.42)} ${X(0.14)} ${Y(0.5)} ${X(-0.06)} ${Y(0.48)}`, lashC, 1.8, 0.75);
  s += ln(`M${X(-0.28)} ${top(-0.56)}C${X(0)} ${top(-0.7)} ${X(0.34)} ${top(-0.64)} ${X(0.5)} ${top(-0.48)}`, o.skin.line, 1.3, 0.7);
  return s;
}

function head(o: HeadOpt): string {
  const sk = o.skin;
  const hid = `${o.p}-hc${clipN++}`;
  const iN = `${o.p}-in${clipN}`;
  const iF = `${o.p}-if${clipN}`;
  const face = o.gaunt ? FACE_GAUNT : FACE;
  let s = `<defs>${lg(iN, 0, 0, 0, 1, [[0, o.near.dark], [0.5, o.near.mid], [1, o.near.light]])}${lg(iF, 0, 0, 0, 1, [[0, o.far.dark], [0.5, o.far.mid], [1, o.far.light]])}<clipPath id="${hid}"><path d="${face}"/></clipPath></defs>`;
  s += o.extraBack ?? "";
  if (o.back) s += cel(o.back, o.backFill ?? "#222", o.hairLine ?? "#000", 2.4);
  if (!o.noNeck) {
    s += cel(NECK, sk.base, sk.line, 2.4);
    s += `<path d="M-18 96C0 112 24 108 38 84L38 130L-18 130Z" fill="${sk.shade}"/>`;
  }
  s += cel(EAR, sk.base, sk.line, 2.2);
  s += ln("M61 6C66 2 70 8 67 18", sk.shade, 2.4);
  s += `<path d="${face}" fill="${sk.base}"/>`;
  s += `<g clip-path="url(#${hid})">`;
  const side = o.shadeSide ?? 1;
  if (side === 1) s += `<path d="M70 -110L70 120L10 120C34 90 50 60 48 30C46 0 40 -40 52 -110Z" fill="${sk.shade}"/>`;
  else s += `<path d="M-70 -110L-70 120L-10 120C-34 86 -44 60 -44 30C-44 0 -40 -40 -40 -110Z" fill="${sk.shade}"/>`;
  if (o.front) s += `<path d="${o.front}" fill="${o.hairShade ?? sk.shade}" transform="translate(4 12)"/>`;
  if (o.gaunt)
    s += `<path d="M-46 30C-40 50 -30 60 -24 62C-34 50 -40 40 -46 30ZM30 28C34 44 32 56 24 66C38 56 44 44 44 30Z" fill="${sk.shade}" opacity=".8"/>`;
  s += `</g>`;
  if (o.rim) s += ln(side === 1 ? "M-51 -30C-55 0 -56 18 -52 34C-48 52 -36 72 -22 88" : "M62 -26C64 4 60 28 52 42C42 62 24 80 6 90", o.rim, 3, 0.9);
  s += `<path d="${face}" fill="none" stroke="${sk.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // blush
  const bl = o.blush ?? 0.5;
  if (bl > 0)
    s += `<g opacity="${bl}"><ellipse cx="28" cy="44" rx="16" ry="7" fill="${sk.blush}" opacity=".55"/><ellipse cx="-36" cy="44" rx="9" ry="6" fill="${sk.blush}" opacity=".5"/>` +
      ln("M20 42l-4 6M28 42l-4 6M36 42l-4 6", sk.blush, 1.4, 0.9) + `</g>`;
  // eyes
  s += eye(o, 22, 8, 44, 50, 1, iN, o.near);
  s += eye(o, -32, 8, 29, 48, -1, iF, o.far);
  // brows
  const b = o.brow ?? 0;
  const bc = o.browColor ?? o.lash;
  s += `<path d="M4 ${n1(-24 - b * 7)}Q22 ${n1(-31 - b * 2)} 42 ${n1(-26 + b * 4)}Q24 ${n1(-28 - b * 2)} 4 ${n1(-21 - b * 7)}Z" fill="${bc}" stroke="${bc}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="M-18 ${n1(-24 - b * 6)}Q-32 ${n1(-28 - b * 1)} -44 ${n1(-21 + b * 4)}Q-32 ${n1(-25 - b * 1)} -18 ${n1(-21 - b * 6)}Z" fill="${bc}" stroke="${bc}" stroke-width="1.4" stroke-linejoin="round"/>`;
  if (b > 0.6) s += ln("M2 -28q-3 -4 -1 -9", sk.line, 1.2, 0.5);
  // nose
  s += ln("M-11 30L-17 44L-10 46", sk.line, 1.8, 0.8);
  s += `<path d="M-9 36L-4 44L-10 46Z" fill="${sk.shade}" opacity=".7"/>`;
  // mouth
  const m = o.mouth ?? "n";
  const L = sk.line;
  if (m === "n") s += ln("M-20 66Q-10 68 0 65", L, 2);
  else if (m === "soft") s += ln("M-20 65Q-10 69 0 64", L, 2) + ln("M-14 72Q-9 73 -5 72", sk.shade, 1.6);
  else if (m === "smile") s += ln("M-24 62Q-10 72 4 60", L, 2.2) + ln("M-14 70Q-9 72 -5 70", sk.shade, 1.6);
  else if (m === "sad") s += ln("M-20 68Q-10 63 0 67", L, 2);
  else if (m === "o")
    s += `<path d="M-18 62Q-10 58 -2 62Q0 72 -10 76Q-19 72 -18 62Z" fill="#8a3a40" stroke="${L}" stroke-width="2"/><path d="M-15 71Q-10 68 -5 71Q-8 75 -12 74Z" fill="#d97a80"/>`;
  else if (m === "part")
    s += `<path d="M-21 64Q-10 62 1 63Q-4 71 -11 71Q-18 70 -21 64Z" fill="#8a3a40" stroke="${L}" stroke-width="1.8"/><path d="M-19 64.5Q-10 63 -1 64L-2 66Q-10 65 -18 66Z" fill="#fff" opacity=".9"/>`;
  else if (m === "grin")
    s += `<path d="M-26 60Q-10 64 6 58Q2 76 -10 78Q-24 74 -26 60Z" fill="#8a3a40" stroke="${L}" stroke-width="2"/><path d="M-24 61Q-10 64 4 59L2 64Q-10 67 -23 64Z" fill="#fff"/>`;
  if ((o.tears ?? 0) >= 2)
    s += `<path d="M34 34C36 50 30 64 32 80C34 90 40 92 42 84C44 70 38 52 34 34Z" fill="#dff2ff" opacity=".75" stroke="#9cc4e6" stroke-width="1"/><circle cx="37" cy="94" r="3.4" fill="#e6f4ff" opacity=".85"/>`;
  s += o.extraUnder ?? "";
  if (o.front) s += cel(o.front, o.frontFill ?? "#222", o.hairLine ?? "#000", 2.4);
  if (o.hi) s += `<path d="${hiBand(-50, 64, -74, 12, 8, 11)}" fill="${o.hi}" opacity=".85"/>`;
  if (o.strands) s += ln("M-40 -70C-44 -50 -44 -30 -40 -10M-14 -84C-16 -60 -14 -40 -10 -20M14 -86C16 -60 22 -40 24 -20M44 -76C48 -56 54 -40 60 -24", o.strands, 1.6, 0.7);
  if (o.side) s += cel(o.side, o.frontFill ?? "#222", o.hairLine ?? "#000", 2.2);
  s += o.extraOver ?? "";
  return s;
}

/**
 * Bangs builder: `pts` alternates cleft, tip, cleft, tip … from the far temple
 * across the forehead; each clump bulges outward and ends in a sharp tip.
 */
function bangs(pts: Pt[], crown: string): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const P = pts[i - 1], Q = pts[i];
    const tip = i % 2 === 1;
    if (tip)
      d += `C${n1(P[0] + (Q[0] - P[0]) * 0.1)} ${n1(P[1] + (Q[1] - P[1]) * 0.6)} ${n1(Q[0] - (Q[0] - P[0]) * 0.3)} ${n1(Q[1] - (Q[1] - P[1]) * 0.2)} ${Q[0]} ${Q[1]}`;
    else
      d += `C${n1(P[0] + (Q[0] - P[0]) * 0.25)} ${n1(P[1] - (P[1] - Q[1]) * 0.35)} ${n1(Q[0] - (Q[0] - P[0]) * 0.1)} ${n1(Q[1] + (P[1] - Q[1]) * 0.45)} ${Q[0]} ${Q[1]}`;
  }
  return d + crown + "Z";
}
/** tapered lock of hair along a cubic curve (root width w) */
function lock(a: Pt, c1: Pt, c2: Pt, e: Pt, w: number, taper = 0.95): string {
  const N = 12;
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0];
    const y = u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1];
    const dx = 3 * u * u * (c1[0] - a[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (e[0] - c2[0]);
    const dy = 3 * u * u * (c1[1] - a[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (e[1] - c2[1]);
    const l = Math.hypot(dx, dy) || 1;
    const ww = (w / 2) * (1 - t * taper) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.6)));
    L.push([x - (dy / l) * ww, y + (dx / l) * ww]);
    R.push([x + (dy / l) * ww, y - (dx / l) * ww]);
  }
  const pts = L.concat(R.reverse());
  return "M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z";
}
/** lighter "angel ring" band with a zigzag lower edge */
function hiBand(x0: number, x1: number, y: number, bulge: number, th: number, n: number): string {
  const Y = (x: number) => y - bulge * (1 - Math.pow((2 * (x - x0)) / (x1 - x0) - 1, 2));
  let d = `M${x0} ${n1(Y(x0))}`;
  for (let i = 1; i <= 12; i++) {
    const x = x0 + ((x1 - x0) * i) / 12;
    d += `L${n1(x)} ${n1(Y(x) - th * 0.5)}`;
  }
  for (let i = n; i >= 0; i--) {
    const x = x0 + ((x1 - x0) * i) / n;
    const xm = x0 + ((x1 - x0) * (i + 0.5)) / n;
    if (i < n) d += `L${n1(xm)} ${n1(Y(xm) + th * (i % 2 ? 1.5 : 0.9))}`;
    d += `L${n1(x)} ${n1(Y(x) + th * 0.25)}`;
  }
  return d + "Z";
}

// ── character palettes ──
const SK_SEOHA: Skin = { base: "#fbe6d8", shade: "#eab8a6", line: "#9a5a4c", blush: "#f08a8a" };
const SK_ELIOS: Skin = { base: "#f8ebe6", shade: "#dcbcc0", line: "#7a5260", blush: "#ee9aa4" };
const SK_RAZEL: Skin = { base: "#f2d2b2", shade: "#d49f7e", line: "#7a4630", blush: "#e8907a" };
const SK_CECI: Skin = { base: "#fdeee6", shade: "#f0c2b8", line: "#a8665a", blush: "#ff9aa8" };
const SK_OLD: Skin = { base: "#e2dcd8", shade: "#b4aaaa", line: "#5e4e54", blush: "#c8a0a0" };
const IR_BROWN: Iris = { dark: "#241008", mid: "#5e3420", light: "#b88458" };
const IR_RED: Iris = { dark: "#4a0610", mid: "#c01e2c", light: "#ff9a86" };
const IR_GOLD: Iris = { dark: "#5e3604", mid: "#d99a18", light: "#fff0a0" };
const IR_AMBER: Iris = { dark: "#4a2204", mid: "#c9780e", light: "#ffd88a" };
const IR_SKY: Iris = { dark: "#1c3e7a", mid: "#5a9ae0", light: "#d6f0ff" };
const IR_ASH: Iris = { dark: "#3a3638", mid: "#8a8486", light: "#dcd8d8" };
const IR_ASHRED: Iris = { dark: "#3e2a2c", mid: "#8e6a6c", light: "#e0cccc" };

// ── hair shapes (local head coords) ──
const CROWN = "C86 -10 86 -64 58 -96C28 -126 -36 -126 -62 -94C-76 -76 -74 -50 -64 -34";
/** Seoha: black shoulder bob, loosely tied low, stray locks */
const SEOHA_BACK =
  "M-60 -64C-80 -34 -82 16 -76 56C-72 86 -66 104 -54 118C-46 110 -40 102 -36 94L-30 112C-14 104 -4 92 2 80L50 86C62 94 74 102 88 100C82 88 84 68 86 48C90 8 88 -42 62 -80C32 -120 -36 -108 -60 -64Z";
const SEOHA_FRONT = bangs(
  [[-64, -34], [-54, 6], [-44, -52], [-30, -8], [-22, -60], [-8, 0], [-2, -62], [12, -10], [18, -64], [30, 2], [38, -60], [52, -14], [58, -52], [70, 14], [76, -30]],
  CROWN.replace("C86 -10", "C84 -12"),
);
const SEOHA_SIDE = lock([-52, -40], [-62, 0], [-64, 50], [-50, 96], 20) + lock([58, -30], [66, 10], [68, 60], [60, 104], 22);
/** Elios: black, tied at the nape, bangs brushing the eyes */
const ELIOS_BACK =
  "M-62 -60C-78 -20 -76 30 -68 70C-64 96 -54 116 -42 130L-32 104L-24 134C-8 120 4 100 8 80L52 84C68 96 84 106 98 104C90 90 92 64 90 40C92 0 88 -50 60 -84C30 -118 -38 -104 -62 -60Z";
const ELIOS_FRONT = bangs(
  [[-66, -30], [-58, 24], [-46, -44], [-34, 8], [-24, -56], [-10, 14], [-4, -60], [8, 0], [16, -62], [28, 16], [36, -56], [52, 4], [58, -46], [72, 30], [78, -24]],
  CROWN,
);
const ELIOS_SIDE = lock([-54, -36], [-64, 10], [-66, 60], [-54, 110], 20) + lock([60, -26], [68, 20], [70, 70], [62, 118], 22);
const ELIOS_WHITE = "M40 -54C44 -30 46 -10 52 4M48 -50C52 -28 56 -8 62 10M34 -52C36 -30 34 -10 30 12";
/** Razel: sandy, swept back and tied, messy strands */
const RAZEL_BACK =
  "M-58 -60C-74 -30 -72 10 -66 40L-52 30L-58 70C-42 60 -32 40 -28 20L42 20C56 40 72 56 86 60C82 40 88 10 86 -20C84 -60 62 -96 22 -104C-18 -110 -46 -86 -58 -60Z";
const RAZEL_FRONT =
  "M-60 -30C-58 -60 -40 -76 -10 -80C10 -82 34 -76 50 -64C60 -50 66 -30 74 -10C80 -40 82 -80 52 -104C20 -128 -34 -124 -56 -94C-66 -78 -66 -54 -60 -30Z";
const RAZEL_STRANDS = lock([-6, -80], [-20, -60], [-26, -40], [-20, -18], 12) + lock([10, -82], [4, -60], [12, -44], [4, -26], 10) + lock([-30, -76], [-44, -56], [-50, -36], [-54, -14], 12);
/** Cecilia: golden curls, soft bangs */
const CECI_FRONT = bangs(
  [[-64, -32], [-56, 8], [-46, -50], [-32, -6], [-22, -60], [-10, -2], [-2, -62], [10, -8], [18, -62], [30, 0], [38, -58], [54, -8], [58, -48], [70, 12], [78, -28]],
  CROWN,
);
const CECI_BACK =
  "M-64 -60C-92 -20 -96 40 -100 100C-104 150 -96 190 -110 230C-90 226 -80 214 -72 200C-66 220 -54 234 -40 240C-44 210 -40 180 -30 160L50 150C60 180 76 204 98 222C104 200 100 180 96 166C108 184 122 196 136 200C124 170 116 140 112 110C106 60 98 10 90 -30C84 -70 62 -104 20 -110C-18 -114 -48 -94 -64 -60Z";
const CECI_SIDE =
  lock([-56, -30], [-76, 20], [-50, 60], [-72, 110], 24) + lock([-72, 100], [-86, 130], [-60, 150], [-74, 180], 18) +
  lock([62, -24], [82, 20], [60, 70], [84, 116], 26) + lock([82, 106], [96, 140], [70, 160], [90, 190], 18);
/** Ash King / old Elios: long white hair, dishevelled */
const OLD_BACK =
  "M-62 -62C-86 -30 -88 30 -92 90C-96 150 -106 200 -98 250C-86 232 -78 220 -72 206C-68 236 -60 256 -46 270C-46 240 -42 214 -34 190L-22 230C-12 200 -8 170 -8 140L50 140C56 180 66 210 82 236C86 214 86 194 84 176C94 198 106 214 118 222C114 190 106 160 106 130C106 80 96 30 90 0C88 -46 72 -84 42 -102C6 -120 -42 -100 -62 -62Z";
const OLD_FRONT = bangs(
  [[-66, -26], [-62, 40], [-48, -40], [-38, 26], [-26, -54], [-14, 30], [-6, -58], [6, 14], [16, -60], [30, 34], [36, -52], [54, 20], [60, -40], [74, 50], [80, -20]],
  CROWN,
);
const OLD_SIDE = lock([-56, -30], [-70, 30], [-72, 90], [-64, 170], 22) + lock([62, -20], [74, 40], [76, 110], [70, 180], 24) + lock([-20, -60], [-36, 0], [-30, 50], [-40, 110], 10);

/** horn (local coords, base at 0,0, pointing up/back) */
function horn(fill: string, line: string, hi: string, s = 1, crumble = false): string {
  const d = `M${n1(-9 * s)} 0C${n1(-10 * s)} ${n1(-22 * s)} ${n1(-4 * s)} ${n1(-40 * s)} ${n1(12 * s)} ${n1(-52 * s)}C${n1(6 * s)} ${n1(-36 * s)} ${n1(6 * s)} ${n1(-18 * s)} ${n1(10 * s)} 0Z`;
  let o = cel(d, fill, line, 2);
  o += ln(`M${n1(-4 * s)} ${n1(-6 * s)}C${n1(-4 * s)} ${n1(-22 * s)} ${n1(0)} ${n1(-34 * s)} ${n1(8 * s)} ${n1(-44 * s)}`, hi, 1.6, 0.7);
  if (crumble) o += `<path d="M${n1(4 * s)} ${n1(-40 * s)}l${n1(8 * s)} ${n1(-12 * s)}l${n1(-2 * s)} ${n1(10 * s)}l${n1(6 * s)} ${n1(-2 * s)}Z" fill="#b7b0ae"/>`;
  return o;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_fall — prologue: falling through the cracked grey dawn among rising sand
// ────────────────────────────────────────────────────────────────────────────
function cgFall(): string {
  const p = "cg-fall";
  const r = rng(4441);
  const defs =
    lg(`${p}-sky`, 0, 0, 0, 1, [
      [0, "#3a4258"],
      [0.35, "#6d7488"],
      [0.62, "#a8a6aa"],
      [0.85, "#e6cdb4"],
      [1, "#ffe2b0"],
    ]) +
    glow(`${p}-sun`, "#fff1c4", 1, 0.45) +
    glow(`${p}-gold`, "#ffd27a", 0.95, 0.35) +
    glow(`${p}-cold`, "#dfe6f4", 0.7, 0.2) +
    lg(`${p}-scrub`, 0, 0, 1, 1, [
      [0, "#3a4d86"],
      [1, "#1f2a52"],
    ]) +
    lg(`${p}-hood`, 0, 0, 1, 1, [
      [0, "#b9bcc6"],
      [1, "#7e828f"],
    ]) +
    lg(`${p}-hair`, 0, 0, 0, 1, [
      [0, "#3b3850"],
      [1, "#1b1924"],
    ]) +
    lg(`${p}-bot`, 0, 0, 0, 1, [
      [0, "#ffd9a0", 0],
      [1, "#ffe8c0", 0.9],
    ]) +
    blur(`${p}-b`, 7);

  let b = `<rect width="1600" height="900" fill="url(#${p}-sky)"/>`;
  // grey dawn disk + halo (behind, upper right)
  b += `<circle cx="1120" cy="250" r="420" fill="url(#${p}-cold)" opacity=".55"/>`;
  b += `<circle cx="1120" cy="250" r="70" fill="#e9e6e4" opacity=".85"/>`;
  // clouds: soft bands
  let cl = "";
  for (let i = 0; i < 9; i++) {
    const y = 120 + i * 70 + r() * 30;
    const x = r() * 1600 - 300;
    const w = 400 + r() * 500;
    cl += `M${n1(x)} ${n1(y)}q${n1(w * 0.25)} ${n1(-30 - r() * 20)} ${n1(w * 0.5)} -6q${n1(w * 0.25)} ${n1(-24 - r() * 20)} ${n1(w * 0.5)} 6q${n1(-w * 0.5)} 18 ${n1(-w)} 0Z`;
  }
  b += `<path d="${cl}" fill="#d9d4d2" opacity=".28" filter="url(#${p}-b)"/>`;
  // warm world-light blooming from below
  b += `<ellipse cx="800" cy="980" rx="1100" ry="420" fill="url(#${p}-gold)" opacity=".85"/>`;
  b += `<rect y="560" width="1600" height="340" fill="url(#${p}-bot)"/>`;

  // cracks in the sky: glowing gold-white fracture lines radiating from a point
  const cx0 = 560, cy0 = 170;
  let cr = "";
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + r() * 0.4;
    let x = cx0, y = cy0;
    cr += `M${x} ${y}`;
    const L = 160 + r() * 380;
    const seg = 5;
    for (let k = 0; k < seg; k++) {
      const aa = a + (r() - 0.5) * 0.7;
      x += (Math.cos(aa) * L) / seg;
      y += (Math.sin(aa) * L) / seg * 0.8;
      cr += `L${n1(x)} ${n1(y)}`;
      if (r() < 0.35) {
        const ba = aa + (r() < 0.5 ? 0.9 : -0.9);
        cr += `M${n1(x)} ${n1(y)}l${n1(Math.cos(ba) * 50)} ${n1(Math.sin(ba) * 40)}M${n1(x)} ${n1(y)}`;
      }
    }
  }
  // concentric crack rings
  for (const rr of [70, 150]) {
    let d = "";
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const q = rr * (0.85 + r() * 0.3);
      d += `${k ? "L" : "M"}${n1(cx0 + Math.cos(a) * q)} ${n1(cy0 + Math.sin(a) * q * 0.8)}`;
    }
    cr += d;
  }
  b += `<circle cx="${cx0}" cy="${cy0}" r="260" fill="url(#${p}-sun)" opacity=".5"/>`;
  b += ln(cr, "#ffe9b0", 9, 0.35, ` filter="url(#${p}-b)"`);
  b += ln(cr, "#fff6de", 2.2, 0.95);
  // shards of sky falling away (darker slivers near crack center)
  let sh = "";
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2;
    const d0 = 40 + r() * 200;
    const x = cx0 + Math.cos(a) * d0, y = cy0 + Math.sin(a) * d0 * 0.8;
    const s = 8 + r() * 22;
    sh += `M${n1(x)} ${n1(y)}l${n1(s)} ${n1(-s * 0.4)}l${n1(-s * 0.3)} ${n1(s * 1.1)}Z`;
  }
  b += `<path d="${sh}" fill="#39405a" opacity=".55" stroke="#fff3cf" stroke-width="1.2"/>`;

  // Seoul rooftop fragments dissolving above (top), seen from below
  const frag = (x: number, y: number, s: number, rot: number, seed: number): string => {
    const t = rng(seed);
    let o = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">`;
    o += cel("M-120 0L110 -14L130 30L118 60L60 50L20 76L-40 58L-110 66L-128 28Z", "#3a4260", "#232838", 2.5);
    o += `<path d="M-120 0L110 -14L114 6L-122 18Z" fill="#59627e"/>`;
    // railing
    o += ln("M-110 -2V-60M-60 -5V-64M-10 -8V-66M40 -10V-70M90 -12V-72M-114 -56L96 -70", "#6c7590", 5);
    o += ln("M-114 -56L96 -70", "#9aa3bc", 2);
    // crumble bits
    let bits = "";
    for (let i = 0; i < 14; i++) {
      const bx = -120 + t() * 250, by = 40 + t() * 60;
      const bs = 4 + t() * 10;
      bits += `M${n1(bx)} ${n1(by)}l${n1(bs)} ${n1(bs * 0.3)}l${n1(-bs * 0.4)} ${n1(bs)}Z`;
    }
    o += `<path d="${bits}" fill="#4a5270"/>`;
    return o + `</g>`;
  };
  b += frag(1280, 70, 1.1, -12, 11);
  b += frag(300, 40, 0.8, 16, 12);
  // vending machine glow on a fragment
  b += `<g transform="translate(1210 110) rotate(-12)"><rect x="-30" y="-110" width="60" height="100" rx="4" fill="#c9d6ff" stroke="#2a3048" stroke-width="3"/><rect x="-22" y="-100" width="44" height="40" fill="#fff6e6"/><rect x="-22" y="-52" width="44" height="8" fill="#e05a4a"/></g>`;
  b += frag(820, -40, 0.7, 4, 13);
  // fragments dissolving into sand (dust trails upward from them)
  const dust: Pt[] = [];
  for (let i = 0; i < 120; i++) {
    const src = [[1280, 140], [300, 100], [820, 20]][i % 3];
    dust.push([src[0] + (r() - 0.5) * 260, src[1] - 10 + r() * 150]);
  }
  b += dots(dust, 2.2, "#ffe4a0", 0.7);

  // rising gold sand streams (static)
  const streams: [number, number, number, number, number][] = [
    [200, 520, 900, -40, 60],
    [1400, 1080, 900, -40, 70],
    [640, 700, 900, 0, 30],
    [1000, 930, 900, -20, 40],
    [60, 260, 700, -60, 50],
    [1560, 1300, 800, -40, 50],
  ];
  let sd1: Pt[] = [], sd2: Pt[] = [];
  streams.forEach(([xa, xb, ya, yb, sw], i) => {
    sd1 = sd1.concat(sandStream(r, 130, xa, xb, ya, yb, sw, i));
    sd2 = sd2.concat(sandStream(r, 30, xa, xb, ya, yb, sw * 0.6, i));
  });
  let rib = "";
  streams.forEach(([xa, xb, ya, yb, sw], i) => {
    let d = "";
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      d += `${k ? "L" : "M"}${n1(xa + (xb - xa) * t + Math.sin(t * 6 + i) * sw)} ${n1(ya + (yb - ya) * t)}`;
    }
    rib += d;
  });
  b += ln(rib, "#ffd27a", 34, 0.16, ` filter="url(#${p}-b)"`);
  b += ln(rib, "#fff1c4", 4, 0.3);
  b += dots(sd1, 2.4, "#ffd27a", 0.75) + dots(sd2, 4.2, "#fff6d8", 0.9);

  // ── Seoha, falling backwards through the light, reaching up-left ──
  b += `<ellipse cx="820" cy="480" rx="380" ry="340" fill="url(#${p}-sun)" opacity=".4"/>`;
  const lineN = "#141a38", lineG = "#4a4e5e", sk = SK_SEOHA;
  const HX = 796, HY = 372, HS = 1.5, HR = -16;
  // hair streaming upward (world coords, behind everything of her)
  let hl = "";
  const roots: [Pt, Pt, Pt, Pt, number][] = [
    [[700, 360], [670, 300], [650, 250], [620, 200], 70],
    [[730, 300], [714, 240], [700, 200], [676, 150], 80],
    [[780, 280], [776, 220], [770, 180], [760, 120], 84],
    [[840, 280], [850, 220], [866, 180], [880, 130], 84],
    [[890, 300], [916, 250], [940, 220], [972, 190], 76],
    [[920, 350], [950, 320], [980, 300], [1020, 290], 60],
  ];
  for (const [a0, c1, c2, e, w] of roots) hl += lock(a0, c1, c2, e, w, 0.8);
  b += cel(hl, `url(#${p}-hair)`, "#0e0c14", 2.4);
  b += ln("M730 290C716 240 700 200 684 170M790 270C788 220 782 180 772 140M850 270C860 220 868 190 878 150M900 310C930 270 950 240 970 214", "#5a5874", 2, 0.8);
  // hood flapping up behind the neck
  b += cel("M760 540C720 500 700 440 730 400C770 430 810 460 860 460C910 460 950 440 980 420C1010 460 1000 520 960 560Z", "#9a9eab", lineG, 2.6);
  b += `<path d="M770 520C750 490 744 460 752 430C790 452 830 470 870 470C910 470 940 458 966 444C976 480 970 510 950 540Z" fill="#6b6f7d"/>`;
  // trailing right arm (sleeve) flung out to the right and down
  b += cel("M960 580C1010 590 1060 620 1110 670C1150 710 1180 750 1200 790L1150 820C1120 780 1090 740 1050 710C1010 680 970 660 930 650Z", `url(#${p}-hood)`, lineG, 2.6);
  b += `<path d="M930 650C970 660 1010 680 1050 710C1090 740 1120 780 1150 820L1170 810C1140 760 1100 720 1060 690C1020 664 980 650 940 636Z" fill="#6f7382"/>`;
  b += cel("M1160 800C1170 790 1190 786 1204 792L1236 790C1246 790 1246 802 1236 804L1212 808L1240 818C1250 822 1246 834 1236 830L1206 822L1226 840C1232 848 1224 856 1216 850L1190 832C1176 834 1162 826 1160 816Z", sk.base, sk.line, 2.2);
  // torso: scrub top, tilted, narrowing to the waist, dissolving into the light below
  const torso = "M740 548C770 530 820 524 870 530C930 538 980 560 1000 590C1010 640 1000 700 990 760C986 800 990 850 1000 900L760 900C752 850 744 800 738 750C730 680 720 600 740 548Z";
  b += cel(torso, `url(#${p}-scrub)`, lineN, 2.8);
  b += `<path d="M1000 590C1010 640 1000 700 990 760C986 800 990 850 1000 900L930 900C940 820 950 740 960 660C966 620 980 596 1000 590Z" fill="#161d3c" opacity=".75"/>`;
  b += ln("M800 620C820 680 840 760 850 880M900 600C910 660 920 760 916 880", "#4a5c98", 2, 0.6);
  // V-neck with skin
  b += `<path d="M806 532C830 560 850 590 868 612C884 586 902 560 920 542C890 530 840 526 806 532Z" fill="${sk.base}" stroke="${sk.line}" stroke-width="2"/>`;
  b += `<path d="M806 532C830 560 850 590 868 612C884 586 902 560 920 542L930 552C908 578 888 606 868 634C848 606 824 574 796 544Z" fill="#2a386a" stroke="${lineN}" stroke-width="2"/>`;
  // open hoodie panels (billowing up and outward)
  b += cel("M744 548C716 600 704 680 706 760C708 820 716 860 724 900L800 900C790 850 780 780 782 700C784 640 790 590 806 548C786 538 760 538 744 548Z", `url(#${p}-hood)`, lineG, 2.6);
  b += cel("M930 546C960 560 990 580 1010 600C1030 660 1036 720 1040 780C1044 830 1054 870 1066 900L1010 900C1000 850 994 800 990 740C986 680 980 620 960 580C952 566 940 556 930 546Z", `url(#${p}-hood)`, lineG, 2.6);
  b += `<path d="M1010 600C1030 660 1036 720 1040 780C1044 830 1054 870 1066 900L1040 900C1026 840 1020 770 1014 700C1010 660 1008 630 1010 600Z" fill="#6f7382"/>`;
  b += ln("M760 600C748 660 744 740 752 840", "#c4c7cf", 2.4, 0.8);
  // drawstrings floating up
  b += ln("M812 552C800 520 796 490 804 460M912 552C930 520 940 490 936 456", "#e6e8ee", 3.4);
  // ID lanyard floating upward, card turning
  b += ln("M826 540C806 500 780 460 740 420M902 546C920 500 930 460 916 420", "#2f6fb8", 5);
  b += `<g transform="translate(724 392) rotate(-30)"><rect x="-36" y="-50" width="72" height="100" rx="8" fill="#f4f7fb" stroke="#2a3048" stroke-width="3"/><rect x="-36" y="-50" width="72" height="22" rx="8" fill="#2f6fb8"/><rect x="-24" y="-16" width="28" height="34" rx="3" fill="#c9d0dc"/><path d="M12 -10h14M12 0h14M12 10h9M-24 30h48M-24 40h32" stroke="#8a93a6" stroke-width="3"/></g>`;
  // reaching left arm (hoodie sleeve) up-left to the open palm
  b += `<g transform="translate(-60 -30) rotate(-6 800 540)">`;
  b += cel("M790 560C760 520 720 470 690 400C670 350 650 300 628 250L680 226C696 276 716 326 740 370C766 420 800 470 840 510Z", `url(#${p}-hood)`, lineG, 2.6);
  b += `<path d="M628 250L680 226C696 276 716 326 740 370C766 420 800 470 840 510L820 530C776 490 740 440 710 380C690 340 668 290 640 256Z" fill="#7a7e8c" opacity=".85"/>`;
  b += ln("M650 258C660 244 672 238 684 236", "#c9ccd4", 3);
  // palm toward the viewer, fingers spread; the hourglass mark on the LEFT palm
  const hand = "M632 246C620 234 614 218 618 204L596 176C590 168 600 160 608 166L630 192L618 150C615 140 628 136 632 146L644 184L646 138C647 127 660 128 660 139L660 182L674 150C678 141 690 145 687 155L676 196C680 214 676 230 664 242C654 252 640 254 632 246Z";
  b += `<circle cx="646" cy="210" r="120" fill="url(#${p}-gold)" opacity=".7"/>`;
  b += cel(hand, sk.base, sk.line, 2.4);
  b += `<path d="M664 242C676 230 680 214 676 196L668 200C668 216 662 230 650 240Z" fill="${sk.shade}"/>`;
  b += `<circle cx="646" cy="218" r="30" fill="url(#${p}-gold)" ${A(p, "pu", 0, 3.4)}/>`;
  b += ln("M636 206L656 206L636 230L656 230Z", "#d9901c", 2.6) + ln("M636 206L656 206L636 230L656 230Z", "#fff6d8", 1.1);
  b += `</g>`;
  // head
  const headS = head({
    p, id: "s", skin: sk, lash: "#1a1418", near: IR_BROWN, far: IR_BROWN,
    open: 1, look: [-0.9, -0.9], brow: 0.9, browColor: "#231c24", mouth: "o", blush: 0.75, tears: 1,
    shadeSide: 1, rim: "#fff1c4",
    back: SEOHA_BACK, backFill: `url(#${p}-hair)`, hairLine: "#0e0c14",
    front: SEOHA_FRONT, frontFill: `url(#${p}-hair)`, hairShade: "#e2ab9a",
    side: lock([-52, -40], [-66, -20], [-76, -30], [-86, -60], 26, 0.8) + lock([58, -30], [74, -10], [86, -20], [100, -46], 28, 0.8),
    hi: "#6a6890", strands: "#4a4864",
  });
  b += place(HX, HY, HS, HR, false, headS);
  // floating tear droplets rising from her eyes
  b += `<g fill="#eef8ff" stroke="#a9c8e8" stroke-width="1">`;
  for (const [x, y, s] of [[770, 250, 5], [748, 214, 3.5], [796, 200, 4], [770, 170, 2.6]] as [number, number, number][])
    b += `<ellipse cx="${x}" cy="${y}" rx="${n1(s * 0.7)}" ry="${s}" ${A(p, "tw", x * 0.01, 3)}/>`;
  b += `</g>`;
  // she dissolves into the other world's light at the bottom
  b += `<rect y="640" width="1600" height="260" fill="url(#${p}-bot)"/>`;
  // animated sand motes rising
  for (let i = 0; i < 26; i++) {
    const x = 200 + r() * 1200;
    const y = 300 + r() * 560;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.8 + r() * 2.4)}" fill="#fff1c4" ${A(p, "up", r() * 6, 4 + r() * 4)}/>`;
  }
  // sparkles
  let spk = "";
  for (let i = 0; i < 14; i++) spk += sparkle(160 + r() * 1280, 80 + r() * 760, 5 + r() * 9);
  b += `<path d="${spk}" fill="#fffbe8" opacity=".9"/>`;
  // light vignette
  b += `<rect width="1600" height="900" fill="url(#${p}-cold)" opacity="0"/>`;
  return svg(p, defs, b);
}

export const CGS_A: Record<string, string> = {
  cg_fall: cgFall(),
};

export function __faceTest(): string {
  const p = "ft";
  const heads: string[] = [];
  const cfg: [Partial<HeadOpt>, Skin, Iris, Iris, string, string, string][] = [
    [{ mouth: "soft", side: SEOHA_SIDE, hi: "#5a5874", strands: "#46445c" }, SK_SEOHA, IR_BROWN, IR_BROWN, SEOHA_BACK, SEOHA_FRONT, "#252330"],
    [{ mouth: "n", open: 0.8, side: ELIOS_SIDE, hi: "#4a4c6e", extraOver: ln(ELIOS_WHITE, "#f4f2f6", 3) }, SK_ELIOS, IR_RED, IR_GOLD, ELIOS_BACK, ELIOS_FRONT, "#1d1c28"],
    [{ mouth: "part", brow: 1, side: RAZEL_STRANDS, hi: "#d8b88a" }, SK_RAZEL, IR_AMBER, IR_AMBER, RAZEL_BACK, RAZEL_FRONT, "#a88158"],
    [{ mouth: "smile", side: CECI_SIDE, hi: "#fff2b8" }, SK_CECI, IR_SKY, IR_SKY, CECI_BACK, CECI_FRONT, "#f0c860"],
    [{ mouth: "sad", open: 0.6, gaunt: true, brow: 0.8, side: OLD_SIDE, hi: "#ffffff" }, SK_OLD, IR_ASHRED, IR_ASH, OLD_BACK, OLD_FRONT, "#e8e4e0"],
  ];
  cfg.forEach(([o, sk, a, b2, bk, fr, hc], i) => {
    heads.push(place(170 + i * 315, 330, 1.45, 0, false, head({ p, id: "t" + i, skin: sk, lash: "#1a1216", near: a, far: b2, back: bk, backFill: hc, front: fr, frontFill: hc, hairLine: "#3a2a2a", ...o } as HeadOpt)));
    heads.push(place(170 + i * 315, 720, 0.8, 0, true, head({ p, id: "u" + i, skin: sk, lash: "#1a1216", near: a, far: b2, back: bk, backFill: hc, front: fr, frontFill: hc, hairLine: "#3a2a2a", ...o, open: 0, closed: "happy" } as HeadOpt)));
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">${heads.join("")}</svg>`;
}
