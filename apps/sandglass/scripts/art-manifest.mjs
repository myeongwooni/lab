// public/art 아래의 그림 파일을 훑어 app/art/slots.generated.ts를 씁니다.
// `npm run dev`와 `npm run build` 전에 저절로 돌아갑니다(predev/prebuild). 직접 돌리려면:
//   node scripts/art-manifest.mjs
//
// 폴더 규칙 (docs/art-slots.md)
//   public/art/bg/<배경id>.(webp|png|jpg|jpeg)
//   public/art/cg/<cgid>.(webp|png|jpg|jpeg)
//   public/art/char/<인물id>/<표정>.(webp|png)
// 같은 이름이 여러 확장자로 있으면 webp > png > jpg 순으로 고릅니다.
// 주소 뒤에 ?v=<내용 해시>를 붙여 그림을 바꾸면 브라우저 캐시도 새로 받습니다.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artDir = join(root, "public/art");
const out = join(root, "app/art/slots.generated.ts");

const RANK = { webp: 0, png: 1, jpg: 2, jpeg: 3 };
const ID = /^[a-z0-9_]+$/;

function scan(dir, exts) {
  const found = {};
  if (!existsSync(dir)) return found;
  for (const f of readdirSync(dir).sort()) {
    const m = f.match(/^(.+)\.([a-z0-9]+)$/i);
    if (!m) continue;
    const [, name, extRaw] = m;
    const ext = extRaw.toLowerCase();
    if (!exts.includes(ext) || !ID.test(name)) continue;
    const full = join(dir, f);
    if (!statSync(full).isFile()) continue;
    const prev = found[name];
    if (prev && RANK[prev.ext] <= RANK[ext]) continue;
    found[name] = { ext, file: f, v: createHash("sha1").update(readFileSync(full)).digest("hex").slice(0, 8) };
  }
  return found;
}

function urls(found, base) {
  return Object.fromEntries(Object.entries(found).map(([k, x]) => [k, `/art/${base}/${x.file}?v=${x.v}`]));
}

const bg = urls(scan(join(artDir, "bg"), ["webp", "png", "jpg", "jpeg"]), "bg");
const cg = urls(scan(join(artDir, "cg"), ["webp", "png", "jpg", "jpeg"]), "cg");
const char = {};
const charDir = join(artDir, "char");
if (existsSync(charDir)) {
  for (const c of readdirSync(charDir).sort()) {
    if (!ID.test(c) || !statSync(join(charDir, c)).isDirectory()) continue;
    const exprs = urls(scan(join(charDir, c), ["webp", "png"]), `char/${c}`);
    if (Object.keys(exprs).length) char[c] = exprs;
  }
}

const json = (o) => JSON.stringify(o, null, 2);
const src = `// 자동 생성 파일입니다. 직접 고치지 마세요 — scripts/art-manifest.mjs가 public/art를 훑어 씁니다.
// 여기 적힌 슬롯은 SVG 대신 그림 파일로 그려집니다.
export type ArtSlots = {
  bg: Record<string, string>;
  cg: Record<string, string>;
  char: Record<string, Record<string, string>>;
};

export const ART_SLOTS: ArtSlots = {
  bg: ${json(bg).replace(/\n/g, "\n  ")},
  cg: ${json(cg).replace(/\n/g, "\n  ")},
  char: ${json(char).replace(/\n/g, "\n  ")},
};
`;

const before = existsSync(out) ? readFileSync(out, "utf8") : "";
if (before !== src) writeFileSync(out, src);
const count = Object.keys(bg).length + Object.keys(cg).length + Object.values(char).reduce((n, x) => n + Object.keys(x).length, 0);
console.log(`art-manifest: 그림 슬롯 ${count}개 (배경 ${Object.keys(bg).length}, CG ${Object.keys(cg).length}, 인물 ${Object.keys(char).length}명)`);
