export type Color = "red" | "blue" | "yellow";
export type Item = "brass" | "lens" | "battery" | "silver";
export type Phase = "intro" | "playing" | "won" | "lost";
export type Target = "books" | "clock" | "painting" | "radio" | "plant" | "rug" | "drawer" | "safe" | "door" | "lamp" | "window";

export type Run = {
  day: string;
  phase: Phase;
  startedAt: number | null;
  deadline: number | null;
  completedIn: number | null;
  inventory: Item[];
  seen: string[];
  drawerOpen: boolean;
  paintingRevealed: boolean;
  radioWorking: boolean;
  safeOpen: boolean;
  lampOn: boolean;
  hints: number;
  attempts: number;
};

export type RecordEntry = { seconds: number; hints: number; attempts: number };
export type Records = Record<string, RecordEntry>;

type Palette = { wall: string; wallDark: string; floor: string; floorLight: string; accent: string; glow: string; name: string; subtitle: string };
export type Puzzle = { day: string; number: number; palette: Palette; order: Color[]; digits: Record<Color, string>; code: string; constellation: number };

export const MAX_SECONDS = 600;
export const ITEM_INFO: Record<Item, { name: string; symbol: string; detail: string }> = {
  brass: { name: "황동 열쇠", symbol: "⚿", detail: "작은 서랍 열쇠" },
  lens: { name: "푸른 렌즈", symbol: "◇", detail: "숨겨진 글씨가 보일 것 같다" },
  battery: { name: "건전지", symbol: "▣", detail: "오래된 기계에 쓸 수 있다" },
  silver: { name: "은빛 열쇠", symbol: "⚿", detail: "출입문 열쇠" },
};
export const COLOR_NAME: Record<Color, string> = { red: "빨강", blue: "파랑", yellow: "노랑" };
export const COLOR_ICON: Record<Color, string> = { red: "🔴", blue: "🔵", yellow: "🟡" };

const PALETTES: Palette[] = [
  { name: "달빛 관측실", subtitle: "하늘을 잃어버린 관측자의 방", wall: "#2d4053", wallDark: "#213348", floor: "#5b5267", floorLight: "#746781", accent: "#96dcca", glow: "#d5efdc" },
  { name: "비밀의 아틀리에", subtitle: "물감이 마르지 않는 밤", wall: "#60404e", wallDark: "#462d3c", floor: "#6c5263", floorLight: "#957084", accent: "#ffd08f", glow: "#fff1d1" },
  { name: "새벽의 서재", subtitle: "책장 너머의 마지막 문장", wall: "#344b4a", wallDark: "#263c3e", floor: "#63554e", floorLight: "#847065", accent: "#d6da99", glow: "#faf3d7" },
  { name: "잠든 시계공의 방", subtitle: "멈춘 시간에도 비밀은 흐른다", wall: "#41466b", wallDark: "#2d3251", floor: "#4e5065", floorLight: "#6c6c85", accent: "#f5c987", glow: "#ffe8b7" },
  { name: "별무늬 작업실", subtitle: "밤을 수리하는 사람의 흔적", wall: "#3e3b58", wallDark: "#2b2a43", floor: "#57445d", floorLight: "#79627c", accent: "#a8c8ff", glow: "#e8e6ff" },
];

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function generator(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 한국 시간 00:00를 기준으로 같은 날 모든 플레이어가 같은 방을 봅니다.
export function todayKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function dailyPuzzle(day: string): Puzzle {
  const random = generator(hash(`pixelroom/v1/${day}`));
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  const colors: Color[] = ["red", "blue", "yellow"];
  const digits: Record<Color, string> = { red: String(numbers[0]), blue: String(numbers[1]), yellow: String(numbers[2]) };
  const order = shuffle(colors, random);
  const number = Math.max(1, Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse("2026-10-18T00:00:00Z")) / 86400000) + 1);
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const constellation = Math.floor(random() * 4);
  return { day, number, digits, order, code: order.map((c) => digits[c]).join(""), palette, constellation };
}

export function newRun(day: string): Run {
  return {
    day, phase: "intro", startedAt: null, deadline: null, completedIn: null,
    inventory: [], seen: [], drawerOpen: false, paintingRevealed: false,
    radioWorking: false, safeOpen: false, lampOn: true, hints: 0, attempts: 0,
  };
}

export function hasItem(run: Run, item: Item) {
  return run.inventory.includes(item);
}

export function gainItem(run: Run, item: Item): Run {
  return hasItem(run, item) ? run : { ...run, inventory: [...run.inventory, item] };
}

export function removeItem(run: Run, item: Item): Run {
  return { ...run, inventory: run.inventory.filter((part) => part !== item) };
}

export function saw(run: Run, clue: string): Run {
  return run.seen.includes(clue) ? run : { ...run, seen: [...run.seen, clue] };
}

export function formatDuration(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function isValidRun(input: unknown, day: string): input is Run {
  if (!input || typeof input !== "object") return false;
  const data = input as Partial<Run>;
  return data.day === day && ["intro", "playing", "won", "lost"].includes(data.phase ?? "") &&
    Array.isArray(data.inventory) && data.inventory.every((item) => Object.keys(ITEM_INFO).includes(item)) &&
    Array.isArray(data.seen) && typeof data.hints === "number" && typeof data.attempts === "number" &&
    (data.deadline === null || typeof data.deadline === "number") &&
    typeof data.drawerOpen === "boolean" && typeof data.safeOpen === "boolean";
}
