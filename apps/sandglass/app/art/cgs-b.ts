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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${c.defs}</defs>${css(c.p, extraCss)}<g stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
}

function place(x: number, y: number, s: number, rot: number, flip: boolean, inner: string): string {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
}

/** 작은 점 여러 개를 한 path로(모래·먼지·별). */
function dots(pts: Pt[], w: number, color: string, op: number): string {
  const q = pts.filter(([x, y]) => x > -10 && x < 1610 && y > -10 && y < 910);
  if (!q.length) return "";
  return `<path d="${q.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h0`).join("")}" stroke="${color}" stroke-width="${w}" opacity="${op}"/>`;
}

/** 4점 반짝임 */
function spark(x: number, y: number, s: number): string {
  const k = s * 0.14;
  return `M${n1(x)} ${n1(y - s)}Q${n1(x + k)} ${n1(y - k)} ${n1(x + s)} ${n1(y)}Q${n1(x + k)} ${n1(y + k)} ${n1(x)} ${n1(y + s)}Q${n1(x - k)} ${n1(y + k)} ${n1(x - s)} ${n1(y)}Q${n1(x - k)} ${n1(y - k)} ${n1(x)} ${n1(y - s)}Z`;
}

/** 셀 도형: 채움 + 색 외곽선 */
function cel(d: string, fill: string, line: string, w = 2.6, extra = ""): string {
  return `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}"${extra}/>`;
}
function ln(d: string, color: string, w = 2, op = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"${op < 1 ? ` opacity="${op}"` : ""}/>`;
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
  noNeck?: boolean;
  look?: Pt; // 시선(홍채 이동, 가까운 눈 기준 단위 좌표)
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
function eyeUnit(c: Ctx, ir: Iris, lash: string, skin: Skin, mode: EyeMode, male: boolean, wet: boolean, look: Pt = [0, 0]): string {
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
  s += `<g transform="translate(${look[0]} ${look[1]})">`;
  s += `<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${irisG}" stroke="${ir.d}" stroke-width="1.4"/>`;
  s += `<ellipse cx="0.5" cy="${cy + 3}" rx="${male ? 4.6 : 5.4}" ry="${male ? 6.6 : 7.6}" fill="${ir.d}"/>`;
  s += fl(`M-8 ${cy + 10}Q0 ${cy + 17} 8 ${cy + 10}Q0 ${cy + 13} -8 ${cy + 10}Z`, ir.l, 0.9);
  if (!(mode === "down")) {
    s += `<ellipse cx="-4.6" cy="${cy - 5 + lid * 0.6}" rx="4.2" ry="5.2" fill="#fff"/>`;
  }
  s += `<circle cx="6" cy="${cy + 9}" r="${wet ? 2.8 : 2}" fill="#fff"/>`;
  if (wet) s += ln(`M-12 ${cy + 13}Q0 ${cy + 21} 13 ${cy + 11}`, "#ffffff", 2, 0.9);
  s += `</g>`;
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

/** 목(얼굴 로컬 좌표). 옷깃이 아랫부분을 덮는다. */
function neck(sex: "f" | "m" | "c", sk: Skin): string {
  const male = sex === "m";
  return (
    cel(male ? "M-22 80L-26 170H40L36 60Z" : "M-16 80L-18 160H30L28 64Z", sk.b, sk.l, 2.4) +
    fl(male ? "M-24 96C0 116 20 100 36 76L38 124C14 136 -8 130 -25 122Z" : "M-17 94C0 110 16 96 28 78L29 116C10 124 -6 120 -17 112Z", sk.s)
  );
}

/** 얼굴(피부·눈·코·입·볼). 머리카락은 따로. */
function face(c: Ctx, o: FaceO): string {
  const male = o.sex === "m";
  const d = o.thin ? FACE_THIN : male ? FACE_M : o.sex === "c" ? FACE_C : FACE_F;
  const sk = o.skin;
  const eyes = o.eyes ?? "open";
  const cp = c.clip(d);
  let s = "";
  if (!o.noNeck) s += neck(o.sex, sk);
  // 얼굴 면 + 음영 + 림 라이트(얼굴 모양으로 잘라서)
  let inner = `<path d="${d}" fill="${sk.b}"/>`;
  const sh = o.shade ?? 1;
  if (sh === 1) inner += fl("M60 -40L60 110L-4 110C20 88 38 62 44 36C48 14 48 -12 40 -40Z", sk.s);
  else inner += fl("M-70 -40L-70 110L-18 110C-30 90 -40 64 -44 38C-48 20 -50 0 -48 -40Z", sk.s);
  // 앞머리가 이마에 드리운 그림자(톱니)
  let zz = "M-70 -60H70V-6";
  for (let i = 0; i <= 14; i++) zz += `L${70 - i * 10} ${i % 2 ? 8 : -4}`;
  inner += fl(zz + "Z", sk.s, 0.75);
  if (o.thin) inner += fl("M30 40C26 58 18 72 8 82C18 66 24 52 26 36Z", sk.s) + fl("M-44 40C-40 56 -34 66 -28 74C-38 68 -46 56 -48 44Z", sk.s);
  if (o.rim && sk.rim) inner += `<path d="${d}" fill="none" stroke="${sk.rim}" stroke-width="7" transform="translate(${o.rim[0]} ${o.rim[1]})" opacity=".95"/>`;
  s += `<g clip-path="${cp}">${inner}</g>`;
  s += `<path d="${d}" fill="none" stroke="${sk.l}" stroke-width="2.6"/>`;
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
  if (!o.noNearEye) s += `<g transform="translate(18 ${ey}) scale(${sx} ${sy})">${eyeUnit(c, o.near, o.lash, sk, eyes, male, wet, o.look)}</g>`;
  if (o.nearEyeExtra) s += `<g transform="translate(18 ${ey}) scale(${sx} ${sy})">${o.nearEyeExtra}</g>`;
  s += `<g transform="translate(-34 ${ey}) scale(${-0.66 * sx} ${sy})">${eyeUnit(c, o.far, o.lash, sk, eyes, male, wet, o.look ? [-o.look[0], o.look[1]] : undefined)}</g>`;
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
    s += `<path d="${tr}" fill="#dff0ff" stroke="#8ab0dc" stroke-width="1" opacity=".5"/>` + ln(`M13 ${ey + 26}C12 ${ey + 38} 14 ${ey + 50} 12 ${ey + 60}`, "#ffffff", 1.2, 0.9);
    s += `<path d="M-38 ${ey + 20}C-40 ${ey + 32} -38 ${ey + 42} -40 ${ey + 50}C-40 ${ey + 54} -37 ${ey + 54} -37 ${ey + 50}C-35 ${ey + 42} -37 ${ey + 32} -36 ${ey + 20}Z" fill="#dff0ff" stroke="#8ab0dc" stroke-width="0.8" opacity=".7"/>`;
  }
  if (te >= 1) s += `<path d="M30 ${ey + 14}c-3 5 -3 9 0 9s3 -4 0 -9z" fill="#f4faff" stroke="#8ab0dc" stroke-width="1"/>`;
  if (o.extra) s += o.extra;
  return s;
}

/** 머리 한 가닥 묶음: [뿌리x, 끝x, 끝y, 폭, 휨] 목록 → 셀 가닥들(뿌리 쪽은 선 없음). */
type Lock = [number, number, number, number, number?];
function locks(ls: Lock[], rootY0: number, h: Hair, w = 2.2, shadeSide = 1): string {
  let s = "";
  let sh = "";
  for (const [rx, tx, ty, wd, bend = 0] of ls) {
    const rootY = rootY0 + Math.round(Math.max(0, Math.abs(rx) + wd - 54) * 1.6);
    const my = (rootY + ty) / 2;
    const q = ty - rootY;
    const d = `M${n1(rx - wd)} ${rootY}C${n1(rx - wd + bend)} ${n1(my)} ${n1(tx + bend * 0.4 - wd * 0.2)} ${n1(ty - q * 0.25)} ${n1(tx)} ${n1(ty)}C${n1(tx + wd * 0.5 + bend * 0.4)} ${n1(ty - q * 0.3)} ${n1(rx + wd + bend)} ${n1(my)} ${n1(rx + wd)} ${rootY}`;
    s += `<path d="${d}" fill="${h.b}" stroke="${h.l}" stroke-width="${w}"/>`;
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

/** 정수리의 광택(천사의 고리): 호를 따라 아래로 뾰족한 조각들, 군데군데 끊김. */
function shine(cx: number, cy: number, rx: number, th: number, n: number, color: string, op = 0.9, tilt = 0): string {
  let d = "";
  const m = n * 2;
  for (let i = 0; i < m; i++) {
    if (i % 5 === 4) continue;
    const t0 = -1 + (2 * i) / m;
    const t1 = -1 + (2 * (i + 1)) / m;
    const y = (t: number): number => cy + t * t * rx * 0.3 + t * tilt;
    const tm = (t0 + t1) / 2;
    const L = th * (1.1 + ((i * 7) % 5) * 0.25) * (1 - tm * tm * 0.5);
    d += `M${n1(cx + t0 * rx)} ${n1(y(t0))}Q${n1(cx + tm * rx)} ${n1(y(tm) - 3)} ${n1(cx + t1 * rx)} ${n1(y(t1))}L${n1(cx + tm * rx + 1)} ${n1(y(tm) + L)}Z`;
  }
  return fl(d, color, op);
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
    cel("M-44 -90L-70 -30C-80 10 -78 60 -68 96C-62 110 -52 118 -40 120L-30 92L60 92L64 124C76 116 82 100 82 80C86 40 82 0 70 -40L44 -90Z", H.s, H.l) +
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
    `<path d="${pts.map(([x, y]) => `M${n1(x)} ${n1(y)}h0`).join("")}" stroke="#8a5a44" stroke-width="1.8" opacity=".45"/>` +
    ln("M-40 36L28 44", "#c8806e", 4) + ln("M-40 36L28 44", "#f4c8b4", 1.6) + ln("M-22 32L-26 42M-4 36L-8 46M12 38L8 48", "#c8806e", 1.4)
  );
}

function hairSeoha(): HairSet {
  const H = HAIR_SEOHA;
  const back =
    cel("M-44 -90L-72 -30C-84 20 -82 80 -72 124C-56 134 -32 130 -18 124L50 124C66 132 82 128 88 116C92 70 88 10 72 -40L44 -90Z", H.s, H.l) +
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
    cel("M-44 -90L-66 -30C-74 10 -70 50 -60 70L60 70C72 40 74 0 66 -40L44 -90Z", H.s, H.l) +
    cel("M50 40C70 50 86 70 90 96C92 110 88 122 82 128C80 110 72 96 60 88C62 100 60 110 56 116C52 96 46 70 40 50Z", H.s, H.l, 2.2);
  let front = cel("M-61 -30C-71 0 -69 20 -63 40C-59 26 -57 14 -55 -6Z", H.b, H.l, 2);
  front += cel("M55 -34C63 -10 65 10 61 30C57 18 53 6 49 -14Z", H.b, H.l, 2);
  // 뒤로 넘긴 덮개: 이마를 드러낸다
  front += fl("M-66 -8C-76 -72 -40 -114 4 -114C50 -114 78 -76 68 -12C60 -40 44 -62 20 -70Q-10 -76 -34 -62C-50 -50 -60 -32 -66 -8Z", H.b);
  front += ln("M-66 -8C-76 -72 -40 -114 4 -114C50 -114 78 -76 68 -12", H.l, 2.6);
  front += ln("M-66 -8C-60 -32 -50 -50 -34 -62Q-10 -76 20 -70C44 -62 60 -40 68 -12", H.l, 1.8, 0.8);
  front += strands(["M-40 -92C-20 -104 20 -106 50 -86", "M-52 -72C-26 -92 24 -96 60 -62", "M-60 -46C-42 -70 10 -82 64 -44"], { ...H, l: H.s }, 2.2);
  const L: Lock[] = [
    [-40, -56, -4, 9, -8],
    [-24, -36, 6, 8, -5],
    [-6, -12, -10, 7, -2],
    [30, 40, -6, 8, 4],
    [46, 58, 4, 8, 6],
  ];
  front += locks(L, -68, H, 2, 1);
  front += shine(-4, -98, 46, 8, 10, H.h, 0.85, -4);
  return { back, front };
}

/** 시안: 턱선 길이 은발, 왼쪽(가까운 쪽) 가는 땋은 머리 + 푸른 구슬 */
function hairSian(o: { child?: boolean } = {}): HairSet {
  const H = HAIR_SIAN;
  const back = cel("M-44 -90L-70 -30C-82 20 -80 70 -70 104C-52 112 -32 110 -20 106L50 106C66 112 80 106 86 96C90 60 86 10 72 -40L44 -90Z", H.s, H.l);
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
  const back = cel("M-44 -90L-74 -30C-90 40 -96 120 -90 220C-80 236 -60 240 -44 232L-30 120L60 120L70 240C88 246 104 236 108 220C108 130 96 30 74 -40L44 -90Z", H.s, H.l);
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
  const back = cel("M-44 -90L-74 -30C-92 40 -96 140 -86 250C-66 262 -40 262 -26 250L60 250C82 262 104 256 110 240C114 140 100 30 76 -40L44 -90Z", H.s, H.l);
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

/** 반짝임 기호(defs에 한 번) → <use> */
function sparkDef(c: Ctx): string {
  const id = `${c.p}-sp`;
  if (!c.defs.includes(`id="${id}"`)) c.defs += `<path id="${id}" d="${spark(0, 0, 10)}"/>`;
  return id;
}
function sparkAt(c: Ctx, x: number, y: number, s: number, fill: string, anim = ""): string {
  const id = sparkDef(c);
  return `<g transform="translate(${Math.round(x)} ${Math.round(y)}) scale(${n1(s / 10)})"><use href="#${id}" fill="${fill}"${anim ? " " + anim : ""}/></g>`;
}

/** 금빛 모래알 흐름(정적) + 반짝임(일부 움직임) */
function sandStream(c: Ctx, r: () => number, pts: () => Pt, n: number, anim: number, kind = "up", color = "#ffe08a"): string {
  const L: Pt[][] = [[], [], []];
  for (let i = 0; i < n; i++) L[i % 3 === 0 ? 1 : i % 7 === 0 ? 2 : 0].push(pts());
  let s = dots(L[0], 2.2, color, 0.75) + dots(L[1], 3.4, "#fff3c4", 0.9) + dots(L[2], 5, "#ffffff", 0.95);
  for (let i = 0; i < anim; i++) {
    const [x, y] = pts();
    s += sparkAt(c, x, y, 4 + r() * 6, "#fff6d0", A(c.p, i % 2 ? kind : "tw", r() * 6, 5 + r() * 4));
  }
  return s;
}


/** 팔·다리: 두 점 사이의 굵기가 변하는 원통(셀) */
function limb(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, fill: string, line: string, shade?: string, bend = 0): string {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend;
  const P = (x: number, y: number, k: number): string => `${n1(x + nx * k)} ${n1(y + ny * k)}`;
  const wm = (w0 + w1) / 2;
  const d = `M${P(x0, y0, w0 / 2)}Q${P(mx, my, wm / 2)} ${P(x1, y1, w1 / 2)}L${P(x1, y1, -w1 / 2)}Q${P(mx, my, -wm / 2)} ${P(x0, y0, -w0 / 2)}Z`;
  let s = cel(d, fill, line, 2.6);
  if (shade) s += fl(`M${P(x0, y0, -w0 / 2)}Q${P(mx, my, -wm / 2)} ${P(x1, y1, -w1 / 2)}L${P(x1, y1, -w1 * 0.15)}Q${P(mx, my, -wm * 0.15)} ${P(x0, y0, -w0 * 0.15)}Z`, shade);
  return s;
}

/** 손등(벙어리장갑 모양 + 엄지). 손목 0,0 → 손끝 -x 방향 */
function mitt(fill: string, shade: string, line: string, thumbUp = true): string {
  const t = thumbUp ? 1 : -1;
  return (
    cel(`M4 ${-16 * t}C-6 ${-28 * t} -22 ${-34 * t} -34 ${-30 * t}C-40 ${-26 * t} -36 ${-20 * t} -24 ${-14 * t}Z`, fill, line, 2.2) +
    cel("M6 -16C-16 -22 -42 -22 -58 -12C-66 -4 -66 6 -58 14C-42 22 -16 20 6 16Z", fill, line, 2.4) +
    fl("M6 4C-16 12 -40 14 -58 10C-60 14 -58 16 -54 17C-40 22 -16 20 6 16Z", shade) +
    ln("M-40 -8L-58 -6M-40 2L-60 3M-40 10L-56 11", line, 1.4, 0.7)
  );
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

/** 남자 상반신 윤곽(로컬: 왼쪽을 봄). 어깨 ±150, 목 밑 y≈120. */
function maleTorsoD(bot: number): string {
  return `M-30 116C-64 134 -104 144 -128 170C-152 198 -162 248 -168 318L-180 ${bot}H196L186 318C182 248 176 194 156 170C126 140 84 130 44 114Z`;
}
/** 여자 상반신 윤곽 */
function femTorsoD(bot: number): string {
  return `M-22 118C-50 132 -80 140 -98 160C-114 182 -120 228 -122 298L-130 ${bot}H150L144 298C140 228 134 182 120 162C100 140 70 130 32 116Z`;
}

/** 엘리오스 코트 상반신(로컬: 왼쪽을 봄). 높은 깃, 놋쇠 단추 두 줄, 흰 셔츠 깃, 회중시계 줄. */
function eliosTorso(rimC: string | null, bot = 800): string {
  const C = COAT;
  let s = cel(maleTorsoD(bot), C.b, C.l, 2.8);
  s += fl(`M110 150C140 164 164 180 176 210C184 250 186 290 188 330L196 ${bot}H110C120 ${bot - 200} 126 400 120 250Z`, C.s);
  s += fl(`M-70 150C-50 240 -44 360 -50 ${bot}H-120C-104 360 -100 240 -70 150Z`, C.s, 0.55);
  s += ln(`M-4 160C2 300 -2 420 0 ${bot}`, C.l, 2.4);
  let bt = "";
  for (let i = 0; i < 5; i++) {
    const y = 200 + i * 66;
    bt += `<circle cx="-36" cy="${y}" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="2"/><circle cx="-38" cy="${y - 2}" r="2.4" fill="#fff0c0"/>`;
    bt += `<circle cx="34" cy="${y + 4}" r="7" fill="#c89838" stroke="#6a4814" stroke-width="2"/>`;
  }
  s += bt;
  s += ln("M-36 266C-16 296 14 302 34 286", "#f0c860", 3.2) + `<circle cx="34" cy="286" r="5" fill="#f0c860" stroke="#8a6418" stroke-width="1.5"/>`;
  // 높은 깃(턱 밑에서 목을 감싼다)
  s += cel("M-30 110L-40 158C-6 172 34 170 62 152L54 92C24 106 -4 114 -30 110Z", C.b, C.l, 2.6);
  s += fl("M26 104L54 92L62 152C48 162 36 166 24 168Z", C.s);
  s += cel("M-28 110C-2 116 26 108 52 94L54 102C28 118 -2 124 -30 118Z", "#f6f4f0", "#8a8aa0", 1.6);
  s += ln("M-60 132C-80 140 -100 150 -114 164", C.l, 1.6, 0.6);
  if (rimC) s += ln(`M-30 116C-64 134 -104 144 -128 170C-152 198 -162 248 -168 318L-180 ${bot}`, rimC, 5, 0.9);
  return s;
}

/** 서하 상반신(로컬: 왼쪽을 봄): 생성색 원피스 + 짙은 녹색 망토(후드 뒤로). */
function seohaTorsoFantasy(rimC: string | null, bot = 800): string {
  let s = cel(femTorsoD(bot), CLOAK_G.b, CLOAK_G.l, 2.6);
  s += fl(`M96 146C120 160 136 190 142 240L150 ${bot}H90C100 ${bot - 200} 108 360 96 146Z`, CLOAK_G.s);
  // 원피스 앞판(망토 사이)
  s += cel(`M-40 150C-54 220 -58 300 -60 ${bot}H70C66 300 60 220 52 146C28 158 -14 160 -40 150Z`, DRESS.b, DRESS.l, 2.2);
  s += fl(`M26 156C40 230 46 320 50 ${bot}H70C66 300 60 220 52 146Z`, DRESS.s);
  s += cel("M-38 146C-18 172 28 172 52 142C38 158 -16 160 -38 146Z", "#fffaf0", DRESS.l, 1.6);
  s += ln("M-2 166C-4 186 -8 206 -12 224M14 166C18 186 22 202 28 218", "#8a6a3a", 2);
  // 망토 깃 + 걸쇠
  s += cel("M-44 132C-66 148 -76 170 -78 198C-60 186 -48 168 -40 150Z", CLOAK_G.b, CLOAK_G.l, 2) + cel("M54 128C78 142 90 166 94 196C74 184 62 166 52 146Z", CLOAK_G.b, CLOAK_G.l, 2);
  s += `<circle cx="-40" cy="152" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="1.8"/><circle cx="54" cy="148" r="7" fill="#d8a848" stroke="#6a4814" stroke-width="1.8"/>`;
  // 뒤로 넘긴 후드
  s += cel("M40 112C70 116 100 130 116 152C92 146 70 140 50 138Z", CLOAK_G.s, CLOAK_G.l, 2);
  if (rimC) s += ln(`M-22 118C-50 132 -80 140 -98 160C-114 182 -120 228 -122 298L-130 ${bot}`, rimC, 5, 0.9);
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
// cg_e_good — 금빛 새벽, 여명탑 꼭대기. 흰 가닥이 섞인 엘리오스가 서하를 뒤에서 안고,
// 둘 사이로 재가 금빛 모래가 되어 해 쪽으로 날아간다.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_e_good cgEGood
function cgEGood(): string {
  const c = new Ctx("cg-e-good");
  const r = rng(1001);
  const SUNX = 300, SUNY = 600;
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [
    [0, "#27336e"],
    [0.2, "#5e5696"],
    [0.4, "#d88a86"],
    [0.55, "#f8b45a"],
    [0.66, "#ffe09a"],
    [0.8, "#fff4d4"],
  ])}"/>`;
  const st: Pt[] = [];
  for (let i = 0; i < 60; i++) st.push([600 + r() * 1000, Math.pow(r(), 1.8) * 220]);
  b += dots(st, 2, "#fff6e0", 0.7);
  b += `<circle cx="${SUNX}" cy="${SUNY}" r="1000" fill="${c.glow("#fff0c0", 0.95, 0.42)}"/>`;
  b += rays(SUNX, SUNY, 20, 1700, -Math.PI * 0.95, -Math.PI * 0.02, 0.018, "#fff6d8", 0.15, r);
  b += cloudBank(r, -40, 1640, 470, 90, "#e0909a", "#fff0c0", 0.5, 150);
  b += cloudBank(r, -40, 1640, 560, 70, "#f2b28e", "#fff6d8", 0.6, 120);
  b += `<circle cx="${SUNX}" cy="${SUNY}" r="170" fill="${c.glow("#ffffff", 1, 0.8)}"/><circle cx="${SUNX}" cy="${SUNY}" r="64" fill="#fffdf2"/>`;
  // 아래 솔레인(금빛 안개 속 지붕)
  let city = "M0 900V700";
  for (let x = 0; x <= 1600; x += 24 + Math.floor(r() * 30)) {
    const h = 30 + r() * 50 * (0.5 + Math.abs(x - 300) / 1200);
    city += `L${x} ${Math.round(700 - h)}L${x + 12} ${Math.round(690 - h - r() * 16)}`;
  }
  b += fl(city + "L1600 700V900Z", "#e49a70", 0.5) + fl("M0 740Q800 700 1600 740V900H0Z", "#f6c898", 0.6);
  // 오른쪽: 여명탑의 금빛 문자판(해·달 기호)
  let dial = `<circle cx="1480" cy="330" r="330" fill="#fbe8b8" opacity=".22"/><circle cx="1480" cy="330" r="330" fill="none" stroke="#f5c060" stroke-width="18"/><circle cx="1480" cy="330" r="298" fill="none" stroke="#fff0c0" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 1480 + Math.cos(a) * 262;
    const y = 330 + Math.sin(a) * 262;
    dial += i % 2 ? `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="12" fill="#f5c060"/>` : `<path d="M${Math.round(x - 14)} ${Math.round(y)}a14 14 0 1 0 22 -11a11 11 0 1 1 -22 11z" fill="#f5c060"/>`;
  }
  dial += ln("M1480 330L1300 250M1480 330L1470 110", "#c08a30", 10);
  b += `<g opacity=".8">${dial}</g>`;

  // ── 인물: 둘 다 해(왼쪽)를 본다 ──
  const rimC = "#fff2c0";
  const skE: Skin = { b: "#fbe2d0", s: "#e2a894", l: "#9a5446", blush: "#f08a82", rim: rimC };
  const skS: Skin = { b: "#fde6d0", s: "#eaab90", l: "#a0574a", blush: "#f5847e", rim: rimC };
  const EX = 900, EY = 240, ES = 1.22;
  const SX = 760, SY = 372, SS = 1.1;
  b += `<ellipse cx="820" cy="430" rx="380" ry="440" fill="${c.glow("#fff6d0", 0.5, 0.22)}"/>`;
  // 엘리오스(뒤)
  const eH = hairElios({ streaks: 5 });
  b += place(EX, EY, ES, -14, false, eH.back);
  b += place(EX, EY, ES, 0, false, neck("m", skE) + eliosTorso(rimC));
  b += place(EX, EY, ES, -14, false, elfEar(skE) + face(c, { sex: "m", skin: skE, near: IRIS.red, far: IRIS.gold, lash: "#0a0a14", eyes: "down", brow: "soft", mouth: "soft", blush: 0.35, rim: [5, -2], noNeck: true, tears: 1 }) + eH.front);
  // 서하(앞)
  const sH = hairSeoha();
  b += place(SX, SY, SS, 0, false, sH.back + neck("f", skS) + seohaTorsoFantasy(rimC));
  b += place(SX, SY, SS, 6, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "soft", brow: "soft", mouth: "smile", tears: 2, blush: 0.6, rim: [5, -2], bags: true, noNeck: true }) + sH.front);
  // 그의 팔: 그녀의 가슴 앞을 가로질러 먼쪽 어깨에(장갑 낀 손)
  const arm = "M1060 470C1000 520 900 560 800 580C740 590 690 586 650 574L640 628C700 648 770 650 840 636C940 616 1030 580 1100 530Z";
  b += cel(arm, COAT.b, COAT.l, 2.8) + fl("M1100 530C1030 580 940 616 840 636C770 650 700 648 640 628L644 612C720 630 800 628 880 610C960 590 1040 556 1090 516Z", COAT.s);
  b += cel("M700 572C690 590 690 612 698 630L650 630C640 610 640 590 648 574Z", "#f6f4f0", "#8a8aa0", 1.6);
  b += place(654, 578, 1.08, 30, false, hand(GLOVE.b, GLOVE.s, GLOVE.l));
  b += ln("M1060 470C1000 520 900 560 800 580C740 590 690 586 650 574", rimC, 3.5, 0.8);
  // 그녀의 손: 그의 소매를 잡는다
  b += place(836, 612, 1.05, 60, false, hand(skS.b, skS.s, skS.l));
  // ── 재 → 금빛 모래: 오른쪽 아래 재가 둘 사이를 지나 해 쪽으로 ──
  const band = (t: number): Pt => [1300 - t * 900 + gauss(r) * 60, 820 - t * 560 - Math.sin(t * 3.1) * 120 + gauss(r) * 50];
  const grey: Pt[] = [];
  for (let i = 0; i < 90; i++) grey.push(band(r() * 0.3));
  let ash = dots(grey, 5, "#8a8784", 0.75);
  for (let i = 0; i < 16; i++) {
    const [x, y] = band(r() * 0.32);
    ash += `<path d="M${Math.round(x)} ${Math.round(y)}l${Math.round(6 + r() * 6)} ${Math.round(-3 - r() * 3)}l${Math.round(-2 - r() * 3)} ${Math.round(7 + r() * 4)}z" fill="#9a9690" opacity=".85"/>`;
  }
  const glowPts: Pt[] = [];
  for (let i = 0; i < 60; i++) glowPts.push(band(0.3 + r() * 0.7));
  b += `<g filter="${c.blur(6)}">${dots(glowPts, 14, "#ffd27a", 0.55)}</g>`;
  b += ash + sandStream(c, r, () => band(0.28 + r() * 0.72), 240, 26, "up");
  b += `<circle cx="770" cy="300" r="120" fill="${c.glow("#fff8e0", 0.55, 0.25)}"/>`;
  // 전경 난간(흰 돌, 금빛 역광)
  b += cel("M0 836L1600 816V900H0Z", "#d8c4a4", "#8a7050", 3) + fl("M0 836L1600 816V828L0 848Z", "#fff0cc", 0.9);
  b += `<rect width="1600" height="900" fill="${c.lgu(0, 0, 1600, 0, [[0, "#ffd08a", 0.3], [0.5, "#ffd9a0", 0.05], [1, "#8a70c0", 0.12]])}" style="mix-blend-mode:screen"/>`;
  return svg(c, b);
}

// ── 뒷모습 도우미 (머리 로컬 좌표, 관객에게 등을 보임) ──

/** 뒤통수 머리. tied: 뒤로 넘겨 묶음(라젤), messy: 흐트러져 뻗친 끝(재의 왕관) */
function backHair(H: Hair, o: { tail?: number; messy?: boolean; len?: number; tied?: boolean } = {}): string {
  const len = o.len ?? 52;
  let s = "";
  if (o.tied) {
    s += cel("M-66 -10C-74 -80 -40 -116 0 -116C40 -116 74 -80 66 -10C64 20 56 44 40 58C20 66 -20 66 -40 58C-56 44 -64 20 -66 -10Z", H.b, H.l, 2.6);
    s += fl("M-62 10C-40 30 40 30 62 10C58 34 50 50 40 58C20 66 -20 66 -40 58C-52 48 -58 34 -62 10Z", H.s, 0.85);
    s += strands(["M-50 -80C-40 -20 -20 30 -4 56", "M-20 -108C-16 -40 -8 20 -2 56", "M20 -108C16 -40 8 20 2 56", "M50 -80C40 -20 20 30 4 56", "M-64 -30C-50 10 -26 40 -6 58", "M64 -30C50 10 26 40 6 58"], { ...H, l: H.s }, 2);
    s += shine(0, -90, 46, 9, 10, H.h, 0.8, 0);
    s += strands(["M-58 20C-66 34 -70 40 -76 44", "M56 24C64 36 66 44 72 48"], H, 1.6);
  } else {
    let tips = "";
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = 46 - (92 * i) / n;
      tips += `L${n1(x)} ${n1(len + (i % 2 ? 16 : -6) + Math.sin(i * 1.7) * 5)}`;
    }
    s += cel(`M-72 -20C-80 -84 -42 -118 0 -118C42 -118 80 -84 72 -20C72 10 62 34 46 ${len}${tips}C-62 34 -72 10 -72 -20Z`, H.b, H.l, 2.6);
    s += fl(`M-68 16C-40 34 40 34 68 16C64 34 56 46 46 ${len}L-46 ${len}C-56 46 -64 34 -68 16Z`, H.s, 0.8);
    s += strands(["M-8 -104C-30 -60 -44 0 -48 50", "M4 -104C10 -50 14 0 12 60", "M12 -104C40 -60 52 0 52 50", "M-14 -104C-52 -80 -64 -20 -66 20"], H, 1.6);
    s += shine(0, -86, 52, 10, 11, H.h, 0.85, 0);
  }
  if (o.messy) {
    // 흐트러져 위·옆으로 뻗친 가닥
    const L: Lock[] = [
      [-46, -96, -60, 14, -12],
      [-28, -56, -140, 13, -8],
      [-6, -6, -156, 12, 0],
      [18, 46, -144, 13, 8],
      [44, 98, -64, 14, 12],
      [-58, -104, 0, 12, -8],
      [58, 104, 4, 12, 8],
    ];
    s += locks(L, -80, H, 2, 1);
  }
  if (o.tail) {
    const y0 = o.tied ? 46 : len - 16;
    s += cel(`M-14 ${y0}C-24 ${y0 + o.tail * 0.4} -12 ${y0 + o.tail * 0.8} 2 ${y0 + o.tail}C18 ${y0 + o.tail * 0.8} 24 ${y0 + o.tail * 0.4} 14 ${y0}Z`, H.b, H.l, 2.2);
    s += fl(`M-8 ${y0 + o.tail * 0.3}C0 ${y0 + o.tail * 0.6} 4 ${y0 + o.tail * 0.8} 2 ${y0 + o.tail}C12 ${y0 + o.tail * 0.7} 14 ${y0 + o.tail * 0.4} 10 ${y0 + 4}Z`, H.s, 0.8);
    s += cel(`M-12 ${y0 - 2}h24v12h-24z`, "#4a3a2a", "#1a0e04", 1.6);
  }
  return s;
}

/** 털 윤곽: 꺾은선을 따라 바깥으로 술 모양 굴곡을 넣는다(닫힌 도형) */
function furPath(pts: Pt[], step: number, amp: number): string {
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let k = 0; k < pts.length; k++) {
    const [x0, y0] = pts[k];
    const [x1, y1] = pts[(k + 1) % pts.length];
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(L / step));
    const nx = (y1 - y0) / L, ny = -(x1 - x0) / L;
    for (let i = 1; i <= n; i++) {
      const t0 = (i - 1) / n, t1 = i / n, tm = (t0 + t1) / 2;
      const a = amp * (0.6 + ((i * 7 + k * 3) % 5) * 0.15);
      d += `Q${n1(x0 + (x1 - x0) * tm + nx * a)} ${n1(y0 + (y1 - y0) * tm + ny * a)} ${n1(x0 + (x1 - x0) * t1)} ${n1(y0 + (y1 - y0) * t1)}`;
    }
  }
  return d + "Z";
}

/** 뒷모습의 두 귀(뾰족) */
function backElfEars(sk: Skin): string {
  return cel("M-62 -6C-80 -18 -96 -30 -104 -36C-100 -14 -90 6 -72 24Z", sk.s, sk.l, 2.2) + cel("M62 -6C80 -18 96 -30 104 -36C100 -14 90 6 72 24Z", sk.s, sk.l, 2.2);
}
function backHorns(): string {
  return cel("M-34 -100C-42 -118 -54 -128 -66 -132C-58 -118 -56 -104 -52 -90Z", "#1c1624", "#050408", 2) + cel("M34 -100C42 -118 54 -128 66 -132C58 -118 56 -104 52 -90Z", "#1c1624", "#050408", 2);
}

/** 시계 문자판 하나(벽시계) */
function clockFace(x: number, y: number, rr: number, face: string, rim: string, hand: string, a1: number, a2: number): string {
  let t = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    t += `M${n1(x + Math.cos(a) * rr * 0.78)} ${n1(y + Math.sin(a) * rr * 0.78)}L${n1(x + Math.cos(a) * rr * 0.9)} ${n1(y + Math.sin(a) * rr * 0.9)}`;
  }
  return (
    `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr)}" fill="${face}" stroke="${rim}" stroke-width="${n1(Math.max(2, rr * 0.12))}"/>` +
    ln(t, hand, Math.max(1, rr * 0.05)) +
    ln(`M${n1(x)} ${n1(y)}L${n1(x + Math.cos(a1) * rr * 0.5)} ${n1(y + Math.sin(a1) * rr * 0.5)}M${n1(x)} ${n1(y)}L${n1(x + Math.cos(a2) * rr * 0.72)} ${n1(y + Math.sin(a2) * rr * 0.72)}`, hand, Math.max(1.4, rr * 0.07))
  );
}

/** 금빛 모래시계(로컬 중심 0,0, 높이 ≈ 200). broken: 금 간 유리, 흘러내린 모래 */
function hourglass(c: Ctx, broken: boolean, glass = "#fff6d8", op = 1): string {
  const gold = "#e8b048";
  const gl = "#7a5010";
  const sand = c.lg(0, 0, 0, 1, [[0, "#ffe9a8"], [1, "#f0a838"]]);
  let s = `<g opacity="${op}">`;
  s += cel("M-46 -86C-46 -40 -8 -16 -8 0C-8 16 -46 40 -46 86H46C46 40 8 16 8 0C8 -16 46 -40 46 -86Z", glass, "#c8a868", 2, ' fill-opacity=".35"');
  s += fl("M-30 60C-20 44 -6 34 0 20C6 34 20 44 30 60L40 86H-40Z", sand);
  if (!broken) s += fl("M-36 -70C-20 -50 -6 -30 0 -10C6 -30 20 -50 36 -70Z", sand);
  else s += fl("M-20 -60C-10 -48 -4 -36 0 -22C4 -36 10 -48 20 -60Z", sand, 0.7);
  s += ln("M-34 -76C-34 -44 -10 -24 -8 -6", "#ffffff", 3, 0.7);
  if (broken) s += ln("M-44 -60L-26 -40L-34 -20M-26 -40L-10 -46M20 -80L30 -56L44 -50M30 -56L22 -36", "#ffffff", 2) + ln("M-44 -60L-26 -40L-34 -20M20 -80L30 -56L44 -50", "#8a7040", 0.8);
  s += cel("M-58 -98H58V-84H-58Z", gold, gl, 2.2) + cel("M-58 84H58V98H-58Z", gold, gl, 2.2);
  s += cel("M-54 -84H-46V84H-54Z", gold, gl, 1.8) + cel("M46 -84H54V84H46Z", gold, gl, 1.8);
  s += fl("M-56 -96H56V-92H-56Z", "#fff0c0") + fl("M-56 86H56V90H-56Z", "#fff0c0");
  if (broken) s += cel("M46 -30L60 -40L54 -22Z", gold, gl, 1.4);
  return s + `</g>`;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_e_bad — 잿빛 공방. 흰 머리가 왕관처럼 선 엘리오스의 뒷모습, 깨진 금빛 모래시계.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_e_bad cgEBad
function cgEBad(): string {
  const c = new Ctx("cg-e-bad");
  const p = c.p;
  const r = rng(2002);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#3a3836"], [0.6, "#5d5a58"], [1, "#2a2826"]])}"/>`;
  // 벽 가득 멈춘 시계들
  let clocks = "";
  for (let i = 0; i < 46; i++) {
    const x = r() * 1600;
    const y = 40 + r() * 620;
    if (x > 560 && x < 1040 && y > 80 && y < 560) continue;
    const rr = 18 + r() * 46;
    clocks += clockFace(x, y, rr, r() < 0.5 ? "#7a7672" : "#8a8580", "#4a4644", "#3a3634", r() * 6.28, r() * 6.28);
  }
  b += `<g opacity=".8">${clocks}</g>`;
  // 가운데 큰 창: 잿빛 새벽
  b += cel("M560 560V180Q800 20 1040 180V560Z", c.lgu(0, 80, 0, 560, [[0, "#b8b2aa"], [0.6, "#d4cfc8"], [1, "#9a948e"]]), "#2e2c2a", 10);
  b += `<circle cx="800" cy="330" r="56" fill="#e6e2dc" opacity=".9"/><circle cx="800" cy="330" r="200" fill="${c.glow("#f4f0ea", 0.6, 0.2)}"/>`;
  b += fl("M560 470C640 440 700 460 800 440C900 420 960 450 1040 430V560H560Z", "#8a8680", 0.8);
  b += ln("M800 60V560M560 330H1040", "#2e2c2a", 8);
  // 창에서 드는 잿빛 빛기둥
  b += fl("M560 560L420 900H1180L1040 560Z", "#e8e4de", 0.1);
  // 작업대와 톱니
  b += cel("M0 700H560L600 760H0Z", "#4a4644", "#1e1c1a", 3) + fl("M0 760H600V900H0Z", "#2e2c2a");
  let gears = "";
  for (let i = 0; i < 7; i++) {
    const gx = 60 + i * 72 + r() * 20;
    const gy = 690 - r() * 20;
    const gr = 16 + r() * 18;
    let d = "";
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const R = k % 2 ? gr : gr * 1.22;
      d += `${k ? "L" : "M"}${n1(gx + Math.cos(a) * R)} ${n1(gy + Math.sin(a) * R * 0.45)}`;
    }
    gears += cel(d + "Z", "#6a6460", "#2a2826", 1.6) + `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="${n1(gr * 0.3)}" ry="${n1(gr * 0.14)}" fill="#2a2826"/>`;
  }
  b += gears;
  // ── 엘리오스 뒷모습 ──
  const sk: Skin = { b: "#dcd8d4", s: "#aca6a4", l: "#4a4446", blush: "#c8a0a0" };
  const GC: Cloth = { b: "#3e4456", s: "#282c3a", l: "#12141c" };
  const X = 800, Y = 290, S = 1.5;
  b += `<ellipse cx="800" cy="340" rx="320" ry="320" fill="${c.glow("#f6f2ec", 0.6, 0.22)}"/>`;
  const back = "M-36 140C-80 146 -124 162 -142 196C-156 230 -160 300 -158 400L-170 900H170L158 400C160 300 156 230 142 196C124 162 80 146 36 140Z";
  let fig = cel("M-24 50L-28 150H28L24 50Z", sk.s, sk.l, 2.4);
  fig += cel(back, GC.b, GC.l, 3);
  fig += fl("M-36 140C-80 146 -124 162 -142 196C-150 214 -154 240 -156 270C-100 236 -50 228 0 230C50 228 100 236 156 270C154 240 150 214 142 196C124 162 80 146 36 140Z", GC.s, 0.85);
  fig += ln("M0 236C2 420 -2 620 0 900M-96 240C-104 340 -108 460 -112 600M96 240C104 340 108 460 112 600", GC.l, 2);
  fig += cel("M-30 96C-18 132 18 132 30 96L40 146C18 164 -18 164 -40 146Z", GC.b, GC.l, 2.4);
  fig += ln("M-142 196C-156 230 -160 300 -158 400L-170 900M142 196C156 230 160 300 158 400L170 900", "#e8e4de", 4, 0.75);
  // 오른팔: 팔꿈치를 굽혀 깨진 모래시계를 든다
  fig += cel("M130 190C160 220 176 280 180 340C182 370 176 390 166 400L120 380C128 340 124 290 110 240Z", GC.b, GC.l, 2.8);
  b += place(X, Y, S, 0, false, fig);
  b += cel("M1060 700C1050 660 1030 630 1010 606L980 620C994 640 1010 670 1016 700Z", GC.b, GC.l, 2.8);
  b += `<circle cx="990" cy="500" r="150" fill="${c.glow("#ffd27a", 0.55, 0.2)}" ${A(p, "pu", 0, 4)}/>`;
  b += place(992, 500, 0.6, 8, false, hourglass(c, true, "#fff6d8", 0.95));
  b += place(996, 574, 0.95, -20, false, hand(GLOVE.b, GLOVE.s, GLOVE.l));
  b += place(X, Y, S, 0, false, backElfEars(sk) + backHorns() + backHair(HAIR_WHITE, { messy: true, len: 64 }));
  b += place(X, Y, S, 0, false, ln("M-72 -20C-80 -84 -42 -118 0 -118C42 -118 80 -84 72 -20", "#ffffff", 3.5, 0.85));
  // 떨어지는 재
  const ash: Pt[] = [];
  for (let i = 0; i < 160; i++) ash.push([r() * 1600, r() * 900]);
  b += dots(ash, 4, "#c9c4bc", 0.55);
  for (let i = 0; i < 18; i++) b += `<path d="M${Math.round(r() * 1600)} ${Math.round(r() * 820)}l7 -3l-2 8z" fill="#d8d4ce" ${A(p, "dn", r() * 6, 6 + r() * 4)}/>`;
  // 비네트
  b += `<rect width="1600" height="900" fill="${c.rg([[0.4, "#000", 0], [1, "#000", 0.6]])}"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_r_back — 지하 수로, 잿빛 결정의 빛. 대검을 든 라젤의 넓은 등, 그 뒤의 서하.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_r_back cgRBack
function cgRBack(): string {
  const c = new Ctx("cg-r-back");
  const p = c.p;
  const r = rng(3003);
  let b = `<rect width="1600" height="900" fill="#1e1e22"/>`;
  // 수로 아치(원근)
  for (let i = 0; i < 5; i++) {
    const k = 1 - i * 0.18;
    const w = 900 * k, h = 700 * k;
    const cy = 520 - i * 20;
    b += ln(`M${n1(800 - w)} 900V${n1(cy)}Q${n1(800 - w)} ${n1(cy - h)} 800 ${n1(cy - h)}Q${n1(800 + w)} ${n1(cy - h)} ${n1(800 + w)} ${n1(cy)}V900`, i % 2 ? "#3a3a40" : "#2e2e34", 60 * k);
  }
  b += fl("M620 900V420Q620 250 800 250Q980 250 980 420V900Z", c.lgu(0, 250, 0, 700, [[0, "#6a6c70"], [1, "#2a2a2e"]]));
  // 벽돌 선
  let br = "";
  for (let y = 60; y < 700; y += 38) br += `M0 ${y}H520M1080 ${y}H1600`;
  b += ln(br, "#34343a", 2, 0.6);
  // 잿빛 결정들 — 빛의 원천
  const crys = (x: number, y: number, s: number, flip = 1): string => {
    let d = "";
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (k - 1.5) * 0.35 * flip;
      const L = s * (0.6 + ((k * 37) % 10) / 20);
      const w = s * 0.14;
      const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L;
      d += `M${n1(x - w)} ${y}L${n1(tx - w * 0.6)} ${n1(ty + w)}L${n1(tx)} ${n1(ty)}L${n1(tx + w * 0.6)} ${n1(ty + w)}L${n1(x + w)} ${y}Z`;
    }
    return `<circle cx="${x}" cy="${n1(y - s * 0.4)}" r="${n1(s * 1.6)}" fill="${c.glow("#e4e8ec", 0.7, 0.25)}"/>` + cel(d, "#b8bcc2", "#5a5e66", 2) + ln(d.replace(/Z/g, ""), "#f4f6f8", 1, 0.6);
  };
  b += crys(560, 600, 170) + crys(1060, 580, 150, -1) + crys(220, 800, 220) + crys(1400, 790, 210, -1) + crys(820, 470, 70);
  // 먼 곳의 무면들(흰 가면)
  for (const [x, y, s] of [[740, 430, 0.5], [870, 420, 0.45], [800, 440, 0.55]] as [number, number, number][]) {
    b += place(x, y, s, 0, false, cel("M-40 20C-60 60 -70 140 -76 240H76C70 140 60 60 40 20Z", "#141418", "#050508", 2) + cel("M-24 -24C-24 -50 24 -50 24 -24C26 6 12 20 0 22C-12 20 -26 6 -24 -24Z", "#f2f0ec", "#6a6866", 2));
  }
  // 물길 반사
  b += fl("M560 900L700 640H900L1040 900Z", "#3a3c42", 0.8) + ln("M660 760H940M620 820H980M700 700H900", "#c8ccd2", 2, 0.35);
  // ── 라젤 뒷모습 ──
  const X = 800, Y = 220, S = 1.6;
  const sk: Skin = { b: "#e8d4c4", s: "#b89a88", l: "#5a3e30", blush: "#d09080" };
  const furL = "#26262a";
  b += `<ellipse cx="800" cy="440" rx="440" ry="400" fill="${c.glow("#eef2f6", 0.4, 0.14)}"/>`;
  // 대검(오른손, 칼끝을 비스듬히 아래로)
  const sword = `<g transform="translate(1150 800) rotate(-48)">${cel("M-14 0L-12 -20L640 -26L720 0L640 26L-12 20Z", "#c8ccd4", "#3a3e48", 3)}${ln("M0 -4L640 -8", "#ffffff", 2.4, 0.85)}${cel("M-20 -46H6V46H-20Z", "#8a7048", "#2a1a0a", 2.4)}${cel("M-90 -9H-20V9H-90Z", "#4a3420", "#1a0e04", 2)}</g>`;
  let body = cel("M-34 30L-38 120H38L34 30Z", sk.s, sk.l, 2.4);
  body += cel("M-36 96C-80 120 -150 140 -186 180C-214 210 -222 260 -216 330L-200 900H200L216 330C222 260 214 210 186 180C150 140 80 120 36 96Z", "#6a4a30", "#2a1a0e", 3);
  // 팔(양쪽, 늘어뜨린) — 오른팔은 대검을 쥔다
  body += cel("M-200 200C-232 250 -240 330 -232 420L-196 420C-196 340 -190 270 -170 220Z", "#5a3e28", "#2a1a0e", 2.6);
  body += cel("M200 200C232 250 240 330 236 420L200 420C200 340 194 270 170 220Z", "#5a3e28", "#2a1a0e", 2.6);
  // 늑대 모피 망토: 어깨를 덮는 두툼한 털 + 길게 늘어진 자락
  body += cel("M-150 300C-170 480 -180 680 -186 900H186C180 680 170 480 150 300Z", "#6e6e74", furL, 3);
  body += fl("M20 250C10 480 6 700 2 900H120C106 700 96 480 70 250Z", "#5c5c62", 0.7);
  let fs = "";
  const fr = rng(77);
  for (let i = 0; i < 60; i++) {
    const x = -160 + fr() * 320;
    const y = 300 + fr() * 560;
    fs += `M${Math.round(x)} ${Math.round(y)}q${Math.round(-4 + fr() * 8)} 14 ${Math.round(-2 + fr() * 4)} 26`;
  }
  body += ln(fs, "#4a4a50", 2, 0.6);
  let edge = "";
  for (let i = 0; i <= 14; i++) {
    const x = 222 - i * 31.7;
    const y = 270 + Math.sin((i / 14) * Math.PI) * 24;
    edge += `Q${n1(x - 6)} ${n1(y + 34)} ${n1(x - 31.7)} ${n1(y + 2)}`;
  }
  // 시계 반대 방향 외곽(바깥쪽 = 왼쪽 법선)
  const mantle: Pt[] = [[44, 96], [-44, 96], [-120, 116], [-186, 150], [-222, 200], [-236, 260], [-232, 320], [-170, 340], [-90, 352], [0, 356], [90, 352], [170, 340], [232, 320], [236, 260], [222, 200], [186, 150], [120, 116]];
  body += cel(furPath(mantle, 26, -14), "#a4a4aa", furL, 2.6);
  body += fl(furPath([[-200, 300], [-120, 318], [0, 326], [120, 318], [200, 300], [210, 330], [0, 350], [-210, 330]], 22, -8), "#7e7e86", 0.8);
  let tf = "";
  for (let i = 0; i < 16; i++) {
    const x = -190 + i * 25;
    tf += `M${x} ${Math.round(150 + Math.abs(i - 7.5) * -2 + 70)}q8 -16 4 -36`;
  }
  body += ln("M-150 150C-110 130 -70 118 -40 110M60 112C100 122 140 136 170 156", "#e4e6ea", 3.5, 0.8);
  b += place(X, Y, S, 0, false, body);
  b += sword + cel("M1110 776C1140 768 1170 790 1166 820C1156 846 1122 850 1102 832Z", "#c89a7a", "#5a3e30", 2.4);
  b += place(X, Y, S, 0, false, cel("M-62 -6C-74 -14 -80 0 -76 14C-74 24 -68 28 -62 26Z", sk.b, sk.l, 2) + cel("M62 -6C74 -14 80 0 76 14C74 24 68 28 62 26Z", sk.b, sk.l, 2) + backHair(HAIR_RAZEL, { tail: 80, tied: true }));
  b += place(X, Y, S, 0, false, ln("M-186 150C-222 200 -236 260 -232 320M186 150C222 200 236 260 232 320M-160 380C-172 520 -180 700 -186 900M160 380C172 520 180 700 186 900", "#eef2f6", 4, 0.6) + ln("M-66 -10C-74 -80 -40 -116 0 -116C40 -116 74 -80 66 -10", "#eef2f6", 3, 0.6));
  // ── 서하(가까이, 왼쪽 아래): 그의 등을 올려다본다 ──
  const skS: Skin = { b: "#ecdcd0", s: "#bda096", l: "#6a4a42", blush: "#d09494", rim: "#eef2f6" };
  const sH = hairSeoha();
  b += place(650, 640, 1.05, 0, true, sH.back + neck("f", skS) + seohaTorsoFantasy("#eef2f6"));
  b += place(650, 640, 1.05, -12, true, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "open", brow: "sad", mouth: "n", blush: 0.3, rim: [-5, -2], shade: -1, noNeck: true, bags: true, look: [-3, -4] }) + sH.front);
  // 떠다니는 결정 먼지(일부 반짝임)
  const dust: Pt[] = [];
  for (let i = 0; i < 120; i++) dust.push([400 + r() * 800, 200 + r() * 600]);
  b += dots(dust, 2.4, "#e8ecf0", 0.5);
  for (let i = 0; i < 14; i++) b += sparkAt(c, 500 + r() * 700, 300 + r() * 460, 5 + r() * 6, "#f4f6f8", A(p, "tw", r() * 4, 3 + r() * 3));
  b += `<rect width="1600" height="900" fill="${c.rg([[0.45, "#000", 0], [1, "#000", 0.65]])}"/>`;
  return svg(c, b);
}

/** 위에서 드리운 구름(아래쪽이 불룩, 아래 가장자리에 빛) */
function cloudTop(r: () => number, x0: number, x1: number, y: number, fill: string, rimC: string, op = 1, puff = 80): string {
  let d = `M${x0} -10`;
  let rimD = "";
  let x = x0;
  while (x < x1) {
    const w = puff * (0.6 + r() * 0.8);
    const env = Math.sin(Math.min(1, Math.max(0, (x + w - x0) / (x1 - x0))) * Math.PI) ** 0.6;
    const h = puff * (0.25 + r() * 0.35) * env;
    const yy = -10 + (y + 10 + (r() - 0.5) * puff * 0.5) * env;
    d += `Q${Math.round(x + w * 0.5)} ${Math.round(yy + h * 2)} ${Math.round(x + w)} ${Math.round(yy)}`;
    rimD += `M${Math.round(x + w * 0.15)} ${Math.round(yy + h * 0.7)}Q${Math.round(x + w * 0.5)} ${Math.round(yy + h * 1.9)} ${Math.round(x + w * 0.85)} ${Math.round(yy + h * 0.7)}`;
    x += w * 0.8;
  }
  d += `L${x1} -10Z`;
  return `<g opacity="${op}"><path d="${d}" fill="${fill}"/>${ln(rimD, rimC, 3, 0.85)}</g>`;
}

const LEATHER: Cloth = { b: "#7a5434", s: "#553820", l: "#2a1a0c" };

/** 라젤 앞모습 상반신(로컬: 왼쪽을 봄): 가죽 갑옷, 회색 늑대 모피 깃, 어깨 너머 대검 손잡이 */
function razelTorso(rimC: string | null, bot = 900): string {
  const L = LEATHER;
  let s = "";
  // 어깨 너머 대검 손잡이
  s += cel("M110 40L140 24L190 150L160 164Z", "#3a2a1a", "#140a02", 2.4) + cel("M96 60L160 30L166 44L102 74Z", "#8a7048", "#2a1a0a", 2);
  s += cel(`M-36 110C-80 128 -136 140 -166 172C-194 204 -206 260 -210 330L-222 ${bot}H232L222 330C218 260 206 200 180 170C150 138 92 126 46 108Z`, L.b, L.l, 3);
  s += fl(`M120 150C160 170 190 200 204 250C214 300 220 360 222 420L232 ${bot}H130C140 ${bot - 300} 146 360 120 150Z`, L.s);
  // 가슴 끈과 버클
  s += cel("M-150 190L190 420L180 448L-158 220Z", "#4a3020", "#1a0e04", 2.2) + cel("M10 290h34v28h-34z", "#c8a050", "#5a3a10", 2);
  s += ln("M-60 260C-40 340 -40 420 -50 520M60 300C70 380 70 460 64 560", L.l, 2, 0.7);
  // 셔츠 깃
  s += cel("M-30 104C-10 140 30 140 50 100L60 150C30 176 -14 176 -40 148Z", "#d8cdb8", "#6a5a44", 2);
  // 회색 늑대 모피 깃(어깨를 덮는다)
  const fur: Pt[] = [[60, 96], [-50, 100], [-120, 126], [-180, 160], [-212, 210], [-150, 214], [-80, 196], [0, 190], [80, 200], [160, 220], [226, 232], [214, 176], [160, 132], [100, 108]];
  s += cel(furPath(fur, 24, -12), "#a0a0a6", "#2a2a2e", 2.6);
  s += ln("M-150 180C-100 170 -50 168 -20 172M40 176C100 180 150 196 190 210", "#6a6a70", 2.4, 0.7);
  if (rimC) s += ln(`M46 108C92 126 150 138 180 170C206 200 218 260 222 330L232 ${bot}`, rimC, 5, 0.85);
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_r_good — 재가 걷힌 낮은 거리 지붕 위, 금빛 해돋이를 보며 웃는 둘. 라젤의 붕대 감은 팔.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_r_good cgRGood
function cgRGood(): string {
  const c = new Ctx("cg-r-good");
  const p = c.p;
  const r = rng(4004);
  const SX = 1180, SY = 560;
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#6a8cc0"], [0.3, "#a8c4e0"], [0.5, "#ffd9a0"], [0.62, "#ffc070"], [0.75, "#fff0c8"]])}"/>`;
  b += `<circle cx="${SX}" cy="${SY}" r="900" fill="${c.glow("#fff2c8", 0.95, 0.4)}"/>`;
  b += rays(SX, SY, 18, 1500, -Math.PI, 0, 0.02, "#fffbe8", 0.18, r);
  // 걷혀 가는 잿빛 구름(가장자리로 밀려남, 금빛 테두리)
  b += cloudTop(r, -60, 620, 150, "#7e7b78", "#ffe6a8", 0.9, 110);
  b += cloudTop(r, 1100, 1680, 120, "#7e7b78", "#ffe6a8", 0.85, 100);
  b += cloudTop(r, -60, 1680, 50, "#6a6866", "#ffd890", 0.5, 140);
  b += cloudBank(r, -40, 1640, 470, 70, "#f2c08a", "#fff6d8", 0.6, 110);
  b += `<circle cx="${SX}" cy="${SY}" r="150" fill="${c.glow("#ffffff", 1, 0.8)}"/><circle cx="${SX}" cy="${SY}" r="58" fill="#fffdf2"/>`;
  // 낮은 거리의 지붕들(주황 기와, 역광)
  let roofs = "";
  for (let i = 0; i < 14; i++) {
    const x = -60 + i * 125 + r() * 40;
    const y = 600 + r() * 60;
    const w = 120 + r() * 80;
    roofs += cel(`M${Math.round(x)} ${Math.round(y)}L${Math.round(x + w / 2)} ${Math.round(y - 40 - r() * 30)}L${Math.round(x + w)} ${Math.round(y)}V900H${Math.round(x)}Z`, i % 2 ? "#c65a36" : "#d86a44", "#6a2a14", 2);
    roofs += fl(`M${Math.round(x)} ${Math.round(y)}h${Math.round(w)}v120h${-Math.round(w)}z`, "#f3ede2", 0.8);
  }
  b += `<g opacity=".9">${roofs}</g>`;
  b += ln("M0 640C300 680 600 660 900 700M700 620C1000 650 1300 640 1600 680", "#5a3a2a", 1.6, 0.7);
  let flags = "";
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 100 + r() * 30;
    const y = 650 + (i < 9 ? i * 4 : 0) + r() * 10;
    flags += `M${Math.round(x)} ${Math.round(y)}h${Math.round(18 + r() * 14)}v${Math.round(16 + r() * 16)}h${-Math.round(16 + r() * 10)}z`;
  }
  b += fl(flags, "#f8f0e0", 0.85);
  b += fl("M0 600H1600V900H0Z", "#ffcf90", 0.18);
  // ── 인물 ──
  const rimC = "#fff3c8";
  const skR: Skin = { b: "#f6d6bc", s: "#d89c80", l: "#7a4430", blush: "#e8806e", rim: rimC };
  const skS: Skin = { b: "#fde6d0", s: "#eaab90", l: "#a0574a", blush: "#f5847e", rim: rimC };
  // 라젤(왼쪽, 오른쪽을 본다 = 반전)
  const rH = hairRazel();
  const RX = 680, RY = 300, RS = 1.25;
  b += place(RX, RY, RS, 0, true, rH.back + neck("m", skR) + razelTorso(null));
  b += place(RX, RY, RS, 4, true, ear(skR) + face(c, { sex: "m", skin: skR, near: IRIS.amber, far: IRIS.amber, lash: "#2a1608", eyes: "happy", mouth: "laugh", browC: "#5a3418", brow: "up", blush: 0.4, rim: [-5, -2], shade: 1, noNeck: true, extra: razelMarks() }) + rH.front);
  // 붕대 감은 팔(앞으로, 무릎 위에)
  b += cel("M470 760C560 720 680 700 800 712L806 770C690 768 580 790 490 830Z", skR.b, skR.l, 2.6);
  b += cel("M550 728C620 712 690 706 760 708L764 768C690 768 620 778 556 796Z", "#f6f2ea", "#a89c88", 2);
  let wrap = "";
  for (let i = 0; i < 9; i++) wrap += `M${566 + i * 22} ${728 - i * 2}l14 ${64 - i * 1.5}`;
  b += ln(wrap, "#c8bca8", 1.6) + fl("M640 730c10 0 14 10 8 16c-8 4 -16 0 -14 -8z", "#c84a4a", 0.5);
  b += place(806, 742, 1.15, 180, false, hand(skR.b, skR.s, skR.l));
  // 서하(오른쪽, 그를 보며 웃는다)
  const sH = hairSeoha();
  const SXx = 930, SYy = 380, SS = 1.08;
  b += place(SXx, SYy, SS, 0, false, sH.back + neck("f", skS) + seohaTorsoFantasy(rimC));
  b += place(SXx, SYy, SS, -4, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "happy", brow: "soft", mouth: "laugh", blush: 0.65, rim: [5, -2], shade: 1, noNeck: true }) + sH.front);
  // 금빛 먼지 몇 개
  const dust: Pt[] = [];
  for (let i = 0; i < 80; i++) dust.push([400 + r() * 1100, 100 + r() * 600]);
  b += dots(dust, 3, "#fff2c0", 0.7);
  for (let i = 0; i < 14; i++) b += sparkAt(c, 500 + r() * 900, 120 + r() * 500, 4 + r() * 6, "#fffbe8", A(p, "tw", r() * 4, 3 + r() * 3));
  // 전경 기와 지붕(그들이 앉은)
  let tiles = "";
  for (let x = -20; x < 1620; x += 46) tiles += `M${x} 830q23 -22 46 0`;
  b += cel("M0 812L1600 800V900H0Z", "#c65a36", "#6a2a14", 3) + ln(tiles, "#8a3a1e", 3) + ln("M0 812L1600 800", "#ffd8a8", 4, 0.9);
  b += `<rect width="1600" height="900" fill="${c.lgu(0, 0, 1600, 0, [[0, "#80a0d0", 0.1], [0.7, "#ffd9a0", 0.12], [1, "#ffc070", 0.3]])}" style="mix-blend-mode:screen"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_r_bad — 잿빛 새벽. 쓰러진 라젤의 손을 잡은 서하, 손바닥에서 떨어지는 마지막 금빛 한 알.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_r_bad cgRBad
function cgRBad(): string {
  const c = new Ctx("cg-r-bad");
  const p = c.p;
  const r = rng(5005);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#5d5a58"], [0.5, "#8a8784"], [0.75, "#a8a39c"], [1, "#4a4846"]])}"/>`;
  b += `<circle cx="1120" cy="250" r="260" fill="${c.glow("#d8d4cc", 0.5, 0.15)}"/><circle cx="1120" cy="250" r="70" fill="#c9c4bc"/><circle cx="1120" cy="250" r="70" fill="none" stroke="#e4e0d8" stroke-width="3"/>`;
  // 무너진 낮은 거리(잿빛 실루엣)
  let ru = "M0 600";
  for (let x = 0; x <= 1600; x += 60) ru += `L${x} ${Math.round(560 - r() * 120)}L${x + 30} ${Math.round(590 - r() * 60)}`;
  b += fl(ru + "L1600 900H0Z", "#6a6764", 0.9);
  b += fl("M0 640Q800 600 1600 650V900H0Z", "#5a5856");
  // 바닥(돌길, 재)
  b += fl("M0 700Q800 660 1600 710V900H0Z", "#7a7774");
  const ashP: Pt[] = [];
  for (let i = 0; i < 200; i++) ashP.push([r() * 1600, r() * 900]);
  b += dots(ashP, 4, "#c9c4bc", 0.5);
  // ── 쓰러진 라젤(왼쪽 아래, 누워 있음) ──
  const skR: Skin = { b: "#dcc8b8", s: "#b09888", l: "#5a3e30", blush: "#c89080" };
  const rH = hairRazel();
  // 누운 몸(머리 왼쪽, 몸은 오른쪽으로 — 서하의 무릎 앞)
  b += cel("M650 740C880 720 1180 720 1480 740L1700 760V900H620C610 840 620 780 650 740Z", LEATHER.b, LEATHER.l, 3) + fl("M630 830C880 820 1180 826 1510 840L1700 850V900H620Z", LEATHER.s);
  b += cel(furPath([[660, 730], [880, 716], [940, 760], [880, 820], [680, 830]], 26, -12), "#9c9ca2", "#2a2a2e", 2.6);
  b += place(620, 770, 1.15, -90, true, rH.back + neck("m", skR) + ear(skR) + face(c, { sex: "m", skin: skR, near: IRIS.amber, far: IRIS.amber, lash: "#2a1608", eyes: "closed", mouth: "soft", browC: "#5a3418", brow: "soft", blush: 0, noNeck: true, extra: razelMarks() }) + rH.front);
  // ── 서하(무릎 꿇고 몸을 숙여 그의 손을 가슴께로) ──
  const skS: Skin = { b: "#ecdcd0", s: "#c0a498", l: "#6a4a42", blush: "#d89494", rim: "#f0ece4" };
  const sH = hairSeoha();
  const SXx = 880, SYy = 330, SS = 1.15;
  b += place(SXx, SYy, SS, -8, false, sH.back + neck("f", skS) + seohaTorsoFantasy("#f0ece4"));
  b += place(SXx - 6, SYy + 4, SS, -20, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "closed", brow: "sad", mouth: "sad", tears: 2, blush: 0.25, rim: [5, -2], noNeck: true, bags: true }) + sH.front);
  // 그의 팔: 아래에서 그녀의 손으로 올라온다
  b += limb(740, 790, 800, 716, 96, 80, LEATHER.b, LEATHER.l, LEATHER.s, -10);
  b += limb(800, 720, 826, 636, 78, 60, skR.b, skR.l, skR.s, -6);
  b += limb(806, 706, 818, 662, 80, 72, "#4a3020", "#1a0e04");
  b += place(826, 630, 1.25, 70, false, mitt(skR.b, skR.s, skR.l));
  // 그녀의 팔과 두 손(그의 손을 감싼다)
  b += limb(820, 540, 786, 604, 54, 40, DRESS.b, DRESS.l, DRESS.s, 10);
  b += limb(980, 600, 882, 652, 60, 42, DRESS.b, DRESS.l, DRESS.s, -14);
  b += place(780, 600, 1.0, 200, false, mitt(skS.b, skS.s, skS.l, false));
  b += place(876, 650, 1.0, 10, false, mitt(skS.b, skS.s, skS.l));
  // 손바닥 문양 + 떨어지는 마지막 금빛 한 알
  b += ln("M860 664l10 -5l-3 10l10 -5", "#ffd27a", 2, 0.9);
  b += `<circle cx="860" cy="720" r="110" fill="${c.glow("#ffe6a0", 0.75, 0.28)}"/>`;
  b += `<g ${A(p, "dn", 2, 5)}><circle cx="860" cy="712" r="28" fill="${c.glow("#fff6d0", 1, 0.5)}"/><circle cx="860" cy="712" r="5" fill="#fffbe8"/></g>`;
  b += ln("M860 676V704", "#ffe6a0", 2, 0.6);
  // 재(일부 천천히 떨어짐)
  for (let i = 0; i < 16; i++) b += `<path d="M${Math.round(r() * 1600)} ${Math.round(r() * 800)}l7 -3l-2 8z" fill="#d8d4ce" ${A(p, "dn", r() * 6, 7 + r() * 4)}/>`;
  b += `<rect width="1600" height="900" fill="${c.rg([[0.45, "#000", 0], [1, "#000", 0.5]])}"/>`;
  return svg(c, b);
}

const ROBE: Cloth = { b: "#f4f6fb", s: "#c4cce4", l: "#56628c" };
const CAPE_B: Cloth = { b: "#3e64b0", s: "#2a4682", l: "#142448" };

/** 시안 상반신(로컬: 왼쪽을 봄): 흰·푸른 마도사 로브, 높은 깃, 은사슬, 어깨의 푸른 망토 */
function sianTorso(rimC: string | null, bot = 900, R: Cloth = ROBE, CB: Cloth = CAPE_B): string {
  let s = cel(maleTorsoD(bot), CB.b, CB.l, 2.8);
  s += fl(`M120 160C150 180 172 210 180 260L196 ${bot}H120C126 ${bot - 300} 130 400 120 160Z`, CB.s);
  // 로브 앞판(흰색, 푸른 테)
  s += cel(`M-80 150C-96 260 -100 400 -104 ${bot}H110C104 400 96 260 80 146C40 164 -40 166 -80 150Z`, R.b, R.l, 2.4);
  s += fl(`M40 160C60 260 70 400 76 ${bot}H110C104 400 96 260 80 146Z`, R.s);
  s += ln(`M-6 170C-4 300 -6 460 -6 ${bot}`, "#4a78c8", 6) + ln(`M-6 170C-4 300 -6 460 -6 ${bot}`, "#c8dcff", 1.6, 0.8);
  // 은사슬 장식
  s += ln("M-70 210C-40 250 30 250 70 206", "#c8d0e0", 3) + ln("M-70 210C-40 250 30 250 70 206", "#6a7490", 1, 0.8);
  s += ln("M-60 260C-30 300 30 300 64 256", "#c8d0e0", 2.4, 0.8);
  s += `<circle cx="0" cy="246" r="9" fill="#3a78d8" stroke="#c8d0e0" stroke-width="3"/>`;
  // 높은 깃(흰, 푸른 안감)
  s += cel("M-36 112L-48 166C-10 182 34 180 66 160L56 92C24 108 -6 116 -36 112Z", R.b, R.l, 2.4);
  s += fl("M28 104L56 92L66 160C52 170 40 174 28 176Z", R.s);
  s += ln("M-36 112C-6 116 24 108 56 92", "#4a78c8", 3);
  // 어깨 망토 깃
  s += cel("M-30 130C-80 136 -130 150 -150 180C-120 172 -80 168 -50 166Z", CB.b, CB.l, 2) + cel("M50 128C100 132 146 150 166 180C136 170 100 164 70 162Z", CB.b, CB.l, 2);
  if (rimC) s += ln(`M44 114C84 130 126 140 156 170C176 194 182 248 186 318L196 ${bot}`, rimC, 5, 0.85);
  return s;
}

/** 시안 얼굴 옵션 공통 */
function sianFace(sk: Skin, o: Partial<FaceO>, patch: boolean): FaceO {
  return {
    sex: "m",
    skin: sk,
    near: IRIS.gold,
    far: IRIS.steel,
    lash: "#2a3450",
    browC: "#7a88b0",
    nearEyeExtra: patch ? undefined : dialIris(),
    noNearEye: patch,
    ...o,
  };
}

/** 푸른 마석 등불 보케 */
function bokeh(c: Ctx, r: () => number, n: number, x0: number, x1: number, y0: number, y1: number, color: string, op: number, rMin = 10, rMax = 40): string {
  const g = c.glow(color, 0.9, 0.5);
  let s = "";
  for (let i = 0; i < n; i++) {
    const rr = rMin + r() * (rMax - rMin);
    s += `<circle cx="${Math.round(x0 + r() * (x1 - x0))}" cy="${Math.round(y0 + r() * (y1 - y0))}" r="${Math.round(rr)}" fill="${g}" opacity="${n1(op * (0.4 + r() * 0.6))}"/>`;
  }
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_s_eye — 안대를 벗은 시안. 금빛 시계 문자판 눈동자, 그 안에 겹겹의 서하. 푸른 마석 등불.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_s_eye cgSEye
function cgSEye(): string {
  const c = new Ctx("cg-s-eye");
  const p = c.p;
  const r = rng(6006);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#0e1838"], [0.6, "#1a2a5a"], [1, "#0a1028"]])}"/>`;
  b += bokeh(c, r, 26, 0, 1600, 0, 900, "#6aa0ff", 0.55, 20, 70);
  b += bokeh(c, r, 14, 0, 1600, 0, 900, "#e4efff", 0.4, 6, 18);
  // 서재 선반(어둠 속)
  b += ln("M0 200H420M0 420H400M1180 260H1600M1200 520H1600", "#2a3a6a", 6, 0.6);
  // 배경: 겹겹의 서하의 그림자(기시의 잔상)
  const ghost = "M0 -120C50 -120 76 -84 74 -40C74 -4 80 30 90 60C70 70 50 72 40 70C60 80 90 96 110 130C120 150 124 170 124 190H-124C-124 170 -120 150 -110 130C-90 96 -60 80 -40 70C-50 72 -70 70 -90 60C-80 30 -74 -4 -74 -40C-76 -84 -50 -120 0 -120Z";
  for (let i = 0; i < 7; i++) {
    const gx = 220 + i * 46 + Math.sin(i * 2.1) * 20, gy = 520 + Math.cos(i * 1.7) * 30;
    b += `<path d="${ghost}" transform="translate(${n1(gx)} ${n1(gy)}) rotate(${n1(-8 + i * 3)}) scale(${n1(1.3 - i * 0.05)})" fill="#9ec2f0" opacity="${n1(0.06 + i * 0.02)}" stroke="#e4efff" stroke-width="2" stroke-opacity=".25"/>`;
  }
  for (let i = 0; i < 4; i++) b += `<path d="${ghost}" transform="translate(${1300 + i * 50} ${560 - i * 20}) rotate(${6 - i * 4}) scale(1.1)" fill="#ffd27a" opacity="${n1(0.05 + i * 0.02)}"/>`;
  const sk: Skin = { b: "#eceaf6", s: "#a4acd8", l: "#3e4878", blush: "#e8a0b4", rim: "#9ec2f0" };
  const H = hairSian();
  const X = 760, Y = 330, S = 4;
  // 금빛 눈 안의 겹겹의 서하(작은 실루엣들) — 단위 눈 좌표
  let ghosts = "";
  for (let i = 0; i < 6; i++) {
    const dx = -6 + i * 2.4 + Math.sin(i) * 1.5;
    const dy = 4 + Math.cos(i * 1.3) * 1.5;
    ghosts += `<g transform="translate(${n1(dx)} ${n1(dy - 7)}) scale(.62)" opacity="${n1(0.18 + i * 0.06)}"><path d="M0 -6c3 0 4.6 2.4 4.4 5.2c0 2 1 4.4 2 6.6h-12.8c1 -2.2 2 -4.6 2 -6.6c-0.2 -2.8 1.4 -5.2 4.4 -5.2z" fill="#fff0c0"/><path d="M-6.6 6c-2 3 -2.6 6 -2.6 9h18.4c0 -3 -0.6 -6 -2.6 -9z" fill="#fff0c0"/></g>`;
  }
  const eye = `<g>${ghosts}</g>` + dialIris();
  b += place(X, Y, S, -4, false, H.back + face(c, sianFace(sk, { eyes: "open", brow: "soft", mouth: "n", blush: 0.3, rim: [5, -2], shade: 1, nearEyeExtra: eye }, false)) + H.front);
  // 금빛 눈의 빛번짐
  const ex = X + 18 * S, ey = Y + 24 * S;
  b += `<circle cx="${ex}" cy="${ey}" r="170" fill="${c.glow("#ffd27a", 0.35, 0.12)}" ${A(p, "pu", 0, 4)}/>`;
  // 손에 든 흰 레이스 안대(오른쪽 아래)
  b += place(1150, 720, 2.2, -24, false, eyepatch()) + ln("M1190 800C1200 840 1196 870 1210 900M1170 806C1172 840 1160 870 1166 900", "#f4f6fb", 4, 0.9);
  // 푸른 림 라이트 위의 반짝임 + 떠다니는 마력 입자
  const mp: Pt[] = [];
  for (let i = 0; i < 90; i++) mp.push([r() * 1600, r() * 900]);
  b += dots(mp, 2.4, "#cfe2ff", 0.6);
  for (let i = 0; i < 16; i++) b += sparkAt(c, r() * 1600, r() * 900, 4 + r() * 7, "#e4efff", A(p, "tw", r() * 4, 3 + r() * 3));
  b += `<rect width="1600" height="900" fill="${c.rg([[0.5, "#000", 0], [1, "#050a20", 0.6]])}"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_s_blade — 청탑 지하의 술식진. 울면서 앞으로 찌르는 시안(절제: 얼굴, 칼날의 빛, 푸른 빛, 떨어지는 모래시계의 빛)
// ────────────────────────────────────────────────────────────────────────────
//@id cg_s_blade cgSBlade
function cgSBlade(): string {
  const c = new Ctx("cg-s-blade");
  const p = c.p;
  const r = rng(7007);
  let b = `<rect width="1600" height="900" fill="#070b1c"/>`;
  // 바닥 술식진(원근 타원) — 아래에서 올라오는 푸른 빛
  b += `<ellipse cx="800" cy="820" rx="900" ry="300" fill="${c.glow("#4a8aff", 0.75, 0.3)}"/>`;
  let ring = "";
  for (const [rx, ry] of [[760, 170], [640, 140], [480, 104]] as Pt[]) ring += `<ellipse cx="800" cy="800" rx="${rx}" ry="${ry}" fill="none" stroke="#9ec2f0" stroke-width="4"/>`;
  let runes = "";
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const x = 800 + Math.cos(a) * 700, y = 800 + Math.sin(a) * 155;
    runes += `M${n1(x - 8)} ${n1(y)}l8 -8l8 8M${n1(x)} ${n1(y - 8)}v14`;
  }
  b += `<g ${A(p, "pu", 0, 3)}>${ring}${ln(runes, "#e4efff", 2, 0.85)}</g>`;
  b += ln("M800 630L1480 800L800 970L120 800Z M800 696L1280 800L800 904L320 800Z", "#6a9ae8", 2, 0.6);
  // 빛기둥
  b += fl("M300 800L520 0H1080L1300 800Z", "#4a8aff", 0.08);
  // ── 시안 ──
  const sk: Skin = { b: "#e2e8fa", s: "#8a98cc", l: "#2e386a", blush: "#d8a0b8", rim: "#9ec2f0" };
  const H = hairSian();
  const X = 800, Y = 300, S = 1.55;
  const RD: Cloth = { b: "#8494c8", s: "#5a6aa4", l: "#1e2850" };
  b += place(X, Y, S, 0, false, H.back + neck("m", sk) + sianTorso("#9ec2f0", 900, RD, { b: "#2a3e78", s: "#1a2a58", l: "#0a1230" }));
  b += place(X, Y, S, -6, false, face(c, sianFace(sk, { eyes: "open", brow: "sad", mouth: "part", tears: 2, blush: 0.2, rim: [3, 6], shade: 1, noNeck: true, look: [-1, 0] }, true)) + H.front + eyepatch());
  // 아래에서 비추는 푸른 빛(얼굴 아래쪽 밝음)
  b += `<ellipse cx="800" cy="460" rx="160" ry="120" fill="${c.glow("#9ec2f0", 0.25, 0.1)}"/>`;
  // 앞으로 뻗은 팔과 단검(칼끝은 화면 아래 — 보이지 않는 서하 쪽)
  b += limb(980, 560, 900, 720, 100, 84, RD.b, RD.l, RD.s, -16);
  b += cel("M860 690C880 676 916 680 928 704C934 724 920 746 896 752C872 756 852 742 848 722C846 708 850 698 860 690Z", "#c8d0e0", "#56628c", 2);
  b += place(890, 740, 1.15, -60, false, mitt(sk.b, sk.s, sk.l, false));
  b += cel("M856 770L700 900H660L834 752Z", "#eef2fb", "#56628c", 2.4) + ln("M846 762L676 900", "#ffffff", 2, 0.9);
  b += cel("M820 744L880 800L870 810L810 754Z", "#c8d0e0", "#56628c", 2);
  // 칼날의 번쩍임
  b += `<circle cx="770" cy="836" r="200" fill="${c.glow("#cfe2ff", 0.9, 0.35)}"/><circle cx="770" cy="836" r="50" fill="${c.glow("#ffffff", 1, 0.8)}"/>`;
  b += sparkAt(c, 770, 836, 60, "#ffffff", A(p, "tw", 0, 2.4)) + ln("M600 836H940M770 720V900", "#ffffff", 2, 0.6);
  // 떨어지는 금빛 모래시계의 빛
  b += `<g ${A(p, "dn", 2.5, 6)}><circle cx="960" cy="190" r="110" fill="${c.glow("#ffd27a", 0.9, 0.35)}"/>` + place(960, 190, 0.34, 24, false, hourglass(c, false)) + `</g>`;
  b += ln("M930 40C940 90 950 130 956 160", "#ffd27a", 3, 0.6);
  const sand: Pt[] = [];
  for (let i = 0; i < 60; i++) sand.push([900 + r() * 120, 40 + r() * 180]);
  b += dots(sand, 2.6, "#ffe6a0", 0.85);
  // 떠오르는 마력 입자
  const mp: Pt[] = [];
  for (let i = 0; i < 120; i++) mp.push([200 + r() * 1200, 400 + r() * 500]);
  b += dots(mp, 2.4, "#cfe2ff", 0.6);
  for (let i = 0; i < 12; i++) b += sparkAt(c, 300 + r() * 1000, 400 + r() * 400, 4 + r() * 5, "#e4efff", A(p, "up", r() * 6, 5 + r() * 3));
  b += `<rect width="1600" height="900" fill="${c.rg([[0.4, "#000", 0], [1, "#000", 0.7]])}"/>`;
  return svg(c, b);
}

/** 열린 오르골(로컬 중심 0,0, 폭 ≈ 160) */
function musicBox(c: Ctx, glow = true): string {
  let s = "";
  if (glow) s += `<circle cx="0" cy="-20" r="150" fill="${c.glow("#fff0c0", 0.7, 0.25)}"/>`;
  // 열린 뚜껑(거울)
  s += cel("M-80 -30L-70 -120H70L80 -30Z", "#f4ecf8", "#6a5a8a", 2.4) + cel("M-62 -40L-56 -108H56L62 -40Z", c.lg(0, 0, 1, 1, [[0, "#e4efff"], [1, "#9ec2f0"]]), "#8a7aa8", 1.6) + ln("M-40 -100L-10 -50M10 -104L30 -70", "#ffffff", 2, 0.8);
  // 상자
  s += cel("M-86 -30H86L80 40H-80Z", "#f4ecf8", "#6a5a8a", 2.6) + fl("M40 -30H86L80 40H36Z", "#d4c8e4");
  s += cel("M-86 -30H86V-18H-86Z", "#e8c060", "#7a5414", 1.8) + cel("M-80 30H80V40H-80Z", "#e8c060", "#7a5414", 1.6);
  s += cel("M-14 4h28v14h-28z", "#e8c060", "#7a5414", 1.4);
  // 안쪽의 금빛 원통과 작은 별
  s += cel("M-50 -40h100v12h-100z", "#ffd27a", "#8a5a10", 1.6) + `<path d="${spark(0, -54, 12)}" fill="#fff6d0"/>`;
  return s;
}

/** 음표 모양(글자 아님, 도형) */
function note(x: number, y: number, s: number, color: string, extra = ""): string {
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(s)})"${extra}><ellipse cx="0" cy="0" rx="6" ry="4.4" transform="rotate(-20)" fill="${color}"/><path d="M5 -1V-24l9 4v4l-7 -3V-1Z" fill="${color}"/></g>`;
}

// ────────────────────────────────────────────────────────────────────────────
// cg_s_good — 금빛 새벽의 청탑 테라스. 안대를 벗고 진심으로 웃는 시안, 서하, 열린 오르골.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_s_good cgSGood
function cgSGood(): string {
  const c = new Ctx("cg-s-good");
  const p = c.p;
  const r = rng(8008);
  const SX = 800, SY = 560;
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#3a5aa8"], [0.25, "#7a9ad8"], [0.45, "#e8b8a8"], [0.58, "#ffd090"], [0.7, "#fff0c8"]])}"/>`;
  b += `<circle cx="${SX}" cy="${SY}" r="900" fill="${c.glow("#fff2c8", 0.9, 0.38)}"/>`;
  b += rays(SX, SY, 20, 1500, -Math.PI, 0, 0.018, "#fffbe8", 0.15, r);
  b += cloudBank(r, -40, 1640, 470, 80, "#e8b0a0", "#fff4d0", 0.6, 120);
  b += `<circle cx="${SX}" cy="${SY}" r="150" fill="${c.glow("#ffffff", 1, 0.8)}"/><circle cx="${SX}" cy="${SY}" r="56" fill="#fffdf2"/>`;
  // 멀리 솔레인 지붕(금빛 안개)
  let city = "M0 900V650";
  for (let x = 0; x <= 1600; x += 22 + Math.floor(r() * 26)) city += `L${x} ${Math.round(640 - r() * 50)}L${x + 11} ${Math.round(630 - r() * 60)}`;
  b += fl(city + "L1600 650V900Z", "#e8a080", 0.5);
  // 청탑 테라스: 푸른 기둥과 흰 난간
  b += cel("M0 0H150V900H0Z", "#3e64b0", "#142448", 3) + fl("M110 0H150V900H110Z", "#9ec2f0", 0.5) + cel("M1450 0H1600V900H1450Z", "#3e64b0", "#142448", 3) + fl("M1450 0H1490V900H1450Z", "#9ec2f0", 0.5);
  b += cel("M150 0H1450V40Q800 110 150 40Z", "#e4efff", "#4a6fb5", 3);
  let bal = "";
  for (let x = 160; x < 1450; x += 52) bal += `M${x} 760h26v80h-26z`;
  b += cel("M0 740H1600V764H0Z", "#f4f6fb", "#4a6fb5", 2.4) + cel(bal, "#e4efff", "#4a6fb5", 2) + cel("M0 836H1600V900H0Z", "#c8d6f0", "#4a6fb5", 2.4);
  // ── 인물 ──
  const rimC = "#fff3c8";
  const skS: Skin = { b: "#fde6d0", s: "#eaab90", l: "#a0574a", blush: "#f5847e", rim: rimC };
  const skN: Skin = { b: "#fbeee6", s: "#dcb4b0", l: "#7a5068", blush: "#f090a0", rim: rimC };
  const sH = hairSeoha();
  const H = hairSian();
  // 서하(왼쪽, 오른쪽을 본다)
  b += place(670, 380, 1.08, 0, true, sH.back + neck("f", skS) + seohaTorsoFantasy(rimC));
  b += place(670, 380, 1.08, 4, true, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "soft", brow: "soft", mouth: "smile", blush: 0.6, rim: [-5, -2], noNeck: true, look: [-2, -2] }) + sH.front);
  // 시안(오른쪽, 왼쪽을 본다 — 금빛 눈이 관객 쪽)
  b += place(920, 290, 1.22, 0, false, H.back + neck("m", skN) + sianTorso(rimC));
  b += place(920, 290, 1.22, -8, false, face(c, sianFace(skN, { eyes: "soft", brow: "soft", mouth: "smile", blush: 0.55, rim: [5, -2], noNeck: true, tears: 1 }, false)) + H.front);
  // 서하가 든 열린 오르골
  b += limb(600, 560, 720, 640, 50, 40, DRESS.b, DRESS.l, DRESS.s, 10);
  b += place(790, 640, 0.9, 0, false, musicBox(c));
  b += place(720, 650, 0.9, 190, false, mitt(skS.b, skS.s, skS.l, false)) + place(862, 650, 0.9, -10, true, mitt(skS.b, skS.s, skS.l, false));
  // 떠오르는 음표와 금빛 입자
  for (let i = 0; i < 7; i++) b += note(700 + i * 34 + r() * 20, 560 - i * 40 - r() * 20, 1.4 + r() * 0.8, i % 2 ? "#fff6d0" : "#ffe6a0", ` opacity=".85"`);
  for (let i = 0; i < 8; i++) b += `<g ${A(p, "up", r() * 7, 6 + r() * 3)}>${note(720 + r() * 160, 520 - r() * 200, 1.2, "#fffbe8")}</g>`;
  b += sandStream(c, r, () => [600 + r() * 420, 200 + r() * 460], 160, 12, "up");
  b += `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#6a8ad0", 0.12], [0.6, "#ffd9a0", 0.1], [1, "#ffc070", 0.2]])}" style="mix-blend-mode:screen"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_s_bad — 햇살 드는 아이 방. 열네 살 시안과 살아 있는 열 살 리아나, 오르골. 창밖은 잿빛 하늘.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_s_bad cgSBad
function cgSBad(): string {
  const c = new Ctx("cg-s-bad");
  const p = c.p;
  const r = rng(9009);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#fff6e4"], [1, "#f6dcb0"]])}"/>`;
  // 벽지 무늬(작은 별)
  let wp = "";
  for (let y = 40; y < 640; y += 90) for (let x = (y / 90) % 2 ? 40 : 85; x < 1600; x += 90) wp += `M${x} ${y - 6}l2 4l4 2l-4 2l-2 4l-2 -4l-4 -2l4 -2z`;
  b += fl(wp, "#e4c89c", 0.6);
  // 창(가운데): 창밖은 잿빛 하늘과 회색 해, 재
  b += cel("M560 80H1040V500H560Z", "#8a8784", "#7a5a38", 14);
  b += fl("M567 87H1033V493H567Z", c.lgu(0, 80, 0, 500, [[0, "#6a6764"], [1, "#a8a39c"]]));
  b += `<circle cx="900" cy="200" r="44" fill="#c9c4bc"/><circle cx="900" cy="200" r="120" fill="${c.glow("#d8d4cc", 0.4, 0.12)}"/>`;
  b += fl("M567 420C660 380 760 410 860 390C940 376 1000 400 1033 390V493H567Z", "#5d5a58");
  const ashW: Pt[] = [];
  for (let i = 0; i < 60; i++) ashW.push([575 + r() * 450, 95 + r() * 390]);
  b += dots(ashW, 4, "#d4d0ca", 0.7);
  for (let i = 0; i < 10; i++) b += `<path d="M${Math.round(580 + r() * 440)} ${Math.round(100 + r() * 300)}l6 -2l-2 7z" fill="#e4e0da" ${A(p, "dn", r() * 6, 6 + r() * 3)}/>`;
  b += ln("M800 80V500M560 290H1040", "#7a5a38", 10);
  // 커튼(햇살 색)
  b += cel("M470 60C520 200 520 400 480 560H580C560 400 560 200 590 60Z", "#f4f0f8", "#a898b8", 2.4) + cel("M1130 60C1080 200 1080 400 1120 560H1020C1040 400 1040 200 1010 60Z", "#f4f0f8", "#a898b8", 2.4);
  // 방 안의 따뜻한 햇살(창과 무관하게 — 기묘한 대비)
  b += fl("M0 0L520 0L900 900H0Z", "#fff6d8", 0.35);
  b += `<circle cx="300" cy="200" r="600" fill="${c.glow("#fff4d0", 0.6, 0.25)}"/>`;
  // 선반의 인형과 작은 신발
  b += cel("M80 300H420V316H80Z", "#c89a6a", "#6a4a2a", 2) + cel("M1180 300H1520V316H1180Z", "#c89a6a", "#6a4a2a", 2);
  b += cel("M140 300C130 260 150 230 170 230C190 230 210 260 200 300Z", "#f0b8c8", "#8a4a5a", 2) + `<circle cx="170" cy="222" r="20" fill="#fde8d6" stroke="#a0594a" stroke-width="2"/>` + cel("M150 214C150 196 190 196 190 214C186 206 154 206 150 214Z", "#e8c060", "#7a5414", 1.6);
  b += cel("M1240 300c0 -20 30 -20 40 -8c6 8 0 8 -6 8zM1300 300c0 -20 30 -20 40 -8c6 8 0 8 -6 8z", "#8ab0e8", "#2a4a88", 1.8);
  b += cel("M1400 300v-50h70v50z", "#f4ecf8", "#6a5a8a", 2);
  // 침대
  b += cel("M300 640H1300V900H300Z", "#f8f4ee", "#b8a890", 3) + fl("M300 700H1300V900H300Z", "#e8dcc8") + cel("M260 560H340V900H260Z", "#c89a6a", "#6a4a2a", 3) + cel("M1260 560H1340V900H1260Z", "#c89a6a", "#6a4a2a", 3);
  b += cel("M360 600C420 570 560 570 600 610C560 640 420 640 360 600Z", "#ffffff", "#c8b8a0", 2);
  // ── 아이들 ──
  const skL: Skin = { b: "#fff0e2", s: "#f0c4ac", l: "#a8645a", blush: "#ff9a96", rim: "#fffbe8" };
  const skY: Skin = { b: "#fbeee6", s: "#e0bcb4", l: "#8a5a6a", blush: "#f09aa8", rim: "#fffbe8" };
  // 리아나(왼쪽, 오른쪽을 본다): 흰 잠옷, 오르골을 무릎에
  const LH = hairLiana();
  const nightD = "M-20 118C-40 128 -58 134 -70 150C-80 168 -84 210 -86 270L-92 900H112L106 270C104 210 100 168 90 152C78 136 56 128 30 116Z";
  b += place(712, 440, 0.88, 0, true, LH.back + neck("c", skL) + cel(nightD, "#ffffff", "#9a8aa8", 2.6) + fl("M56 150C80 170 96 210 100 270L108 900H56Z", "#e4dcef") + cel("M-30 120C-10 150 30 150 44 116L50 130C30 166 -16 166 -36 132Z", "#f4f0fa", "#9a8aa8", 1.8) + cel("M-10 150l14 10l14 -10l-4 16l-10 -4l-10 4z", "#6aa0e8", "#2a4a88", 1.6));
  b += place(712, 440, 0.88, 6, true, face(c, { sex: "c", skin: skL, near: IRIS.sky, far: IRIS.sky, lash: "#4a3a20", eyes: "happy", mouth: "laugh", blush: 0.7, noNeck: true, rim: [-4, -2] }) + LH.front);
  // 소년 시안(오른쪽, 왼쪽을 본다): 흰 셔츠 + 푸른 조끼, 웃는데 눈물 한 줄
  const YH = hairSian({ child: true });
  const vest: Cloth = { b: "#4a6fb5", s: "#2e4a88", l: "#142448" };
  b += place(920, 340, 1.05, 0, false, YH.back + neck("c", skY) + `<g transform="translate(6 0) scale(.86 1)">` + cel(femTorsoD(900), "#f8f8fc", "#7a84a8", 2.6) + cel("M-90 170C-96 260 -100 400 -104 900H-10C-14 600 -16 400 -20 160Z", vest.b, vest.l, 2.4) + cel("M110 170C118 260 124 400 130 900H40C40 600 36 400 30 160Z", vest.b, vest.l, 2.4) + `</g>` + cel("M-26 118C-6 150 24 150 40 114L48 128C26 166 -14 166 -34 132Z", "#ffffff", "#7a84a8", 1.8));
  b += place(920, 340, 1.05, -6, false, face(c, { sex: "c", skin: skY, near: IRIS.gold, far: IRIS.steel, lash: "#2a3450", browC: "#8a96b8", eyes: "soft", brow: "sad", mouth: "smile", tears: 2, blush: 0.5, noNeck: true, rim: [5, -2], nearEyeExtra: dialIris() }) + YH.front);
  // 오르골(리아나의 무릎 위) + 음표
  b += place(800, 690, 1.0, 0, false, musicBox(c));
  b += place(724, 700, 0.85, 190, false, mitt(skL.b, skL.s, skL.l, false)) + place(876, 700, 0.85, -10, true, mitt(skL.b, skL.s, skL.l, false));
  for (let i = 0; i < 6; i++) b += `<g ${A(p, "up", r() * 7, 6 + r() * 3)}>${note(740 + r() * 140, 600 - r() * 140, 1.3, "#d8a848")}</g>`;
  // 햇살 속 먼지
  const dust: Pt[] = [];
  for (let i = 0; i < 70; i++) dust.push([r() * 700, r() * 800]);
  b += dots(dust, 3, "#fffbe8", 0.8);
  b += `<rect width="1600" height="900" fill="${c.rg([[0.6, "#000", 0], [1, "#5a3a10", 0.22]])}"/>`;
  return svg(c, b);
}

/** 재의 왕 상반신(로컬: 왼쪽을 봄): 검회색 넝마 망토, 가장자리가 재로 부서짐 */
function ashTorso(r: () => number, bot = 900): string {
  let edge = "";
  for (let y = 200; y < bot; y += 40) edge += `L${n1(196 + r() * 30)} ${y}L${n1(180 + r() * 10)} ${y + 20}`;
  let s = cel(`M40 108C90 126 150 140 180 180${edge}L200 ${bot}H-230L-208 330C-206 260 -198 206 -172 174C-140 140 -80 128 -30 110Z`, "#3a3836", "#121010", 2.8);
  s += fl(`M80 140C130 160 170 200 180 260L190 ${bot}H90C100 ${bot - 300} 100 400 80 140Z`, "#262422");
  s += ln("M-120 200C-130 400 -140 600 -150 900M-40 180C-44 400 -50 600 -54 900M60 190C66 400 70 600 76 900", "#121010", 2, 0.6);
  // 금 간 자국(재처럼 갈라짐)
  s += ln("M-30 112L-20 140L-34 160M50 110L44 134L58 150", "#8a8784", 2, 0.8);
  return s;
}

/** 재의 왕 맨얼굴의 갈라진 금(뺨·목) */
function ashCracks(): string {
  return ln("M30 50L40 62L34 74L46 86M-44 40L-38 54L-46 64M10 112L18 130L10 146M-6 120L-14 136", "#5a5654", 1.8, 0.85) + ln("M30 50L40 62L34 74", "#d8d4ce", 0.8, 0.6);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_two_kings — 틈새의 방. 잿빛 왕좌 앞에서 마주 선 젊은 엘리오스와 가면을 벗은 재의 왕, 그 사이의 서하. 위로 오르는 모래.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_two_kings cgTwoKings
function cgTwoKings(): string {
  const c = new Ctx("cg-two-kings");
  const p = c.p;
  const r = rng(1111);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#1b1a22"], [0.6, "#2d2a35"], [1, "#141218"]])}"/>`;
  // 큰 아치 창 — 끝없는 잿빛 새벽
  b += cel("M480 640V260Q800 -20 1120 260V640Z", c.lgu(0, 60, 0, 640, [[0, "#6a6764"], [0.6, "#a8a39c"], [1, "#8a8784"]]), "#0e0d12", 16);
  b += `<circle cx="800" cy="330" r="60" fill="#c9c4bc"/><circle cx="800" cy="330" r="220" fill="${c.glow("#d8d4cc", 0.45, 0.15)}"/>`;
  b += fl("M480 560C600 520 700 548 800 530C900 512 1000 540 1120 520V640H480Z", "#5d5a58");
  b += ln("M800 60V640", "#0e0d12", 10);
  // 재의 왕좌(창 앞, 실루엣)
  b += cel("M690 660V440C690 400 720 380 740 370L760 330L780 360L800 300L820 360L840 330L860 370C880 380 910 400 910 440V660Z", "#2e2c34", "#08080c", 4) + fl("M710 660V520H890V660Z", "#1e1c24");
  b += ln("M740 380L750 430M860 380L850 430M800 320V380", "#5a5860", 3, 0.7);
  // 바닥: 부서진 시계 문자판들
  b += fl("M0 640H1600V900H0Z", "#24222a");
  let dialsF = "";
  for (let i = 0; i < 9; i++) {
    const x = r() * 1600, y = 680 + r() * 200, rr = 20 + r() * 40;
    dialsF += `<ellipse cx="${Math.round(x)}" cy="${Math.round(y)}" rx="${Math.round(rr)}" ry="${Math.round(rr * 0.35)}" fill="#5a5856" stroke="#c8a050" stroke-width="2" opacity=".7"/>`;
  }
  b += dialsF;
  // 공중에 멈춘 톱니
  for (let i = 0; i < 8; i++) {
    const gx = 100 + r() * 1400, gy = 80 + r() * 400, gr = 14 + r() * 30;
    if (gx > 520 && gx < 1080) continue;
    let d = "";
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const R = k % 2 ? gr : gr * 1.25;
      d += `${k ? "L" : "M"}${n1(gx + Math.cos(a) * R)} ${n1(gy + Math.sin(a) * R)}`;
    }
    b += cel(d + "Z", "#5a5040", "#1a160e", 2) + `<circle cx="${n1(gx)}" cy="${n1(gy)}" r="${n1(gr * 0.35)}" fill="#1b1a22"/>`;
  }
  // ── 인물 ──
  const skY: Skin = { b: "#f0e4dc", s: "#bca8a8", l: "#5a3e44", blush: "#e0909a", rim: "#ffe6a0" };
  const skA: Skin = { b: "#d8d2cc", s: "#9e9894", l: "#3e3a3a", blush: "#b89898", rim: "#ffe6a0" };
  const skS: Skin = { b: "#f2e0d4", s: "#c8a494", l: "#7a4a42", blush: "#e8908c", rim: "#ffe6a0" };
  // 젊은 엘리오스(왼쪽, 오른쪽을 본다 — 가까운 눈 = 그의 오른눈 = 금)
  const eH = hairElios({ streaks: 4 });
  b += place(650, 270, 1.2, 0, true, eH.back + neck("m", skY) + eliosTorso("#ffe6a0"));
  b += place(650, 270, 1.2, 3, true, elfEar(skY) + face(c, { sex: "m", skin: skY, near: IRIS.gold, far: IRIS.red, lash: "#0a0a14", eyes: "open", brow: "knit", mouth: "n", blush: 0.2, rim: [-5, -2], noNeck: true }) + eH.front);
  // 재의 왕(오른쪽, 왼쪽을 본다 — 가까운 눈에 붉은빛이 조금)
  const aH = hairAged();
  b += place(950, 260, 1.22, 0, false, aH.back + neck("m", skA) + ashTorso(rng(12)));
  b += place(950, 260, 1.22, -3, false, elfEar(skA) + face(c, { sex: "m", thin: true, skin: skA, near: IRIS.ashRed, far: IRIS.ash, lash: "#2a2628", eyes: "soft", brow: "sad", mouth: "n", blush: 0, rim: [5, -2], noNeck: true, extra: ashCracks() }) + aH.front);
  // 서하(가운데, 조금 뒤, 관객을 향해 두 사람을 번갈아)
  const sH = hairSeoha();
  b += place(800, 420, 0.95, 0, false, sH.back + neck("f", skS) + seohaTorsoFantasy("#ffe6a0"));
  b += place(800, 420, 0.95, 0, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "open", brow: "sad", mouth: "part", blush: 0.3, noNeck: true, bags: true, look: [3, 0] }) + sH.front);
  // 재의 왕의 몸에서 부서져 오르는 재 조각
  for (let i = 0; i < 12; i++) b += `<path d="M${Math.round(1100 + r() * 120)} ${Math.round(400 + r() * 400)}l9 -3l-3 10z" fill="#8a8784" ${A(p, "up", r() * 7, 6 + r() * 3)}/>`;
  // 위로 떨어지는 금빛 모래(전체)
  b += sandStream(c, r, () => [r() * 1600, r() * 900], 260, 16, "up");
  b += `<rect width="1600" height="900" fill="${c.rg([[0.45, "#000", 0], [1, "#000", 0.55]])}"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_shatter — 밤, 시계의 집 옥상. 망치로 내리친 금빛 모래시계가 파편과 모래로 터지고,
// 엘리오스가 서하의 손을 잡는다.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_shatter cgShatter
function cgShatter(): string {
  const c = new Ctx("cg-shatter");
  const p = c.p;
  const r = rng(1212);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#0a0e24"], [0.6, "#1a2448"], [1, "#2a2a40"]])}"/>`;
  const st: Pt[] = [];
  for (let i = 0; i < 220; i++) st.push([r() * 1600, Math.pow(r(), 1.5) * 560]);
  b += dots(st, 2, "#e4e8ff", 0.7);
  b += `<circle cx="1320" cy="140" r="48" fill="#f4f0e0"/><circle cx="1320" cy="140" r="200" fill="${c.glow("#e4e8ff", 0.35, 0.1)}"/>`;
  // 왕성의 지붕과 여명탑(멀리)
  b += fl("M0 640L200 600L300 620L420 560L520 600V420L560 380L600 420V600L700 580L900 620L1100 570L1300 610L1600 580V900H0Z", "#141a34");
  b += fl("M540 420H580V200L560 150L540 200Z", "#1e2648") + `<circle cx="560" cy="240" r="14" fill="#c8a050" opacity=".7"/>`;
  // 옥상 바닥(담쟁이 난간)
  b += cel("M0 700L1600 680V900H0Z", "#3a3448", "#14101c", 3) + fl("M0 700L1600 680V700L0 720Z", "#ffe6a0", 0.4);
  const ivy: Pt[] = [];
  for (let i = 0; i < 160; i++) ivy.push([r() * 1600, 690 + r() * 30]);
  b += dots(ivy, 7, "#2a4a34", 0.9);
  const CX = 800, CY = 500;
  b += `<circle cx="${CX}" cy="${CY}" r="560" fill="${c.glow("#ffd27a", 0.75, 0.3)}"/>`;
  b += rays(CX, CY, 30, 900, 0, Math.PI * 2, 0.025, "#ffe6a0", 0.14, r);
  // ── 인물 ──
  const rimC = "#ffe6a0";
  const skE: Skin = { b: "#f6e0d0", s: "#c89c8c", l: "#6a3c3a", blush: "#ea8a84", rim: rimC };
  const skS: Skin = { b: "#fde6d0", s: "#d8a08a", l: "#8a4a40", blush: "#f5847e", rim: rimC };
  // 서하(오른쪽, 왼쪽을 봄) — 망치를 내리친 직후
  const sH = hairSeoha();
  b += place(1010, 330, 1.12, 0, false, sH.back + neck("f", skS) + seohaTorsoFantasy(rimC));
  b += place(1010, 330, 1.12, -6, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "open", brow: "knit", mouth: "part", tears: 2, blush: 0.4, rim: [-5, -2], shade: 1, noNeck: true, look: [-4, 3] }) + sH.front);
  // 엘리오스(왼쪽, 오른쪽을 봄) — 그녀의 손을 잡는다
  const eH = hairElios({ streaks: 5 });
  b += place(600, 300, 1.2, 0, true, eH.back + neck("m", skE) + eliosTorso(rimC));
  b += place(600, 300, 1.2, 6, true, elfEar(skE) + face(c, { sex: "m", skin: skE, near: IRIS.gold, far: IRIS.red, lash: "#0a0a14", eyes: "wide", brow: "sad", mouth: "part", blush: 0.25, rim: [-5, -2], noNeck: true, look: [-3, 3] }) + eH.front);
  // ── 폭발하는 모래시계(중심 800, 470) ──
  b += `<circle cx="${CX}" cy="${CY}" r="260" fill="${c.glow("#fff6d0", 1, 0.6)}" ${A(p, "pu", 0, 2.6)}/>`;
  b += place(CX, CY, 0.9, -14, false, hourglass(c, true, "#fff6d8", 0.9));
  b += `<circle cx="${CX + 20}" cy="${CY - 70}" r="70" fill="${c.glow("#ffffff", 1, 0.9)}"/>`;
  // 파편(유리·금테)
  let shards = "";
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = 90 + r() * 360;
    const x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d * 0.8;
    if (y < 430 && (Math.abs(x - 610) < 110 || Math.abs(x - 1010) < 110)) continue;
    const s = 12 + r() * 30;
    const rot = r() * 6.28;
    const pt = (k: number, m: number): string => `${n1(x + Math.cos(rot + k) * s * m)} ${n1(y + Math.sin(rot + k) * s * m)}`;
    shards += `M${pt(0, 1)}L${pt(2.2, 0.6)}L${pt(3.6, 0.9)}L${pt(5, 0.4)}Z`;
  }
  b += cel(shards, "#fff6e0", "#c8a050", 1.6, ' fill-opacity=".85"');
  b += sandStream(c, r, () => {
    const a = r() * Math.PI * 2;
    const d = 40 + Math.pow(r(), 0.7) * 520;
    return [CX + Math.cos(a) * d, CY + Math.sin(a) * d * 0.75];
  }, 420, 24, "tw");
  // 망치: 손잡이 끝이 모래시계 위를 내리친다
  b += limb(1060, 600, 950, 580, 54, 42, DRESS.b, DRESS.l, DRESS.s, -10);
  b += `<g transform="translate(950 580) rotate(-150)">${cel("M0 -9H150V9H0Z", "#8a6a45", "#3a2e2a", 2.2)}${cel("M140 -36H196V36H140Z", "#7a7a84", "#2a2a30", 2.6)}${fl("M140 -36H196V-22H140Z", "#c8ccd8")}</g>`;
  b += place(954, 582, 1.05, 30, false, mitt(skS.b, skS.s, skS.l));
  b += limb(700, 720, 930, 640, 72, 54, COAT.b, COAT.l, COAT.s, -14);
  b += place(966, 622, 1.05, 160, false, mitt(GLOVE.b, GLOVE.s, GLOVE.l, false));
  b += `<rect width="1600" height="900" fill="${c.rg([[0.5, "#000", 0], [1, "#000", 0.5]])}"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_true — 1년 뒤, 시계탑에서 내려다본 솔레인의 금빛 새벽. 나란히 선 엘리오스와 서하,
// 바람에 날리는 흰 가닥, 아래쪽의 작은 진료소 간판과 손 흔드는 사람들의 실루엣.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_true cgTrue
function cgTrue(): string {
  const c = new Ctx("cg-true");
  const p = c.p;
  const r = rng(1313);
  const SX = 820, SY = 430;
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#4a6ab8"], [0.22, "#8aaee0"], [0.4, "#ffd2a0"], [0.5, "#ffc070"], [0.6, "#fff0c8"]])}"/>`;
  b += `<circle cx="${SX}" cy="${SY}" r="1000" fill="${c.glow("#fff2c8", 0.95, 0.42)}"/>`;
  b += rays(SX, SY, 22, 1500, -Math.PI, 0.2, 0.02, "#fffbe8", 0.16, r);
  b += cloudBank(r, -40, 1640, 300, 70, "#f0b8a0", "#fff4d0", 0.6, 130);
  b += `<circle cx="${SX}" cy="${SY}" r="160" fill="${c.glow("#ffffff", 1, 0.8)}"/><circle cx="${SX}" cy="${SY}" r="58" fill="#fffdf2"/>`;
  // 솔레인: 층층이 쌓인 흰 벽과 주황 기와(3단, 먼 곳은 안개)
  const tiers: [number, number, number, string, string][] = [
    [470, 40, 0.45, "#f2c8a8", "#e8a888"],
    [560, 56, 0.7, "#f6e4cc", "#e08a60"],
    [680, 80, 0.95, "#f3ede2", "#e0764a"],
  ];
  for (const [y0, h, op, wall, roof] of tiers) {
    let w = "";
    let sh = "";
    let rf = "";
    let wn = "";
    for (let x = -20; x < 1620; ) {
      const bw = h * (0.9 + r() * 0.9);
      const bh = h * (0.5 + r() * 0.5);
      const yy = y0 + r() * h * 0.5;
      w += `M${Math.round(x)} ${Math.round(yy)}h${Math.round(bw)}V900H${Math.round(x)}Z`;
      sh += `M${Math.round(x + bw * 0.62)} ${Math.round(yy)}h${Math.round(bw * 0.38)}V900H${Math.round(x + bw * 0.62)}Z`;
      rf += `M${Math.round(x - 6)} ${Math.round(yy + 2)}L${Math.round(x + bw * 0.25)} ${Math.round(yy - bh)}H${Math.round(x + bw * 0.75)}L${Math.round(x + bw + 6)} ${Math.round(yy + 2)}Z`;
      if (op > 0.6) for (let k = 0; k < 2; k++) wn += `M${Math.round(x + bw * (0.2 + k * 0.35))} ${Math.round(yy + h * 0.3)}h${Math.round(h * 0.14)}v${Math.round(h * 0.2)}h${-Math.round(h * 0.14)}z`;
      x += bw * (0.8 + r() * 0.15);
    }
    b += `<g opacity="${op}">${cel(w, wall, "#b8ab98", 1.4)}${fl(sh, "#d8cfc0", 0.8)}${fl(wn, "#7a5a40", 0.7)}${cel(rf, roof, "#8a3a1e", 1.6)}</g>`;
  }
  // 운하(빛나는 띠)
  b += fl("M0 760C300 740 600 770 900 750C1200 730 1400 760 1600 745V775C1400 790 1200 760 900 780C600 800 300 770 0 790Z", "#ffe6b0", 0.8);
  // 작은 진료소 간판(추상 도형: 흰 판 + 붉은 십자 대신 금빛 모래시계 모양)과 손 흔드는 사람들
  b += cel("M1150 700h70v40h-70z", "#fffaf0", "#8a6a45", 2) + fl("M1170 708h30l-12 12l12 12h-30l12 -12z", "#e0764a") + ln("M1185 740V770", "#8a6a45", 3);
  const ppl: [number, number, string][] = [[1080, 778, "#e0764a"], [1110, 782, "#3a3e48"], [1250, 780, "#7a5434"], [1280, 776, "#4a6fb5"], [1310, 784, "#f4f6fb"], [1350, 780, "#2f5a46"]];
  for (const [x, y, col] of ppl) b += fl(`M${x - 7} ${y}c0 -10 3 -16 7 -16s7 6 7 16zM${x} ${y - 24}a6 6 0 1 0 0.1 0z`, col) + ln(`M${x + 5} ${y - 12}l10 -12`, col, 3);
  for (let i = 0; i < 3; i++) b += `<g ${A(p, "sw", i * 1.3, 1.6)}>${ln(`M${[1085, 1285, 1355][i]} ${[766, 764, 768][i]}l6 -14`, "#fffbe8", 3)}</g>`;
  // 시계탑 테라스(전경): 금빛 문자판 가장자리와 난간
  let bal = "";
  for (let x = 10; x < 1600; x += 56) bal += `M${x} 832h28v60h-28z`;
  b += cel("M0 816H1600V836H0Z", "#f3ede2", "#8a7050", 2.4) + cel(bal, "#e8d8bc", "#8a7050", 2) + fl("M0 816H1600V822H0Z", "#fff0cc");
  // ── 인물: 나란히, 서로를 보며 웃는다 ──
  const rimC = "#fff3c8";
  const skE: Skin = { b: "#fbe2d0", s: "#e2a894", l: "#9a5446", blush: "#f08a82", rim: rimC };
  const skS: Skin = { b: "#fde6d0", s: "#eaab90", l: "#a0574a", blush: "#f5847e", rim: rimC };
  // 엘리오스(왼쪽, 오른쪽을 봄) — 바람에 흰 가닥이 날린다
  const eH = hairElios({ streaks: 6 });
  b += place(690, 300, 1.15, 0, true, eH.back + neck("m", skE) + eliosTorso(rimC));
  b += place(690, 300, 1.15, 4, true, elfEar(skE) + face(c, { sex: "m", skin: skE, near: IRIS.gold, far: IRIS.red, lash: "#0a0a14", eyes: "soft", brow: "soft", mouth: "smile", blush: 0.45, rim: [-5, -2], noNeck: true, look: [-2, 0] }) + eH.front);
  // 바람에 날리는 흰·검은 가닥(움직임)
  const windW = "M50 -50C80 -60 110 -56 140 -70M54 -40C84 -44 112 -40 136 -50M56 -30C80 -30 100 -24 124 -30";
  const windB = "M58 -18C86 -18 110 -10 134 -16M60 -6C84 -4 104 4 126 0";
  b += place(690, 300, 1.15, 4, true, `<g ${A(p, "sw", 0, 4)}>${ln(windW, HAIR_WHITE.l, 6)}${ln(windW, HAIR_WHITE.b, 3.4)}${ln(windB, HAIR_ELIOS.l, 6)}${ln(windB, HAIR_ELIOS.b, 3)}</g>`);
  // 서하(오른쪽, 왼쪽을 봄)
  const sH = hairSeoha();
  b += place(930, 370, 1.05, 0, false, sH.back + neck("f", skS) + seohaTorsoFantasy(rimC));
  b += place(930, 370, 1.05, -4, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "soft", brow: "soft", mouth: "smile", blush: 0.6, rim: [5, -2], noNeck: true, look: [-2, -2] }) + sH.front);
  // 금빛 입자(바람)
  b += sandStream(c, r, () => [400 + r() * 900, 150 + r() * 500], 160, 14, "up");
  b += `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#6a8ad0", 0.12], [0.5, "#ffd9a0", 0.08], [1, "#ffc070", 0.2]])}" style="mix-blend-mode:screen"/>`;
  return svg(c, b);
}

// ────────────────────────────────────────────────────────────────────────────
// cg_return — 서울, 병원 옥상, 새벽 4시 44분. 따뜻한 캔커피와 휴대폰을 든 서하가
// 하늘을 본다. 희미하게 반짝이는 금빛 한 알.
// ────────────────────────────────────────────────────────────────────────────
//@id cg_return cgReturn
function cgReturn(): string {
  const c = new Ctx("cg-return");
  const p = c.p;
  const r = rng(1414);
  let b = `<rect width="1600" height="900" fill="${c.lgu(0, 0, 0, 900, [[0, "#1d2d4f"], [0.45, "#4f6fa3"], [0.7, "#a8a0b8"], [0.82, "#f0b89a"], [1, "#f6d0b0"]])}"/>`;
  const st: Pt[] = [];
  for (let i = 0; i < 60; i++) st.push([r() * 1600, Math.pow(r(), 1.6) * 320]);
  b += dots(st, 1.8, "#e4ecff", 0.6);
  b += `<ellipse cx="800" cy="760" rx="1000" ry="260" fill="${c.glow("#ffd8b8", 0.6, 0.25)}"/>`;
  // 금빛 한 알(하늘)
  b += `<circle cx="640" cy="170" r="60" fill="${c.glow("#ffe6a0", 0.8, 0.3)}" ${A(p, "pu", 0, 3)}/>` + sparkAt(c, 640, 170, 16, "#fff6d0", A(p, "tw", 1, 3.4)) + `<circle cx="640" cy="170" r="3" fill="#fffbe8"/>`;
  // 서울 스카이라인(아파트, 한강 다리, 산 위의 탑)
  b += fl("M0 640C200 600 380 560 520 590C600 600 700 560 800 580L1600 600V900H0Z", "#3a4a72", 0.6);
  b += fl("M1180 560L1186 470L1176 470L1196 430L1216 470L1206 470L1212 560Z", "#2e3c62");
  let sky = "M0 900V700";
  let win = "";
  for (let x = 0; x < 1600; ) {
    const w = 40 + r() * 70;
    const h = 60 + r() * 140;
    sky += `V${Math.round(700 - h)}H${Math.round(x + w)}`;
    for (let k = 0; k < 6; k++) if (r() < 0.35) win += `M${Math.round(x + 8 + r() * (w - 16))} ${Math.round(700 - h + 12 + r() * (h - 20))}h4`;
    x += w;
  }
  b += fl(sky + "V900Z", "#1e2a48") + ln(win, "#ffd8a0", 3, 0.8);
  b += fl("M0 740H1600V760H0Z", "#e8b898", 0.5) + ln("M0 744C200 730 400 730 600 744M900 744C1100 730 1300 730 1500 744", "#2e3c62", 3);
  // 옥상 난간과 바닥
  b += fl("M0 760H1600V900H0Z", "#2a3048") + ln("M0 760H1600", "#6a7aa0", 6);
  let rail = "";
  for (let x = 20; x < 1600; x += 80) rail += `M${x} 700V760`;
  b += ln("M0 700H1600" + rail, "#4a5678", 5);
  // 자판기(왼쪽, 불빛)
  b += cel("M120 420H300V780H120Z", "#c8d0e0", "#2a3048", 3) + fl("M140 440H280V600H140Z", "#fff4d8", 0.95) + `<rect x="120" y="420" width="180" height="360" fill="${c.glow("#fff0d0", 0.4, 0.1)}"/>`;
  let cans = "";
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) cans += `M${152 + i * 32} ${460 + k * 70}h18v40h-18z`;
  b += fl(cans, "#c84a4a", 0.8);
  // ── 서하: 남색 스크럽 + 회색 후드 집업, ID 줄. 하늘(왼쪽 위)을 올려다본다 ──
  const skS: Skin = { b: "#f6dccc", s: "#c8a0a0", l: "#7a4a4a", blush: "#ec8a8a", rim: "#ffd8b8" };
  const sH = hairSeoha();
  const X = 860, Y = 360, S = 1.15;
  const hood: Cloth = { b: "#8a8e98", s: "#666a76", l: "#2a2e38" };
  let body = cel(femTorsoD(900), hood.b, hood.l, 2.6) + fl("M96 146C120 160 136 190 142 240L150 900H90C100 700 108 360 96 146Z", hood.s);
  // 스크럽(앞섶 V넥)
  body += cel("M-46 150C-56 260 -60 400 -62 900H76C72 400 66 260 56 146C40 190 20 210 4 220C-14 206 -32 186 -46 150Z", "#2a3a6a", "#101830", 2.2) + fl("M30 170C44 260 50 400 54 900H76C72 400 66 260 56 146Z", "#1e2a50");
  body += cel("M-30 134C-20 180 -6 206 4 222C18 206 34 180 44 130C30 150 16 160 4 162C-10 160 -22 150 -30 134Z", skS.b, skS.l, 2);
  // 후드(목 뒤) + 지퍼 + 끈
  body += cel("M-40 120C-70 110 -90 130 -96 160C-80 150 -60 146 -44 150Z", hood.b, hood.l, 2) + cel("M50 110C84 104 104 124 110 156C92 146 72 142 58 146Z", hood.b, hood.l, 2);
  body += ln("M-56 160C-62 260 -64 400 -66 900M74 156C80 260 82 400 84 900", "#c8ccd4", 2, 0.8) + ln("M-30 160V260M40 160V250", "#e8eaf0", 2);
  // 목걸이 ID카드 줄
  body += ln("M-30 130C-24 190 -6 240 4 270M44 126C36 190 18 240 8 270", "#4a8a6a", 3) + cel("M-16 270h44v56h-44z", "#ffffff", "#5a6a7a", 1.8) + fl("M-10 280h14v16h-14z", "#9ab0c8") + ln("M10 284h12M10 292h10M-10 306h32M-10 314h26", "#8a96a8", 1.6);
  b += place(X, Y, S, 0, false, sH.back + neck("f", skS) + body);
  b += place(X, Y, S, 14, false, face(c, { sex: "f", skin: skS, near: IRIS.brown, far: IRIS.brown, lash: "#1a0e0e", eyes: "soft", brow: "soft", mouth: "soft", blush: 0.4, rim: [5, -3], noNeck: true, bags: true, look: [-3, -5], tears: 1 }) + sH.front);
  // 캔커피(가슴께, 두 손 중 오른손으로 감싸 쥠, 김)와 휴대폰(왼손, 화면 빛)
  b += limb(990, 590, 944, 700, 60, 48, hood.b, hood.l, hood.s, -14);
  b += cel("M846 650h48v80h-48z", "#c8a070", "#4a3420", 2) + fl("M846 666h48v20h-48z", "#3a2a1a") + fl("M850 652h8v76h-8z", "#fff0d8", 0.6) + cel("M846 646h48v8h-48z", "#d8d8dc", "#4a4a50", 1.4);
  b += place(944, 698, 1.0, 0, false, mitt(skS.b, skS.s, skS.l));
  for (let i = 0; i < 3; i++) b += `<path d="M${856 + i * 12} 636c-8 -14 8 -22 0 -36" fill="none" stroke="#ffffff" stroke-width="3" opacity=".5" ${A(p, "up", i * 1.2, 4)}/>`;
  b += limb(770, 580, 740, 740, 56, 46, hood.b, hood.l, hood.s, 12);
  b += place(744, 742, 0.95, 160, false, mitt(skS.b, skS.s, skS.l));
  b += `<g transform="translate(772 726) rotate(-16)">${cel("M-20 -36h40v72h-40z", "#1a1e28", "#05060a", 2)}${fl("M-16 -30h32v58h-32z", "#5a7ab0")}${fl("M-12 -26h10v6h-10z", "#e8c060")}</g>`;
  b += `<circle cx="772" cy="726" r="70" fill="${c.glow("#a8c8ff", 0.35, 0.1)}"/>`;
  b += `<rect x="120" y="420" width="180" height="360" fill="${c.glow("#fff0d0", 0.5, 0.15)}"/>`;
  b += `<rect width="1600" height="900" fill="${c.rg([[0.5, "#000", 0], [1, "#0a1020", 0.45]])}"/>`;
  return svg(c, b);
}
export const CGS_B: Record<string, string> = {
  cg_e_good: cgEGood(),
  cg_e_bad: cgEBad(),
  cg_r_back: cgRBack(),
  cg_r_good: cgRGood(),
  cg_r_bad: cgRBad(),
  cg_s_eye: cgSEye(),
  cg_s_blade: cgSBlade(),
  cg_s_good: cgSGood(),
  cg_s_bad: cgSBad(),
  cg_two_kings: cgTwoKings(),
  cg_shatter: cgShatter(),
  cg_true: cgTrue(),
  cg_return: cgReturn(),
};
