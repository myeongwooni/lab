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
  "M58 -30C60 0 58 24 52 42C44 64 26 92 2 108C-6 113 -14 112 -21 106C-37 88 -48 66 -54 44C-58 32 -60 24 -58 16C-62 8 -64 -2 -62 -14L-61 -30C-61 -106 58 -106 58 -30Z";
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
  const sy = male ? 0.86 : o.sex === "c" ? 1.08 : 1;
  const sx = o.sex === "c" ? 1.06 : 1;
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
    const tr = `M8 ${ey + 20}C6 ${ey + 34} 10 ${ey + 50} 8 ${ey + 66}C7 ${ey + 72} 11 ${ey + 74} 13 ${ey + 68}C15 ${ey + 50} 12 ${ey + 34} 13 ${ey + 20}Z`;
    s += `<path d="${tr}" fill="#e8f4ff" stroke="#8ab0dc" stroke-width="1.2" opacity=".9"/>` + ln(`M10 ${ey + 26}C9 ${ey + 40} 11 ${ey + 52} 10 ${ey + 62}`, "#ffffff", 1.4);
    s += `<path d="M-38 ${ey + 20}C-40 ${ey + 34} -38 ${ey + 44} -40 ${ey + 54}C-40 ${ey + 58} -36 ${ey + 58} -36 ${ey + 54}C-34 ${ey + 44} -36 ${ey + 34} -35 ${ey + 20}Z" fill="#e8f4ff" stroke="#8ab0dc" stroke-width="1" opacity=".85"/>`;
  }
  if (te >= 1) s += `<path d="M30 ${ey + 14}c-3 5 -3 9 0 9s3 -4 0 -9z" fill="#f4faff" stroke="#8ab0dc" stroke-width="1"/>`;
  if (o.extra) s += o.extra;
  return s;
}

/** 머리 한 가닥 묶음: [뿌리x, 끝x, 끝y, 폭, 휨] 목록 → 셀 가닥들. */
type Lock = [number, number, number, number, number?];
function locks(ls: Lock[], rootY: number, h: Hair, w = 2.2, shadeSide = 1): string {
  let s = "";
  let sh = "";
  for (const [rx, tx, ty, wd, bend = 0] of ls) {
    const my = (rootY + ty) / 2;
    const d = `M${n1(rx - wd)} ${rootY}C${n1(rx - wd + bend)} ${n1(my)} ${n1(tx + bend * 0.4 - wd * 0.2)} ${n1(ty - (ty - rootY) * 0.25)} ${n1(tx)} ${n1(ty)}C${n1(tx + wd * 0.5 + bend * 0.4)} ${n1(ty - (ty - rootY) * 0.3)} ${n1(rx + wd + bend)} ${n1(my)} ${n1(rx + wd)} ${rootY}Z`;
    s += cel(d, h.b, h.l, w);
    // 그림자 가닥(한쪽 절반)
    const k = shadeSide;
    sh += `M${n1(rx + k * wd * 0.1)} ${rootY + 10}C${n1(rx + k * wd * 0.2 + bend)} ${n1(my)} ${n1(tx + k * 2 + bend * 0.3)} ${n1(ty - (ty - rootY) * 0.3)} ${n1(tx)} ${n1(ty - 2)}C${n1(tx + k * wd * 0.4 + bend * 0.4)} ${n1(ty - (ty - rootY) * 0.35)} ${n1(rx + k * wd * 0.85 + bend)} ${n1(my)} ${n1(rx + k * wd * 0.8)} ${rootY + 10}Z`;
  }
  return s + fl(sh, h.s, 0.9);
}

/** 정수리의 광택 띠(천사의 고리): 위는 매끈, 아래는 톱니. */
function shine(cx: number, cy: number, rx: number, th: number, n: number, color: string, op = 0.9, tilt = 0): string {
  let top = "";
  let bot = "";
  for (let i = 0; i <= n; i++) {
    const t = -1 + (2 * i) / n;
    const x = cx + t * rx;
    const y = cy + t * t * rx * 0.28 + t * tilt;
    top += `${i ? "L" : "M"}${n1(x)} ${n1(y)}`;
    const yy = y + th * (i % 2 ? 1.25 : 0.35) * (1 - t * t * 0.6);
    bot = `L${n1(x)} ${n1(yy)}` + bot;
  }
  return fl(top + bot + "Z", color, op);
}

/** 가는 잔머리(선) */
function strands(ds: string[], h: Hair, w = 1.8): string {
  return ds.map((d) => ln(d, h.l, w)).join("");
}

// ── 인물별 머리 ──
const HAIR_ELIOS: Hair = { b: "#262838", s: "#12131e", h: "#5a6488", l: "#0a0a12" };
const HAIR_WHITE: Hair = { b: "#f2f0ee", s: "#c4c0cc", h: "#ffffff", l: "#7a7686" };
const HAIR_SEOHA: Hair = { b: "#2a2426", s: "#151114", h: "#5e5260", l: "#0c0a0c" };
const HAIR_RAZEL: Hair = { b: "#b98a58", s: "#8a5e38", h: "#e8c690", l: "#4a2c16" };
const HAIR_SIAN: Hair = { b: "#e2ebf6", s: "#a9bbd8", h: "#ffffff", l: "#5e6f98" };
const HAIR_LIANA: Hair = { b: "#f6ead0", s: "#d6c49c", h: "#fffbf0", l: "#8e7c52" };

/** 엘리오스 머리. white: 흰 가닥 수(0~), full: 전부 흰머리. */
function hairElios(o: { streaks: number; full?: boolean; horns?: boolean }): { back: string; front: string } {
  const H = o.full ? HAIR_WHITE : HAIR_ELIOS;
  const back =
    cel("M-70 -30C-78 10 -76 60 -66 96C-60 110 -50 118 -40 120L-30 92L60 92L64 124C74 116 80 100 80 80C84 40 80 0 70 -40Z", H.s, H.l) +
    // 목뒤로 느슨하게 묶은 꽁지
    cel("M52 96C64 110 72 132 70 160C66 176 58 186 50 190C56 172 56 150 48 128C46 116 46 106 52 96Z", H.s, H.l, 2.2);
  let front = cel("M-66 -16C-74 -70 -40 -112 4 -112C48 -112 74 -76 66 -18C58 -44 40 -62 4 -64C-30 -64 -56 -46 -66 -16Z", H.b, H.l);
  // 먼쪽 옆머리(뺨 따라)
  front += cel("M-62 -40C-72 0 -70 40 -60 78C-56 66 -54 50 -54 36C-50 50 -46 60 -40 66C-46 40 -50 10 -48 -20Z", H.b, H.l, 2.2);
  // 가까운 쪽 옆머리(귀 앞)
  front += cel("M50 -40C60 -10 64 20 60 58C58 46 54 36 50 30C50 44 48 54 44 62C46 30 44 0 40 -30Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-50, -64, 18, 14, -6],
    [-34, -46, 8, 16, -4],
    [-16, -24, 26, 15, -2],
    [2, -6, 10, 15, 0],
    [18, 14, 34, 13, 2],
    [34, 34, 12, 14, 3],
    [50, 56, 6, 13, 4],
  ];
  front += locks(L, -86, H, 2.2, 1);
  // 흰 가닥(가까운 쪽 앞머리)
  if (!o.full && o.streaks > 0) {
    const W = HAIR_WHITE;
    const ws: Lock[] = ([
      [30, 28, 20, 5, 2],
      [40, 44, 10, 4, 3],
      [22, 18, 30, 4, 1],
      [48, 54, 2, 4, 4],
      [10, 6, 22, 4, 0],
      [-4, -12, 16, 4, -2],
    ] as Lock[]).slice(0, o.streaks);
    front += locks(ws, -84, W, 1.6, 1);
  }
  front += shine(0, -80, 52, 9, 12, H.h, o.full ? 0.9 : 0.75, -4);
  front += strands(["M-8 -60C-14 -30 -20 -10 -22 10", "M26 -58C30 -30 30 -10 26 8"], H, 1.4);
  if (o.horns !== false) {
    const hc = "#1a1520";
    const hl = "#6a5a78";
    front += cel("M-40 -92C-46 -110 -58 -122 -70 -126C-60 -114 -58 -100 -56 -86Z", hc, "#050408", 2) + ln("M-46 -100C-52 -110 -58 -116 -64 -120", hl, 1.6, 0.8);
    front += cel("M30 -100C34 -118 44 -130 56 -136C50 -122 50 -108 48 -94Z", hc, "#050408", 2) + ln("M36 -108C40 -118 46 -124 52 -128", hl, 1.6, 0.8);
  }
  return { back, front };
}

/** 엘리오스의 뾰족한 귀(가까운 쪽) */
function elfEar(sk: Skin): string {
  return cel("M52 -2C64 -12 82 -28 94 -36C88 -16 80 8 68 26C62 34 56 36 50 32Z", sk.b, sk.l, 2.4) + fl("M58 6C66 -4 76 -14 84 -22C80 -8 74 6 66 18C62 22 58 18 58 6Z", sk.s);
}

function hairSeoha(): { back: string; front: string } {
  const H = HAIR_SEOHA;
  const back =
    cel("M-72 -30C-82 20 -80 80 -70 124C-54 134 -30 130 -16 124L50 124C66 132 82 128 88 116C90 70 86 10 72 -40Z", H.s, H.l) +
    // 낮게 대충 묶은 꽁지
    cel("M50 108C62 120 70 140 66 166C64 176 58 184 52 186C54 170 52 150 44 132Z", H.s, H.l, 2.2);
  let front = cel("M-68 -14C-76 -70 -42 -110 2 -110C46 -110 74 -76 68 -16C60 -42 40 -60 2 -62C-32 -62 -58 -44 -68 -14Z", H.b, H.l);
  // 먼쪽 옆머리 (턱 아래까지, 끝이 안으로)
  front += cel("M-64 -40C-78 10 -78 70 -64 118C-58 108 -56 96 -56 84C-50 96 -42 106 -34 110C-44 80 -50 40 -50 0C-50 -14 -50 -26 -48 -36Z", H.b, H.l, 2.2);
  // 가까운 쪽 옆머리 (귀를 덮음)
  front += cel("M44 -44C62 -10 70 40 66 106C60 96 56 84 54 72C50 88 44 98 36 104C44 70 44 30 36 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-50, -60, 2, 14, -6],
    [-32, -40, 10, 16, -4],
    [-14, -20, 4, 14, -2],
    [4, 0, 12, 15, 0],
    [22, 20, 6, 14, 2],
    [40, 42, 0, 14, 4],
  ];
  front += locks(L, -84, H, 2.2, 1);
  front += shine(-2, -80, 54, 9, 12, H.h, 0.8, -3);
  // 잔머리
  front += strands(["M-52 30C-60 50 -58 70 -64 86", "M58 40C62 60 60 80 66 96", "M-4 -64C-12 -52 -18 -44 -26 -40", "M44 -20C54 -4 56 12 54 24"], H, 1.3);
  return { back, front };
}

function hairRazel(): { back: string; front: string } {
  const H = HAIR_RAZEL;
  const back =
    cel("M-66 -30C-74 10 -70 50 -60 70L60 70C72 40 74 0 66 -40Z", H.s, H.l) +
    cel("M50 40C70 50 86 70 90 96C92 110 88 122 82 128C80 110 72 96 60 88C62 100 60 110 56 116C52 96 46 70 40 50Z", H.s, H.l, 2.2);
  let front = cel("M-64 -10C-74 -70 -40 -114 4 -114C50 -114 76 -76 66 -16C56 -50 36 -74 4 -76C-30 -76 -54 -54 -64 -10Z", H.b, H.l);
  // 뒤로 넘긴 결
  front += strands(["M-40 -90C-20 -104 20 -106 50 -86", "M-50 -70C-24 -92 24 -96 60 -62", "M-60 -40C-40 -70 10 -80 64 -40"], { ...H, l: H.s }, 2);
  // 흘러내린 잔머리(흐트러진)
  const L: Lock[] = [
    [-30, -44, -20, 7, -6],
    [-12, -20, -8, 6, -3],
    [34, 40, -12, 6, 3],
  ];
  front += locks(L, -74, H, 2, 1);
  front += cel("M-60 -30C-70 0 -68 20 -62 40C-58 26 -56 14 -54 -6Z", H.b, H.l, 2);
  front += cel("M54 -34C62 -10 64 10 60 30C56 18 52 6 48 -14Z", H.b, H.l, 2);
  front += shine(-4, -92, 46, 8, 10, H.h, 0.8, -4);
  return { back, front };
}

/** 시안: 턱선 길이 은발, 왼쪽(가까운 쪽) 가는 땋은 머리 + 푸른 구슬 */
function hairSian(o: { child?: boolean } = {}): { back: string; front: string } {
  const H = HAIR_SIAN;
  const back = cel("M-70 -30C-80 20 -78 70 -68 104C-50 112 -30 110 -20 106L50 106C66 112 80 106 84 96C88 60 84 10 72 -40Z", H.s, H.l);
  let front = cel("M-68 -14C-76 -72 -40 -112 4 -112C48 -112 74 -76 68 -16C60 -44 40 -62 4 -64C-30 -64 -58 -46 -68 -14Z", H.b, H.l);
  front += cel("M-62 -40C-76 10 -76 60 -66 104C-60 92 -58 80 -56 70C-52 84 -46 94 -38 98C-46 70 -50 30 -48 -10Z", H.b, H.l, 2.2);
  front += cel("M46 -44C62 -10 68 40 64 96C58 86 56 76 54 66C50 80 46 88 40 92C46 60 44 20 38 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-50, -62, 8, 14, -8],
    [-32, -42, 16, 16, -6],
    [-12, -22, 10, 15, -3],
    [8, 2, 20, 15, -1],
    [26, 24, 8, 14, 1],
    [44, 48, 2, 13, 3],
  ];
  front += locks(L, -84, H, 2.2, 1);
  front += shine(-2, -80, 54, 9, 12, H.h, 0.95, -3);
  if (!o.child) {
    // 가는 땋은 머리
    let br = "";
    for (let i = 0; i < 7; i++) {
      const y = 20 + i * 15;
      const x = 62 + Math.sin(i * 0.5) * 2;
      br += cel(`M${x - 6} ${y}C${x - 7} ${y + 8} ${x - 2} ${y + 14} ${x + 1} ${y + 16}C${x + 6} ${y + 10} ${x + 6} ${y + 4} ${x + 2} ${y - 2}Z`, i % 2 ? H.b : H.s, H.l, 1.4);
    }
    front += br + `<circle cx="63" cy="136" r="7" fill="#3a78d8" stroke="#1a3a78" stroke-width="1.8"/><circle cx="61" cy="133" r="2.4" fill="#cfe6ff"/>`;
    front += ln("M63 143V156M60 144L58 156M66 144L68 156", H.l, 1.4);
  }
  return { back, front };
}

/** 재의 왕 맨얼굴: 새하얀 긴 머리, 흐트러짐 */
function hairAged(): { back: string; front: string } {
  const H = HAIR_WHITE;
  const back = cel("M-74 -30C-90 40 -96 120 -90 220C-80 236 -60 240 -44 232L-30 120L60 120L70 240C88 246 104 236 108 220C108 130 96 30 74 -40Z", H.s, H.l);
  let front = cel("M-66 -16C-74 -70 -40 -112 4 -112C48 -112 74 -76 66 -18C58 -44 40 -62 4 -64C-30 -64 -56 -46 -66 -16Z", H.b, H.l);
  front += cel("M-62 -40C-80 20 -84 100 -78 180C-70 160 -66 140 -64 120C-58 140 -50 154 -42 160C-52 110 -52 50 -48 -10Z", H.b, H.l, 2.2);
  front += cel("M48 -44C66 0 74 80 72 170C66 150 62 134 60 118C54 136 48 146 40 152C50 100 48 30 40 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-50, -66, 22, 14, -8],
    [-32, -44, 30, 16, -5],
    [-14, -22, 18, 15, -2],
    [4, 0, 36, 14, 0],
    [22, 18, 22, 14, 2],
    [40, 44, 28, 13, 5],
    [52, 60, 12, 10, 5],
  ];
  front += locks(L, -86, H, 2.2, 1);
  front += shine(0, -80, 52, 8, 12, "#ffffff", 0.9, -4);
  front += strands(["M-70 40C-80 80 -86 120 -96 150", "M70 50C78 90 84 120 92 150", "M-20 -60C-30 -20 -40 20 -50 50"], H, 1.4);
  // 부서지는 뿔
  const hc = "#2a262e";
  front += cel("M-40 -92C-46 -110 -56 -120 -66 -124L-62 -116L-68 -114C-60 -104 -58 -96 -56 -86Z", hc, "#08070a", 2);
  front += cel("M30 -100C34 -118 42 -128 52 -134L50 -126L56 -122C50 -112 50 -104 48 -94Z", hc, "#08070a", 2);
  return { back, front };
}

function hairLiana(): { back: string; front: string } {
  const H = HAIR_LIANA;
  const back = cel("M-74 -30C-92 40 -96 140 -86 250C-66 262 -40 262 -26 250L60 250C82 262 104 256 110 240C114 140 100 30 76 -40Z", H.s, H.l);
  let front = cel("M-70 -14C-78 -72 -42 -112 4 -112C50 -112 76 -76 70 -16C62 -44 40 -62 4 -64C-30 -64 -60 -46 -70 -14Z", H.b, H.l);
  front += cel("M-64 -40C-82 20 -86 100 -80 190C-72 170 -68 150 -66 130C-60 150 -52 164 -44 170C-54 120 -54 60 -50 0Z", H.b, H.l, 2.2);
  front += cel("M48 -44C68 0 78 90 76 190C70 170 66 154 64 138C58 156 52 166 44 172C54 120 50 40 40 -20Z", H.b, H.l, 2.2);
  const L: Lock[] = [
    [-50, -58, -2, 14, -5],
    [-32, -38, 6, 15, -3],
    [-12, -16, 0, 14, -1],
    [8, 6, 8, 14, 1],
    [26, 28, 2, 14, 3],
    [44, 50, -2, 12, 4],
  ];
  front += locks(L, -84, H, 2.1, 1);
  front += shine(-2, -80, 54, 9, 12, H.h, 0.95, -3);
  // 작은 푸른 리본
  front += cel("M52 -70l18 -14l4 20zM52 -70l22 6l-10 16z", "#6aa0e8", "#2a4a88", 1.8) + `<circle cx="54" cy="-70" r="5" fill="#8ab8f0" stroke="#2a4a88" stroke-width="1.6"/>`;
  return { back, front };
}

/** 머리 전체 조립: 뒷머리 → (귀) → 얼굴 → 앞머리 → 눈썹 앞으로 */
function head(c: Ctx, f: FaceO, hair: { back: string; front: string }, ear = "", over = ""): string {
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
function cgSheet(): string {
  const c = new Ctx("cg-sheet");
  let b = `<rect width="1600" height="900" fill="#cfd8e8"/>`;
  const sk = SKIN_WARM;
  const f = (o: Partial<FaceO>): FaceO => ({ sex: "f", skin: sk, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", ...o });
  b += place(170, 250, 1.1, 0, false, head(c, f({ bags: true }), hairSeoha()));
  b += place(440, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", brow: "soft", mouth: "soft" }), hairElios({ streaks: 4 }), elfEar(sk)));
  b += place(710, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.amber, far: IRIS.amber, lash: "#2a1608", mouth: "laugh", eyes: "happy", browC: "#5a3418" }), hairRazel()));
  b += place(980, 250, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.gold, far: IRIS.steel, lash: "#2a3450", mouth: "smile", nearEyeExtra: dialIris() }), hairSian()));
  b += place(1250, 250, 1.1, 0, false, head(c, f({ sex: "m", thin: true, near: IRIS.ashRed, far: IRIS.ash, lash: "#2a2628", eyes: "soft", brow: "sad" }), hairAged(), elfEar(sk)));
  b += place(170, 660, 1.1, 0, true, head(c, f({ eyes: "closed", mouth: "soft", tears: 2 }), hairSeoha()));
  b += place(440, 660, 1.1, 0, true, head(c, f({ sex: "c", near: IRIS.sky, far: IRIS.sky, lash: "#4a3a20", mouth: "open" }), hairLiana()));
  b += place(710, 660, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.steel, far: IRIS.steel, lash: "#2a3450", tears: 2, brow: "sad", mouth: "grit", noNearEye: true }), hairSian(), "", eyepatch()));
  b += place(980, 660, 1.1, 0, false, head(c, f({ mouth: "laugh", eyes: "happy" }), hairSeoha()));
  b += place(1250, 660, 1.1, 0, false, head(c, f({ sex: "m", near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", eyes: "down", brow: "sad" }), hairElios({ streaks: 0, full: true }), elfEar(sk)));
  return svg(c, b);
}

export const CGS_B: Record<string, string> = {
  cg_sheet: cgSheet(),
};
