// 확장자 없는 상대 경로 import를 .ts로 풀어 줍니다. `node --import ./scripts/ts-resolve.mjs <파일>`
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  if (/^\\.{1,2}\\//.test(specifier) && !/\\.[cm]?[jt]sx?$/.test(specifier)) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try { return await next(specifier + ext, context); } catch {}
    }
  }
  return next(specifier, context);
}`),
  import.meta.url,
);
