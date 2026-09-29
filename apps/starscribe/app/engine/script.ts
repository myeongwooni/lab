// 원고(StarScript)를 명령 목록으로 바꿉니다. 규격은 README의 "원고 쓰는 법"에 있습니다.
// 이 파일은 다른 모듈을 불러오지 않습니다. `node scripts/check-story.ts`가 그대로 읽어 씁니다.

export const CHARACTER_IDS = ["cassian", "lucien", "mirelle", "theo", "isolde", "gregor", "ferryman", "noel", "emperor", "young"] as const;
export type CharId = (typeof CHARACTER_IDS)[number];

// 대사 줄의 이름표 → 스탠딩 id. 표에 없는 이름은 스탠딩 없이 이름표만 뜹니다.
export const SPEAKER_TO_CHAR: Record<string, CharId> = {
  카시안: "cassian",
  루시엔: "lucien",
  미렐: "mirelle",
  테오: "theo",
  이졸데: "isolde",
  그레고르: "gregor",
  사공: "ferryman",
  노엘: "noel",
  황제: "emperor",
  소년: "young",
};

export const EXPRESSIONS = ["normal", "smile", "sad", "angry", "surprise", "serious", "tender", "pain", "smirk", "cry"] as const;
export const POSITIONS = ["left", "center", "right"] as const;
export type Pos = (typeof POSITIONS)[number];

export const BACKGROUND_IDS = [
  "black", "white", "archive", "archive_night", "room", "study", "register", "tower", "cell", "capital_night", "street",
  "festival", "bridge", "rain_street", "vault", "garden", "observatory", "snowfield", "cabin", "wasteland", "village",
  "sea", "depth", "throne", "palace", "ritual", "starfall", "dawn", "memory",
] as const;

export const CG_IDS = [
  "cg_oath", "cg_newborn", "cg_meet", "cg_letter", "cg_lantern", "cg_vault", "cg_umbrella", "cg_confession",
  "cg_snow_kiss", "cg_book", "cg_c_good", "cg_c_bad", "cg_lucien_teach", "cg_l_good", "cg_l_bad", "cg_sea", "cg_depth",
  "cg_sisters", "cg_true",
] as const;

export const BGM_IDS = [
  "title", "lullaby", "archive", "tower", "warm", "lucien", "festival", "tension", "sorrow", "villain", "north", "sea",
  "climax", "ending",
] as const;

export const AMBIENT_IDS = ["rain", "wind", "fire", "sea", "crowd", "night"] as const;

export const SE_IDS = [
  "page", "pen", "bell", "door", "chain", "sword", "clash", "heartbeat", "step", "thunder", "glass", "whoosh", "starfall",
  "fire", "splash", "knock", "magic", "chime", "burn", "wind", "hit",
] as const;

export const FX_IDS = ["snow", "rain", "petals", "stars", "embers", "lanterns", "meteors", "letters", "dust"] as const;
export const FILTER_IDS = ["memory", "night", "dark", "blur", "warm"] as const;
export const TRANSITIONS = ["cross", "fade", "white", "cut", "ink"] as const;
export type Transition = (typeof TRANSITIONS)[number];

export const CHAPTER_IDS = ["prologue", "ch01", "ch02", "ch03", "ch04", "ch05", "c06", "c07", "c08", "l06", "l07", "l08", "t06", "t07", "t08", "t09"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export const ENDING_IDS = ["early", "c_good", "c_bad", "l_good", "l_bad", "true"] as const;
export type EndingId = (typeof ENDING_IDS)[number];

export type Effect = { name: string; add?: number };
export type Option = { text: string; label: string; effects: Effect[]; cond?: string };

export type Cmd =
  | { t: "say"; who: string | null; char?: CharId; expr?: string; text: string; quiet?: boolean }
  | { t: "bg"; id: string; trans: Transition; ms: number }
  | { t: "cg"; id: string | null }
  | { t: "show"; id: CharId; expr?: string; pos?: Pos }
  | { t: "hide"; id: CharId | "all" }
  | { t: "bgm"; id: string | null; ms: number }
  | { t: "amb"; id: string | null }
  | { t: "se"; id: string }
  | { t: "fx"; id: string | null }
  | { t: "filter"; id: string | null }
  | { t: "shake"; big: boolean }
  | { t: "flash"; color: string }
  | { t: "wait"; ms: number }
  | { t: "title"; small: string; big: string }
  | { t: "day"; n: number }
  | { t: "place"; text: string }
  | { t: "letter"; head: string; paras: string[] }
  | { t: "mode"; nvl: boolean }
  | { t: "clear" }
  | { t: "set"; name: string; value: number | boolean }
  | { t: "add"; name: string; n: number }
  | { t: "if"; cond: string; label: string }
  | { t: "jump"; label: string }
  | { t: "choice"; options: Option[] }
  | { t: "next"; chapter: string }
  | { t: "end"; ending: string };

export type Problem = { line: number; msg: string; warn?: boolean };
export type Parsed = { cmds: Cmd[]; labels: Record<string, number>; lines: number[]; problems: Problem[] };

const FLASH_COLORS: Record<string, string> = { white: "#ffffff", red: "#b3242b", gold: "#f1d58a" };

function has<T extends string>(list: readonly T[], v: string): v is T {
  return (list as readonly string[]).includes(v);
}

// 원고 한 편을 읽습니다. 규격에 어긋난 줄은 problems에 모아 두고 가능한 만큼 계속 읽습니다.
export function parseScript(src: string): Parsed {
  const cmds: Cmd[] = [];
  const lines: number[] = [];
  const labels: Record<string, number> = {};
  const problems: Problem[] = [];
  const raw = src.split(/\r?\n/);

  const push = (cmd: Cmd, line: number) => {
    cmds.push(cmd);
    lines.push(line);
  };

  for (let i = 0; i < raw.length; i++) {
    const n = i + 1;
    const line = raw[i].trim();
    if (!line || line.startsWith("//")) continue;
    const bad = (msg: string, warn = false) => problems.push({ line: n, msg, warn });

    if (line.startsWith("* ")) {
      const name = line.slice(2).trim();
      if (labels[name] !== undefined) bad(`라벨 중복: ${name}`);
      labels[name] = cmds.length;
      continue;
    }

    if (line.startsWith("@")) {
      const [head, ...rest] = line.slice(1).split(/\s+/);
      const arg = line.slice(1 + head.length).trim();
      switch (head) {
        case "bg": {
          const [id, trans = "cross", ms] = rest;
          if (!has(BACKGROUND_IDS, id)) bad(`없는 배경: ${id}`);
          if (!has(TRANSITIONS, trans)) bad(`없는 전환: ${trans}`);
          push({ t: "bg", id, trans: has(TRANSITIONS, trans) ? trans : "cross", ms: ms ? Number(ms) : trans === "cut" ? 0 : 1000 }, n);
          break;
        }
        case "cg":
          if (arg !== "off" && !has(CG_IDS, arg)) bad(`없는 CG: ${arg}`);
          push({ t: "cg", id: arg === "off" ? null : arg }, n);
          break;
        case "show": {
          const [id, ...mods] = rest;
          if (!has(CHARACTER_IDS, id)) {
            bad(`없는 인물: ${id}`);
            break;
          }
          let expr: string | undefined;
          let pos: Pos | undefined;
          for (const m of mods) {
            if (has(POSITIONS, m)) pos = m;
            else if (has(EXPRESSIONS, m)) expr = m;
            else bad(`모르는 표정/위치: ${m}`);
          }
          push({ t: "show", id, expr, pos }, n);
          break;
        }
        case "hide":
          if (arg !== "all" && !has(CHARACTER_IDS, arg)) bad(`없는 인물: ${arg}`);
          push({ t: "hide", id: arg as CharId | "all" }, n);
          break;
        case "bgm": {
          const [id, ms] = rest;
          if (id !== "stop" && !has(BGM_IDS, id)) bad(`없는 배경음악: ${id}`);
          push({ t: "bgm", id: id === "stop" ? null : id, ms: ms ? Number(ms) : 2000 }, n);
          break;
        }
        case "amb":
          if (arg !== "none" && !has(AMBIENT_IDS, arg)) bad(`없는 환경음: ${arg}`);
          push({ t: "amb", id: arg === "none" ? null : arg }, n);
          break;
        case "se":
          if (!has(SE_IDS, arg)) bad(`없는 효과음: ${arg}`);
          push({ t: "se", id: arg }, n);
          break;
        case "fx":
          if (arg !== "none" && !has(FX_IDS, arg)) bad(`없는 입자: ${arg}`);
          push({ t: "fx", id: arg === "none" ? null : arg }, n);
          break;
        case "filter":
          if (arg !== "none" && !has(FILTER_IDS, arg)) bad(`없는 필터: ${arg}`);
          push({ t: "filter", id: arg === "none" ? null : arg }, n);
          break;
        case "shake":
          push({ t: "shake", big: arg === "big" }, n);
          break;
        case "flash":
          push({ t: "flash", color: FLASH_COLORS[arg || "white"] ?? "#ffffff" }, n);
          break;
        case "wait":
          push({ t: "wait", ms: Number(arg) || 500 }, n);
          break;
        case "title": {
          const [small, big] = arg.split("|");
          if (big === undefined) bad("@title은 '작은글|큰글' 형식");
          push({ t: "title", small: small.trim(), big: (big ?? "").trim() }, n);
          break;
        }
        case "day":
          push({ t: "day", n: Number(arg) }, n);
          break;
        case "place":
          push({ t: "place", text: arg }, n);
          break;
        case "letter": {
          const paras: string[] = [];
          let j = i + 1;
          for (; j < raw.length; j++) {
            const l = raw[j].trim();
            if (l === "@endletter") break;
            if (l.startsWith("|")) paras.push(l.slice(1).trim());
            else if (l) problems.push({ line: j + 1, msg: "편지 안의 줄은 |로 시작해야 합니다" });
          }
          if (j >= raw.length) bad("@endletter가 없습니다");
          push({ t: "letter", head: arg, paras }, n);
          i = j;
          break;
        }
        case "endletter":
          bad("짝 없는 @endletter");
          break;
        case "nvl":
          push({ t: "mode", nvl: true }, n);
          break;
        case "adv":
          push({ t: "mode", nvl: false }, n);
          break;
        case "clear":
          push({ t: "clear" }, n);
          break;
        case "set": {
          const [name, v] = rest;
          const value = v === "true" ? true : v === "false" ? false : Number(v);
          if (typeof value === "number" && Number.isNaN(value)) bad(`@set 값이 이상합니다: ${v}`);
          push({ t: "set", name, value }, n);
          break;
        }
        case "add":
          push({ t: "add", name: rest[0], n: Number(rest[1] ?? 1) }, n);
          break;
        case "flag":
          push({ t: "set", name: arg, value: true }, n);
          break;
        case "if": {
          const m = arg.match(/^(.*?)\s*->\s*(\S+)$/);
          if (!m) {
            bad("@if 조건 -> 라벨 형식이 아닙니다");
            break;
          }
          push({ t: "if", cond: m[1], label: m[2] }, n);
          break;
        }
        case "jump":
          push({ t: "jump", label: arg }, n);
          break;
        case "choice": {
          const options: Option[] = [];
          let j = i + 1;
          for (; j < raw.length; j++) {
            const l = raw[j].trim();
            if (!l.startsWith("- ")) break;
            const m = l.slice(2).match(/^(?:\?(\S+)\s+)?(.*?)\s*=>\s*(\S+)\s*(?:\|\s*(.*))?$/);
            if (!m) {
              problems.push({ line: j + 1, msg: "선택지는 '- 문구 => 라벨 | 효과' 형식" });
              continue;
            }
            const effects: Effect[] = (m[4] ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => {
                const e = s.match(/^([a-z_]+)([+-]\d+)$/);
                return e ? { name: e[1], add: Number(e[2]) } : { name: s };
              });
            options.push({ cond: m[1], text: m[2], label: m[3], effects });
          }
          if (!options.length) bad("선택지가 없습니다");
          push({ t: "choice", options }, n);
          i = j - 1;
          break;
        }
        case "next":
          if (!has(CHAPTER_IDS, arg)) bad(`없는 장: ${arg}`);
          push({ t: "next", chapter: arg }, n);
          break;
        case "end":
          if (!has(ENDING_IDS, arg)) bad(`없는 엔딩: ${arg}`);
          push({ t: "end", ending: arg }, n);
          break;
        default:
          bad(`모르는 명령: @${head}`);
      }
      continue;
    }

    // 대사 줄: "이름: 내용", "이름[표정]: 내용", "(이름): 내용"
    const m = line.match(/^(\(?)([^:：()[\]]{1,12}?)(\)?)(?:\[([a-z]+)\])?\s*[:：]\s+(.+)$/);
    if (m && (/^[?？]+$/.test(m[2].trim()) || !/[.!?…,]/.test(m[2]))) {
      const who0 = m[2].trim();
      const who = /^[?？]+$/.test(who0) ? "???" : who0;
      const expr = m[4];
      if (expr && !has(EXPRESSIONS, expr)) bad(`없는 표정: ${expr}`);
      const text = m[5];
      if (/^[“"「]/.test(text)) bad("대사에 따옴표를 쓰지 마세요 (자동으로 붙습니다)", true);
      push({ t: "say", who, char: SPEAKER_TO_CHAR[who], expr, text, quiet: m[1] === "(" }, n);
    } else {
      push({ t: "say", who: null, text: line }, n);
    }
    if (line.length > 220) bad(`줄이 깁니다 (${line.length}자)`, true);
  }

  return { cmds, labels, lines, problems };
}

// ── 조건식 ─────────────────────────────────────────
// "c >= 6 & lullaby & !lantern", "l > 2 | forgive". &가 |보다 먼저 묶입니다.
export type Vars = Record<string, number | boolean>;

export function evalCond(cond: string, vars: Vars): boolean {
  return cond.split("|").some((part) =>
    part.split("&").every((atom) => {
      const a = atom.trim();
      if (!a) return true;
      const m = a.match(/^([a-z_][a-z0-9_]*)\s*(>=|<=|==|!=|>|<)\s*(-?\d+)$/);
      if (m) {
        const v = Number(vars[m[1]] ?? 0);
        const x = Number(m[3]);
        switch (m[2]) {
          case ">=": return v >= x;
          case "<=": return v <= x;
          case ">": return v > x;
          case "<": return v < x;
          case "==": return v === x;
          default: return v !== x;
        }
      }
      if (a.startsWith("!")) return !vars[a.slice(1).trim()];
      return Boolean(vars[a]);
    }),
  );
}

export function condNames(cond: string): string[] {
  return cond.match(/[a-z_][a-z0-9_]*/g) ?? [];
}
