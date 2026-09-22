import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  appendCell,
  claimTurn,
  countCells,
  readCells,
  releaseTurn,
  underIpLimit,
} from "@/lib/store";
import { kstDayKey, secondsUntilKstMidnight } from "@/lib/day";
import {
  VISITOR_COOKIE,
  clientIp,
  ipHash,
  newVisitorId,
  nicknameFor,
  publicId,
} from "@/lib/identity";

export const dynamic = "force-dynamic";

const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

function firstGrapheme(input: string): string {
  const first = segmenter.segment(input)[Symbol.iterator]().next();
  return first.done ? "" : first.value.segment;
}

function fail(status: number, message: string, extra: object = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const raw = typeof (body as { c?: unknown })?.c === "string" ? (body as { c: string }).c : "";

  let ch = firstGrapheme(raw);
  if (/^\s$/.test(ch)) ch = " ";
  if (!ch || ch.length > 8 || /[\p{Cc}\p{Cf}]/u.test(ch)) {
    return fail(400, "한 글자만 쓸 수 있어요.");
  }

  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const visitor = existing ?? newVisitorId();
  const me = publicId(visitor);
  const day = kstDayKey();

  if (!(await underIpLimit(ipHash(clientIp(req.headers)), day))) {
    return fail(429, "같은 네트워크에서 오늘 쓸 수 있는 몫을 다 썼어요.", {
      resetInSec: secondsUntilKstMidnight(),
    });
  }

  if (!(await claimTurn(me, day))) {
    return fail(429, "오늘 몫은 이미 썼어요.", {
      usedToday: true,
      resetInSec: secondsUntilKstMidnight(),
    });
  }

  const nickname = nicknameFor(me);
  try {
    await appendCell({ c: ch, a: me, n: nickname, t: Date.now() });
  } catch {
    await releaseTurn(me, day);
    return fail(503, "원고지에 닿지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
  }

  const [cells, total] = await Promise.all([readCells(), countCells()]);
  const res = NextResponse.json({
    cells,
    total,
    me,
    nickname,
    usedToday: true,
    resetInSec: secondsUntilKstMidnight(),
  });

  if (!existing) {
    res.cookies.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return res;
}
