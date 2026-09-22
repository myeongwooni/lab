import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { countCells, readCells, turnTaken } from "@/lib/store";
import { kstDayKey, secondsUntilKstMidnight } from "@/lib/day";
import {
  VISITOR_COOKIE,
  newVisitorId,
  nicknameFor,
  publicId,
} from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const visitor = existing ?? newVisitorId();
  const me = publicId(visitor);
  const day = kstDayKey();

  const [cells, total, taken] = await Promise.all([
    readCells(),
    countCells(),
    existing ? turnTaken(me, day) : Promise.resolve(false),
  ]);

  const res = NextResponse.json({
    cells,
    total,
    me,
    nickname: nicknameFor(me),
    usedToday: taken,
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
