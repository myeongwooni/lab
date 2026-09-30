// 이벤트 CG (B 묶음) — 「천 번째 새벽, 당신에게」
// 각 CG는 독립된 SVG 문자열(viewBox 0 0 1600 900, slice).
// 모든 id·클래스·키프레임은 CG 고유 접두어(cg-e-good- 등)로 시작한다.
// 규칙: 필터 2개 이하, 움직이는 요소 40개 이하, <text> 없음, SMIL 없음, 시드 고정 난수, 45KB 이하.
// 화풍: TV 애니메이션 키 비주얼 — 셀 셰이딩 인물(색 외곽선, 2단 음영, 림 라이트), 빛번짐, 빛나는 하늘.

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

/** 그림 하나의 정의(gradient·clip) 모음. 모든 id에 접두어를 붙인다. */
class Ctx {
  defs = "";
  private k = 0;
  p: string;
  constructor(p: string) {
    this.p = p;
  }
  id(s: string): string {
    return `${this.p}-${s}${(this.k++).toString(36)}`;
  }
  /** 선형 그라데이션(도형 기준 좌표) → url(#…) */
  lg(x1: number, y1: number, x2: number, y2: number, s: Stop[]): string {
    const id = this.id("l");
    this.defs += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
    return `url(#${id})`;
  }
  /** 선형 그라데이션(화면 좌표) */
  lgu(x1: number, y1: number, x2: number, y2: number, s: Stop[]): string {
    const id = this.id("u");
    this.defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}">${stops(s)}</linearGradient>`;
    return `url(#${id})`;
  }
  /** 원형 그라데이션(도형 기준 좌표) */
  rg(s: Stop[], cx = 0.5, cy = 0.5, r = 0.5, fx?: number, fy?: number): string {
    const id = this.id("r");
    const f = fx === undefined ? "" : ` fx="${fx}" fy="${fy ?? cy}"`;
    this.defs += `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${f}>${stops(s)}</radialGradient>`;
    return `url(#${id})`;
  }
  /** 빛번짐용: 색 → 투명 */
  glow(color: string, core = 0.9, mid = 0.35): string {
    return this.rg([
      [0, color, core],
      [0.3, color, mid],
      [1, color, 0],
    ]);
  }
  clip(d: string): string {
    const id = this.id("c");
    this.defs += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    return `url(#${id})`;
  }
  blur(sd: number): string {
    const id = this.id("f");
    this.defs += `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
    return `url(#${id})`;
  }
}

/** 공용 애니메이션 CSS. 움직이는 요소는 class `${p}-a ${p}-<종류>`. */
function css(p: string, extra = ""): string {
  return (
    `<style>.${p}-a{transform-box:fill-box;transform-origin:center}` +
    `.${p}-tw{animation:${p}-tw 4.2s ease-in-out infinite}@keyframes ${p}-tw{0%,100%{opacity:1}50%{opacity:.25}}` +
    `.${p}-pu{animation:${p}-pu 5s ease-in-out infinite}@keyframes ${p}-pu{0%,100%{opacity:.65}50%{opacity:1}}` +
    `.${p}-up{animation:${p}-up 7s ease-in-out infinite}@keyframes ${p}-up{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(18px,-60px);opacity:0}}` +
    `.${p}-dn{animation:${p}-dn 6s ease-in infinite}@keyframes ${p}-dn{0%{transform:translate(0,0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translate(0,70px);opacity:0}}` +
    `.${p}-sw{animation:${p}-sw 6s ease-in-out infinite}@keyframes ${p}-sw{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}` +
    `.${p}-fl{animation:${p}-fl 2.8s ease-in-out infinite}@keyframes ${p}-fl{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(.96,1.05)}}` +
    extra +
    `@media (prefers-reduced-motion:reduce){.${p}-a{animation:none!important}}</style>`
  );
}

function A(p: string, kind: string, delay = 0, dur?: number): string {
  const st = `animation-delay:${n1(-delay)}s${dur ? `;animation-duration:${n1(dur)}s` : ""}`;
  return `class="${p}-a ${p}-${kind}" style="${st}"`;
}

function svg(c: Ctx, body: string, extraCss = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${c.defs}</defs>${css(c.p, extraCss)}${body}</svg>`;
}

function place(x: number, y: number, s: number, rot: number, flip: boolean, inner: string): string {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
}

/** 작은 점 여러 개를 한 path로(모래·먼지·별). */
function dots(pts: Pt[], w: number, color: string, op: number): string {
  const q = pts.filter(([x, y]) => x > -10 && x < 1610 && y > -10 && y < 910);
  if (!q.length) return "";
  return `<path d="${q.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h0`).join("")}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
}

/** 4점 반짝임 */
function spark(x: number, y: number, s: number): string {
  const k = s * 0.14;
  return `M${n1(x)} ${n1(y - s)}Q${n1(x + k)} ${n1(y - k)} ${n1(x + s)} ${n1(y)}Q${n1(x + k)} ${n1(y + k)} ${n1(x)} ${n1(y + s)}Q${n1(x - k)} ${n1(y + k)} ${n1(x - s)} ${n1(y)}Q${n1(x - k)} ${n1(y - k)} ${n1(x)} ${n1(y - s)}Z`;
}

/** 셀 도형: 채움 + 색 외곽선 */
function cel(d: string, fill: string, line: string, w = 2.6, extra = ""): string {
  return `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round"${extra}/>`;
}
function ln(d: string, color: string, w = 2, op = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
}
function fl(d: string, fill: string, op = 1): string {
  return `<path d="${d}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ""}/>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 인물 키트 — 머리 로컬 좌표: 머리 높이 ≈ 200(정수리 y≈-104, 턱 y≈100), 관객 기준 왼쪽을 보는 3/4.
// 반전(flip)하면 오른쪽을 본다.
// ────────────────────────────────────────────────────────────────────────────

interface Skin {
  b: string; // 밝은 면
  s: string; // 그림자 면
  l: string; // 외곽선
  blush: string;
  rim?: string; // 림 라이트
}
interface Iris {
  d: string;
  b: string;
  l: string;
}
interface Hair {
  b: string;
  s: string;
  h: string;
  l: string;
}

const SKIN_WARM: Skin = { b: "#fde8d6", s: "#eeb79f", l: "#a0594a", blush: "#f28f8a", rim: "#fff3c4" };

const IRIS = {
  brown: { d: "#2a1610", b: "#6a3a24", l: "#b77a4e" },
  red: { d: "#4a0a12", b: "#b3202e", l: "#ff7a6a" },
  gold: { d: "#6a3c08", b: "#e0a020", l: "#ffe28a" },
  amber: { d: "#5a2e08", b: "#d07818", l: "#ffcf70" },
  steel: { d: "#1e2f4a", b: "#5a7ea8", l: "#b8d4f0" },
  ash: { d: "#3a3836", b: "#8a8784", l: "#d4d0ca" },
  ashRed: { d: "#3a2426", b: "#8a6262", l: "#d4bcb8" },
  sky: { d: "#1a3a6a", b: "#4a8ad0", l: "#b0dcff" },
};

type EyeMode = "open" | "soft" | "down" | "closed" | "happy" | "wide";
type MouthMode = "n" | "smile" | "open" | "sad" | "laugh" | "part" | "grit" | "soft";
type BrowMode = "n" | "sad" | "soft" | "knit" | "up";

interface FaceO {
  sex: "f" | "m" | "c";
  skin: Skin;
  near: Iris; // 관객에 가까운 쪽(오른쪽) 눈
  far: Iris;
  lash: string;
  eyes?: EyeMode;
  mouth?: MouthMode;
  brow?: BrowMode;
  browC?: string;
  tears?: 0 | 1 | 2;
  blush?: number;
  rim?: [number, number]; // 림 라이트 방향(로컬)
  shade?: 1 | -1; // 그림자가 드는 쪽: 1 = 가까운 쪽(오른쪽)
  bags?: boolean;
  thin?: boolean; // 여윈 얼굴(늙은 엘리오스)
  extra?: string; // 얼굴 위(흉터·금·수염)
  noNearEye?: boolean; // 안대 등으로 가림
  nearEyeExtra?: string; // 가까운 눈 위 장식(시계 문자판)
}

const FACE_F =
  "M58 -30C60 0 58 26 50 44C40 66 20 88 -2 100C-10 104 -17 102 -22 97C-36 83 -47 63 -53 42C-57 31 -59 24 -57 16C-61 8 -63 -2 -61 -14L-60 -30C-60 -104 58 -104 58 -30Z";
const FACE_M =
  "M58 -30C60 0 59 30 53 52C47 70 30 92 6 108C-2 112 -12 112 -19 106C-34 90 -46 70 -52 48C-57 34 -59 26 -58 16C-62 8 -64 -2 -62 -14L-61 -30C-61 -106 58 -106 58 -30Z";
const FACE_THIN =
  "M56 -30C58 0 56 22 48 40C40 62 24 92 2 108C-6 113 -14 112 -20 106C-34 88 -44 68 -49 46C-52 34 -54 26 -54 16C-58 6 -60 -4 -59 -14L-59 -30C-59 -106 56 -106 56 -30Z";
const FACE_C =
  "M60 -30C63 4 60 30 50 50C40 70 22 88 0 96C-8 99 -16 97 -22 92C-38 80 -50 62 -56 42C-60 31 -62 22 -60 14C-64 6 -65 -4 -63 -14L-62 -30C-62 -104 60 -104 60 -30Z";

/** 한쪽 눈(단위 좌표: 폭 40, 바깥 눈꼬리 +x). */
function eyeUnit(c: Ctx, ir: Iris, lash: string, skin: Skin, mode: EyeMode, male: boolean, wet: boolean): string {
  if (mode === "closed") {
    return (
      `<path d="M-20 -2C-10 8 8 9 21 -2L23 1C10 12 -10 12 -21 1Z" fill="${lash}"/>` +
      ln("M16 5l5 5M9 8l3 5", lash, 1.6) +
      ln("M-14 -16C-2 -21 10 -19 18 -13", skin.l, 1.2, 0.5)
    );
  }
  if (mode === "happy") {
    return `<path d="M-20 8C-10 -8 10 -9 21 5L22 9C10 -3 -10 -3 -20 12Z" fill="${lash}"/>` + ln("M-14 -10C-2 -16 10 -14 18 -8", skin.l, 1.2, 0.5);
  }
  // 눈꺼풀 높이: 0 = 활짝, 크면 덮임
  const lid = mode === "soft" ? 7 : mode === "down" ? 12 : mode === "wide" ? -3 : 0;
  const irisG = c.lg(0, 0, 0, 1, [
    [0, ir.d],
    [0.42, ir.b],
    [0.85, ir.l],
    [1, ir.l],
  ]);
  const ry = male ? 14 : 16;
  const rx = male ? 11.5 : 12.5;
  const cy = mode === "down" ? 5 : 2;
  const sclera = "M-19 -6C-10 -15 8 -17 20 -9C21 4 16 17 2 19C-10 19 -18 10 -19 -6Z";
  let s = cel(sclera, "#ffffff", skin.l, 1.2);
  // 흰자 위쪽 그림자(속눈썹 그림자)
  s += fl("M-19 -6C-10 -15 8 -17 20 -9L20 -3C8 -9 -8 -8 -19 0Z", "#c9cfe8", 0.8);
  s += `<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${irisG}" stroke="${ir.d}" stroke-width="1.4"/>`;
  s += `<ellipse cx="0.5" cy="${cy + 3}" rx="${male ? 4.6 : 5.4}" ry="${male ? 6.6 : 7.6}" fill="${ir.d}"/>`;
  s += fl(`M-8 ${cy + 10}Q0 ${cy + 17} 8 ${cy + 10}Q0 ${cy + 13} -8 ${cy + 10}Z`, ir.l, 0.9);
  if (!(mode === "down")) {
    s += `<ellipse cx="-4.6" cy="${cy - 5 + lid * 0.6}" rx="4.2" ry="5.2" fill="#fff"/>`;
  }
  s += `<circle cx="6" cy="${cy + 9}" r="${wet ? 2.8 : 2}" fill="#fff"/>`;
  if (wet) s += ln(`M-12 ${cy + 13}Q0 ${cy + 21} 13 ${cy + 11}`, "#ffffff", 2, 0.9);
  // 눈꺼풀(피부) — lid>0 이면 위쪽을 덮는다
  const t = (y: number): number => y + lid;
  if (lid > 0) {
    s += fl(`M-22 -24H24V${t(-9)}C8 ${t(-16)} -10 ${t(-15)} -21 ${t(-3)}Z`, skin.b);
  }
  // 윗속눈썹(두껍게, 바깥 꼬리 튕김)
  const up = male
    ? `M-21 ${t(-3)}C-11 ${t(-15)} 8 ${t(-18)} 21 ${t(-10)}L24 ${t(-7)}C18 ${t(-10)} 8 ${t(-13)} -4 ${t(-12)}C-12 ${t(-11)} -17 ${t(-7)} -20 ${t(0)}Z`
    : `M-21 ${t(-3)}C-12 ${t(-16)} 8 ${t(-20)} 21 ${t(-11)}L26 ${t(-9)}L23 ${t(-5)}C18 ${t(-10)} 6 ${t(-14)} -4 ${t(-13)}C-12 ${t(-12)} -17 ${t(-8)} -20 ${t(-1)}Z`;
  s += `<path d="${up}" fill="${lash}"/>`;
  if (!male) s += ln(`M21 ${t(-10)}l6 -4M18 ${t(-13)}l4 -5`, lash, 1.5);
  // 쌍꺼풀
  s += ln(`M-14 ${t(-19)}C-2 ${t(-25)} 12 ${t(-23)} 20 ${t(-16)}`, skin.l, 1.3, 0.55);
  // 아랫속눈썹
  s += ln("M-4 19C4 20 11 17 16 12", lash, 1.4, 0.6);
  return s;
}

/** 얼굴(피부·눈·코·입·볼). 머리카락은 따로. */
function face(c: Ctx, o: FaceO): string {
  const male = o.sex === "m";
  const d = o.thin ? FACE_THIN : male ? FACE_M : o.sex === "c" ? FACE_C : FACE_F;
  const sk = o.skin;
  const eyes = o.eyes ?? "open";
  const cp = c.clip(d);
  let s = "";
  // 목
  const neck = male ? "M-20 80L-24 190H38L34 60Z" : "M-16 80L-18 180H30L28 64Z";
  s += cel(neck, sk.b, sk.l, 2.4);
  s += fl(male ? "M-22 96C0 116 20 100 34 76L36 120C14 132 -8 126 -23 118Z" : "M-17 94C0 110 16 96 28 78L29 116C10 124 -6 120 -17 112Z", sk.s);
  // 얼굴 면 + 음영 + 림 라이트(얼굴 모양으로 잘라서)
  let inner = `<path d="${d}" fill="${sk.b}"/>`;
  const sh = o.shade ?? 1;
  if (sh === 1) inner += fl("M60 -40L60 110L-4 110C20 88 38 62 44 36C48 14 48 -12 40 -40Z", sk.s);
  else inner += fl("M-70 -40L-70 110L-18 110C-30 90 -40 64 -44 38C-48 20 -50 0 -48 -40Z", sk.s);
  if (o.thin) inner += fl("M30 40C26 58 18 72 8 82C18 66 24 52 26 36Z", sk.s) + fl("M-44 40C-40 56 -34 66 -28 74C-38 68 -46 56 -48 44Z", sk.s);
  if (o.rim && sk.rim) inner += `<path d="${d}" fill="none" stroke="${sk.rim}" stroke-width="7" transform="translate(${o.rim[0]} ${o.rim[1]})" opacity=".95"/>`;
  s += `<g clip-path="${cp}">${inner}</g>`;
  s += `<path d="${d}" fill="none" stroke="${sk.l}" stroke-width="2.6" stroke-linejoin="round"/>`;
  // 볼 홍조
  const bl = o.blush ?? 0.45;
  if (bl > 0) {
    s += `<ellipse cx="22" cy="56" rx="17" ry="7.5" fill="${sk.blush}" opacity="${bl}"/><ellipse cx="-42" cy="56" rx="8" ry="6" fill="${sk.blush}" opacity="${bl * 0.9}"/>`;
    s += ln("M12 54l-4 6M20 54l-4 6M28 54l-4 6", sk.blush, 1.4, Math.min(1, bl * 1.6));
  }
  // 다크서클
  if (o.bags) s += ln("M4 46C12 50 24 50 32 44", "#b58aa0", 2.2, 0.45) + ln("M-46 46C-42 48 -36 48 -32 45", "#b58aa0", 1.8, 0.4);
  // 눈
  const ey = male ? 24 : o.sex === "c" ? 26 : 22;
  const sy = male ? 0.95 : o.sex === "c" ? 1.2 : 1.12;
  const sx = male ? 1.04 : o.sex === "c" ? 1.14 : 1.1;
  const wet = (o.tears ?? 0) > 0;
  if (!o.noNearEye) s += `<g transform="translate(18 ${ey}) scale(${sx} ${sy})">${eyeUnit(c, o.near, o.lash, sk, eyes, male, wet)}</g>`;
  if (o.nearEyeExtra) s += `<g transform="translate(18 ${ey}) scale(${sx} ${sy})">${o.nearEyeExtra}</g>`;
  s += `<g transform="translate(-34 ${ey}) scale(${-0.66 * sx} ${sy})">${eyeUnit(c, o.far, o.lash, sk, eyes, male, wet)}</g>`;
  // 눈썹
  const bc = o.browC ?? o.lash;
  const bw = male ? 3.6 : 2.6;
  const brow = o.brow ?? "n";
  const by = ey - (male ? 22 : 26);
  const B: Record<BrowMode, [string, string]> = {
    n: [`M0 ${by + 2}C10 ${by - 4} 24 ${by - 5} 38 ${by}`, `M-46 ${by + 1}C-40 ${by - 3} -32 ${by - 3} -24 ${by + 1}`],
    soft: [`M0 ${by}C12 ${by - 4} 26 ${by - 3} 38 ${by + 3}`, `M-46 ${by + 3}C-40 ${by - 2} -32 ${by - 3} -24 ${by}`],
    sad: [`M0 ${by - 3}C12 ${by - 4} 26 ${by} 38 ${by + 5}`, `M-46 ${by + 5}C-40 ${by} -32 ${by - 3} -24 ${by - 3}`],
    knit: [`M2 ${by + 4}C12 ${by - 2} 26 ${by - 6} 38 ${by - 3}`, `M-46 ${by - 2}C-38 ${by - 4} -30 ${by} -24 ${by + 4}`],
    up: [`M0 ${by - 2}C10 ${by - 9} 24 ${by - 10} 38 ${by - 4}`, `M-46 ${by - 3}C-40 ${by - 8} -32 ${by - 8} -24 ${by - 4}`],
  };
  s += ln(B[brow][0], bc, bw) + ln(B[brow][1], bc, bw * 0.85);
  // 코(그림자 한 점 + 선)
  const ny = male ? 60 : o.sex === "c" ? 56 : 54;
  s += ln(`M-15 ${ny - 12}L-20 ${ny}L-14 ${ny + 2}`, sk.l, 2, 0.85) + fl(`M-14 ${ny - 10}L-12 ${ny}L-17 ${ny}Z`, sk.s, 0.8);
  // 입
  const my = male ? 84 : o.sex === "c" ? 76 : 78;
  const mo = o.mouth ?? "n";
  const lip = male ? sk.l : "#b0484a";
  const M: Record<MouthMode, string> = {
    n: ln(`M-24 ${my}Q-15 ${my + 2} -6 ${my - 1}`, lip, 2.4),
    soft: ln(`M-26 ${my - 1}Q-15 ${my + 4} -4 ${my - 2}`, lip, 2.4),
    smile: ln(`M-28 ${my - 3}Q-15 ${my + 7} -2 ${my - 4}`, lip, 2.6),
    sad: ln(`M-24 ${my + 1}Q-15 ${my - 3} -6 ${my + 1}`, lip, 2.4),
    part: `<path d="M-23 ${my - 1}Q-15 ${my - 3} -8 ${my - 1}Q-14 ${my + 7} -23 ${my - 1}Z" fill="#8a2a34" stroke="${lip}" stroke-width="1.8"/>`,
    open: `<path d="M-28 ${my - 4}Q-15 ${my - 2} -2 ${my - 5}Q-8 ${my + 12} -18 ${my + 11}Q-26 ${my + 8} -28 ${my - 4}Z" fill="#8a2a34" stroke="${lip}" stroke-width="2"/><path d="M-22 ${my + 7}Q-15 ${my + 4} -8 ${my + 7}Q-15 ${my + 11} -22 ${my + 7}Z" fill="#e06a70"/>`,
    laugh: `<path d="M-32 ${my - 6}Q-15 ${my - 4} 2 ${my - 7}Q-4 ${my + 16} -16 ${my + 15}Q-28 ${my + 12} -32 ${my - 6}Z" fill="#7a2230" stroke="${lip}" stroke-width="2.2"/><path d="M-29 ${my - 4}Q-15 ${my - 2} 0 ${my - 5}L-2 ${my - 1}Q-15 ${my + 1} -28 ${my}Z" fill="#fff"/><path d="M-24 ${my + 9}Q-15 ${my + 5} -6 ${my + 9}Q-15 ${my + 14} -24 ${my + 9}Z" fill="#e06a70"/>`,
    grit: `<path d="M-28 ${my - 2}Q-15 ${my - 4} -2 ${my - 3}Q-6 ${my + 6} -15 ${my + 6}Q-24 ${my + 5} -28 ${my - 2}Z" fill="#fff" stroke="${lip}" stroke-width="2"/>` + ln(`M-26 ${my + 1}H-4`, lip, 1.2),
  };
  s += M[mo];
  // 눈물
  const te = o.tears ?? 0;
  if (te >= 2) {
    const tr = `M12 ${ey + 20}C9 ${ey + 34} 13 ${ey + 48} 10 ${ey + 64}C9 ${ey + 70} 13 ${ey + 72} 14 ${ey + 66}C16 ${ey + 50} 13 ${ey + 34} 15 ${ey + 20}Z`;
    s += `<path d="${tr}" fill="#dff0ff" stroke="#8ab0dc" stroke-width="1" opacity=".75"/>` + ln(`M13 ${ey + 26}C12 ${ey + 38} 14 ${ey + 50} 12 ${ey + 60}`, "#ffffff", 1.2, 0.9);
    s += `<path d="M-38 ${ey + 20}C-40 ${ey + 32} -38 ${ey + 42} -40 ${ey + 50}C-40 ${ey + 54} -37 ${ey + 54} -37 ${ey + 50}C-35 ${ey + 42} -37 ${ey + 32} -36 ${ey + 20}Z" fill="#dff0ff" stroke="#8ab0dc" stroke-width="0.8" opacity=".7"/>`;
  }
  if (te >= 1) s += `<path d="M30 ${ey + 14}c-3 5 -3 9 0 9s3 -4 0 -9z" fill="#f4faff" stroke="#8ab0dc" stroke-width="1"/>`;
  if (o.extra) s += o.extra;
  return s;
}

/** 머리 한 가닥 묶음: [뿌리x, 끝x, 끝y, 폭, 휨] 목록 → 셀 가닥들(뿌리 쪽은 선 없음). */
type Lock = [number, number, number, number, number?];
function locks(ls: Lock[], rootY: number, h: Hair, w = 2.2, shadeSide = 1): string {
  let s = "";
  let sh = "";
  for (const [rx, tx, ty, wd, bend = 0] of ls) {
    const my = (rootY + ty) / 2;
    const q = ty - rootY;
    const d = `M${n1(rx - wd)} ${rootY}C${n1(rx - wd + bend)} ${n1(my)} ${n1(tx + bend * 0.4 - wd * 0.2)} ${n1(ty - q * 0.25)} ${n1(tx)} ${n1(ty)}C${n1(tx + wd * 0.5 + bend * 0.4)} ${n1(ty - q * 0.3)} ${n1(rx + wd + bend)} ${n1(my)} ${n1(rx + wd)} ${rootY}`;
    s += `<path d="${d}Z" fill="${h.b}"/><path d="${d}" fill="none" stroke="${h.l}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const k = shadeSide;
    sh += `M${n1(rx + k * wd * 0.1)} ${rootY}C${n1(rx + k * wd * 0.2 + bend)} ${n1(my + 6)} ${n1(tx + k * 2 + bend * 0.3)} ${n1(ty - q * 0.3)} ${n1(tx)} ${n1(ty - 3)}C${n1(tx + k * wd * 0.4 + bend * 0.4)} ${n1(ty - q * 0.35)} ${n1(rx + k * wd * 0.85 + bend)} ${n1(my + 6)} ${n1(rx + k * wd * 0.8)} ${rootY}Z`;
  }
  return s + fl(sh, h.s, 0.85);
}

/** 정수리 덮개: 가닥 뿌리를 덮고 바깥 윤곽만 선. */
const CROWN_FILL = "M-69 -12C-77 -72 -40 -113 4 -113C49 -113 77 -76 69 -14C62 -34 50 -50 34 -58Q4 -70 -28 -60C-46 -52 -60 -36 -69 -12Z";
const CROWN_LINE = "M-69 -12C-77 -72 -40 -113 4 -113C49 -113 77 -76 69 -14";
function crown(h: Hair, w = 2.6): string {
  return fl(CROWN_FILL, h.b) + ln(CROWN_LINE, h.l, w);
}

/** 정수리의 광택 띠(천사의 고리): 위는 매끈, 아래는 톱니. */
function shine(cx: number, cy: number, rx: number, th: number, n: number, color: string, op = 0.9, tilt = 0): string {
  let top = "";
  let bot = "";
  for (let i = 0; i <= n; i++) {
    const t = -1 + (2 * i) / n;
    const x = cx + t * rx;
    const y = cy + t * t * rx * 0.3 + t * tilt;
    top += `${i ? "L" : "M"}${n1(x)} ${n1(y)}`;
    const yy = y + th * (i % 2 ? 1.3 : 0.3) * (1 - t * t * 0.6);
    bot = `L${n1(x)} ${n1(yy)}` + bot;
  }
  return fl(top + bot + "Z", color, op);
}

/** 가는 잔머리(선) */
function strands(ds: string[], h: Hair, w = 1.8): string {
  return ds.map((d) => ln(d, h.l, w)).join("");
}

// ── 인물별 머리 ──
const HAIR_ELIOS: Hair = { b: "#282a3c", s: "#13141f", h: "#6a76a0", l: "#08080f" };
const HAIR_WHITE: Hair = { b: "#f4f2f0", s: "#c6c2ce", h: "#ffffff", l: "#77738a" };
const HAIR_SEOHA: Hair = { b: "#2c2528", s: "#161114", h: "#6a5a6a", l: "#0a080a" };
const HAIR_RAZEL: Hair = { b: "#bb8c58", s: "#8a5e36", h: "#ecca92", l: "#4a2c14" };
const HAIR_SIAN: Hair = { b: "#e4edf8", s: "#a8bad8", h: "#ffffff", l: "#5a6c98" };
const HAIR_LIANA: Hair = { b: "#f7ecd4", s: "#d8c69e", h: "#fffcf2", l: "#8e7c52" };

type HairSet = { back: string; front: string };

/** 엘리오스 머리. streaks: 흰 가닥 수, full: 전부 흰머리. */
function hairElios(o: { streaks: number; full?: boolean; horns?: boolean }): HairSet {
  const H = o.full ? HAIR_WHITE : HAIR_ELIOS;
  const back =
    cel("M-60 -80L-70 -30C-80 10 -78 60 -68 96C-62 110 -52 118 -40 120L-30 92L60 92L64 124C76 116 82 100 82 80C86 40 82 0 70 -40L60 -80Z", H.s, H.l) +
    cel("M52 96C66 110 76 134 72 162C68 178 60 188 50 192C56 172 56 150 48 128C46 116 46 106 52 96Z", H.s, H.l, 2.2);
  let front = cel("M-62 -40C-74 0 -72 44 -62 82C-57 70 -55 54 -54 40C-50 54 -46 62 -39 68C-46 40 -50 10 -48 -20Z", H.b, H.l, 2.2);
  front += cel("M50 -40C62 -10 66 22 61 60C58 48 55 38 50 32C50 46 48 56 44 64C46 30 44 0 40 -30Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-52, -66, 20, 14, -6],
    [-34, -46, 8, 16, -4],
    [-16, -24, 28, 15, -2],
    [2, -6, 12, 15, 0],
    [18, 12, 36, 13, 2],
    [34, 34, 14, 14, 3],
    [52, 58, 8, 13, 4],
  ];
  front += locks(L, -74, H, 2.2, 1);
  if (!o.full && o.streaks > 0) {
    const ws: Lock[] = ([
      [30, 28, 22, 5, 2],
      [42, 46, 12, 4, 3],
      [22, 18, 32, 4, 1],
      [50, 56, 6, 4, 4],
      [10, 6, 24, 4, 0],
      [-4, -12, 18, 4, -2],
    ] as Lock[]).slice(0, o.streaks);
    front += locks(ws, -66, HAIR_WHITE, 1.6, 1);
  }
  front += crown(H);
  if (!o.full && o.streaks > 0) front += fl("M28 -62Q40 -66 54 -52L50 -46Q40 -58 30 -56Z", HAIR_WHITE.b, 0.95);
  front += shine(0, -86, 54, 10, 12, H.h, o.full ? 0.95 : 0.8, -4);
  front += strands(["M-10 -66C-16 -36 -22 -12 -24 10", "M26 -64C31 -34 31 -12 27 8"], H, 1.3);
  if (o.horns !== false) {
    const hc = "#1c1624";
    const hl = "#7a6a8a";
    front += cel("M-40 -96C-47 -112 -58 -122 -70 -127C-61 -114 -59 -101 -57 -88Z", hc, "#050408", 2) + ln("M-46 -104C-52 -112 -58 -118 -64 -121", hl, 1.6, 0.8);
    front += cel("M30 -104C34 -120 44 -131 56 -137C50 -123 50 -110 48 -97Z", hc, "#050408", 2) + ln("M36 -111C40 -120 46 -126 52 -130", hl, 1.6, 0.8);
  }
  return { back, front };
}

/** 엘리오스의 뾰족한 귀(가까운 쪽) */
function elfEar(sk: Skin): string {
  return cel("M52 -2C64 -12 82 -28 94 -36C88 -16 80 8 68 26C62 34 56 36 50 32Z", sk.b, sk.l, 2.4) + fl("M58 6C66 -4 76 -14 84 -22C80 -8 74 6 66 18C62 22 58 18 58 6Z", sk.s);
}

/** 보통 귀(가까운 쪽) */
function ear(sk: Skin): string {
  return cel("M52 0C62 -8 72 0 70 16C68 28 62 36 52 34Z", sk.b, sk.l, 2.4) + ln("M58 8C64 6 66 14 62 22", sk.l, 1.4, 0.6);
}

/** 라젤: 수염 자국 + 콧등 흉터 */
function razelMarks(): string {
  const r = rng(31);
  const pts: Pt[] = [];
  for (let i = 0; i < 70; i++) {
    const t = r();
    const x = -34 + t * 80;
    const yb = 108 - Math.abs(x + 6) * 0.5;
    pts.push([x, yb - 4 - r() * 26]);
  }
  return (
    fl("M-38 70C-30 100 -10 116 10 106C30 92 44 72 50 54C40 80 20 98 2 100C-14 100 -28 90 -38 70Z", "#b88670", 0.35) +
    `<path d="${pts.map(([x, y]) => `M${n1(x)} ${n1(y)}h0`).join("")}" stroke="#8a5a44" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>` +
    ln("M-40 36L28 44", "#c8806e", 4) + ln("M-40 36L28 44", "#f4c8b4", 1.6) + ln("M-22 32L-26 42M-4 36L-8 46M12 38L8 48", "#c8806e", 1.4)
  );
}

function hairSeoha(): HairSet {
  const H = HAIR_SEOHA;
  const back =
    cel("M-60 -80L-72 -30C-84 20 -82 80 -72 124C-56 134 -32 130 -18 124L50 124C66 132 82 128 88 116C92 70 88 10 72 -40L60 -80Z", H.s, H.l) +
    cel("M50 108C62 120 71 140 67 166C65 176 59 184 52 187C54 170 52 150 44 132Z", H.s, H.l, 2.2);
  let front = cel("M-64 -40C-80 10 -80 70 -66 118C-60 108 -57 96 -57 84C-51 96 -43 106 -34 110C-45 80 -51 40 -50 0C-50 -14 -50 -26 -48 -36Z", H.b, H.l, 2.2);
  front += cel("M44 -44C62 -10 71 40 67 106C61 96 57 84 55 72C51 88 45 98 36 104C44 70 44 30 36 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-52, -62, 4, 14, -6],
    [-34, -42, 12, 16, -4],
    [-15, -20, 6, 14, -2],
    [4, 0, 14, 15, 0],
    [22, 20, 8, 14, 2],
    [40, 42, 2, 14, 4],
  ];
  front += locks(L, -74, H, 2.2, 1);
  front += crown(H);
  front += shine(-2, -86, 56, 10, 12, H.h, 0.85, -3);
  front += strands(["M-53 30C-61 50 -59 70 -65 88", "M58 40C62 60 60 80 67 98", "M-6 -70C-14 -58 -20 -50 -28 -46", "M44 -20C54 -4 56 12 54 26"], H, 1.3);
  return { back, front };
}

function hairRazel(): HairSet {
  const H = HAIR_RAZEL;
  const back =
    cel("M-56 -80L-66 -30C-74 10 -70 50 -60 70L60 70C72 40 74 0 66 -40L56 -80Z", H.s, H.l) +
    cel("M50 40C70 50 86 70 90 96C92 110 88 122 82 128C80 110 72 96 60 88C62 100 60 110 56 116C52 96 46 70 40 50Z", H.s, H.l, 2.2);
  let front = cel("M-61 -30C-71 0 -69 20 -63 40C-59 26 -57 14 -55 -6Z", H.b, H.l, 2);
  front += cel("M55 -34C63 -10 65 10 61 30C57 18 53 6 49 -14Z", H.b, H.l, 2);
  // 뒤로 넘긴 덮개: 이마를 드러낸다
  front += fl("M-66 -8C-76 -72 -40 -114 4 -114C50 -114 78 -76 68 -12C60 -40 44 -62 20 -70Q-10 -76 -34 -62C-50 -50 -60 -32 -66 -8Z", H.b);
  front += ln("M-66 -8C-76 -72 -40 -114 4 -114C50 -114 78 -76 68 -12", H.l, 2.6);
  front += ln("M-66 -8C-60 -32 -50 -50 -34 -62Q-10 -76 20 -70C44 -62 60 -40 68 -12", H.l, 1.8, 0.8);
  front += strands(["M-40 -92C-20 -104 20 -106 50 -86", "M-52 -72C-26 -92 24 -96 60 -62", "M-60 -46C-42 -70 10 -82 64 -44"], { ...H, l: H.s }, 2.2);
  const L: Lock[] = [
    [-30, -44, -14, 7, -6],
    [-14, -22, -2, 6, -3],
    [32, 40, -16, 6, 3],
  ];
  front += locks(L, -68, H, 2, 1);
  front += shine(-4, -98, 46, 8, 10, H.h, 0.85, -4);
  return { back, front };
}

/** 시안: 턱선 길이 은발, 왼쪽(가까운 쪽) 가는 땋은 머리 + 푸른 구슬 */
function hairSian(o: { child?: boolean } = {}): HairSet {
  const H = HAIR_SIAN;
  const back = cel("M-60 -80L-70 -30C-82 20 -80 70 -70 104C-52 112 -32 110 -20 106L50 106C66 112 80 106 86 96C90 60 86 10 72 -40L60 -80Z", H.s, H.l);
  let front = cel("M-62 -40C-77 10 -77 60 -67 104C-61 92 -59 80 -57 70C-53 84 -47 94 -38 98C-46 70 -50 30 -48 -10Z", H.b, H.l, 2.2);
  front += cel("M46 -44C62 -10 69 40 65 96C59 86 57 76 55 66C51 80 47 88 40 92C46 60 44 20 38 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-52, -64, 10, 14, -8],
    [-33, -42, 18, 16, -6],
    [-13, -22, 12, 15, -3],
    [8, 2, 22, 15, -1],
    [26, 24, 10, 14, 1],
    [44, 48, 4, 13, 3],
  ];
  front += locks(L, -74, H, 2.2, 1);
  front += crown(H);
  front += shine(-2, -86, 56, 10, 12, H.h, 0.95, -3);
  if (!o.child) {
    let br = "";
    for (let i = 0; i < 7; i++) {
      const y = 20 + i * 15;
      const x = 63 + Math.sin(i * 0.5) * 2;
      br += cel(`M${n1(x - 6)} ${y}C${n1(x - 7)} ${y + 8} ${n1(x - 2)} ${y + 14} ${n1(x + 1)} ${y + 16}C${n1(x + 6)} ${y + 10} ${n1(x + 6)} ${y + 4} ${n1(x + 2)} ${y - 2}Z`, i % 2 ? H.b : H.s, H.l, 1.4);
    }
    front += br + `<circle cx="64" cy="136" r="7" fill="#3a78d8" stroke="#1a3a78" stroke-width="1.8"/><circle cx="62" cy="133" r="2.4" fill="#cfe6ff"/>`;
    front += ln("M64 143V156M61 144L59 156M67 144L69 156", H.l, 1.4);
  }
  return { back, front };
}

/** 재의 왕 맨얼굴: 새하얀 긴 머리, 흐트러짐, 부서지는 뿔 */
function hairAged(): HairSet {
  const H = HAIR_WHITE;
  const back = cel("M-62 -80L-74 -30C-90 40 -96 120 -90 220C-80 236 -60 240 -44 232L-30 120L60 120L70 240C88 246 104 236 108 220C108 130 96 30 74 -40L62 -80Z", H.s, H.l);
  let front = cel("M-62 -40C-80 20 -84 100 -78 180C-70 160 -66 140 -64 120C-58 140 -50 154 -42 160C-52 110 -52 50 -48 -10Z", H.b, H.l, 2.2);
  front += cel("M48 -44C66 0 74 80 72 170C66 150 62 134 60 118C54 136 48 146 40 152C50 100 48 30 40 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-52, -68, 24, 14, -8],
    [-33, -44, 32, 16, -5],
    [-14, -22, 20, 15, -2],
    [4, 0, 38, 14, 0],
    [22, 18, 24, 14, 2],
    [40, 44, 30, 13, 5],
    [54, 62, 14, 10, 5],
  ];
  front += locks(L, -74, H, 2.2, 1);
  front += crown(H);
  front += shine(0, -86, 54, 9, 12, "#ffffff", 0.9, -4);
  front += strands(["M-70 40C-80 80 -86 120 -96 150", "M70 50C78 90 84 120 92 150", "M-20 -64C-30 -20 -40 20 -50 50"], H, 1.4);
  const hc = "#2a262e";
  front += cel("M-40 -96C-46 -112 -56 -121 -66 -125L-62 -117L-68 -115C-60 -106 -58 -99 -56 -88Z", hc, "#08070a", 2);
  front += cel("M30 -104C34 -120 42 -129 52 -135L50 -127L56 -123C50 -114 50 -107 48 -97Z", hc, "#08070a", 2);
  return { back, front };
}

function hairLiana(): HairSet {
  const H = HAIR_LIANA;
  const back = cel("M-62 -80L-74 -30C-92 40 -96 140 -86 250C-66 262 -40 262 -26 250L60 250C82 262 104 256 110 240C114 140 100 30 76 -40L62 -80Z", H.s, H.l);
  let front = cel("M-64 -40C-82 20 -86 100 -80 190C-72 170 -68 150 -66 130C-60 150 -52 164 -44 170C-54 120 -54 60 -50 0Z", H.b, H.l, 2.2);
  front += cel("M48 -44C68 0 78 90 76 190C70 170 66 154 64 138C58 156 52 166 44 172C54 120 50 40 40 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-52, -60, 0, 14, -5],
    [-33, -38, 8, 15, -3],
    [-12, -16, 2, 14, -1],
    [8, 6, 10, 14, 1],
    [26, 28, 4, 14, 3],
    [44, 50, 0, 12, 4],
  ];
  front += locks(L, -74, H, 2.1, 1);
  front += crown(H);
  front += shine(-2, -86, 56, 10, 12, H.h, 0.95, -3);
  front += cel("M52 -74l18 -14l4 20zM52 -74l22 6l-10 16z", "#6aa0e8", "#2a4a88", 1.8) + `<circle cx="54" cy="-74" r="5" fill="#8ab8f0" stroke="#2a4a88" stroke-width="1.6"/>`;
  return { back, front };
}

/** 머리 전체 조립: 뒷머리 → (귀) → 얼굴 → 앞머리 → 눈썹 앞으로 */
function head(c: Ctx, f: FaceO, hair: HairSet, ear = "", over = ""): string {
  return hair.back + ear + face(c, f) + hair.front + over;
}

/** 가까운 쪽 가림용 흰 레이스 안대 */
function eyepatch(): string {
  let lace = "";
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    lace += `<circle cx="${n1(18 + Math.cos(a) * 25)}" cy="${n1(24 + Math.sin(a) * 21)}" r="3.4" fill="none" stroke="#b8c4dc" stroke-width="1.2"/>`;
  }
  return (
    ln("M-8 8L-60 -8M44 14L64 4", "#f4f6fb", 3) +
    cel("M-6 20C-6 4 6 -2 18 -2C32 -2 44 6 44 22C44 36 32 44 18 44C4 44 -6 36 -6 20Z", "#f7f8fc", "#8e9ab8", 2) +
    lace +
    ln("M4 14C10 8 26 8 34 14M4 28C12 34 26 34 34 28", "#c8d0e4", 1.2)
  );
}

/** 금빛 시계 문자판 홍채 (시안의 기시의 눈). 단위 눈 좌표에 얹는다. */
function dialIris(scale = 1): string {
  let t = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 8 : 9.6;
    t += `M${n1(Math.cos(a) * r0 * 1.0)} ${n1(2 + Math.sin(a) * r0 * 1.28)}L${n1(Math.cos(a) * 11.4)} ${n1(2 + Math.sin(a) * 14.6)}`;
  }
  return (
    `<g transform="scale(${scale})">` +
    ln(t, "#fff4c0", 1.1, 0.95) +
    `<ellipse cx="0" cy="2" rx="7" ry="9" fill="none" stroke="#7a4a08" stroke-width="1"/>` +
    ln("M0 2L0 -5M0 2L4.6 5.2", "#3a2204", 1.4) +
    `<ellipse cx="-4.6" cy="-3" rx="4" ry="5" fill="#fff" opacity=".95"/><circle cx="6" cy="11" r="2" fill="#fff"/></g>`
  );
}

// ── 공용 배경 도우미 ──

/** 구름 띠: 둥근 뭉치들의 윗면을 림 라이트로 */
function cloudBank(r: () => number, x0: number, x1: number, y: number, h: number, fill: string, rimC: string, op = 1, puff = 60): string {
  let d = `M${x0} ${y + h}`;
  let rimD = "";
  let x = x0;
  while (x < x1) {
    const w = puff * (0.6 + r() * 0.9);
    const hh = h * (0.4 + r() * 0.6);
    d += `L${n1(x)} ${n1(y + h * 0.5)}Q${n1(x + w * 0.1)} ${n1(y + h * 0.5 - hh)} ${n1(x + w * 0.5)} ${n1(y + h * 0.5 - hh)}Q${n1(x + w * 0.9)} ${n1(y + h * 0.5 - hh)} ${n1(x + w)} ${n1(y + h * 0.5)}`;
    rimD += `M${n1(x + w * 0.12)} ${n1(y + h * 0.5 - hh * 0.6)}Q${n1(x + w * 0.2)} ${n1(y + h * 0.5 - hh * 0.98)} ${n1(x + w * 0.5)} ${n1(y + h * 0.5 - hh)}`;
    x += w * 0.72;
  }
  d += `L${x1} ${y + h}Z`;
  return `<g opacity="${op}"><path d="${d}" fill="${fill}"/>${ln(rimD, rimC, 3, 0.85)}</g>`;
}

/** 빛줄기(방사) */
function rays(cx: number, cy: number, n: number, len: number, a0: number, a1: number, w: number, color: string, op: number, r: () => number): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * ((i + 0.5 + (r() - 0.5) * 0.6) / n);
    const ww = w * (0.4 + r());
    d += `M${cx} ${cy}L${n1(cx + Math.cos(a - ww) * len)} ${n1(cy + Math.sin(a - ww) * len)}L${n1(cx + Math.cos(a + ww) * len)} ${n1(cy + Math.sin(a + ww) * len)}Z`;
  }
  return fl(d, color, op);
}

/** 금빛 모래알 흐름(정적) + 반짝임(일부 움직임) */
function sandStream(c: Ctx, r: () => number, pts: () => Pt, n: number, anim: number, kind = "up", color = "#ffe08a"): string {
  const L: Pt[][] = [[], [], []];
  for (let i = 0; i < n; i++) L[i % 3 === 0 ? 1 : i % 7 === 0 ? 2 : 0].push(pts());
  let s = dots(L[0], 2.2, color, 0.75) + dots(L[1], 3.4, "#fff3c4", 0.9) + dots(L[2], 5, "#ffffff", 0.95);
  for (let i = 0; i < anim; i++) {
    const [x, y] = pts();
    s += `<path d="${spark(x, y, 4 + r() * 6)}" fill="#fff6d0" ${A(c.p, i % 2 ? kind : "tw", r() * 6, 5 + r() * 4)}/>`;
  }
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// 테스트 시트(내보내지 않음 — 미리보기 전용)
// ────────────────────────────────────────────────────────────────────────────
//@id cg_sheet cgSheet
function cgSheet(): string {
  const c = new Ctx("cg-sheet");
  let b = `<rect width="1600" height="900" fill="#cfd8e8"/>`;
  const sk = SKIN_WARM;
  const f = (o: Partial<FaceO>): FaceO => ({ sex: "f", skin: sk, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", ...o });
  b += place(170, 250, 1.1, 0, false, head(c, f({ bags: true }), hairSeoha()));
  b += place(440, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", brow: "soft", mouth: "soft" }), hairElios({ streaks: 4 }), elfEar(sk)));
  b += place(710, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.amber, far: IRIS.amber, lash: "#2a1608", mouth: "laugh", eyes: "happy", browC: "#5a3418", extra: razelMarks() }), hairRazel(), ear(sk)));
  b += place(980, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.gold, far: IRIS.steel, lash: "#2a3450", mouth: "smile", nearEyeExtra: dialIris() }), hairSian()));
  b += place(1250, 250, 1.1, 0, false, head(c, f({ sex: "m", thin: true, near: IRIS.ashRed, far: IRIS.ash, lash: "#2a2628", eyes: "soft", brow: "sad" }), hairAged(), elfEar(sk)));
  b += place(170, 660, 1.1, 0, true, head(c, f({ eyes: "closed", mouth: "soft", tears: 2 }), hairSeoha()));
  b += place(440, 660, 1.1, 0, true, head(c, f({ sex: "c", near: IRIS.sky, far: IRIS.sky, lash: "#4a3a20", mouth: "open" }), hairLiana()));
  b += place(710, 660, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.steel, far: IRIS.steel, lash: "#2a3450", tears: 2, brow: "sad", mouth: "grit", noNearEye: true }), hairSian(), "", eyepatch()));
  b += place(980, 660, 1.1, 0, false, head(c, f({ mouth: "laugh", eyes: "happy" }), hairSeoha()));
  b += place(1250, 660, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", eyes: "down", brow: "sad" }), hairElios({ streaks: 0, full: true }), elfEar(sk)));
  return svg(c, b);
}

//@id cg_zoom cgZoom
function cgZoom(): string {
  const c = new Ctx("cg-zoom");
  const sk = SKIN_WARM;
  let b = `<rect width="1600" height="900" fill="#cfd8e8"/>`;
  b += place(420, 470, 3, 0, false, head(c, { sex: "f", skin: sk, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", bags: true }, hairSeoha()));
  b += place(1180, 470, 3, 0, true, head(c, { sex: "m", skin: sk, near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", brow: "soft", mouth: "soft" }, hairElios({ streaks: 4 }), elfEar(sk)));
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// 공용 옷·몸 도우미 (머리 로컬 좌표와 같은 축척)
// ────────────────────────────────────────────────────────────────────────────

interface Cloth {
  b: string;
  s: string;
  l: string;
}
const COAT: Cloth = { b: "#2a3558", s: "#171e38", l: "#0a0e1e" };
const CLOAK_G: Cloth = { b: "#2f5a46", s: "#1c3a2c", l: "#0e2018" };
const DRESS: Cloth = { b: "#f4ead4", s: "#d8c6a4", l: "#8a7452" };
const GLOVE: Cloth = { b: "#24222a", s: "#141218", l: "#050408" };

/** 엘리오스 코트 상반신(로컬: 왼쪽을 봄). 높은 깃, 놋쇠 단추 두 줄, 흰 셔츠 깃, 회중시계 줄. */
function eliosTorso(rimC: string | null, len = 700): string {
  const C = COAT;
  const bot = 100 + len;
  let s = cel(`M-44 150C-96 164 -146 196 -166 262L-196 ${bot}H206L186 262C166 198 116 166 54 150Z`, C.b, C.l, 2.8);
  // 그림자 면(가까운 쪽 옆구리)
  s += fl(`M120 190C150 210 176 240 186 262L206 ${bot}H96C110 ${bot - 200} 118 360 120 190Z`, C.s);
  s += fl(`M-60 176C-40 260 -30 360 -40 ${bot}H-110C-96 360 -90 260 -60 176Z`, C.s, 0.6);
  // 앞여밈 선 + 단추
  s += ln(`M-6 170C0 300 -4 420 -2 ${bot}`, C.l, 2.4);
  let bt = "";
  for (let i = 0; i < 5; i++) {
    const y = 214 + i * 70;
    bt += `<circle cx="-40" cy="${y}" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="2"/><circle cx="-42" cy="${y - 2}" r="2.4" fill="#fff0c0"/>`;
    bt += `<circle cx="36" cy="${y + 4}" r="7" fill="#c89838" stroke="#6a4814" stroke-width="2"/>`;
  }
  s += bt;
  // 회중시계 줄
  s += ln("M-40 284C-20 310 10 316 36 300", "#f0c860", 3) + ln("M-40 284C-20 310 10 316 36 300", "#8a6418", 1, 0.6);
  // 높은 깃
  s += cel("M-34 108L-44 168C-10 182 30 180 60 164L50 98C20 112 -8 114 -34 108Z", C.b, C.l, 2.6);
  s += fl("M24 110L50 98L60 164C46 172 34 176 22 178Z", C.s);
  s += cel("M-30 110C-6 118 22 116 48 102L50 110C24 124 -6 126 -32 118Z", "#f6f4f0", "#8a8aa0", 1.6);
  if (rimC) s += ln(`M-44 150C-96 164 -146 196 -166 262L-196 ${bot}`, rimC, 5, 0.9);
  return s;
}

/** 서하 상반신(로컬: 왼쪽을 봄): 생성색 원피스 + 짙은 녹색 망토(후드 뒤로). */
function seohaTorsoFantasy(rimC: string | null, len = 600): string {
  const bot = 100 + len;
  let s = "";
  // 망토(뒤 → 어깨)
  s += cel(`M-40 130C-100 150 -140 200 -150 280L-170 ${bot}H190L160 280C150 200 110 150 50 128Z`, CLOAK_G.b, CLOAK_G.l, 2.6);
  s += fl(`M110 170C140 200 156 240 160 280L190 ${bot}H100C110 ${bot - 200} 116 320 110 170Z`, CLOAK_G.s);
  // 원피스 앞판
  s += cel(`M-40 150C-54 220 -60 300 -64 ${bot}H80C74 300 66 220 56 146C30 160 -14 162 -40 150Z`, DRESS.b, DRESS.l, 2.2);
  s += fl(`M30 156C44 230 52 320 56 ${bot}H80C74 300 66 220 56 146Z`, DRESS.s);
  // 둥근 깃 + 끈
  s += cel("M-40 148C-20 176 30 176 56 144C40 168 -18 170 -40 148Z", "#fffaf0", DRESS.l, 1.6);
  s += ln("M-4 170C-6 190 -10 210 -14 228M14 170C18 190 22 206 28 222", "#8a6a3a", 2);
  // 망토 여밈(놋쇠 걸쇠) + 후드 주름
  s += cel("M-46 136C-66 150 -76 170 -78 196C-60 186 -48 168 -40 150Z", CLOAK_G.b, CLOAK_G.l, 2) + cel("M56 132C80 146 92 168 96 196C76 184 64 166 54 146Z", CLOAK_G.b, CLOAK_G.l, 2);
  s += `<circle cx="-42" cy="154" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="1.8"/><circle cx="56" cy="150" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="1.8"/>`;
  s += cel("M-30 110C-60 120 -80 140 -90 160C-40 150 20 150 90 156C80 132 64 116 50 106C20 120 -4 120 -30 110Z", CLOAK_G.s, CLOAK_G.l, 2.2);
  if (rimC) s += ln(`M50 128C110 150 150 200 160 280L190 ${bot}`, rimC, 5, 0.9);
  return s;
}

/** 손(장갑/맨손) — 로컬, 손목이 +x 쪽, 손가락이 -x 쪽을 향함 */
function hand(fill: string, shade: string, line: string, spread = 0): string {
  return (
    cel(`M40 -18C20 -22 0 -24 -20 -20C-34 -18 -46 -12 -52 -4C-54 2 -48 4 -40 0L-20 -6C-34 0 -48 6 -54 14C-56 20 -50 22 -42 18L-20 8C-32 14 -44 22 -48 30C-48 36 -42 36 -36 32L-16 20C-24 26 -30 34 -30 40C-28 44 -22 42 -16 38C-4 30 10 22 24 20C34 18 40 12 42 4Z`, fill, line, 2.2) +
    fl("M40 -2C30 8 18 14 4 18C14 20 30 18 42 4Z", shade) +
    (spread ? "" : "")
  );
}

// ────────────────────────────────────────────────────────────────────────────
// cg_e_good — 금빛 새벽, 여명탑 꼭대기. 흰 가닥이 섞인 엘리오스가 서하를 안고,
// 둘 사이로 재가 금빛 모래가 되어 날아간다.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_e_good cgEGood
function cgEGood(): string {
  const c = new Ctx("cg-e-good");
  const p = c.p;
  const r = rng(1001);
  const sky = c.lgu(0, 0, 0, 900, [
    [0, "#2c3a78"],
    [0.22, "#6a5a9a"],
    [0.42, "#e08a7a"],
    [0.56, "#f8b858"],
    [0.66, "#ffe29a"],
    [0.8, "#fff4d4"],
  ]);
  let b = `<rect width="1600" height="900" fill="${sky}"/>`;
  // 별 몇 개(위쪽, 사라지는 밤)
  const st: Pt[] = [];
  for (let i = 0; i < 70; i++) st.push([r() * 1600, Math.pow(r(), 1.8) * 240]);
  b += dots(st, 2, "#fff6e0", 0.7);
  // 거대한 해의 빛번짐
  b += `<circle cx="800" cy="600" r="900" fill="${c.glow("#fff0c0", 0.95, 0.4)}"/>`;
  b += rays(800, 600, 22, 1400, Math.PI, Math.PI * 2, 0.02, "#fff6d8", 0.16, r);
  // 먼 구름 띠(금빛 테두리)
  b += cloudBank(r, -40, 1640, 470, 90, "#e89a86", "#fff0c0", 0.55, 90);
  b += cloudBank(r, -40, 1640, 560, 70, "#f4b890", "#fff6d8", 0.6, 70);
  // 해 원반
  b += `<circle cx="800" cy="610" r="150" fill="${c.glow("#ffffff", 1, 0.8)}"/><circle cx="800" cy="610" r="62" fill="#fffdf2"/>`;
  // 아래 솔레인 도시(금빛 안개)
  let city = "M0 900V700";
  for (let x = 0; x <= 1600; x += 24 + Math.floor(r() * 30)) {
    const h = 30 + r() * 60 * (0.4 + Math.abs(x - 800) / 900);
    city += `L${x} ${n1(700 - h)}L${x + 12} ${n1(690 - h - r() * 16)}`;
  }
  b += fl(city + "L1600 700V900Z", "#e8a070", 0.55);
  b += fl("M0 740Q800 700 1600 740V900H0Z", "#f6c898", 0.6);
  // 왼쪽: 여명탑의 금빛 문자판(해와 달 기호) 일부
  let dial = `<circle cx="140" cy="360" r="330" fill="none" stroke="#f5c060" stroke-width="18"/><circle cx="140" cy="360" r="300" fill="#fbe8b8" opacity=".25"/><circle cx="140" cy="360" r="300" fill="none" stroke="#fff0c0" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 140 + Math.cos(a) * 262;
    const y = 360 + Math.sin(a) * 262;
    dial += i % 2 ? `<circle cx="${n1(x)}" cy="${n1(y)}" r="12" fill="#f5c060"/>` : `<path d="M${n1(x - 14)} ${n1(y)}a14 14 0 1 0 22 -11a11 11 0 1 1 -22 11z" fill="#f5c060"/>`;
  }
  dial += ln("M140 360L300 240M140 360L150 150", "#c08a30", 10) + `<circle cx="140" cy="360" r="20" fill="#f5c060"/>`;
  b += `<g opacity=".75">${dial}</g>`;
  // 오른쪽 탑 기둥(프레임)
  b += cel("M1460 0H1600V900H1430L1440 300Z", "#e8d8bc", "#a88a64", 3) + fl("M1470 0H1500L1480 900H1440Z", "#fff4dc", 0.6);

  // ── 인물 ──
  const skE: Skin = { b: "#fbe0cc", s: "#e3a78f", l: "#9a5446", blush: "#f08a82", rim: "#fff4c8" };
  const skS: Skin = { b: "#fde4cc", s: "#eaa98c", l: "#a0574a", blush: "#f5847e", rim: "#fff4c8" };
  const rimC = "#fff2c0";
  const EX = 720, EY = 280, ES = 1.2;
  const SX = 890, SY = 380, SS = 1.05;
  // 뒤쪽 후광(두 사람 윤곽 블룸)
  b += `<ellipse cx="820" cy="420" rx="360" ry="420" fill="${c.glow("#fff6d0", 0.55, 0.25)}"/>`;
  // 엘리오스(오른쪽을 봄 = 반전)
  const eH = hairElios({ streaks: 5 });
  b += place(EX, EY, ES, 8, true, eH.back);
  b += place(EX, EY, ES, 0, true, eliosTorso(rimC));
  b += place(EX, EY, ES, 8, true, face(c, { sex: "m", skin: skE, near: IRIS.gold, far: IRIS.red, lash: "#0a0a14", eyes: "soft", brow: "soft", mouth: "soft", blush: 0.35, rim: [4, -2], shade: -1, tears: 1 }) + elfEar(skE) + eH.front);
  // 서하(왼쪽을 봄)
  const sH = hairSeoha();
  b += place(SX, SY, SS, 0, false, seohaTorsoFantasy(rimC));
  b += place(SX, SY, SS, -10, false, sH.back + face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "soft", brow: "soft", mouth: "smile", tears: 2, blush: 0.6, rim: [4, -2], shade: 1, bags: true }) + sH.front);
  // 서하의 손: 그의 가슴 위
  b += place(772, 560, 1.05, -20, false, hand(skS.b, skS.s, skS.l));
  // 그의 팔: 그녀의 등을 감싼다(장갑)
  b += cel("M980 520C1010 560 1020 640 1000 720C980 800 930 860 880 900H1010C1060 840 1090 740 1080 640C1074 580 1050 530 1010 500Z", COAT.b, COAT.l, 2.8);
  b += fl("M1030 540C1060 590 1070 680 1050 760C1034 820 1010 860 990 900H1010C1060 840 1090 740 1080 640C1074 580 1054 540 1030 520Z", COAT.s);
  b += place(1000, 520, 1.1, 150, false, hand(GLOVE.b, GLOVE.s, GLOVE.l));
  b += ln("M1010 500C1050 530 1074 580 1080 640", rimC, 4, 0.9);

  // ── 재 → 금빛 모래: 둘 사이로 흘러오른다 ──
  let ash = "";
  const band = (t: number): Pt => [520 + t * 700 + gauss(r) * 70, 860 - t * 820 + gauss(r) * 50];
  const grey: Pt[] = [];
  const gold: Pt[] = [];
  for (let i = 0; i < 260; i++) {
    const t = Math.pow(r(), 0.9);
    const pt = band(t);
    (t < 0.3 ? grey : gold).push(pt);
  }
  ash += dots(grey, 5, "#8a8784", 0.7);
  for (let i = 0; i < 18; i++) {
    const [x, y] = band(r() * 0.3);
    ash += `<path d="M${n1(x)} ${n1(y)}l${n1(6 + r() * 6)} ${n1(-3 - r() * 3)}l${n1(-2 - r() * 3)} ${n1(7 + r() * 4)}z" fill="#9a9690" opacity=".8"/>`;
  }
  b += `<g filter="${c.blur(5)}">${dots(gold.slice(0, 80), 12, "#ffd27a", 0.6)}</g>`;
  b += ash + sandStream(c, r, () => band(0.25 + r() * 0.75), 220, 26, "up");
  // 두 얼굴 사이의 빛번짐
  b += `<circle cx="812" cy="330" r="110" fill="${c.glow("#fff8e0", 0.7, 0.3)}"/>`;
  // 전경 난간(흰 돌, 금빛 역광)
  b += cel("M0 820L1600 800V900H0Z", "#d8c4a4", "#8a7050", 3) + fl("M0 820L1600 800V812L0 832Z", "#fff0cc", 0.9);
  // 전체 색보정: 따뜻한 빛 번짐
  b += `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#ffd9a0", 0], [0.6, "#ffd9a0", 0.12], [1, "#ffb070", 0.25]])}" style="mix-blend-mode:screen"/>`;
  return svg(c, b);
}
export const CGS_B: Record<string, string> = {
  cg_sheet: cgSheet(),
  cg_zoom: cgZoom(),
  cg_e_good: cgEGood(),
};
