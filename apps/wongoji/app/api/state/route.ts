import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { turnTaken } from "@/lib/store";
import { sheet } from "@/lib/view";
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

  const view = await sheet();
  const taken = me
    ? await turnTaken(me, day).catch(() => false)
    : false;

  return NextResponse.json({
    ...view,
    me,
    nickname: me ? nicknameFor(me) : null,
    usedToday: taken,
    resetInSec: secondsUntilKstMidnight(),
  });
}
