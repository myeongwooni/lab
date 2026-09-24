import type { CoatId, Mood } from "./fortune";

type Palette = Record<string, string>;

// 한 줄에서 같은 색이 이어지면 사각형 하나로 합쳐 그립니다.
export function Pixels({ rows, palette, x = 0, y = 0 }: { rows: string[]; palette: Palette; x?: number; y?: number }) {
  const rects: React.ReactNode[] = [];
  rows.forEach((row, rowIndex) => {
    let start = 0;
    for (let col = 1; col <= row.length; col += 1) {
      if (col < row.length && row[col] === row[start]) continue;
      const fill = palette[row[start]];
      if (fill) {
        rects.push(
          <rect key={`${rowIndex}-${start}`} x={x + start} y={y + rowIndex} width={col - start} height={1} fill={fill} />,
        );
      }
      start = col;
    }
  });
  return <>{rects}</>;
}

export function Sprite({
  rows,
  palette,
  scale,
  className,
  title,
}: {
  rows: string[];
  palette: Palette;
  scale: number;
  className?: string;
  title?: string;
}) {
  const width = rows[0].length;
  const height = rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Pixels rows={rows} palette={palette} />
    </svg>
  );
}

// 머리와 몸통. 눈(E)과 털(w)은 표정과 무늬가 덮어씁니다.
const HEAD = [
  ".o............o.",
  ".oo..........oo.",
  ".owo........owo.",
  ".opwoooooooowpo.",
  ".owwwwwwwwwwwwo.",
  "owwwwwwwwwwwwwwo",
  "owwEEwwwwwwEEwwo",
  "owwEEwwwwwwEEwwo",
  "owpwwwwnnwwwwpwo",
  "owwwwwmwwmwwwwwo",
  ".owwwwwmmwwwwwo.",
  "..owwwwwwwwwwo..",
  ".owOWWOwwOWWOwo.",
];

// 고양이가 앞발로 붙들고 있는 제비뽑기 통.
const BOX = [
  ".ooOWWOhhOWWOoo.",
  ".orOOOOrrOOOOro.",
  ".orrrrrrrrrrrro.",
  ".oggggggggggggo.",
  ".orrrrlkklrrrro.",
  ".orrrrllllrrrro.",
  ".orrrrlkklrrrro.",
  ".orrrrllllrrrro.",
  ".oggggggggggggo.",
  ".orrrrrrrrrrrro.",
  ".oooooooooooooo.",
];

const STICK = ["oooo", "orro", "orro", "obbo", "obbo", "obbo", "obbo", "obbo", "obbo"];

type Point = [number, number];

const MOODS: Record<Mood, { set: [number, number, string][]; clearEyes?: boolean }> = {
  sparkle: { set: [[4, 6, "h"], [12, 6, "h"]] },
  smile: { set: [[4, 6, "h"], [12, 6, "h"]] },
  calm: { set: [] },
  happy: {
    clearEyes: true,
    set: [[4, 6, "E"], [11, 6, "E"], [3, 7, "E"], [5, 7, "E"], [10, 7, "E"], [12, 7, "E"]],
  },
  sleepy: {
    clearEyes: true,
    set: [[2, 7, "E"], [3, 7, "E"], [4, 7, "E"], [11, 7, "E"], [12, 7, "E"], [13, 7, "E"]],
  },
  sad: {
    set: [
      [3, 8, "t"], [12, 8, "t"],
      [6, 9, "w"], [9, 9, "w"], [7, 9, "m"], [8, 9, "m"],
      [7, 10, "w"], [8, 10, "w"], [6, 10, "m"], [9, 10, "m"],
    ],
  },
  cry: {
    clearEyes: true,
    set: [
      [3, 6, "E"], [4, 7, "E"], [3, 8, "E"], [12, 6, "E"], [11, 7, "E"], [12, 8, "E"],
      [2, 9, "t"], [13, 9, "t"], [2, 10, "t"], [13, 10, "t"],
      [6, 9, "w"], [9, 9, "w"], [7, 9, "m"], [8, 9, "m"],
      [7, 10, "w"], [8, 10, "w"], [6, 10, "m"], [9, 10, "m"],
    ],
  },
};

type Coat = { fur: string; paw: string; patch?: string; patch2?: string; eye: string; line: string; mouth?: string; c?: Point[]; d?: Point[] };

const TUXEDO_BIB: Point[] = [
  [5, 8], [6, 8], [9, 8], [10, 8],
  [4, 9], [5, 9], [7, 9], [8, 9], [10, 9], [11, 9],
  [5, 10], [6, 10], [9, 10], [10, 10],
  [6, 11], [7, 11], [8, 11], [9, 11],
  [7, 12], [8, 12],
];

const TABBY_STRIPES: Point[] = [
  [5, 4], [7, 4], [8, 4], [10, 4], [6, 5], [9, 5],
  [1, 6], [1, 8], [14, 6], [14, 8], [3, 11], [12, 11],
];

const COATS: Record<CoatId, Coat> = {
  gold: { fur: "#f9d86a", paw: "#fff3c4", patch: "#e8a33a", eye: "#2b2233", line: "#5a3a1c", c: [[7, 4], [8, 4], [7, 5], [8, 5]] },
  cheese: { fur: "#f9c98d", paw: "#fff1de", patch: "#ea8f3e", eye: "#2b2233", line: "#4a2e1f", c: TABBY_STRIPES },
  calico: {
    fur: "#fff8ee",
    paw: "#fff8ee",
    patch: "#f1a24f",
    patch2: "#3f3446",
    eye: "#2b2233",
    line: "#3a2c33",
    c: [[2, 2], [2, 4], [3, 4], [4, 4], [5, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [2, 6], [1, 7], [2, 7], [3, 11], [4, 11], [5, 11]],
    d: [[10, 4], [11, 4], [12, 4], [13, 4], [11, 5], [12, 5], [13, 5], [14, 5], [13, 6], [14, 6], [13, 7], [14, 7], [13, 2], [10, 11], [11, 11], [12, 11]],
  },
  tuxedo: { fur: "#3d3548", paw: "#fbf6ee", patch: "#fbf6ee", eye: "#f4c542", line: "#17121c", c: TUXEDO_BIB },
  tabby: { fur: "#bcc2cd", paw: "#eef0f4", patch: "#7c8394", eye: "#2b2233", line: "#2d2f3a", c: TABBY_STRIPES },
  white: { fur: "#ffffff", paw: "#ffffff", eye: "#2b2233", line: "#3b3a4a" },
  black: { fur: "#2f2a38", paw: "#3f3949", eye: "#f4c542", line: "#0f0c13", mouth: "#8f86a0" },
};

function buildHead(mood: Mood, coat: Coat) {
  const grid = HEAD.map((row) => row.split(""));
  const recipe = MOODS[mood];

  if (recipe.clearEyes) {
    grid.forEach((row) => row.forEach((cell, col) => { if (cell === "E") row[col] = "w"; }));
  }
  for (const [x, y, value] of recipe.set) grid[y][x] = value;

  for (const [x, y] of coat.c ?? []) if (grid[y][x] === "w") grid[y][x] = "c";
  for (const [x, y] of coat.d ?? []) if (grid[y][x] === "w") grid[y][x] = "d";

  return grid.map((row) => row.join(""));
}

function paletteOf(coat: Coat): Palette {
  return {
    o: coat.line,
    w: coat.fur,
    W: coat.paw,
    O: coat.line,
    c: coat.patch ?? coat.fur,
    d: coat.patch2 ?? coat.fur,
    p: "#f6a2b3",
    n: "#e56d80",
    m: coat.mouth ?? coat.line,
    E: coat.eye,
    h: "#ffffff",
    t: "#7cc8f4",
    r: "#d9483b",
    g: "#f2c14e",
    l: "#fbf1dc",
    k: "#6b2a22",
    b: "#e9c27d",
  };
}

// 통 윗면 구멍(h)은 속이 보이도록 어둡게 칠합니다.
const BOX_PALETTE_OVERRIDE = { h: "#3a1a18" };

export function CatScene({
  coat,
  mood,
  stickOut,
  shaking,
  scale = 12,
}: {
  coat: CoatId;
  mood: Mood;
  stickOut: boolean;
  shaking: boolean;
  scale?: number;
}) {
  const coatDef = COATS[coat];
  const palette = paletteOf(coatDef);
  const head = buildHead(mood, coatDef);
  const width = 16;
  const height = HEAD.length + BOX.length;

  return (
    <svg
      className={`cat-scene${shaking ? " is-shaking" : ""}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <defs>
        <clipPath id="stick-slot">
          <rect x="0" y="0" width={width} height={HEAD.length + 0.5} />
        </clipPath>
      </defs>
      <g className="cat-body">
        <Pixels rows={head} palette={palette} />
      </g>
      <g clipPath="url(#stick-slot)">
        <g className={`cat-stick${stickOut ? " is-out" : ""}`}>
          <Pixels rows={STICK} palette={palette} x={6} y={HEAD.length + 1} />
        </g>
      </g>
      <g className="cat-box">
        <Pixels rows={BOX} palette={{ ...palette, ...BOX_PALETTE_OVERRIDE }} y={HEAD.length} />
      </g>
    </svg>
  );
}

// 도감에 쓰는 얼굴만 있는 작은 초상.
export function CatFace({ coat, mood, locked, scale = 4 }: { coat: CoatId; mood: Mood; locked?: boolean; scale?: number }) {
  const coatDef = COATS[coat];
  const palette = locked
    ? Object.fromEntries(Object.keys(paletteOf(coatDef)).map((key) => [key, key === "o" || key === "O" ? "#6d6378" : "#d9d2e0"]))
    : paletteOf(coatDef);
  const rows = buildHead(locked ? "calm" : mood, coatDef).slice(0, 11);
  return <Sprite rows={rows} palette={palette} scale={scale} />;
}

const STAR = ["..y..", ".yyy.", "yyyyy", ".yyy.", "..y.."];
const HEART = [".pp.pp.", "ppppppp", "ppppppp", ".ppppp.", "..ppp..", "...p..."];
const CLOUD = ["...ooo...", ".oogggoo.", "oggggggo.", "ogggggggo", ".ooooooo."];
const DROP = ["t", "t"];
const ZZZ = ["zzz", "..z", ".z.", "zzz"];

const DECO_PALETTE: Palette = { y: "#ffe16b", p: "#ff8fa8", o: "#6f6a80", g: "#c9c4d6", t: "#7cc8f4", z: "#b7a3e8" };

export function Decorations({ mood }: { mood: Mood }) {
  if (mood === "sparkle") {
    return (
      <div className="deco" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={`deco-star deco-star-${index}`}>
            <Sprite rows={STAR} palette={DECO_PALETTE} scale={5} />
          </span>
        ))}
      </div>
    );
  }
  if (mood === "happy" || mood === "smile") {
    return (
      <div className="deco" aria-hidden>
        {[0, 1].map((index) => (
          <span key={index} className={`deco-heart deco-heart-${index}`}>
            <Sprite rows={HEART} palette={DECO_PALETTE} scale={4} />
          </span>
        ))}
      </div>
    );
  }
  if (mood === "sleepy") {
    return (
      <div className="deco" aria-hidden>
        {[0, 1].map((index) => (
          <span key={index} className={`deco-z deco-z-${index}`}>
            <Sprite rows={ZZZ} palette={DECO_PALETTE} scale={index === 0 ? 5 : 3} />
          </span>
        ))}
      </div>
    );
  }
  if (mood === "sad" || mood === "cry") {
    return (
      <div className="deco" aria-hidden>
        <span className="deco-cloud">
          <Sprite rows={CLOUD} palette={DECO_PALETTE} scale={7} />
          {[0, 1, 2].map((index) => (
            <span key={index} className={`deco-drop deco-drop-${index}`}>
              <Sprite rows={DROP} palette={DECO_PALETTE} scale={5} />
            </span>
          ))}
        </span>
      </div>
    );
  }
  return null;
}
