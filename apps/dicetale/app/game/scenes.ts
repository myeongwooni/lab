import type { SpriteId } from "./sprites";

// 장면 그림은 96×56 도트 캔버스 위에 층을 쌓아 그립니다.
export const SCENE_W = 96;
export const SCENE_H = 56;

export type Layer =
  | { kind: "rect"; x: number; y: number; w: number; h: number; c: string; cls?: string }
  | { kind: "sprite"; id: SpriteId; x: number; y: number; flip?: boolean; cls?: string };

export type ArtId =
  | "tavern"
  | "road"
  | "woods"
  | "swamp"
  | "camp"
  | "gate"
  | "hall"
  | "vault"
  | "lair"
  | "village"
  | "friend"
  | "fallen";

const rect = (x: number, y: number, w: number, h: number, c: string, cls?: string): Layer => ({ kind: "rect", x, y, w, h, c, cls });
const sp = (id: SpriteId, x: number, y: number, flip = false, cls?: string): Layer => ({ kind: "sprite", id, x, y, flip, cls });

// 두 색이 바둑판처럼 섞인 줄. 색이 바뀌는 경계를 부드럽게 합니다.
function dither(y: number, h: number, c: string, offset = 0): Layer[] {
  const out: Layer[] = [];
  for (let row = 0; row < h; row += 1) {
    for (let x = (row + offset) % 2; x < SCENE_W; x += 2) out.push(rect(x, y + row, 1, 1, c));
  }
  return out;
}

// 흩뿌린 1도트 별. 같은 그림이 매번 나오도록 고정된 해시를 씁니다.
function hash(n: number) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

function stars(seed: number, count: number, maxY: number, c = "w"): Layer[] {
  const out: Layer[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = hash(seed * 1000 + i * 2) % SCENE_W;
    const y = hash(seed * 1000 + i * 2 + 1) % maxY;
    out.push(rect(x, y, 1, 1, c, i % 3 === 0 ? "twinkle" : undefined));
  }
  return out;
}

// 돌벽. 줄마다 벽돌을 반 칸씩 엇갈리게 놓습니다.
function bricks(x: number, y: number, w: number, h: number, base: string, line: string, bw = 8, bh = 4): Layer[] {
  const out: Layer[] = [rect(x, y, w, h, base)];
  for (let row = 0; row * bh < h; row += 1) {
    const yy = y + row * bh;
    out.push(rect(x, yy, w, 1, line));
    const shift = row % 2 === 0 ? 0 : bw / 2;
    for (let xx = x + shift; xx < x + w; xx += bw) out.push(rect(xx, yy, 1, Math.min(bh, y + h - yy), line));
  }
  return out;
}

function planks(x: number, y: number, w: number, h: number): Layer[] {
  const out: Layer[] = [rect(x, y, w, h, "b")];
  for (let xx = x; xx < x + w; xx += 6) out.push(rect(xx, y, 1, h, "B"));
  for (let xx = x + 3; xx < x + w; xx += 12) out.push(rect(xx, y + 5, 1, 1, "B"), rect(xx + 6, y + 14, 1, 1, "B"));
  return out;
}

// 가지가 비스듬히 뻗은 죽은 나무
function deadTree(x: number, y: number, right: boolean): Layer[] {
  const d = right ? 1 : -1;
  return [
    rect(x, y, 3, 32, "K"),
    rect(x + (right ? 3 : -1), y + 8, 1, 1, "K"),
    rect(x + (right ? 4 : -2), y + 7, 1, 1, "K"),
    rect(x + (right ? 5 : -3), y + 6, 1, 1, "K"),
    rect(x + (right ? 5 : -3), y + 5, 1, 1, "K"),
    rect(x + (right ? -1 : 3), y + 14, 1, 1, "K"),
    rect(x + (right ? -2 : 4), y + 13, 1, 1, "K"),
    rect(x + (right ? -3 : 5), y + 13, 1, 1, "K"),
    rect(x + 1, y - 3, 1, 3, "K"),
    rect(x + 1 + d, y - 5, 1, 2, "K"),
    rect(x - 1, y + 29, 5, 3, "K"),
  ];
}

const tavern: Layer[] = [
  ...planks(0, 0, 96, 40),
  rect(0, 0, 96, 3, "B"),
  // 창문과 달빛
  rect(8, 8, 18, 14, "k"),
  rect(9, 9, 16, 12, "v"),
  ...stars(3, 6, 12).map((l) => (l.kind === "rect" ? { ...l, x: 9 + (l.x % 16), y: 9 + (l.y % 12) } : l)),
  sp("moon", 18, 10),
  rect(16, 9, 1, 12, "k"),
  rect(9, 14, 16, 1, "k"),
  // 선반과 병
  rect(34, 12, 28, 2, "B"),
  sp("bottle", 36, 8),
  sp("bottleRed", 41, 8),
  sp("bottle", 46, 8),
  sp("mug", 52, 9),
  sp("bottleRed", 57, 8),
  // 벽난로
  ...bricks(68, 10, 24, 30, "G", "H", 6, 3),
  rect(72, 22, 16, 18, "k"),
  rect(73, 23, 14, 17, "K"),
  sp("flame", 76, 32, false, "flicker"),
  sp("campLogs", 76, 37),
  rect(66, 10, 28, 2, "B"),
  // 바닥
  rect(0, 40, 96, 16, "B"),
  rect(0, 40, 96, 1, "k"),
  ...Array.from({ length: 8 }, (_, i) => rect(i * 12 + 4, 44 + (i % 2) * 6, 7, 1, "b")),
  // 카운터와 주인장
  sp("keeper", 40, 20),
  rect(30, 30, 36, 3, "n"),
  rect(30, 33, 36, 9, "b"),
  rect(30, 30, 36, 1, "k"),
  rect(30, 33, 36, 1, "k"),
  rect(30, 42, 36, 1, "k"),
  sp("mug", 34, 27),
  sp("candle", 58, 25, false, "flicker"),
  // 앞쪽 탁자와 촌장
  sp("elder", 8, 34),
  sp("table", 2, 45),
  sp("mug", 6, 42),
  sp("barrel", 86, 44),
];

const road: Layer[] = [
  rect(0, 0, 96, 30, "u"),
  ...dither(14, 3, "c"),
  rect(0, 17, 96, 13, "c"),
  ...dither(26, 2, "w", 1),
  rect(0, 28, 96, 28, "l"),
  ...dither(28, 2, "L"),
  // 먼 산
  ...Array.from({ length: 6 }, (_, i) => rect(i * 18 - 4, 22 - (i % 3) * 2, 22, 8 + (i % 3) * 2, "z")),
  rect(0, 28, 96, 3, "L"),
  // 갈라지는 길
  rect(40, 31, 16, 25, "n"),
  rect(44, 31, 8, 3, "n"),
  rect(28, 36, 12, 6, "n"),
  rect(16, 38, 12, 3, "n"),
  rect(56, 36, 12, 6, "n"),
  rect(68, 38, 14, 3, "n"),
  rect(42, 44, 1, 1, "A"),
  rect(50, 50, 1, 1, "A"),
  sp("pine", 4, 14),
  sp("pine", 12, 18),
  sp("oak", 78, 18),
  sp("pine", 88, 16),
  sp("sign", 54, 22),
  sp("bush", 22, 44),
  sp("bush", 70, 46),
  sp("tuft", 10, 48),
  sp("tuft", 86, 52),
  sp("tuft", 34, 51),
  sp("rock", 60, 49),
];

const woods: Layer[] = [
  rect(0, 0, 96, 56, "m"),
  ...dither(0, 56, "L"),
  rect(0, 0, 96, 12, "Z"),
  ...Array.from({ length: 9 }, (_, i) => sp("pineDark", i * 11 - 3, 2 + (i % 2) * 3)),
  rect(0, 38, 96, 18, "m"),
  ...dither(38, 2, "Z"),
  ...Array.from({ length: 6 }, (_, i) => sp("pine", i * 17 - 2, 26 + (i % 2) * 2)),
  rect(0, 44, 96, 12, "L"),
  ...dither(44, 1, "m"),
  // 덤불 속 빛나는 눈
  sp("bush", 60, 40),
  rect(63, 41, 1, 1, "y", "blink"),
  rect(66, 41, 1, 1, "y", "blink"),
  sp("mushroom", 20, 50),
  sp("mushroom", 78, 51),
  sp("tuft", 40, 52),
  sp("tuft", 8, 50),
];

const swamp: Layer[] = [
  rect(0, 0, 96, 56, "Z"),
  rect(0, 0, 96, 20, "z"),
  ...dither(18, 4, "Z"),
  ...[4, 26, 50, 72, 90].flatMap((x, i) => deadTree(x, 6 + (i % 3) * 3, i % 2 === 0)),
  // 안개
  ...dither(30, 2, "x", 0).filter((_, i) => i % 3 !== 0),
  rect(0, 34, 96, 22, "Z"),
  ...dither(34, 1, "z"),
  rect(0, 40, 96, 10, "z"),
  ...dither(40, 1, "c"),
  ...dither(49, 1, "Z"),
  sp("lily", 20, 43),
  sp("lily", 54, 45),
  sp("lily", 74, 42),
  sp("reeds", 4, 33),
  sp("reeds", 36, 34),
  sp("reeds", 86, 33),
  sp("reeds", 64, 48),
  sp("skull", 12, 51),
  sp("mushroom", 80, 51),
  rect(30, 44, 1, 1, "w", "blink"),
  rect(60, 41, 1, 1, "w", "blink"),
];

const camp: Layer[] = [
  rect(0, 0, 96, 56, "V"),
  ...stars(11, 40, 30),
  sp("moon", 78, 6),
  ...dither(26, 3, "v"),
  rect(0, 29, 96, 27, "v"),
  ...Array.from({ length: 10 }, (_, i) => sp("pineDark", i * 10 - 4, 18 + (i % 2) * 2)),
  rect(0, 38, 96, 18, "m"),
  ...dither(38, 1, "V"),
  // 모닥불 빛
  ...dither(40, 14, "L").filter((l) => l.kind === "rect" && Math.abs(l.x - 47) < 20),
  sp("tent", 12, 30),
  sp("flame", 44, 40, false, "flicker"),
  sp("campLogs", 44, 46),
  rect(28, 48, 10, 3, "b"),
  rect(28, 48, 10, 1, "n"),
  rect(60, 49, 10, 3, "b"),
  rect(60, 49, 10, 1, "n"),
  sp("rock", 76, 48),
  sp("tuft", 8, 52),
  sp("tuft", 88, 50),
];

const gate: Layer[] = [
  rect(0, 0, 96, 56, "H"),
  rect(0, 0, 96, 10, "K"),
  ...dither(10, 3, "K"),
  ...bricks(10, 6, 76, 40, "G", "H"),
  // 기둥
  rect(10, 6, 8, 40, "g"),
  rect(78, 6, 8, 40, "g"),
  rect(10, 6, 1, 40, "k"),
  rect(17, 6, 1, 40, "H"),
  rect(78, 6, 1, 40, "k"),
  rect(85, 6, 1, 40, "H"),
  rect(8, 4, 80, 3, "g"),
  rect(8, 4, 80, 1, "w"),
  // 돌문
  rect(34, 16, 28, 30, "k"),
  rect(35, 17, 26, 29, "K"),
  rect(47, 17, 2, 29, "k"),
  rect(36, 14, 24, 2, "k"),
  rect(38, 12, 20, 2, "k"),
  // 룬
  rect(39, 24, 2, 2, "c", "glow"),
  rect(43, 30, 2, 2, "c", "glow"),
  rect(39, 36, 2, 2, "c", "glow"),
  rect(52, 24, 2, 2, "c", "glow"),
  rect(55, 30, 2, 2, "c", "glow"),
  rect(52, 36, 2, 2, "c", "glow"),
  rect(46, 13, 4, 2, "c", "glow"),
  sp("torch", 26, 20, false, "flicker"),
  sp("torch", 67, 20, false, "flicker"),
  rect(0, 46, 96, 10, "K"),
  ...dither(46, 1, "H"),
  sp("rock", 4, 48),
  sp("skull", 70, 50),
  sp("bones", 22, 52),
];

const hall: Layer[] = [
  rect(0, 0, 96, 56, "K"),
  ...dither(0, 20, "H"),
  ...Array.from({ length: 9 }, (_, i) => sp("stalactite", i * 11 + 2, 0)),
  rect(0, 36, 96, 20, "H"),
  ...dither(36, 1, "K"),
  // 뾰족한 목책
  ...Array.from({ length: 24 }, (_, i) => rect(i * 4, 26 + (i % 2), 3, 12, "B")),
  ...Array.from({ length: 24 }, (_, i) => rect(i * 4 + 1, 25 + (i % 2), 1, 1, "B")),
  rect(0, 30, 96, 1, "b"),
  // 해골 깃발
  rect(47, 8, 1, 20, "b"),
  rect(48, 8, 10, 7, "R"),
  rect(48, 14, 10, 1, "k"),
  sp("skull", 51, 9),
  // 고블린 천막과 불
  sp("tent", 8, 27),
  sp("tent", 70, 27, true),
  sp("torch", 32, 18, false, "flicker"),
  sp("torch", 62, 18, false, "flicker"),
  sp("barrel", 28, 32),
  sp("barrel", 58, 36),
  sp("bones", 40, 48),
  sp("skull", 50, 46),
  sp("crystal", 88, 40),
  sp("crystal", 2, 44),
  sp("barrel", 78, 45),
  sp("mushroom", 20, 50),
  rect(44, 42, 8, 2, "B"),
  sp("flame", 45, 36, false, "flicker"),
];

const vault: Layer[] = [
  ...bricks(0, 0, 96, 44, "H", "K", 10, 5),
  rect(0, 44, 96, 12, "K"),
  ...dither(44, 1, "H"),
  // 받침대 위 보물상자
  rect(36, 38, 24, 6, "g"),
  rect(36, 38, 24, 1, "w"),
  rect(36, 43, 24, 1, "G"),
  sp("chest", 42, 30),
  sp("goldPile", 14, 40),
  sp("goldPile", 72, 40),
  sp("coin", 26, 48),
  sp("coin", 64, 50),
  sp("torch", 8, 16, false, "flicker"),
  sp("torch", 85, 16, false, "flicker"),
  sp("crystal", 20, 34),
  sp("crystal", 74, 33),
  rect(47, 26, 1, 1, "Y", "twinkle"),
  rect(52, 24, 1, 1, "Y", "twinkle"),
];

const lairBase: Layer[] = [
  rect(0, 0, 96, 56, "K"),
  ...dither(0, 30, "R"),
  ...Array.from({ length: 9 }, (_, i) => sp("stalactite", i * 11 + 4, 0)),
  rect(0, 40, 96, 16, "B"),
  ...dither(40, 1, "K"),
  // 금화 더미
  rect(18, 42, 60, 6, "o"),
  rect(22, 40, 52, 2, "y"),
  rect(30, 38, 36, 2, "y"),
  ...Array.from({ length: 14 }, (_, i) => rect(20 + i * 4, 41 + (i % 3), 1, 1, "Y", i % 4 === 0 ? "twinkle" : undefined)),
  sp("goldPile", 6, 46),
  sp("goldPile", 80, 46),
  sp("crystal", 4, 34),
  sp("crystal", 88, 33),
];

const lair: Layer[] = [
  ...lairBase,
  // 등불을 끌어안고 잠든 새끼 용
  sp("dragon", 36, 17),
  sp("lantern", 34, 30, false, "glow"),
  rect(62, 14, 2, 1, "w", "zz"),
  rect(66, 10, 3, 1, "w", "zz"),
];

const village: Layer[] = [
  rect(0, 0, 96, 56, "v"),
  ...dither(20, 6, "U"),
  rect(0, 26, 96, 30, "U"),
  ...stars(21, 30, 22, "Y"),
  sp("moon", 10, 5),
  sp("house", 4, 26),
  sp("house", 22, 24),
  sp("house", 66, 26),
  sp("house", 82, 25),
  rect(0, 38, 96, 18, "L"),
  ...dither(38, 1, "U"),
  rect(40, 38, 16, 18, "n"),
  // 광장의 등불
  sp("lampPost", 44, 22),
  sp("lantern", 44, 14, false, "glow"),
  sp("tuft", 12, 48),
  sp("tuft", 80, 50),
  sp("bush", 60, 44),
];

const friend: Layer[] = [
  ...lairBase,
  sp("lantern", 28, 29, false, "glow"),
  sp("dragon", 42, 17),
  sp("heart", 36, 10, false, "twinkle"),
  sp("heart", 60, 6, false, "twinkle"),
];

const fallen: Layer[] = [
  rect(0, 0, 96, 56, "V"),
  ...stars(41, 18, 26, "g"),
  sp("moon", 76, 6),
  ...dither(26, 4, "v"),
  rect(0, 30, 96, 26, "v"),
  ...Array.from({ length: 10 }, (_, i) => sp("pineDark", i * 10 - 4, 18 + (i % 2) * 2)),
  rect(0, 38, 96, 18, "K"),
  ...dither(38, 1, "v"),
  // 흙무덤과 꽂힌 검
  rect(34, 44, 28, 4, "B"),
  rect(36, 43, 24, 1, "B"),
  sp("grave", 44, 35),
  sp("sword", 60, 33),
  sp("flower", 38, 40),
  sp("flower", 55, 41),
  sp("tuft", 30, 48),
  sp("tuft", 64, 49),
  sp("skull", 80, 48),
  rect(48, 30, 1, 1, "x", "twinkle"),
  rect(52, 27, 1, 1, "x", "twinkle"),
];

export const ART: Record<ArtId, Layer[]> = {
  tavern,
  road,
  woods,
  swamp,
  camp,
  gate,
  hall,
  vault,
  lair,
  village,
  friend,
  fallen,
};
