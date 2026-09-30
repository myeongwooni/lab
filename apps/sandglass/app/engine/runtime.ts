// 원고 명령을 한 박자(클릭 한 번)씩 실행합니다. 화면과 상관없는 순수 로직이라 저장/불러오기가 쉽습니다.
import { evalCond, type ChapterId, type CharId, type Cmd, type Option, type Parsed, type Pos, type Transition, type Vars } from "./script";

export type Story = {
  chapters: Record<string, Parsed>;
  // 전역 라벨 → (장, 명령 번호)
  labels: Record<string, { ch: string; i: number }>;
};

export function buildStory(sources: Record<string, string>, parse: (src: string) => Parsed): Story {
  const chapters: Record<string, Parsed> = {};
  const labels: Story["labels"] = {};
  for (const [ch, src] of Object.entries(sources)) {
    const p = parse(src);
    chapters[ch] = p;
    for (const [name, i] of Object.entries(p.labels)) labels[name] = { ch, i };
  }
  return { chapters, labels };
}

export type Actor = { id: CharId; expr: string; pos: Pos };
export type NvlLine = { who: string | null; text: string; quiet?: boolean };

export type StageState = {
  bg: string;
  bgTrans: Transition;
  bgMs: number;
  bgSeq: number; // 배경이 바뀔 때마다 1씩. 같은 배경으로 다시 전환하는 연출도 구분합니다.
  cg: string | null;
  actors: Actor[];
  bgm: string | null;
  amb: string | null;
  fx: string | null;
  filter: string | null;
  nvl: boolean;
  nvlLines: NvlLine[];
};

export type GameState = {
  ch: string;
  i: number;
  vars: Vars;
  stage: StageState;
  day: number | null;
};

export type Beat =
  | { kind: "say"; who: string | null; text: string; char?: CharId; quiet?: boolean; key: string }
  | { kind: "choice"; options: Option[]; key: string }
  | { kind: "title"; small: string; big: string }
  | { kind: "day"; n: number }
  | { kind: "letter"; head: string; paras: string[]; key: string }
  | { kind: "wait"; ms: number }
  | { kind: "next"; chapter: string }
  | { kind: "end"; ending: string }
  | { kind: "death"; id: string }
  | { kind: "rewind"; loop: number };

export type Effect =
  | { t: "se"; id: string }
  | { t: "shake"; big: boolean }
  | { t: "flash"; color: string }
  | { t: "place"; text: string }
  | { t: "unlockCg"; id: string }
  | { t: "unlockDeath"; id: string };

export function emptyStage(): StageState {
  return { bg: "black", bgTrans: "cut", bgMs: 0, bgSeq: 0, cg: null, actors: [], bgm: null, amb: null, fx: null, filter: null, nvl: false, nvlLines: [] };
}

export function newGame(ch: ChapterId | string = "prologue", vars: Vars = { e: 0, r: 0, s: 0, loop: 1 }): GameState {
  return { ch, i: 0, vars: { ...vars }, stage: emptyStage(), day: null };
}

const DEFAULT_POS: Pos[] = ["center", "left", "right"];

function applyStage(s: StageState, cmd: Cmd, fx: Effect[]): StageState {
  switch (cmd.t) {
    case "bg":
      return { ...s, bg: cmd.id, bgTrans: cmd.trans, bgMs: cmd.ms, bgSeq: s.bgSeq + 1 };
    case "cg":
      if (cmd.id) fx.push({ t: "unlockCg", id: cmd.id });
      return { ...s, cg: cmd.id };
    case "show": {
      const existing = s.actors.find((a) => a.id === cmd.id);
      if (existing) {
        return {
          ...s,
          actors: s.actors.map((a) => (a.id === cmd.id ? { ...a, expr: cmd.expr ?? a.expr, pos: cmd.pos ?? a.pos } : a)),
        };
      }
      const taken = new Set(s.actors.map((a) => a.pos));
      const pos = cmd.pos ?? DEFAULT_POS.find((p) => !taken.has(p)) ?? "center";
      // 같은 자리에 누가 있으면 밀어냅니다.
      const actors = s.actors.filter((a) => a.pos !== pos);
      return { ...s, actors: [...actors, { id: cmd.id, expr: cmd.expr ?? "normal", pos }] };
    }
    case "hide":
      return { ...s, actors: cmd.id === "all" ? [] : s.actors.filter((a) => a.id !== cmd.id) };
    case "bgm":
      return { ...s, bgm: cmd.id };
    case "amb":
      return { ...s, amb: cmd.id };
    case "fx":
      return { ...s, fx: cmd.id };
    case "filter":
      return { ...s, filter: cmd.id };
    case "mode":
      return { ...s, nvl: cmd.nvl, nvlLines: [] };
    case "clear":
      return { ...s, nvlLines: [] };
    case "se":
      fx.push({ t: "se", id: cmd.id });
      return s;
    case "shake":
      fx.push({ t: "shake", big: cmd.big });
      return s;
    case "flash":
      fx.push({ t: "flash", color: cmd.color });
      return s;
    case "place":
      fx.push({ t: "place", text: cmd.text });
      return s;
    default:
      return s;
  }
}

function applyVars(vars: Vars, cmd: Cmd): Vars {
  if (cmd.t === "set") return { ...vars, [cmd.name]: cmd.value };
  if (cmd.t === "add") return { ...vars, [cmd.name]: Number(vars[cmd.name] ?? 0) + cmd.n };
  return vars;
}

export function applyEffects(vars: Vars, option: Option): Vars {
  const next = { ...vars };
  for (const e of option.effects) {
    if (e.add !== undefined) next[e.name] = Number(next[e.name] ?? 0) + e.add;
    else next[e.name] = true;
  }
  return next;
}

export type StepResult = { state: GameState; beat: Beat; effects: Effect[] };

// state.i부터 실행해서 멈춰야 하는 명령(박자)을 만나면 돌려줍니다. state.i는 그 박자의 번호가 됩니다.
// extra: 엔진이 넣어 주는 전역 변수(true_unlocked 등)
export function run(story: Story, start: GameState, extra: Vars = {}): StepResult {
  let st = start;
  const effects: Effect[] = [];
  const env = () => ({ ...st.vars, ...extra });

  for (let guard = 0; guard < 20000; guard++) {
    const chapter = story.chapters[st.ch];
    if (!chapter) return { state: st, beat: { kind: "end", ending: "__missing" }, effects };
    const cmd = chapter.cmds[st.i];
    if (!cmd) {
      // 장이 명령 없이 끝났다면 원고 누락. 타이틀로 돌려보냅니다.
      return { state: st, beat: { kind: "end", ending: "__missing" }, effects };
    }
    const key = `${st.ch}:${st.i}`;
    const jumpTo = (label: string) => {
      const target = story.labels[label];
      if (!target) throw new Error(`없는 라벨: ${label}`);
      st = { ...st, ch: target.ch, i: target.i };
    };

    switch (cmd.t) {
      case "say": {
        let stage = st.stage;
        if (cmd.char && cmd.expr && stage.actors.some((a) => a.id === cmd.char)) {
          stage = { ...stage, actors: stage.actors.map((a) => (a.id === cmd.char ? { ...a, expr: cmd.expr! } : a)) };
        }
        st = { ...st, stage };
        return { state: st, beat: { kind: "say", who: cmd.who, text: cmd.text, char: cmd.char, quiet: cmd.quiet, key }, effects };
      }
      case "choice": {
        const vars = env();
        const options = cmd.options.filter((o) => !o.cond || evalCond(o.cond, vars));
        return { state: st, beat: { kind: "choice", options, key }, effects };
      }
      case "title":
        return { state: st, beat: { kind: "title", small: cmd.small, big: cmd.big }, effects };
      case "day":
        st = { ...st, day: cmd.n };
        return { state: st, beat: { kind: "day", n: cmd.n }, effects };
      case "letter":
        return { state: st, beat: { kind: "letter", head: cmd.head, paras: cmd.paras, key }, effects };
      case "wait":
        return { state: st, beat: { kind: "wait", ms: cmd.ms }, effects };
      case "next":
        return { state: st, beat: { kind: "next", chapter: cmd.chapter }, effects };
      case "end":
        return { state: st, beat: { kind: "end", ending: cmd.ending }, effects };
      case "death": {
        // 죽음: 무대를 비우고 사망 카드를 띄웁니다. 음악은 원고가 정합니다.
        const stage = { ...st.stage, actors: [], cg: null, fx: null, filter: null, nvl: false, nvlLines: [] };
        st = { ...st, stage };
        effects.push({ t: "unlockDeath", id: cmd.id });
        return { state: st, beat: { kind: "death", id: cmd.id }, effects };
      }
      case "rewind": {
        // 되감기: 회차를 올리고 무대를 전부 비운 뒤 라벨로 갑니다. 되감기 카드가 뜨는 동안 멈춰 있습니다.
        const target = story.labels[cmd.label];
        if (!target) throw new Error(`없는 라벨: ${cmd.label}`);
        const loop = Number(st.vars.loop ?? 1) + 1;
        st = { ...st, ch: target.ch, i: target.i - 1, vars: { ...st.vars, loop }, stage: { ...emptyStage(), bgSeq: st.stage.bgSeq + 1 }, day: null };
        return { state: st, beat: { kind: "rewind", loop }, effects };
      }
      case "jump":
        jumpTo(cmd.label);
        continue;
      case "if":
        if (evalCond(cmd.cond, env())) {
          jumpTo(cmd.label);
          continue;
        }
        break;
      case "set":
      case "add":
        st = { ...st, vars: applyVars(st.vars, cmd) };
        break;
      default:
        st = { ...st, stage: applyStage(st.stage, cmd, effects) };
    }
    st = { ...st, i: st.i + 1 };
  }
  throw new Error("원고가 끝없이 돌고 있습니다");
}

// 현재 박자를 넘기고 다음 박자까지 실행합니다.
export function advance(story: Story, st: GameState, extra: Vars = {}): StepResult {
  return run(story, { ...st, i: st.i + 1 }, extra);
}

export function choose(story: Story, st: GameState, option: Option, extra: Vars = {}): StepResult {
  const target = story.labels[option.label];
  if (!target) throw new Error(`없는 라벨: ${option.label}`);
  return run(story, { ...st, vars: applyEffects(st.vars, option), ch: target.ch, i: target.i }, extra);
}

export function enterChapter(story: Story, st: GameState, chapter: string, extra: Vars = {}): StepResult {
  // 다음 장은 무대를 비우고 시작합니다. 음악은 새 장이 정합니다.
  const stage = { ...st.stage, actors: [], cg: null, fx: null, filter: null, nvl: false, nvlLines: [] };
  return run(story, { ...st, ch: chapter, i: 0, stage }, extra);
}

// NVL 모드에서 대사를 화면에 쌓습니다.
export function pushNvl(st: GameState, line: NvlLine): GameState {
  return { ...st, stage: { ...st.stage, nvlLines: [...st.stage.nvlLines, line] } };
}
