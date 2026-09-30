// 스탠딩을 인물별 모듈에서 골라 옵니다. 없는 인물은 빈 그림입니다.
import { CHARS_A } from "./characters-a";
import { CHARS_B } from "./characters-b";

const EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000"></svg>`;

export function characterSvg(id: string, expr: string): string {
  const draw = CHARS_A[id] ?? CHARS_B[id];
  return draw ? draw(expr) : EMPTY;
}
