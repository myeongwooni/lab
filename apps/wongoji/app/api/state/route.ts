import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { countCells, readCells, turnTaken } from "@/lib/store";
import { kstDayKey, secondsUntilKstMidnight } from "@/lib/day";
import { VISITOR_COOKIE, nicknameFor, publicId } from "@/lib/identity";

export const dynamic = "force-dynamic";

/** Reading state never mints an identity — the first written character
 *  does. Two polls racing on a cookie-less visitor would otherwise each
 *  mint one, and the name shown would not be the name that gets stored. */
export async function GET() {
  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value;
  const me = visitor ? publicId(visitor) : null;
  const day = kstDayKey();

  const [cells, total, taken] = await Promise.all([
    readCells(),
    countCells(),
    me ? turnTaken(me, day) : Promise.resolve(false),
  ]);

  return NextResponse.json({
    cells,
    total,
    me,
    nickname: me ? nicknameFor(me) : null,
    usedToday: taken,
    resetInSec: secondsUntilKstMidnight(),
  });
}
