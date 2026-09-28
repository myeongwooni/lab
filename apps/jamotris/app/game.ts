import { type Board, type Found, type Tile, findWords, jamoTile, merge, nextBatch } from "./hangul";

export const COLS = 7;
export const ROWS = 12;
const SPAWN_COL = 3;
const QUEUE_MIN = 6;

export type Phase = "ready" | "playing" | "paused" | "clearing" | "over";
export type Piece = { ch: string; row: number; col: number };
export type Flash = { id: number; text: string; points: number; combo: number };

export type State = {
  phase: Phase;
  board: Board;
  piece: Piece | null;
  queue: string[];
  hold: string | null;
  canHold: boolean;
  score: number;
  words: string[];
  rows: number;
  combo: number;
  clearing: Set<string> | null;
  flash: Flash | null;
};

export type Action =
  | { type: "start" }
  | { type: "tick" }
  | { type: "move"; dx: number }
  | { type: "moveTo"; col: number }
  | { type: "soft" }
  | { type: "drop" }
  | { type: "hold" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "settle" };

const cellKey = (row: number, col: number) => `${row}:${col}`;

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null));
}

export function initialState(): State {
  return {
    phase: "ready",
    board: emptyBoard(),
    piece: null,
    queue: [],
    hold: null,
    canHold: true,
    score: 0,
    words: [],
    rows: 0,
    combo: 0,
    clearing: null,
    flash: null,
  };
}

export function level(state: Pick<State, "words" | "rows">) {
  return 1 + Math.floor((state.words.length + state.rows) / 4);
}

export function tickMs(state: Pick<State, "words" | "rows">) {
  return Math.max(150, 850 - (level(state) - 1) * 70);
}

function fill(queue: string[]) {
  const next = [...queue];
  while (next.length < QUEUE_MIN) next.push(...nextBatch());
  return next;
}

/** 조각이 멈출 줄. 그 아래 칸과 합쳐질 수 있으면 합쳐질 칸도 알려 줍니다. */
export function landing(board: Board, piece: Piece) {
  let row = piece.row;
  while (row + 1 < ROWS && !board[row + 1][piece.col]) row += 1;
  const below = row + 1 < ROWS ? board[row + 1][piece.col] : null;
  const merged = below ? merge(below, jamoTile(piece.ch)) : null;
  return { row, merged };
}

function spawn(state: State): State {
  const queue = fill(state.queue);
  const [ch, ...rest] = queue;
  if (state.board[0][SPAWN_COL]) return { ...state, phase: "over", piece: null };
  return { ...state, phase: "playing", piece: { ch, row: 0, col: SPAWN_COL }, queue: fill(rest), canHold: true };
}

function fullRows(board: Board) {
  return board.flatMap((line, row) => (line.every(Boolean) ? [row] : []));
}

/** 판을 살펴 단어와 꽉 찬 줄을 지울 준비를 하거나, 없으면 다음 조각을 꺼냅니다. */
function resolve(state: State, combo: number): State {
  const found: Found[] = findWords(state.board);
  const rows = fullRows(state.board);
  if (!found.length && !rows.length) return spawn({ ...state, combo: 0 });

  const clearing = new Set<string>();
  found.forEach(({ cells }) => cells.forEach(([r, c]) => clearing.add(cellKey(r, c))));
  rows.forEach((r) => {
    for (let c = 0; c < COLS; c++) clearing.add(cellKey(r, c));
  });

  const wordPoints = found.reduce((sum, { word }) => sum + word.length * word.length * 10, 0);
  const points = (wordPoints + rows.length * 50) * combo;
  const text = found.length ? found.map(({ word }) => word).join(" · ") : "한 줄 정리";

  return {
    ...state,
    phase: "clearing",
    piece: null,
    clearing,
    combo,
    score: state.score + points,
    words: [...state.words, ...found.map(({ word }) => word)],
    rows: state.rows + rows.length,
    flash: { id: (state.flash?.id ?? 0) + 1, text, points, combo },
  };
}

function lock(state: State, piece: Piece): State {
  const { row, merged } = landing(state.board, piece);
  const board = state.board.map((line) => [...line]);
  if (merged) board[row + 1][piece.col] = merged;
  else board[row][piece.col] = jamoTile(piece.ch);
  return resolve({ ...state, board, piece: null }, 1);
}

function settle(state: State): State {
  const clearing = state.clearing ?? new Set<string>();
  const board = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    let target = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const tile = state.board[r][c];
      if (!tile || clearing.has(cellKey(r, c))) continue;
      board[target][c] = tile;
      target -= 1;
    }
  }
  return resolve({ ...state, board, clearing: null }, state.combo + 1);
}

function shift(state: State, piece: Piece, col: number): State {
  if (col < 0 || col >= COLS || state.board[piece.row][col]) return state;
  return { ...state, piece: { ...piece, col } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return spawn({ ...initialState(), queue: fill([]) });
    case "pause":
      return state.phase === "playing" ? { ...state, phase: "paused" } : state;
    case "resume":
      return state.phase === "paused" ? { ...state, phase: "playing" } : state;
    case "settle":
      return state.phase === "clearing" ? settle(state) : state;
  }

  const piece = state.piece;
  if (state.phase !== "playing" || !piece) return state;

  switch (action.type) {
    case "tick":
    case "soft": {
      const blocked = piece.row + 1 >= ROWS || state.board[piece.row + 1][piece.col];
      if (blocked) return lock(state, piece);
      const next = { ...state, piece: { ...piece, row: piece.row + 1 } };
      return action.type === "soft" ? { ...next, score: next.score + 1 } : next;
    }
    case "move":
      return shift(state, piece, piece.col + action.dx);
    case "moveTo": {
      let next = state;
      const step = Math.sign(action.col - piece.col);
      while (next.piece && next.piece.col !== action.col) {
        const moved = shift(next, next.piece, next.piece.col + step);
        if (moved === next) break;
        next = moved;
      }
      return next;
    }
    case "drop": {
      const { row } = landing(state.board, piece);
      return lock({ ...state, score: state.score + (row - piece.row) * 2 }, piece);
    }
    case "hold": {
      if (!state.canHold) return state;
      const queue = fill(state.queue);
      const [ch, rest] = state.hold ? [state.hold, queue] : [queue[0], queue.slice(1)];
      if (state.board[0][SPAWN_COL]) return state;
      return {
        ...state,
        hold: piece.ch,
        queue: fill(rest),
        piece: { ch, row: 0, col: SPAWN_COL },
        canHold: false,
      };
    }
  }
}
