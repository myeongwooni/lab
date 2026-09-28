import type { Hero, Tally } from "./engine";
import type { EndingId, SceneId } from "./story";

// 장면에 들어설 때마다 이어하기용으로 저장합니다. 전투 중간은 저장하지 않습니다.
export type LogEntry = { kind: "roll" | "fight" | "story"; text: string };

export type SaveData = {
  v: 1;
  hero: Hero;
  scene: SceneId;
  checkpoint: Hero;
  tally: Tally;
  log: LogEntry[];
};

const SAVE_KEY = "dicetale:save";
const ENDINGS_KEY = "dicetale:endings";

export function loadSave(): SaveData | null {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
    return data && data.v === 1 && data.hero && data.scene ? (data as SaveData) : null;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // 저장이 막혀 있어도 이번 판은 끝까지 할 수 있습니다.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 무시
  }
}

export function loadEndings(): EndingId[] {
  try {
    const data = JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function addEnding(id: EndingId): EndingId[] {
  const next = Array.from(new Set([...loadEndings(), id]));
  try {
    localStorage.setItem(ENDINGS_KEY, JSON.stringify(next));
  } catch {
    // 무시
  }
  return next;
}
