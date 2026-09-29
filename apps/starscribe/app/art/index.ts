// 그림 모듈을 한데 모읍니다. 없는 id는 검은 화면으로 대신합니다.
import { CITY_BACKGROUNDS } from "./bg-city";
import { WORLD_BACKGROUNDS } from "./bg-world";
import { CGS } from "./cgs";
import { characterSvg as drawCharacter } from "./characters";

const BLANK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="900" fill="#05060d"/></svg>`;

const BACKGROUNDS: Record<string, string> = { ...CITY_BACKGROUNDS, ...WORLD_BACKGROUNDS };

export function backgroundSvg(id: string): string {
  return BACKGROUNDS[id] ?? BLANK;
}

export function cgSvg(id: string): string {
  return CGS[id] ?? BLANK;
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
