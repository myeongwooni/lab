// 대사 한 줄의 인라인 표기를 글자 단위 조각으로 나눕니다.
//   [본문|루비]  루비(윗글자)    *강조*  강조    {w}  타자 중 잠깐 멈춤
export type Piece =
  | { t: "ch"; ch: string; em: boolean }
  | { t: "ruby"; base: string; rt: string; em: boolean }
  | { t: "pause"; ms: number };

export function tokenize(text: string): Piece[] {
  const out: Piece[] = [];
  let em = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "*") {
      em = !em;
      continue;
    }
    if (c === "{" && text.startsWith("{w}", i)) {
      out.push({ t: "pause", ms: 420 });
      i += 2;
      continue;
    }
    if (c === "[") {
      const close = text.indexOf("]", i);
      const bar = text.indexOf("|", i);
      if (close > i && bar > i && bar < close) {
        out.push({ t: "ruby", base: text.slice(i + 1, bar), rt: text.slice(bar + 1, close), em });
        i = close;
        continue;
      }
    }
    out.push({ t: "ch", ch: c, em });
  }
  return out;
}

// 타자 효과에서 셀 글자 수(멈춤 제외). 루비는 한 덩어리로 칩니다.
export function visibleCount(pieces: Piece[]): number {
  return pieces.reduce((n, p) => n + (p.t === "pause" ? 0 : 1), 0);
}

// 백로그·세이브 미리보기용 평문
export function plain(text: string): string {
  return text.replace(/\{w\}/g, "").replace(/\*/g, "").replace(/\[([^|\]]+)\|[^\]]+\]/g, "$1");
}
