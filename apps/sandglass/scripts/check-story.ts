// 원고를 모두 읽어 규격 위반, 없는 라벨, 오타 난 변수를 찾습니다.
//   node scripts/check-story.ts            모든 장
//   node scripts/check-story.ts ch02 ch03  특정 장만 (라벨 검사는 있는 장 전체 기준)
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTER_IDS, condNames, parseScript, type Cmd } from "../app/engine/script.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../app/story");
const only = process.argv.slice(2);
const files = readdirSync(dir).filter((f) => /^[a-z0-9_]+\.ts$/.test(f) && f !== "index.ts");

// 엔진이 관리하는 변수와 바이블의 변수. 여기 없는 이름을 쓰면 오타일 가능성이 큽니다.
const KNOWN_VARS = new Set([
  "e", "r", "s", "loop", "true_unlocked", "unmasked",
  "r_stitch", "know_chapel", "know_sand", "know_fire", "toby_saved", "e_watch", "s_eye", "ribbon", "know_poison", "know_king",
  "e_trust", "lili_saved", "know_cecilia", "e_waltz", "e_journal", "r_medic", "r_half", "s_liana", "s_forgive",
  "t_sian", "t_razel", "t_cecilia",
]);

const labelOwner = new Map<string, string>();
const parsed = new Map<string, { cmds: Cmd[]; lines: number[] }>();
let errors = 0;
let warnings = 0;

for (const f of files.sort()) {
  const id = f.replace(/\.ts$/, "");
  const mod = await import(join(dir, f));
  const src: unknown = mod.default;
  if (typeof src !== "string") {
    console.log(`✗ ${f}: default export가 문자열이 아닙니다`);
    errors++;
    continue;
  }
  const p = parseScript(src);
  parsed.set(id, p);
  if (!(CHAPTER_IDS as readonly string[]).includes(id)) console.log(`? ${f}: 장 목록에 없는 파일 이름`);
  if (p.labels[id] !== 0) {
    console.log(`✗ ${f}: 첫 라벨이 '* ${id}'가 아닙니다`);
    errors++;
  }
  for (const [name] of Object.entries(p.labels)) {
    if (labelOwner.has(name)) {
      console.log(`✗ ${f}: 라벨 '${name}'이(가) ${labelOwner.get(name)}에도 있습니다`);
      errors++;
    }
    labelOwner.set(name, id);
  }
  if (!only.length || only.includes(id)) {
    for (const pr of p.problems) {
      console.log(`${pr.warn ? "!" : "✗"} ${f}:${pr.line} ${pr.msg}`);
      if (pr.warn) warnings++;
      else errors++;
    }
  }
}

for (const [id, p] of parsed) {
  if (only.length && !only.includes(id)) continue;
  const where = (i: number) => `${id}.ts:${p.lines[i]}`;
  const vars = (names: string[], i: number) => {
    for (const v of names) if (!KNOWN_VARS.has(v)) (console.log(`! ${where(i)} 모르는 변수 '${v}' (오타?)`), warnings++);
  };
  const target = (label: string, i: number) => {
    if (labelOwner.has(label)) return;
    // 아직 원고가 없는 장으로 가는 점프는 경고만 합니다.
    if ((CHAPTER_IDS as readonly string[]).includes(label)) (console.log(`! ${where(i)} '${label}' 원고가 아직 없습니다`), warnings++);
    else (console.log(`✗ ${where(i)} 없는 라벨: ${label}`), errors++);
  };
  let says = 0;
  p.cmds.forEach((c, i) => {
    if (c.t === "say") says++;
    if (c.t === "jump" || c.t === "rewind") target(c.label, i);
    if (c.t === "if") (target(c.label, i), vars(condNames(c.cond), i));
    if (c.t === "set" || c.t === "add") vars([c.name], i);
    if (c.t === "choice")
      for (const o of c.options) {
        target(o.label, i);
        vars(o.effects.map((e) => e.name), i);
        if (o.cond) vars(condNames(o.cond), i);
      }
    if (c.t === "next" && !parsed.has(c.chapter)) console.log(`! ${where(i)} 다음 장 '${c.chapter}' 원고가 아직 없습니다`);
  });
  const last = p.cmds[p.cmds.length - 1];
  if (!last || !["next", "end", "jump", "choice", "rewind"].includes(last.t)) {
    console.log(`✗ ${id}.ts: 마지막 명령이 @next/@end/@jump/@choice/@rewind가 아닙니다`);
    errors++;
  }
  const chars = p.cmds.reduce((s, c) => s + (c.t === "say" ? c.text.length : c.t === "letter" ? c.paras.join("").length : 0), 0);
  console.log(`· ${id}: 텍스트 ${says}줄, ${chars.toLocaleString()}자`);
}

console.log(errors ? `\n오류 ${errors}개, 경고 ${warnings}개` : `\n오류 없음 (경고 ${warnings}개)`);
process.exit(errors ? 1 : 0);
