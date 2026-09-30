// 원고를 처음부터 끝까지 수백 번 무작위로 읽어 막다른 길, 없는 라벨, 도달하지 못하는 줄을 찾습니다.
//   node --import ./scripts/ts-resolve.mjs scripts/playtest.ts [횟수]
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { advance, buildStory, choose, enterChapter, newGame, run, type GameState, type StepResult } from "../app/engine/runtime";
import { parseScript } from "../app/engine/script";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../app/story");
const sources: Record<string, string> = {};
for (const f of readdirSync(dir)) {
  if (!/^[a-z0-9_]+\.ts$/.test(f) || f === "index.ts") continue;
  sources[f.replace(/\.ts$/, "")] = (await import(join(dir, f))).default;
}
const story = buildStory(sources, parseScript);
const runs = Number(process.argv[2] ?? 400);
const seen = new Set<string>();
const endings = new Map<string, number>();
const problems = new Map<string, number>();
const chosen = new Map<string, Set<number>>();

for (let r = 0; r < runs; r++) {
  const extra = { true_unlocked: r % 3 === 0 };
  let res: StepResult;
  try {
    // 절반은 처음부터, 나머지는 루트 첫 장에서 무작위 호감도·플래그로 시작합니다.
    const starts = ["e06", "r06", "s06", "t06"].filter((c) => story.chapters[c]);
    const fromRoute = r % 2 === 1 && starts.length > 0;
    const flags = ["r_stitch", "know_chapel", "know_sand", "toby_saved", "e_watch", "s_eye", "ribbon", "know_king", "e_trust", "lili_saved", "know_cecilia"];
    const vars: Record<string, number | boolean> = { e: Math.floor(Math.random() * 8), r: Math.floor(Math.random() * 7), s: Math.floor(Math.random() * 6), loop: 11 };
    for (const f of flags) if (Math.random() < 0.6) vars[f] = true;
    res = run(story, fromRoute ? newGame(starts[r % starts.length], vars) : newGame("prologue"), extra);
  } catch (e) {
    problems.set(String(e), (problems.get(String(e)) ?? 0) + 1);
    continue;
  }
  for (let steps = 0; steps < 50000; steps++) {
    const { beat, state } = res;
    try {
      if (beat.kind === "say" || beat.kind === "letter") seen.add(`${state.ch}:${state.i}`);
      if (beat.kind === "end") {
        endings.set(beat.ending, (endings.get(beat.ending) ?? 0) + 1);
        break;
      }
      if (beat.kind === "next") {
        if (!story.chapters[beat.chapter]) {
          problems.set(`원고 없음: ${beat.chapter}`, (problems.get(`원고 없음: ${beat.chapter}`) ?? 0) + 1);
          break;
        }
        res = enterChapter(story, state, beat.chapter, extra);
        continue;
      }
      if (beat.kind === "choice") {
        if (!beat.options.length) throw new Error(`빈 선택지 ${beat.key}`);
        // 아직 안 고른 선택지를 먼저 고릅니다.
        const tried = chosen.get(beat.key) ?? new Set<number>();
        chosen.set(beat.key, tried);
        const fresh = beat.options.map((_, i) => i).filter((i) => !tried.has(i));
        const pick = fresh.length && Math.random() < 0.7 ? fresh[0] : Math.floor(Math.random() * beat.options.length);
        tried.add(pick);
        const opt = beat.options[pick];
        if (!story.labels[opt.label]) {
          problems.set(`원고 없음(선택지): ${opt.label}`, (problems.get(`원고 없음(선택지): ${opt.label}`) ?? 0) + 1);
          break;
        }
        res = choose(story, state, opt, extra);
        continue;
      }
      res = advance(story, state as GameState, extra);
    } catch (e) {
      const msg = `${e instanceof Error ? e.message : e} @ ${state.ch}:${state.i}`;
      problems.set(msg, (problems.get(msg) ?? 0) + 1);
      break;
    }
  }
}

console.log("엔딩 도달:", Object.fromEntries(endings));
for (const [p, n] of problems) console.log(`✗ ${p} (${n}회)`);
for (const [ch, p] of Object.entries(story.chapters)) {
  const total = p.cmds.filter((c) => c.t === "say" || c.t === "letter").length;
  const got = p.cmds.filter((c, i) => (c.t === "say" || c.t === "letter") && seen.has(`${ch}:${i}`)).length;
  const missing = p.cmds.map((c, i) => ((c.t === "say" || c.t === "letter") && !seen.has(`${ch}:${i}`) ? p.lines[i] : 0)).filter(Boolean);
  console.log(`· ${ch}: ${got}/${total}줄 도달${missing.length ? ` — 못 간 줄(원고 줄 번호): ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? " …" : ""}` : ""}`);
}
