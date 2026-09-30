// 브라우저 localStorage에 세이브 슬롯과 전역 기록(본 대사, 엔딩, CG, 설정)을 둡니다.
// 사생활 보호 모드 등에서 저장소를 못 쓰면 조용히 메모리로만 동작합니다.
import type { GameState } from "./runtime";

const PREFIX = "starscribe:";
export const SLOT_COUNT = 18;

export type LogLine = { who: string | null; text: string; choice?: boolean };

export type SaveData = {
  v: 1;
  at: number;
  state: GameState;
  log: LogLine[];
  preview: string;
  chapter: string;
};

export type Settings = {
  textSpeed: number; // 1(느림)~5(즉시)
  autoDelay: number; // 1(짧게)~5(길게)
  bgm: number;
  se: number;
  amb: number;
  skipUnread: boolean;
  fontScale: number; // 0.9 ~ 1.2
};

export const DEFAULT_SETTINGS: Settings = { textSpeed: 3, autoDelay: 3, bgm: 0.7, se: 0.8, amb: 0.6, skipUnread: false, fontScale: 1 };

export type GlobalData = {
  seen: Record<string, number[]>; // 장 → 본 명령 번호
  endings: string[];
  cgs: string[];
  tracks: string[];
  letters: { head: string; paras: string[]; ch: string }[];
  chapters: string[]; // 들어가 본 장
  chapterVars: Record<string, Record<string, number | boolean>>; // 장 시작 시점 변수(챕터 다시 보기용)
  settings: Settings;
};

function emptyGlobal(): GlobalData {
  return { seen: {}, endings: [], cgs: [], tracks: [], letters: [], chapters: [], chapterVars: {}, settings: { ...DEFAULT_SETTINGS } };
}

const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // 저장소가 가득 찼거나 막혀 있으면 이번 세션 메모리에만 남습니다.
  }
}

function remove(key: string) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {}
}

let cachedGlobal: GlobalData | null = null;

export function loadGlobal(): GlobalData {
  if (cachedGlobal) return cachedGlobal;
  const base = emptyGlobal();
  try {
    const raw = read("global");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GlobalData>;
      cachedGlobal = { ...base, ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) } };
      return cachedGlobal;
    }
  } catch {}
  cachedGlobal = base;
  return base;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function updateGlobal(fn: (g: GlobalData) => void) {
  const g = loadGlobal();
  fn(g);
  // 대사마다 쓰면 느려지므로 모아서 씁니다.
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushGlobal, 400);
}

export function flushGlobal() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (cachedGlobal) write("global", JSON.stringify(cachedGlobal));
}

export function markSeen(key: string) {
  const [ch, n] = key.split(":");
  const i = Number(n);
  const g = loadGlobal();
  const list = g.seen[ch] ?? (g.seen[ch] = []);
  if (list.includes(i)) return;
  updateGlobal(() => list.push(i));
}

export function isSeen(key: string): boolean {
  const [ch, n] = key.split(":");
  return loadGlobal().seen[ch]?.includes(Number(n)) ?? false;
}

export function addUnique(list: "endings" | "cgs" | "tracks" | "chapters", id: string) {
  const g = loadGlobal();
  if (!g[list].includes(id)) updateGlobal((x) => x[list].push(id));
}

export function addLetter(head: string, paras: string[], ch: string) {
  const g = loadGlobal();
  if (g.letters.some((l) => l.head === head && l.ch === ch)) return;
  updateGlobal((x) => x.letters.push({ head, paras, ch }));
}

export function slotKey(slot: number | "auto" | "quick") {
  return `slot:${slot}`;
}

export function loadSlot(slot: number | "auto" | "quick"): SaveData | null {
  try {
    const raw = read(slotKey(slot));
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return data.v === 1 ? data : null;
  } catch {
    return null;
  }
}

export function writeSlot(slot: number | "auto" | "quick", data: SaveData) {
  write(slotKey(slot), JSON.stringify(data));
}

export function deleteSlot(slot: number | "auto" | "quick") {
  remove(slotKey(slot));
}

export function latestSave(): { slot: number | "auto" | "quick"; data: SaveData } | null {
  let best: { slot: number | "auto" | "quick"; data: SaveData } | null = null;
  const slots: (number | "auto" | "quick")[] = ["auto", "quick", ...Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)];
  for (const s of slots) {
    const d = loadSlot(s);
    if (d && (!best || d.at > best.data.at)) best = { slot: s, data: d };
  }
  return best;
}

export function makeSave(state: GameState, log: LogLine[], preview: string): SaveData {
  return { v: 1, at: Date.now(), state, log: log.slice(-80), preview: preview.slice(0, 80), chapter: state.ch };
}

export function trueUnlocked(g: GlobalData = loadGlobal()): boolean {
  const e = g.endings;
  return (e.includes("c_good") || e.includes("c_bad")) && (e.includes("l_good") || e.includes("l_bad"));
}
