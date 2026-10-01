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
  male?: boolean; // squarer jaw, narrower eyes, heavier brows
  noFeatures?: boolean; // masked: skip eyes/brows/nose/mouth
  extraBack?: string; // drawn before back hair
}

const FACE =
  "M-50 -40C-54 -8 -56 16 -52 34C-48 52 -36 74 -22 88C-16 94 -8 96 -2 93C18 83 40 64 52 42C60 28 64 4 62 -30C60 -80 30 -102 0 -102C-30 -102 -50 -78 -50 -40Z";
const FACE_GAUNT =
  "M-50 -40C-54 -10 -54 10 -52 26C-50 46 -34 72 -20 88C-14 94 -8 96 -2 93C16 82 34 62 46 42C54 26 62 4 62 -30C60 -80 30 -102 0 -102C-30 -102 -50 -78 -50 -40Z";
const FACE_M =
  "M-52 -40C-56 -8 -58 18 -54 38C-48 60 -34 82 -18 92L6 92C26 84 46 64 56 42C62 26 66 4 64 -30C62 -80 32 -102 0 -102C-32 -102 -52 -78 -52 -40Z";
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
  if (o.male) s += ln(`M${X(-0.54)} ${Y(0.02)}C${X(-0.34)} ${top(-0.48)} ${X(0.3)} ${top(-0.58)} ${X(0.62)} ${top(-0.26)}`, lashC, 4.4) + ln(`M${X(0.5)} ${top(-0.36)}L${X(0.66)} ${top(-0.3)}`, lashC, 3);
  else s += `<path d="M${X(-0.54)} ${Y(0.04)}C${X(-0.34)} ${top(-0.5)} ${X(0.3)} ${top(-0.6)} ${X(0.6)} ${top(-0.32)}L${X(0.72)} ${top(-0.3)}L${X(0.6)} ${top(-0.18)}C${X(0.3)} ${top(-0.44)} ${X(-0.3)} ${top(-0.38)} ${X(-0.47)} ${Y(0.06)}Z" fill="${lashC}" stroke="${lashC}" stroke-width="1" stroke-linejoin="round"/>`;
  s += ln(`M${X(0.5)} ${Y(0.18)}C${X(0.38)} ${Y(0.42)} ${X(0.14)} ${Y(0.5)} ${X(-0.06)} ${Y(0.48)}`, lashC, 1.8, 0.75);
  s += ln(`M${X(-0.28)} ${top(-0.56)}C${X(0)} ${top(-0.7)} ${X(0.34)} ${top(-0.64)} ${X(0.5)} ${top(-0.48)}`, o.skin.line, 1.3, 0.7);
  return s;
}

function head(o: HeadOpt): string {
  const sk = o.skin;
  const hid = `${o.p}-hc${clipN++}`;
  const iN = `${o.p}-in${clipN}`;
  const iF = `${o.p}-if${clipN}`;
  const face = o.gaunt ? FACE_GAUNT : o.male ? FACE_M : FACE;
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
  if (o.noFeatures) {
    s += o.extraUnder ?? "";
    if (o.front) s += cel(o.front, o.frontFill ?? "#222", o.hairLine ?? "#000", 2.4);
    if (o.hi) s += `<path d="${hiBand(-50, 64, -74, 12, 8, 11)}" fill="${o.hi}" opacity=".85"/>`;
    if (o.side) s += cel(o.side, o.frontFill ?? "#222", o.hairLine ?? "#000", 2.2);
    return s + (o.extraOver ?? "");
  }
  // blush
  const bl = o.blush ?? 0.5;
  if (bl > 0)
    s += `<g opacity="${bl}"><ellipse cx="28" cy="44" rx="16" ry="7" fill="${sk.blush}" opacity=".55"/><ellipse cx="-36" cy="44" rx="9" ry="6" fill="${sk.blush}" opacity=".5"/>` +
      ln("M20 42l-4 6M28 42l-4 6M36 42l-4 6", sk.blush, 1.4, 0.9) + `</g>`;
  // eyes
  s += eye(o, 22, 8, o.male ? 41 : 44, o.male ? 35 : 50, 1, iN, o.near);
  s += eye(o, -32, 8, o.male ? 27 : 29, o.male ? 33 : 48, -1, iF, o.far);
  // brows
  const b = o.brow ?? 0;
  const bc = o.browColor ?? o.lash;
  const bt = o.male ? 3 : 0, by = o.male ? 6 : 0;
  s += `<path d="M4 ${n1(-24 - b * 7 + by)}Q22 ${n1(-31 - b * 2 + by)} 42 ${n1(-26 + b * 4 + by)}Q24 ${n1(-28 - b * 2 + by + bt)} 4 ${n1(-21 - b * 7 + by + bt)}Z" fill="${bc}" stroke="${bc}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="M-18 ${n1(-24 - b * 6 + by)}Q-32 ${n1(-28 - b * 1 + by)} -44 ${n1(-21 + b * 4 + by)}Q-32 ${n1(-25 - b * 1 + by + bt)} -18 ${n1(-21 - b * 6 + by + bt)}Z" fill="${bc}" stroke="${bc}" stroke-width="1.4" stroke-linejoin="round"/>`;
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
const CROWN = "C86 -60 78 -84 58 -96C28 -126 -36 -126 -62 -94C-76 -76 -74 -50 -64 -34";
/** Seoha: black shoulder bob, loosely tied low, stray locks */
const SEOHA_BACK =
  "M-60 -64C-80 -34 -82 16 -76 56C-72 86 -66 104 -54 118C-46 110 -40 102 -36 94L-30 112C-14 104 -4 92 2 80L50 86C62 94 74 102 88 100C82 88 84 68 86 48C90 8 88 -42 62 -80C32 -120 -36 -108 -60 -64Z";
const SEOHA_FRONT = bangs(
  [[-64, -34], [-54, 6], [-44, -52], [-30, -8], [-22, -60], [-8, 0], [-2, -62], [12, -10], [18, -64], [30, 2], [38, -60], [52, -14], [58, -52], [70, 14], [76, -30]],
  CROWN,
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
  "M-56 -60C-70 -40 -70 -10 -62 10L-50 -6L-54 26L-40 4C-44 -20 -40 -40 -30 -56L50 -60C62 -40 70 -16 72 6L82 -8L80 20L92 6C92 -30 84 -70 60 -92C30 -118 -34 -108 -56 -60ZM60 -20C90 -10 104 20 100 60C98 90 106 110 116 126C92 124 80 104 78 80C76 50 70 20 56 0Z";
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
  [[-62, -44], [-58, 4], [-50, -48], [-44, 6], [-30, -60], [-24, -10], [-12, -64], [-8, -24], [4, -66], [16, -14], [24, -64], [36, 2], [44, -56], [60, 18], [64, -44], [74, -6], [80, -40]],
  CROWN,
);
const OLD_SIDE = lock([-54, -30], [-92, 30], [-44, 90], [-84, 170], 18) + lock([62, -24], [96, 40], [54, 100], [92, 180], 20) + lock([-8, -40], [-20, -10], [-10, 20], [-22, 44], 8);

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
  b += `<circle cx="430" cy="250" r="420" fill="url(#${p}-cold)" opacity=".55"/>`;
  b += `<circle cx="430" cy="250" r="70" fill="#e9e6e4" opacity=".85"/>`;
  // clouds: soft bands
  let cl = "";
  for (let i = 0; i < 6; i++) {
    const y = 120 + i * 100 + r() * 30;
    const x = r() * 1600 - 300;
    const w = 400 + r() * 500;
    cl += `M${n1(x)} ${n1(y)}q${n1(w * 0.25)} ${n1(-30 - r() * 20)} ${n1(w * 0.5)} -6q${n1(w * 0.25)} ${n1(-24 - r() * 20)} ${n1(w * 0.5)} 6q${n1(-w * 0.5)} 18 ${n1(-w)} 0Z`;
  }
  b += `<path d="${cl}" fill="#d9d4d2" opacity=".28" filter="url(#${p}-b)"/>`;
  // warm world-light blooming from below
  b += `<ellipse cx="800" cy="980" rx="1100" ry="420" fill="url(#${p}-gold)" opacity=".85"/>`;
  b += `<rect y="560" width="1600" height="340" fill="url(#${p}-bot)"/>`;

  // cracks in the sky: glowing gold-white fracture lines radiating from a point
  const cx0 = 1040, cy0 = 170;
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
    for (let i = 0; i < 8; i++) {
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
  for (let i = 0; i < 90; i++) {
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
    sd1 = sd1.concat(sandStream(r, 85, xa, xb, ya, yb, sw, i));
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

  b += `<g transform="translate(1550 0) scale(-1 1)">`;
  // ── Seoha, falling backwards through the light, reaching up-left ──
  b += `<ellipse cx="820" cy="480" rx="380" ry="340" fill="url(#${p}-sun)" opacity=".4"/>`;
  const lineN = "#141a38", lineG = "#4a4e5e", sk = SK_SEOHA;
  const HX = 796, HY = 372, HS = 1.5, HR = -16;
  // hair streaming upward (world coords, behind everything of her)
  const hl = "M700 450C670 400 650 340 634 280C664 300 690 312 708 318C700 280 700 240 700 196C730 226 752 250 770 266C776 226 786 196 800 162C820 196 836 226 848 256C870 226 900 204 934 190C930 226 930 254 936 280C962 276 990 282 1016 296C992 326 968 352 950 390Z";
  b += cel(hl, `url(#${p}-hair)`, "#0e0c14", 2.6);
  // hood flapping up behind the neck
  b += cel("M760 540C720 500 700 440 730 400C770 430 810 460 860 460C910 460 950 440 980 420C1010 460 1000 520 960 560Z", "#9a9eab", lineG, 2.6);
  b += `<path d="M770 520C750 490 744 460 752 430C790 452 830 470 870 470C910 470 940 458 966 444C976 480 970 510 950 540Z" fill="#6b6f7d"/>`;
  // ID lanyard floating upward, card turning
  b += ln("M826 540C790 520 700 500 640 470M902 546C860 540 720 520 650 490", "#2f6fb8", 5);
  b += `<g transform="translate(612 470) rotate(-60)"><rect x="-36" y="-50" width="72" height="100" rx="8" fill="#f4f7fb" stroke="#2a3048" stroke-width="3"/><rect x="-36" y="-50" width="72" height="22" rx="8" fill="#2f6fb8"/><rect x="-24" y="-16" width="28" height="34" rx="3" fill="#c9d0dc"/><path d="M12 -10h14M12 0h14M12 10h9M-24 30h48M-24 40h32" stroke="#8a93a6" stroke-width="3"/></g>`;
  // reaching left arm (hoodie sleeve) up-left to the open palm
  b += `<g transform="translate(-96 -16)">`;
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
    hi: "#6a6890", strands: "#4a4864",
  });
  b += place(HX, HY, HS, HR, false, headS);
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
  b += ln("M812 552C806 536 804 520 808 506M912 552C920 536 926 522 924 506", "#e6e8ee", 3.4);
  // floating tear droplets rising from her eyes
  b += `<g fill="#eef8ff" stroke="#a9c8e8" stroke-width="1">`;
  for (const [x, y, s] of [[770, 250, 5], [748, 214, 3.5], [796, 200, 4], [770, 170, 2.6]] as [number, number, number][])
    b += `<ellipse cx="${x}" cy="${y}" rx="${n1(s * 0.7)}" ry="${s}" ${A(p, "tw", x * 0.01, 3)}/>`;
  b += `</g>`;
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

// ── hands: capsule fingers (outline stroke + skin stroke) and a palm ──
function hand(x: number, y: number, sc: number, rot: number, flip: boolean, palm: string, fingers: [Pt, Pt, Pt][], sk: Skin, w = 13, extra = ""): string {
  let f1 = "", f2 = "";
  for (const [a, c, e] of fingers) f1 += `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`;
  f2 = f1;
  let o = ln(f1, sk.line, w + 4.4) + ln(f2, sk.base, w);
  o += cel(palm, sk.base, sk.line, 2.2) + extra;
  return place(x, y, sc, rot, flip, o);
}
/** open palm facing the viewer, fingers up (local, wrist at 0,0) */
const PALM_OPEN = "M-24 0C-30 -14 -30 -34 -24 -48C-10 -54 12 -54 26 -46C30 -32 28 -12 20 0C8 8 -12 8 -24 0Z";
const FING_OPEN: [Pt, Pt, Pt][] = [[[-18, -46], [-26, -66], [-30, -86]], [[-6, -50], [-8, -76], [-8, -100]], [[8, -50], [12, -76], [14, -98]], [[20, -44], [28, -64], [32, -82]], [[-24, -16], [-40, -28], [-50, -44]]];
/** palm up, fingers relaxed and curling (reaching / offering) */
const PALM_UP = "M-30 0C-34 -16 -30 -34 -18 -42C0 -48 22 -44 32 -32C38 -18 34 -2 24 6C6 14 -18 12 -30 0Z";
const FING_UP: [Pt, Pt, Pt][] = [[[-20, -40], [-30, -60], [-22, -72]], [[-6, -44], [-10, -68], [0, -80]], [[10, -44], [12, -66], [22, -76]], [[24, -36], [32, -54], [38, -62]], [[-28, -10], [-48, -16], [-54, -32]]];
/** back of hand, fingers curled over an edge (gripping) */
const PALM_GRIP = "M-26 0C-32 -18 -28 -40 -14 -50C4 -56 24 -50 30 -36C34 -18 30 -2 20 6C4 12 -16 10 -26 0Z";
const FING_GRIP: [Pt, Pt, Pt][] = [[[-16, -48], [-22, -70], [-10, -76]], [[-2, -52], [-2, -76], [10, -80]], [[12, -50], [16, -72], [26, -74]], [[24, -40], [32, -58], [38, -60]], [[-26, -14], [-40, -30], [-34, -48]]];

// ── clocks ──
/** clock face group (r = 50 at origin) to be <use>d */
function clockDef(id: string, face: string, rim: string, tick: string, rimLine: string): string {
  let t = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 34 : 38;
    t += `M${n1(Math.cos(a) * r0)} ${n1(Math.sin(a) * r0)}L${n1(Math.cos(a) * 43)} ${n1(Math.sin(a) * 43)}`;
  }
  return `<g id="${id}"><circle r="50" fill="${rim}" stroke="${rimLine}" stroke-width="3"/><circle r="44" fill="${face}"/><path d="${t}" stroke="${tick}" stroke-width="3"/><circle r="3.5" fill="${tick}"/></g>`;
}
/** hands of a clock (path fragment) */
function clockHands(x: number, y: number, s: number, h: number, m: number): string {
  const ah = (h / 12) * Math.PI * 2 - Math.PI / 2;
  const am = (m / 60) * Math.PI * 2 - Math.PI / 2;
  return `M${n1(x)} ${n1(y)}l${n1(Math.cos(ah) * 24 * s)} ${n1(Math.sin(ah) * 24 * s)}M${n1(x)} ${n1(y)}l${n1(Math.cos(am) * 36 * s)} ${n1(Math.sin(am) * 36 * s)}`;
}
function useAt(id: string, x: number, y: number, s: number, rot = 0, sy = 1, extra = ""): string {
  return `<use href="#${id}" transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(${n1(s)} ${n1(s * sy)})"${extra}/>`;
}
/** cracked porcelain mask of the Ash King (local head coords, front-ish) */
function ashMask(glowId: string, glowOp: number): string {
  const m = "M-56 -66C-60 -20 -60 20 -52 44C-42 70 -22 94 2 97C28 94 50 70 60 44C68 14 68 -28 64 -66C44 -98 -34 -100 -56 -66Z";
  let o = cel(m, "#f1eeea", "#6e6870", 2.6);
  o += `<path d="M64 -66C68 -28 68 14 60 44C50 70 28 94 2 97C24 80 40 50 44 10C46 -20 44 -50 38 -86C50 -82 58 -76 64 -66Z" fill="#c9c3c4"/>`;
  // eye holes
  const eh = "M4 4C10 -10 30 -14 42 -4C36 8 18 12 4 4ZM-14 4C-18 -8 -34 -12 -46 -4C-40 8 -26 10 -14 4Z";
  o += `<path d="${eh}" fill="#18161c" stroke="#5a5460" stroke-width="1.6"/>`;
  o += `<ellipse cx="23" cy="-2" rx="9" ry="5" fill="url(#${glowId})" opacity="${glowOp}"/><ellipse cx="-30" cy="-1" rx="7" ry="4" fill="url(#${glowId})" opacity="${glowOp}"/>`;
  if (glowOp > 0.5) o += `<circle cx="22" cy="-1" r="2.2" fill="#ece8e0"/><circle cx="-30" cy="0" r="1.8" fill="#ece8e0"/>`;
  // faint painted tear line + cracks
  o += ln("M22 10C22 30 20 48 22 64", "#a8a0a6", 1.6, 0.6);
  o += ln("M40 -90L30 -60L38 -40L26 -18M30 -60L50 -54M-20 -96L-12 -70L-24 -52M-12 -70L4 -64M-48 30L-34 44L-38 62M58 30L44 40", "#5e5660", 1.8);
  o += `<path d="M44 -88L56 -76L50 -70L40 -80Z" fill="#2a2630"/>`;
  return o;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_ashking — the Room Between: the masked king leans toward her
// ────────────────────────────────────────────────────────────────────────────
function cgAshking(): string {
  const p = "cg-ashking";
  const r = rng(999);
  const defs =
    lg(`${p}-bg`, 0, 0, 0, 1, [[0, "#15141b"], [0.6, "#2d2a35"], [1, "#121118"]]) +
    lg(`${p}-win`, 0, 0, 0, 1, [[0, "#5d5a62"], [0.55, "#9a948f"], [0.8, "#c9c4bc"], [1, "#a39c95"]]) +
    glow(`${p}-sun`, "#e9e4dc", 0.9, 0.35) +
    glow(`${p}-gold`, "#ffd27a", 0.9, 0.3) +
    glow(`${p}-eye`, "#dcd8d0", 1, 0.5) +
    lg(`${p}-cloak`, 0, 0, 0, 1, [[0, "#4a4650"], [0.5, "#2c2932"], [1, "#16141a"]]) +
    lg(`${p}-hair`, 0, 0, 0, 1, [[0, "#f4f2f0"], [0.45, "#cfcad2"], [1, "#7e7688"]]) +
    lg(`${p}-vig`, 0, 0, 0, 1, [[0, "#0c0b10", 0], [1, "#0c0b10", 0.85]]) +
    clockDef(`${p}-ck`, "#cfc8bc", "#7a6a50", "#3a342c", "#2a2420") +
    blur(`${p}-b`, 8);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // huge arched window onto the endless grey dawn
  const win = "M420 900V330C420 150 600 40 800 40C1000 40 1180 150 1180 330V900Z";
  b += `<path d="${win}" fill="url(#${p}-win)"/>`;
  b += `<circle cx="800" cy="330" r="360" fill="url(#${p}-sun)" opacity=".6"/>`;
  b += `<circle cx="800" cy="330" r="76" fill="#dedad4" opacity=".9"/>`;
  // grey ash-dunes / dead city beyond
  b += `<path d="M420 600Q520 560 620 590T820 580T1020 590T1180 570V900H420Z" fill="#7a746f" opacity=".7"/>`;
  b += `<path d="M420 660Q560 630 700 650T980 640T1180 650V900H420Z" fill="#5d5854"/>`;
  // mullions
  b += ln("M800 40V900M420 360H1180M610 80V900M990 80V900", "#1c1b22", 10, 0.85);
  b += `<path d="${win}M380 900V330C380 120 580 0 800 0C1020 0 1220 120 1220 330V900Z" fill="#1b1a22" fill-rule="evenodd"/>`;
  b += ln("M420 900V330C420 150 600 40 800 40C1000 40 1180 150 1180 330V900", "#4a4652", 4);
  // falling ash (static flecks)
  const ash: Pt[] = [];
  for (let i = 0; i < 90; i++) ash.push([420 + r() * 760, 40 + r() * 620]);
  b += dots(ash, 2.4, "#e8e2da", 0.45);

  // throne of ash + broken clocks behind him
  b += `<path d="M540 900C530 700 540 500 560 360C570 280 580 220 600 160C620 210 640 190 660 130C690 180 710 150 740 110C760 150 780 120 800 80C820 120 840 150 860 110C890 150 910 180 940 130C960 190 980 210 1000 160C1020 220 1030 280 1040 360C1060 500 1070 700 1060 900Z" fill="#232129" stroke="#6a6672" stroke-width="3"/>`;
  // the great broken clock behind his head, a pale halo
  b += `<circle cx="800" cy="300" r="300" fill="url(#${p}-sun)" opacity=".75"/>`;
  b += `<circle cx="800" cy="300" r="190" fill="#d9d3c8" stroke="#8a6a45" stroke-width="10"/><circle cx="800" cy="300" r="172" fill="none" stroke="#a89880" stroke-width="3"/>`;
  let tk = "";
  for (let i = 0; i < 60; i++) {
    const a2 = (i / 60) * Math.PI * 2;
    const r0 = i % 5 === 0 ? 146 : 160;
    tk += `M${n1(800 + Math.cos(a2) * r0)} ${n1(300 + Math.sin(a2) * r0)}L${n1(800 + Math.cos(a2) * 168)} ${n1(300 + Math.sin(a2) * 168)}`;
  }
  b += ln(tk, "#6a5a48", 3);
  b += `<path d="M800 300L1000 180L990 120L920 140Z" fill="#2d2a35"/>`;
  b += ln("M800 300L960 110M800 300L1000 190M800 300L640 420L600 400M640 420L660 470", "#4a3e36", 3);
  b += ln("M800 300L700 150M800 300L920 400", "#3a2e2a", 7);
  let ck = "", hands = "";
  const cks: [number, number, number, number][] = [[580, 520, 0.8, -20], [1020, 520, 0.8, 25], [600, 180, 0.4, 10], [1000, 180, 0.4, -8], [570, 380, 0.55, -40], [1030, 380, 0.55, 30]];
  for (const [x, y, s, rot] of cks) {
    ck += useAt(`${p}-ck`, x, y, s, rot, 0.92, ` opacity=".85"`);
    hands += clockHands(x, y, s, r() * 12, r() * 60);
  }
  b += ck + ln(hands, "#2a2420", 4);
  
  // floating stopped gears
  const gear = (x: number, y: number, R: number, n: number): string => {
    let d = "";
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 ? R : R * 0.82;
      d += `${i ? "L" : "M"}${n1(x + Math.cos(a) * rr)} ${n1(y + Math.sin(a) * rr)}`;
    }
    return d + `ZM${n1(x + R * 0.35)} ${y}a${n1(R * 0.35)} ${n1(R * 0.35)} 0 1 0 ${n1(-R * 0.7)} 0a${n1(R * 0.35)} ${n1(R * 0.35)} 0 1 0 ${n1(R * 0.7)} 0Z`;
  };
  b += `<path d="${gear(300, 250, 60, 12)}${gear(1310, 200, 46, 10)}${gear(220, 560, 34, 8)}${gear(1390, 520, 70, 14)}" fill="#8a6a45" stroke="#3a2e2a" stroke-width="3" fill-rule="evenodd" opacity=".8"/>`;

  // ── the Ash King: leaning forward, forearms on knees, one hand reaching ──
  const line = "#18161c";
  // cloak mass (shoulders wide, hunched forward)
  b += cel("M480 900C470 760 500 620 560 540C600 490 660 460 720 452L880 452C940 460 1000 490 1040 540C1100 620 1130 760 1120 900Z", `url(#${p}-cloak)`, line, 3);
  // ragged, ash-dissolving hem at shoulders
  let rag = "";
  for (let i = 0; i < 14; i++) {
    const x = 500 + i * 44 + r() * 20;
    const y = 520 + Math.abs(i - 6.5) * -6 + r() * 30;
    rag += `M${n1(x)} ${n1(y)}l${n1(12 + r() * 10)} ${n1(40 + r() * 50)}l${n1(10 + r() * 8)} ${n1(-30 - r() * 30)}`;
  }
  b += ln(rag, "#5a5662", 2.4, 0.8);
  b += `<path d="M560 540C600 490 660 460 720 452L700 520C650 540 600 580 560 640Z" fill="#5a5662" opacity=".7"/>`;
  b += ln("M490 800C490 700 510 610 560 540C600 490 660 460 720 452M1110 800C1110 700 1090 610 1040 540C1000 490 940 460 880 452", "#e8e2d8", 3, 0.8);
  // long white hair falling forward over the shoulders
  b += cel(lock([700, 330], [640, 420], [640, 520], [600, 640], 70, 0.85) + lock([900, 330], [960, 420], [970, 520], [1010, 650], 74, 0.85), `url(#${p}-hair)`, "#625a6c", 2.4);
  // left forearm resting across the knee (right side of image)
  b += cel("M900 600C960 610 1020 640 1060 690C1070 720 1040 740 1010 730C960 700 910 680 860 670Z", "#34313a", line, 2.6);
  // reaching hand toward the viewer (palm up, offered), fingertips crumbling to ash
  b += cel("M760 560C720 600 690 640 670 690L730 720C750 680 780 640 820 610Z", "#34313a", line, 2.6);
  b += ln("M672 690L730 720", "#5a5662", 5);
  b += hand(690, 740, 1.5, 200, false, PALM_UP, FING_UP, { base: "#dcd6d2", shade: "#aca2a4", line: "#5e4e54", blush: "" }, 13);
  // ash flaking from the fingertips
  let fl = "";
  for (let i = 0; i < 16; i++) {
    const x = 620 + r() * 140, y = 800 + r() * 90;
    const s2 = 3 + r() * 6;
    fl += `M${n1(x)} ${n1(y)}l${n1(s2)} ${n1(-s2 * 0.4)}l${n1(-s2 * 0.2)} ${n1(s2)}Z`;
  }
  b += `<path d="${fl}" fill="#b8b0ac" opacity=".85"/>`;

  // head: tilted, leaning toward the viewer, masked
  const HX = 800, HY = 320, HS = 1.55, HR = 6;
  const headK = head({
    p, id: "k", skin: SK_OLD, lash: "#222", near: IR_ASH, far: IR_ASH, noFeatures: true, shadeSide: 1, rim: "#fffaf0",
    back: OLD_BACK, backFill: `url(#${p}-hair)`, hairLine: "#625a6c",
    front: OLD_FRONT, frontFill: `url(#${p}-hair)`, hairShade: "#a8a0a4",
    side: OLD_SIDE, hi: "#ffffff",
    extraBack: `<g transform="translate(-34 -92) rotate(-16)">${horn("#1f1d24", "#0c0b10", "#6a6674", 1.3, true)}</g><g transform="translate(46 -88) rotate(22)">${horn("#1f1d24", "#0c0b10", "#6a6674", 1.4, true)}</g>`,
    extraUnder: ashMask(`${p}-eye`, 0.9),
  });
  b += place(HX, HY, HS, HR, false, headK);
  b += cel("M728 480C760 520 850 522 884 486L910 560C860 580 750 580 700 560Z", "#2c2932", "#16141a", 2.6);
  b += cel(lock([730, 480], [700, 540], [700, 600], [680, 680], 40, 0.9) + lock([872, 480], [906, 540], [910, 600], [930, 690], 42, 0.9), `url(#${p}-hair)`, "#625a6c", 2.2);
  // eye-hole glow, pulsing faintly
  b += `<g ${A(p, "pu", 0, 4.5)}><circle cx="836" cy="320" r="26" fill="url(#${p}-eye)" opacity=".55"/><circle cx="752" cy="316" r="20" fill="url(#${p}-eye)" opacity=".45"/></g>`;

  // gold sand falling UPWARD: bright streams + motes
  let rib = "";
  const st: [number, number, number][] = [[300, 380, 50], [1300, 1240, 60], [560, 620, 30], [1040, 980, 30]];
  let sd: Pt[] = [];
  st.forEach(([xa, xb, sw], i) => {
    let d = "";
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      d += `${k ? "L" : "M"}${n1(xa + (xb - xa) * t + Math.sin(t * 5 + i) * sw)} ${n1(900 - 920 * t)}`;
    }
    rib += d;
    sd = sd.concat(sandStream(r, 110, xa, xb, 900, -20, sw, i));
  });
  b += ln(rib, "#ffd27a", 30, 0.2, ` filter="url(#${p}-b)"`);
  b += dots(sd, 2.4, "#ffd27a", 0.8);
  // fallen broken clock faces on the floor
  let fc = "";
  for (const [x, y, s, rot] of [[380, 850, 1.2, 20], [1220, 840, 1.1, -30], [600, 880, 0.8, 60], [1040, 885, 0.9, -10]] as [number, number, number, number][])
    fc += useAt(`${p}-ck`, x, y, s, rot, 0.35);
  b += fc;
  b += `<rect y="600" width="1600" height="300" fill="url(#${p}-vig)"/>`;
  for (let i = 0; i < 26; i++) {
    const x = 200 + r() * 1200, y = 380 + r() * 500;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.8 + r() * 2.2)}" fill="#ffe7a8" ${A(p, "up", r() * 6, 5 + r() * 4)}/>`;
  }
  let spk = "";
  for (let i = 0; i < 8; i++) spk += sparkle(300 + r() * 1000, 100 + r() * 700, 4 + r() * 7);
  b += `<path d="${spk}" fill="#fff4d0" opacity=".85"/>`;
  return svg(p, defs, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_unmask — e07: beneath the cracked mask, an aged Elios
// ────────────────────────────────────────────────────────────────────────────
function cgUnmask(): string {
  const p = "cg-unmask";
  const r = rng(1000);
  const defs =
    lg(`${p}-bg`, 0, 0, 0, 1, [[0, "#3a383f"], [0.5, "#77716f"], [1, "#2a2830"]]) +
    glow(`${p}-sun`, "#f2ede4", 0.95, 0.35) +
    glow(`${p}-gold`, "#ffd27a", 0.9, 0.3) +
    glow(`${p}-eye`, "#dcd8d0", 1, 0.5) +
    lg(`${p}-hair`, 0, 0, 0, 1, [[0, "#f8f6f4"], [0.45, "#d2ccd4"], [1, "#857d8e"]]) +
    lg(`${p}-cloak`, 0, 0, 0, 1, [[0, "#4a4650"], [1, "#1a181e"]]) +
    lg(`${p}-green`, 0, 0, 1, 1, [[0, "#3f6a4c"], [1, "#1e3a2a"]]) +
    lg(`${p}-vig`, 0, 0, 0, 1, [[0, "#141218", 0], [1, "#141218", 0.8]]) +
    blur(`${p}-b`, 8);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  b += `<circle cx="820" cy="300" r="620" fill="url(#${p}-sun)" opacity=".55"/>`;
  // arched window ribs soft behind
  b += ln("M380 900V360C380 140 580 20 800 20C1020 20 1220 140 1220 360V900", "#2a2830", 26, 0.5, ` filter="url(#${p}-b)"`);
  const ash: Pt[] = [];
  for (let i = 0; i < 80; i++) ash.push([r() * 1600, r() * 900]);
  b += dots(ash, 2.6, "#efe9e0", 0.4);

  // shoulders/cloak
  b += cel("M470 900C480 780 540 700 640 660L960 660C1060 700 1120 780 1130 900Z", `url(#${p}-cloak)`, "#16141a", 3);
  b += `<path d="M640 660L960 660C900 700 860 720 800 720C740 720 700 700 640 660Z" fill="#5a5662"/>`;
  // neck ash cracks glow
  const HX = 800, HY = 380, HS = 2.3, HR = -3;
  const crack = ln("M34 30L44 44L38 58L48 72M44 44L56 48M38 58L28 66M-40 40L-46 54L-40 64M10 110L18 126L12 140M18 126L30 130", "#4a3a3e", 1.8) +
    ln("M34 30L44 44L38 58L48 72M10 110L18 126L12 140", "#ffd9a0", 0.8, 0.8);
  const headU = head({
    p, id: "u", skin: SK_OLD, lash: "#2a2226", near: IR_ASHRED, far: IR_ASH,
    open: 0.58, look: [0, 0.3], brow: 1, browColor: "#cfc9cb", mouth: "soft", blush: 0.2, tears: 2, gaunt: true,
    shadeSide: 1, rim: "#fff6e0",
    back: OLD_BACK, backFill: `url(#${p}-hair)`, hairLine: "#625a6c",
    front: OLD_FRONT, frontFill: `url(#${p}-hair)`, hairShade: "#a49a9e",
    side: OLD_SIDE, hi: "#ffffff",
    extraBack: `<g transform="translate(-34 -92) rotate(-16)">${horn("#1f1d24", "#0c0b10", "#6a6674", 1.2, true)}</g><g transform="translate(46 -88) rotate(22)">${horn("#1f1d24", "#0c0b10", "#6a6674", 1.3, true)}</g>`,
    extraUnder: crack + ln("M4 36C14 42 30 42 42 34M-20 36C-28 40 -38 40 -46 34", "#8a7c80", 1.6, 0.7),
  });
  b += place(HX, HY, HS, HR, false, headU);

  // the mask, lifted away up-left, held by Seoha's hands (green cloak sleeves from the left)
  b += cel("M0 760C120 700 250 600 350 470L420 520C330 650 200 780 60 900H0Z", `url(#${p}-green)`, "#10241a", 3);
  b += cel("M0 520C110 470 220 390 300 300L360 350C290 450 170 560 30 630H0Z", `url(#${p}-green)`, "#10241a", 3);
  b += ln("M340 480L410 530M290 310L352 356", "#f4ecd8", 6);
  b += `<g transform="translate(520 300) rotate(-24) scale(2.1)">${ashMask(`${p}-eye`, 0.25)}</g>`;
  // hands gripping the mask edges
  b += hand(340, 334, 1.55, 58, false, PALM_GRIP, FING_GRIP, SK_SEOHA, 12);
  b += hand(396, 508, 1.55, 64, false, PALM_GRIP, FING_GRIP, SK_SEOHA, 12);
  // his collar covers the neck
  b += cel("M600 900C610 800 640 720 700 690C740 720 860 720 900 690C960 720 990 800 1000 900Z", "#2c2932", "#16141a", 3);
  b += ln("M700 690C740 740 860 740 900 690", "#6a6674", 3);
  // ash dust shed from the mask
  let fl = "";
  for (let i = 0; i < 18; i++) {
    const x = 420 + r() * 260, y = 180 + r() * 300;
    const s2 = 3 + r() * 6;
    fl += `M${n1(x)} ${n1(y)}l${n1(s2)} ${n1(-s2 * 0.4)}l${n1(-s2 * 0.2)} ${n1(s2)}Z`;
  }
  b += `<path d="${fl}" fill="#d8d0cc" opacity=".8"/>`;
  // rising gold sand + light
  let sd: Pt[] = [];
  sd = sd.concat(sandStream(r, 120, 1100, 1260, 900, 0, 40, 1), sandStream(r, 90, 380, 300, 900, 0, 40, 2));
  b += dots(sd, 2.4, "#ffd27a", 0.75);
  b += `<rect y="620" width="1600" height="280" fill="url(#${p}-vig)"/>`;
  for (let i = 0; i < 22; i++) {
    const x = 200 + r() * 1200, y = 300 + r() * 560;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.6 + r() * 2)}" fill="#ffe7a8" ${A(p, "up", r() * 6, 5 + r() * 4)}/>`;
  }
  // falling ash flakes (animated)
  for (let i = 0; i < 10; i++) {
    const x = 500 + r() * 600, y = 100 + r() * 400;
    b += `<rect x="${n1(x)}" y="${n1(y)}" width="5" height="3" fill="#ece6de" ${A(p, "dn", r() * 7, 6 + r() * 3)}/>`;
  }
  return svg(p, defs, b);
}

/** world position of a local head point after place() */
function wp(x: number, y: number, s: number, rot: number, flip: boolean, lx: number, ly: number): Pt {
  const a = (rot * Math.PI) / 180;
  const X = (flip ? -lx : lx) * s, Y = ly * s;
  return [x + X * Math.cos(a) - Y * Math.sin(a), y + X * Math.sin(a) + Y * Math.cos(a)];
}
function eliosHead(p: string, o: Partial<HeadOpt>, whites = 3, hs = 1): string {
  const w = ELIOS_WHITE.split("M").filter(Boolean).slice(0, whites).map((q) => "M" + q).join("");
  return head({
    p, id: "e", skin: SK_ELIOS, lash: "#16121c", male: true, near: IR_RED, far: IR_GOLD, browColor: "#1a1822",
    back: ELIOS_BACK, backFill: `url(#${p}-eh)`, hairLine: "#0a0a12",
    front: ELIOS_FRONT, frontFill: `url(#${p}-eh)`, hairShade: "#cfaab2",
    side: ELIOS_SIDE, hi: "#55587e", strands: "#3a3a52",
    extraBack: `<g transform="translate(-36 -86) rotate(-22)">${horn("#15141b", "#050508", "#5c5a70", 0.75 * hs)}</g><g transform="translate(40 -84) rotate(18)">${horn("#15141b", "#050508", "#5c5a70", 0.8 * hs)}</g>`,
    extraOver: ln(w, "#0a0a12", 4.6) + ln(w, "#ecebf2", 2.6) + (o.extraOver ?? ""),
    ...o,
  } as HeadOpt);
}
const EH_GRAD = (p: string) => lg(`${p}-eh`, 0, 0, 0, 1, [[0, "#2c2b3c"], [0.6, "#1a1924"], [1, "#0e0d14"]]);
const COAT_LINE = "#0c1020";
const SK_GLOVE: Skin = { base: "#24222a", shade: "#141218", line: "#050408", blush: "" };

// ────────────────────────────────────────────────────────────────────────────
// cg_sand — ch02: Razel turns to sand, puzzled and worried
// ────────────────────────────────────────────────────────────────────────────
function cgSand(): string {
  const p = "cg-sand";
  const r = rng(237);
  const defs =
    lg(`${p}-wall`, 0, 0, 1, 0, [[0, "#6e4628"], [0.45, "#4a3020"], [1, "#2a1e16"]]) +
    glow(`${p}-lamp`, "#ffb45a", 0.95, 0.35) +
    glow(`${p}-gold`, "#ffd27a", 0.95, 0.3) +
    lg(`${p}-gray`, 0, 0, 1, 0, [[0, "#8a8784", 0], [0.42, "#8a8784", 0], [0.7, "#8a8784", 0.55], [1, "#9a9794", 0.85]]) +
    lg(`${p}-hair`, 0, 0, 0, 1, [[0, "#a8804e"], [1, "#5e4024"]]) +
    lg(`${p}-fur`, 0, 0, 0, 1, [[0, "#b4b0aa"], [0.5, "#8a8682"], [1, "#5e5a58"]]) +
    lg(`${p}-leather`, 0, 0, 1, 1, [[0, "#8a5c3a"], [1, "#4a2e1c"]]) +
    lg(`${p}-hood`, 0, 0, 1, 1, [[0, "#b9bcc6"], [1, "#6e727f"]]) +
    blur(`${p}-b`, 9);
  let b = `<rect width="1600" height="900" fill="url(#${p}-wall)"/>`;
  // planks + beams
  let pl = "";
  for (let x = 40; x < 1600; x += 90 + r() * 30) pl += `M${n1(x)} 0V900`;
  b += ln(pl, "#2a1a10", 3, 0.5);
  b += `<path d="M0 90H1600V140H0ZM0 560H1600V600H0Z" fill="#2e1e14"/>` + ln("M0 92H1600M0 562H1600", "#8a6440", 2, 0.6);
  // shelves with bottles (left)
  let bt = "";
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 52 + r() * 10, h = 50 + r() * 40;
    bt += `M${n1(x)} 300v${n1(-h)}q0 -14 10 -18v-14h8v14q10 4 10 18v${n1(h)}Z`;
  }
  b += `<path d="${bt}" fill="#3a5a4a" stroke="#1a1410" stroke-width="2" opacity=".85"/><rect x="40" y="300" width="500" height="14" fill="#3a2616"/>`;
  // hanging lamp, warm bloom
  b += `<circle cx="300" cy="200" r="520" fill="url(#${p}-lamp)" opacity=".75"/>`;
  b += ln("M300 0V150", "#1a1410", 3) + `<path d="M270 150h60l-10 60h-40Z" fill="#ffe0a0" stroke="#3a2616" stroke-width="3"/>`;
  b += `<g ${A(p, "fl", 0, 2.6)}><circle cx="300" cy="185" r="60" fill="url(#${p}-lamp)"/></g>`;
  // table edge bottom
  b += `<path d="M0 760L1600 720V900H0Z" fill="#3a2414"/>` + ln("M0 760L1600 720", "#9a6a40", 3, 0.7);
  b += `<path d="M180 740h70v-60q-36 -10 -70 0Z" fill="#c9a060" stroke="#3a2414" stroke-width="3"/>`;

  // ── Razel ──
  const HX = 800, HY = 330, HS = 2.0, HR = 4;
  const line = "#2a1a10";
  // body: leather armour + fur mantle, big shoulders
  b += ln("M1010 120L940 420", "#3a2a1e", 22) + ln("M1010 120L940 420", "#7a5a3a", 14) + `<path d="M990 110h50v20h-50Z" fill="#c8a060" stroke="#3a2616" stroke-width="3"/>`;
  b += cel("M470 900C470 760 520 640 640 590C700 566 760 560 800 560C860 560 920 568 980 594C1090 640 1140 760 1140 900Z", `url(#${p}-leather)`, line, 3);
  b += `<path d="M700 600L800 700L900 600C860 640 740 640 700 600Z" fill="#3a2414"/>` + ln("M620 700C680 740 740 760 800 760C860 760 920 740 980 700M600 800H1000", "#2a1a10", 3, 0.7);
  const zig = (pts: Pt[], amp: number): string => {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      for (let k = 1; k <= 4; k++) {
        const t = k / 4, tm = (k - 0.5) / 4;
        const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
        d += `L${n1(x0 + (x1 - x0) * tm + (nx / l) * amp)} ${n1(y0 + (y1 - y0) * tm + (ny / l) * amp)}L${n1(x0 + (x1 - x0) * t)} ${n1(y0 + (y1 - y0) * t)}`;
      }
    }
    return d;
  };
  let fur = zig([[430, 780], [470, 660], [560, 580], [660, 548], [740, 556]], -14).replace(/^M/, "M");
  for (let i = 0; i < 8; i++) fur += `L${n1(730 - i * 38)} ${n1(620 + i * 16 + (i % 2) * 20)}`;
  fur += "L430 800Z";
  let fur2 = zig([[1170, 780], [1130, 660], [1040, 580], [940, 548], [860, 556]], 14);
  for (let i = 0; i < 8; i++) fur2 += `L${n1(870 + i * 38)} ${n1(620 + i * 16 + (i % 2) * 20)}`;
  fur2 += "L1170 800Z";
  b += cel(fur + fur2, `url(#${p}-fur)`, "#3a3634", 2.6);
  b += ln("M500 640L540 610M560 600L600 580M1100 640L1060 610M1040 600L1000 580", "#e6e2dc", 2.4, 0.8);
  // head
  const stub: Pt[] = [];
  for (let i = 0; i < 40; i++) {
    const t = r();
    stub.push([-30 + t * 70 + (r() - 0.5) * 6, 60 + Math.sin(t * Math.PI) * 26 + r() * 6]);
  }
  const headR = head({
    p, id: "r", skin: SK_RAZEL, lash: "#2a160a", male: true, near: IR_AMBER, far: IR_AMBER, browColor: "#6a4a2a",
    open: 0.9, look: [0.1, 0], brow: 1.1, mouth: "o", blush: 0, shadeSide: 1, rim: "#ffd9a0",
    back: RAZEL_BACK, backFill: `url(#${p}-hair)`, hairLine: "#3a2414",
    front: RAZEL_FRONT, frontFill: `url(#${p}-hair)`, hairShade: "#dcae8c",
    side: RAZEL_STRANDS, strands: "#d0aa78",
    extraUnder: dots(stub, 1.6, "#9a6a4a", 0.6) + ln("M-20 34L8 16", "#a05a44", 3.4) + ln("M-20 34L8 16", "#f6d0b4", 1.4) + `<path d="M-40 56C-30 80 -10 92 4 92C24 84 40 66 50 48C40 70 20 84 0 86C-16 86 -30 76 -40 56Z" fill="#b48a70" opacity=".45"/>`,
  });
  // brows thicker for Razel: drawn by head with brow colour
  b += place(HX, HY, HS, HR, false, `<g transform="scale(1.12 1)">${headR}</g>`);
  b += cel("M690 600C730 570 760 560 790 580C820 596 850 590 880 570C920 580 940 600 950 620C880 650 760 650 690 600Z", "#5a3a24", line, 3);

  // his hand raised toward her, crumbling from the fingertips into gold sand
  b += cel("M600 900C590 820 580 740 590 690L660 680C664 740 670 820 680 900Z", `url(#${p}-leather)`, line, 3);
  const FING_SAND: [Pt, Pt, Pt][] = [[[-18, -46], [-22, -58], [-24, -66]], [[-6, -50], [-7, -64], [-7, -74]], [[8, -50], [10, -62], [11, -70]], [[20, -44], [24, -54], [27, -60]], [[-24, -16], [-40, -28], [-48, -40]]];
  b += hand(622, 690, 1.6, 12, false, PALM_OPEN, FING_SAND, SK_RAZEL, 14);
  {
    let tp = "";
    for (const [, c, e] of FING_SAND) {
      const [ax, ay] = wp(622, 690, 1.6, 12, false, c[0], c[1]);
      const [bx, by] = wp(622, 690, 1.6, 12, false, e[0], e[1]);
      tp += `M${n1(ax)} ${n1(ay)}L${n1(bx)} ${n1(by)}`;
    }
    b += ln(tp, "#c88a20", 25) + ln(tp, "#ffd27a", 21) + ln(tp, "#fff6d8", 8, 0.8);
  }
  // sand streaming away from the fingertips (up and right, toward the grey)
  const tips: Pt[] = [[570, 580], [600, 566], [625, 570], [648, 590]];
  let sand: Pt[] = [], big: Pt[] = [];
  for (const [tx, ty] of tips) {
    for (let i = 0; i < 90; i++) {
      const t = Math.pow(r(), 0.7);
      sand.push([tx - t * 520 + (r() - 0.5) * 60 * t, ty - t * 300 + (r() - 0.5) * 70 * t + Math.sin(t * 5) * 20]);
    }
    for (let i = 0; i < 12; i++) {
      const t = r();
      big.push([tx - t * 300 + (r() - 0.5) * 40, ty - t * 220 + (r() - 0.5) * 50]);
    }
  }
  b += `<ellipse cx="680" cy="520" rx="220" ry="140" fill="url(#${p}-gold)" opacity=".6"/>`;
  b += ln("M610 570C540 500 420 420 120 280", "#ffd27a", 80, 0.3, ` filter="url(#${p}-b)"`);
  b += dots(sand, 2.6, "#ffd27a", 0.9) + dots(big, 5, "#fff1c4", 0.95);

  // the world going grey from the right
  b += `<rect width="1600" height="900" fill="url(#${p}-gray)"/>`;
  // Seoha's hand reaching in (foreground, bottom right): grey hoodie sleeve over navy scrub cuff
  b += cel("M1600 900L1600 640C1480 660 1360 700 1260 760L1330 900Z", `url(#${p}-hood)`, "#3e4250", 3);
  b += cel("M1270 760C1250 770 1236 790 1240 812L1300 850C1310 830 1320 800 1330 780Z", "#2c3a6a", "#141a38", 2.6);
  const FING_REACH: [Pt, Pt, Pt][] = [[[-18, -46], [-24, -74], [-22, -100]], [[-6, -50], [-6, -82], [-2, -110]], [[8, -50], [14, -80], [20, -104]], [[20, -44], [30, -64], [38, -84]], [[-26, -14], [-46, -24], [-58, -40]]];
  b += hand(1262, 800, 2.1, -62, false, PALM_GRIP, FING_REACH, SK_SEOHA, 13);
  // animated sand motes
  for (let i = 0; i < 26; i++) {
    const t = r();
    b += `<circle cx="${n1(610 - t * 460)}" cy="${n1(560 - t * 300 + (r() - 0.5) * 60)}" r="${n1(2 + r() * 2.4)}" fill="#fff1c4" ${A(p, "up", r() * 6, 3 + r() * 3)}/>`;
  }
  return svg(p, defs, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_demon — ch02: Elios unveils his demon form to protect her
// ────────────────────────────────────────────────────────────────────────────
function cgDemon(): string {
  const p = "cg-demon";
  const r = rng(402);
  const defs =
    lg(`${p}-bg`, 0, 0, 0, 1, [[0, "#141428"], [0.6, "#231c30"], [1, "#0c0a12"]]) +
    glow(`${p}-moon`, "#bcd0ff", 0.9, 0.3) +
    glow(`${p}-red`, "#ff3a3a", 0.95, 0.35) +
    glow(`${p}-gold`, "#ffc850", 0.95, 0.35) +
    lg(`${p}-shaft`, 0, 0, 1, 1, [[0, "#c8d8ff", 0.45], [1, "#c8d8ff", 0]]) +
    lg(`${p}-coat`, 0, 0, 1, 1, [[0, "#2a3560"], [0.6, "#161c38"], [1, "#0a0e1e"]]) +
    lg(`${p}-blade`, 0, 0, 1, 0, [[0, "#050408"], [0.7, "#1a0c14"], [1, "#6a0e18"]]) +
    EH_GRAD(p) +
    blur(`${p}-b`, 10);
  let b = `<rect width="1600" height="900" fill="url(#${p}-bg)"/>`;
  // rose window upper left, moonlight shafts
  const wx = 380, wy = 200;
  b += `<circle cx="${wx}" cy="${wy}" r="330" fill="url(#${p}-moon)" opacity=".55"/>`;
  b += `<circle cx="${wx}" cy="${wy}" r="140" fill="#2a2a50" stroke="#0a0a14" stroke-width="10"/>`;
  const glass = ["#3a5aa8", "#8a2a48", "#a88a40", "#2a7a70", "#5a3a90", "#a85a30"];
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2;
    for (const [r0, r1] of [[44, 90], [90, 132]] as [number, number][])
      b += `<path d="M${n1(wx + Math.cos(a0) * r0)} ${n1(wy + Math.sin(a0) * r0)}L${n1(wx + Math.cos(a0) * r1)} ${n1(wy + Math.sin(a0) * r1)}A${r1} ${r1} 0 0 1 ${n1(wx + Math.cos(a1) * r1)} ${n1(wy + Math.sin(a1) * r1)}L${n1(wx + Math.cos(a1) * r0)} ${n1(wy + Math.sin(a1) * r0)}Z" fill="${glass[(i + (r0 > 50 ? 3 : 0)) % 6]}" stroke="#0a0a14" stroke-width="4" opacity=".75"/>`;
  }
  b += `<circle cx="${wx}" cy="${wy}" r="44" fill="#c8d0f0" stroke="#0a0a14" stroke-width="6" opacity=".9"/>`;
  b += `<circle cx="${wx}" cy="${wy}" r="200" fill="url(#${p}-moon)" opacity=".35"/>`;
  b += `<path d="M260 280L520 180L1300 900L700 900Z" fill="url(#${p}-shaft)" opacity=".5"/>`;
  // pillars and broken goddess statue (dim, background)
  b += `<path d="M60 900V200H130V900ZM1440 900V160H1520V900Z" fill="#1a1626"/>`;
  b += `<path d="M1180 900V640L1220 600L1210 480C1200 440 1220 400 1250 390L1240 350C1260 330 1290 340 1290 370L1286 392C1320 410 1330 450 1320 500L1310 600L1350 640V900Z" fill="#3a3650" opacity=".8"/>`;
  // faceless assassins (left, dim): white masks glinting
  for (const [x, y, s] of [[260, 540, 1], [470, 500, 0.8], [140, 620, 1.2]] as [number, number, number][]) {
    b += `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 360C-60 200 -50 60 0 0C50 60 60 200 60 360Z" fill="#0a0a10"/><path d="M-50 60C-50 -20 50 -20 50 60C50 90 -50 90 -50 60Z" fill="#0c0c12"/><ellipse cx="0" cy="40" rx="26" ry="34" fill="#e8e6ee"/><ellipse cx="8" cy="36" rx="12" ry="22" fill="#c8c6d4"/>` +
      ln("M40 120L150 20", "#c8ccd8", 4) + `</g>`;
  }
  // shadow blades unfurling from behind him
  let bl = "";
  const bases: [number, number, number, number][] = [[-150, 330, 0, 130], [-118, 290, 0, 120], [-82, 250, 0, 110], [-190, 360, 0, 110], [-46, 210, 0, 90], [-222, 380, 0, 100], [200, 300, 0, 90], [165, 260, 0, 80], [-10, 200, 0, 70]];
  for (const [ang, len, , w] of bases) {
    const a = (ang * Math.PI) / 180;
    const ox = 960, oy = 520;
    const ex = ox + Math.cos(a) * len * 1.6, ey = oy + Math.sin(a) * len * 1.6;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const cx = (ox + ex) / 2 + nx * w, cy = (oy + ey) / 2 + ny * w;
    bl += `M${n1(ox + nx * w * 0.4)} ${n1(oy + ny * w * 0.4)}Q${n1(cx)} ${n1(cy)} ${n1(ex)} ${n1(ey)}Q${n1((ox + ex) / 2 + nx * w * 0.2)} ${n1((oy + ey) / 2 + ny * w * 0.2)} ${n1(ox - nx * w * 0.4)} ${n1(oy - ny * w * 0.4)}Z`;
  }
  b += `<path d="${bl}" fill="#ff3040" opacity=".35" filter="url(#${p}-b)"/>`;
  b += `<path d="${bl}" fill="url(#${p}-blade)" stroke="#ff4050" stroke-width="3"/>`;
  // wisps of shadow
  let ws = "";
  for (let i = 0; i < 18; i++) {
    const x = 700 + r() * 600, y = 300 + r() * 500;
    ws += `M${n1(x)} ${n1(y)}q${n1(20 + r() * 30)} ${n1(-30 - r() * 40)} ${n1(-10 + r() * 20)} ${n1(-70 - r() * 50)}`;
  }
  b += ln(ws, "#1a0a14", 6, 0.8);

  // ── Elios, back to the viewer, looking over his shoulder ──
  const HX = 900, HY = 300, HS = 1.55, HR = -8;
  // hood blown back + cloak streaming right
  b += cel("M960 380C1040 360 1140 380 1240 420C1320 450 1400 470 1480 460C1420 520 1330 540 1240 530C1150 520 1060 500 990 470Z", "#10142a", COAT_LINE, 3);
  b += `<path d="M990 470C1060 500 1150 520 1240 530C1330 540 1420 520 1480 460C1400 500 1300 510 1220 500C1130 490 1050 470 990 440Z" fill="#232a4c"/>`;
  // back and shoulders (coat), left arm thrown out to the left to shield
  b += cel("M640 900C650 760 680 620 740 540C790 480 860 450 940 450C1020 450 1080 480 1120 540C1170 620 1190 760 1190 900Z", `url(#${p}-coat)`, COAT_LINE, 3);
  b += ln("M940 470C930 600 930 760 940 900", "#070a16", 3, 0.8);
  b += ln("M760 540C800 500 870 476 940 470M1110 540C1080 500 1020 476 960 470", "#6a7ab8", 2.6, 0.6);
  b += cel("M760 540C700 540 620 530 540 500C480 480 430 460 390 440L380 490C430 520 490 550 560 574C640 600 700 610 740 610Z", `url(#${p}-coat)`, COAT_LINE, 3);
  b += ln("M384 470C430 500 500 530 560 550", "#4a5a98", 2.4, 0.7);
  // gloved hand, fingers splayed, shadow gathering
  b += hand(382, 466, 1.5, -104, false, PALM_OPEN, FING_OPEN, SK_GLOVE, 13);
  b += `<circle cx="300" cy="470" r="90" fill="url(#${p}-red)" opacity=".5" ${A(p, "pu", 0, 2.4)}/>`;
  // hood fold around the neck
  b += cel("M860 470C880 430 930 410 980 420C1010 430 1020 460 1010 480C980 470 930 468 890 480Z", "#1a2040", COAT_LINE, 2.6);
  const headE = eliosHead(p, { open: 0.85, look: [0.35, 0.1], brow: -1.4, mouth: "sad", blush: 0.1, shadeSide: 1, rim: "#c8d8ff" }, 3, 1.5);
  b += place(HX, HY, HS, HR, false, headE);
  b += cel("M880 470C900 440 920 432 940 440C970 452 1000 452 1020 440C1030 460 1030 490 1016 510C970 520 910 516 872 500Z", "#1c2346", COAT_LINE, 2.6);
  b += ln("M892 452C920 470 980 470 1014 452", "#e8e8f0", 3);
  // glowing eyes: red (his left, near) + gold (his right, far)
  const [ex1, ey1] = wp(HX, HY, HS, HR, false, 22, 10);
  const [ex2, ey2] = wp(HX, HY, HS, HR, false, -32, 10);
  b += `<g ${A(p, "pu", 1, 3)}><circle cx="${n1(ex1)}" cy="${n1(ey1)}" r="60" fill="url(#${p}-red)" opacity=".75"/><circle cx="${n1(ex2)}" cy="${n1(ey2)}" r="40" fill="url(#${p}-gold)" opacity=".45"/></g>`;
  // embers / red motes
  for (let i = 0; i < 20; i++) {
    const x = r() < 0.5 ? 500 + r() * 300 : 1100 + r() * 300, y = 250 + r() * 600;
    b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.6 + r() * 2.4)}" fill="#ff6a5a" ${A(p, "up", r() * 6, 4 + r() * 3)}/>`;
  }
  b += `<rect width="1600" height="900" fill="none" stroke="#000" stroke-width="80" opacity=".35" filter="url(#${p}-b)"/>`;
  return svg(p, defs, b);
}

export const CGS_A: Record<string, string> = {
  cg_fall: cgFall(),
  cg_ashking: cgAshking(),
  cg_sand: cgSand(),
  cg_demon: cgDemon(),
  cg_unmask: cgUnmask(),
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
