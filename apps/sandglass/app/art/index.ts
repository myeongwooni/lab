// 그림 모듈을 한데 모읍니다.
// 1) public/art 아래에 그림 파일이 있으면 그 파일(슬롯)을 씁니다 — 목록은 slots.generated.ts (빌드 때 자동 생성).
// 2) 없으면 코드로 그린 SVG를 씁니다. 없는 id는 검은 화면으로 대신합니다.
import { CITY_BACKGROUNDS } from "./bg-city";
import { WORLD_BACKGROUNDS } from "./bg-world";
import { CGS_A } from "./cgs-a";
import { CGS_B } from "./cgs-b";
import { characterSvg as drawCharacter } from "./characters";
import { ART_SLOTS } from "./slots.generated";

const BLANK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="900" fill="#05060d"/></svg>`;

const BACKGROUNDS: Record<string, string> = { ...CITY_BACKGROUNDS, ...WORLD_BACKGROUNDS };

// 단색 배경은 그림 파일 없이도 늘 같은 색입니다.
const SOLID: Record<string, string> = {
  black: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="900" fill="#030306"/></svg>`,
  white: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="900" fill="#f7f4ec"/></svg>`,
};

export function backgroundSvg(id: string): string {
  return BACKGROUNDS[id] ?? SOLID[id] ?? BLANK;
}

export function hasBackground(id: string): boolean {
  return id in BACKGROUNDS || id in ART_SLOTS.bg;
}

export function cgSvg(id: string): string {
  return CGS_A[id] ?? CGS_B[id] ?? BLANK;
}

const charCache = new Map<string, string>();

export function characterSvg(id: string, expr: string): string {
  const key = `${id}/${expr}`;
  let svg = charCache.get(key);
  if (svg === undefined) {
    svg = drawCharacter(id, expr);
    charCache.set(key, svg);
  }
  return svg;
}

// ── 그림 슬롯 ─────────────────────────────────
export function bgImage(id: string): string | null {
  return ART_SLOTS.bg[id] ?? null;
}

export function cgImage(id: string): string | null {
  return ART_SLOTS.cg[id] ?? null;
}

// 표정 그림이 없으면 그 인물의 normal 그림을, 그것도 없으면 null(=SVG)을 돌려줍니다.
export function charImage(id: string, expr: string): string | null {
  const set = ART_SLOTS.char[id];
  if (!set) return null;
  return set[expr] ?? set.normal ?? null;
}

// 곧 쓰일 그림을 미리 받아 둡니다. 같은 주소는 한 번만.
const preloaded = new Set<string>();
export function preloadImages(urls: (string | null | undefined)[]) {
  if (typeof window === "undefined") return;
  for (const u of urls) {
    if (!u || preloaded.has(u)) continue;
    preloaded.add(u);
    const img = new Image();
    img.decoding = "async";
    img.src = u;
  }
}

// 재의 왕은 가면이 벗겨진 뒤(@flag unmasked) 맨얼굴 그림을 씁니다.
export function artCharId(id: string, vars: Record<string, number | boolean>): string {
  return id === "ashking" && vars.unmasked ? "ashking_bare" : id;
}
