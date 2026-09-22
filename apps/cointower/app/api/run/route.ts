import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { board, recordRun, rollRun, takeSlot } from "@/lib/store";
import {
  VISITOR_COOKIE,
  newVisitorId,
  nicknameFor,
  publicId,
} from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const visitor = existing ?? newVisitorId();
  const me = publicId(visitor);

  const withCookie = (res: NextResponse) => {
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
  };

  if (!(await takeSlot(me))) {
    return withCookie(
      NextResponse.json({ error: "조금만 천천히." }, { status: 429 }),
    );
  }

  const run = rollRun(() => randomInt(2));
  const at = Date.now();
  const { best, isRecord } = await recordRun(me, run, at);
  const state = await board();

  return withCookie(
    NextResponse.json({
      ...state,
      top: state.top.map((e) => ({ ...e, name: nicknameFor(e.id) })),
      me,
      nickname: nicknameFor(me),
      run,
      best,
      isRecord,
    }),
  );
}
