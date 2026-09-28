"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { COLS, ROWS, initialState, landing, level, reducer, tickMs } from "./game";
import { type Tile, jamoTile, tileText } from "./hangul";

const BEST_KEY = "jamotris:best";
const BOOK_KEY = "jamotris:words";
const CLEAR_MS = 420;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장이 막힌 브라우저에서도 게임은 그대로 할 수 있게 조용히 넘어갑니다.
  }
}

function TileFace({ tile, className = "" }: { tile: Tile; className?: string }) {
  return <span className={`tile is-${tile.kind} ${className}`}>{tileText(tile)}</span>;
}

function Mini({ ch, label }: { ch: string | null; label: string }) {
  return (
    <div className="mini">
      <span className="mini-label">{label}</span>
      {ch ? <TileFace tile={jamoTile(ch)} /> : <span className="tile is-empty" />}
    </div>
  );
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [best, setBest] = useState(0);
  const [book, setBook] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const saved = useRef(false);

  useEffect(() => {
    setBest(read(BEST_KEY, 0));
    setBook(read<string[]>(BOOK_KEY, []));
  }, []);

  // 떨어지는 박자는 레벨이 오를수록 빨라집니다.
  const speed = tickMs(state);
  useEffect(() => {
    if (state.phase !== "playing") return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), speed);
    return () => window.clearInterval(id);
  }, [state.phase, speed]);

  useEffect(() => {
    if (state.phase !== "clearing") return;
    const id = window.setTimeout(() => dispatch({ type: "settle" }), CLEAR_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.flash?.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const keys: Record<string, Parameters<typeof dispatch>[0]> = {
        ArrowLeft: { type: "move", dx: -1 },
        ArrowRight: { type: "move", dx: 1 },
        ArrowDown: { type: "soft" },
        ArrowUp: { type: "drop" },
        " ": { type: "drop" },
        c: { type: "hold" },
        C: { type: "hold" },
        Shift: { type: "hold" },
      };
      if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        dispatch({ type: state.phase === "paused" ? "resume" : "pause" });
        return;
      }
      // 끝난 판에서는 떨구던 스페이스가 곧장 새 판을 열지 않도록 엔터만 받습니다.
      const restart = event.key === "Enter" || (event.key === " " && state.phase === "ready");
      if (restart && (state.phase === "ready" || state.phase === "over")) {
        event.preventDefault();
        dispatch({ type: "start" });
        return;
      }
      const action = keys[event.key];
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    };
    const onHide = () => document.hidden && dispatch({ type: "pause" });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [state.phase]);

  // 게임이 끝나면 최고 점수와 단어장을 한 번만 저장합니다.
  useEffect(() => {
    if (state.phase !== "over") {
      saved.current = false;
      return;
    }
    if (saved.current) return;
    saved.current = true;
    if (state.score > best) {
      setBest(state.score);
      write(BEST_KEY, state.score);
    }
    const merged = [...new Set([...book, ...state.words])];
    if (merged.length !== book.length) {
      setBook(merged);
      write(BOOK_KEY, merged);
    }
  }, [state.phase, state.score, state.words, best, book]);

  const ghost = state.piece ? landing(state.board, state.piece) : null;
  const isActive = state.phase === "playing" || state.phase === "clearing" || state.phase === "paused";

  async function share() {
    const words = [...new Set(state.words)].slice(0, 8).join(", ");
    const text = `자모트리스 ${state.score.toLocaleString()}점!${words ? ` 만든 단어: ${words}` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "자모트리스", text, url: location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // 공유 창을 닫은 경우도 여기로 옵니다.
    }
  }

  return (
    <main>
      <header className="title">
        <h1>
          자모<span>트리스</span>
        </h1>
        <p>떨어지는 자모를 쌓아 글자를, 글자를 이어 단어를</p>
      </header>

      <section className="hud" aria-label="점수">
        <div>
          <span>점수</span>
          <b>{state.score.toLocaleString()}</b>
        </div>
        <div>
          <span>레벨</span>
          <b>{level(state)}</b>
        </div>
        <div>
          <span>단어</span>
          <b>{state.words.length}</b>
        </div>
        <div>
          <span>최고</span>
          <b>{Math.max(best, state.score).toLocaleString()}</b>
        </div>
      </section>

      <div className="play">
        <aside className="side">
          <Mini ch={state.hold} label="보관" />
          <button
            type="button"
            className="key is-small"
            onClick={() => dispatch({ type: "hold" })}
            disabled={!isActive || !state.canHold}
          >
            바꾸기
          </button>
        </aside>

        <div className="well">
          <div
            className="board"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
          >
            {state.board.map((line, r) =>
              line.map((tile, c) => {
                const piece = state.piece;
                const isPiece = piece && piece.row === r && piece.col === c;
                const isGhostSpot = ghost && piece && piece.col === c && !ghost.merged && ghost.row === r && !isPiece;
                const isMergeSpot = ghost?.merged && piece && piece.col === c && ghost.row + 1 === r;
                const isClearing = state.clearing?.has(`${r}:${c}`);
                return (
                  <button
                    type="button"
                    key={`${r}:${c}`}
                    className={`cell${isClearing ? " is-clearing" : ""}${piece?.col === c ? " is-lane" : ""}`}
                    onClick={() => dispatch({ type: "moveTo", col: c })}
                    tabIndex={-1}
                    aria-label={`${c + 1}번째 칸`}
                  >
                    {isPiece ? (
                      <TileFace tile={jamoTile(piece.ch)} className="is-falling" />
                    ) : isMergeSpot && ghost?.merged ? (
                      <TileFace tile={ghost.merged} className="is-preview" />
                    ) : tile ? (
                      <TileFace tile={tile} />
                    ) : isGhostSpot ? (
                      <TileFace tile={jamoTile(piece.ch)} className="is-ghost" />
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>

          {state.flash && state.phase === "clearing" && (
            <div className="flash" key={state.flash.id}>
              <b>{state.flash.text}</b>
              <span>
                +{state.flash.points}
                {state.flash.combo > 1 && ` · ${state.flash.combo}연쇄`}
              </span>
            </div>
          )}

          {state.phase === "ready" && (
            <div className="overlay">
              <h2>이렇게 놀아요</h2>
              <ol className="rules">
                <li>
                  <TileFace tile={jamoTile("ㄱ")} /> 위에 <TileFace tile={jamoTile("ㅏ")} /> →{" "}
                  <TileFace tile={{ kind: "syllable", cho: "ㄱ", jung: "ㅏ", jong: "" }} />
                </li>
                <li>
                  <TileFace tile={{ kind: "syllable", cho: "ㄱ", jung: "ㅏ", jong: "" }} /> 위에{" "}
                  <TileFace tile={jamoTile("ㅁ")} /> → <TileFace tile={{ kind: "syllable", cho: "ㄱ", jung: "ㅏ", jong: "ㅁ" }} />{" "}
                  받침
                </li>
                <li>
                  <TileFace tile={{ kind: "syllable", cho: "ㄴ", jung: "ㅏ", jong: "" }} />
                  <TileFace tile={{ kind: "syllable", cho: "ㅁ", jung: "ㅜ", jong: "" }} /> 가로·세로로 단어가 되면 펑!
                </li>
                <li>꽉 찬 줄도 사라져요. 맨 위까지 쌓이면 끝</li>
              </ol>
              <button type="button" className="key is-primary" onClick={() => dispatch({ type: "start" })}>
                시작하기
              </button>
              <p className="overlay-hint">← → 이동 · ↓ 한 칸 · 스페이스 떨구기 · C 보관 · P 멈춤 · 엔터 다시 하기</p>
            </div>
          )}

          {state.phase === "paused" && (
            <div className="overlay">
              <h2>잠깐 쉬는 중</h2>
              <button type="button" className="key is-primary" onClick={() => dispatch({ type: "resume" })}>
                이어 하기
              </button>
            </div>
          )}

          {state.phase === "over" && (
            <div className="overlay">
              <h2>쌓기 끝!</h2>
              <p className="overlay-score">
                <b>{state.score.toLocaleString()}</b>점{state.score > 0 && state.score >= best && " · 최고 기록"}
              </p>
              {state.words.length > 0 ? (
                <ul className="made">
                  {[...new Set(state.words)].map((word) => (
                    <li key={word}>{word}</li>
                  ))}
                </ul>
              ) : (
                <p className="overlay-hint">나 + 무, 사 + 자처럼 옆 칸에 글자를 이어 보세요</p>
              )}
              <div className="overlay-actions">
                <button type="button" className="key is-primary" onClick={() => dispatch({ type: "start" })}>
                  다시 하기
                </button>
                <button type="button" className="key" onClick={share}>
                  {copied ? "복사했어요" : "자랑하기"}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="side">
          <span className="mini-label">다음</span>
          <div className="next">
            {state.queue.slice(0, 4).map((ch, i) => (
              <TileFace key={i} tile={jamoTile(ch)} className={i === 0 ? "" : "is-later"} />
            ))}
          </div>
        </aside>
      </div>

      <nav className="pad" aria-label="조작">
        <button type="button" className="key" onClick={() => dispatch({ type: "move", dx: -1 })} aria-label="왼쪽">
          ◀
        </button>
        <button type="button" className="key" onClick={() => dispatch({ type: "soft" })} aria-label="한 칸 내리기">
          ▼
        </button>
        <button type="button" className="key" onClick={() => dispatch({ type: "move", dx: 1 })} aria-label="오른쪽">
          ▶
        </button>
        <button type="button" className="key is-primary is-wide" onClick={() => dispatch({ type: "drop" })}>
          떨구기
        </button>
      </nav>

      <section className="book">
        <div className="book-head">
          <h2>단어장</h2>
          <p>지금까지 만든 단어 {book.length}개</p>
        </div>
        {book.length ? (
          <ul>
            {book.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        ) : (
          <p className="book-empty">아직 비어 있어요. 첫 단어를 만들어 보세요.</p>
        )}
      </section>

      <p className="foot">칸을 누르면 그 줄로 옮겨요 · 기록은 이 브라우저에만 남아요</p>
    </main>
  );
}
