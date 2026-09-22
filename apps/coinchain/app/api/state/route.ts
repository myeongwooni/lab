import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cooldownLeft, snapshot } from "@/lib/store";
import { VISITOR_COOKIE, nicknameFor, publicId } from "@/lib/identity";

export const dynamic = "force-dynamic";

/** Reading state never mints an identity — the first flip does. Two polls
 *  racing on a cookie-less visitor would otherwise each mint one, and the
 *  name shown would not be the name that ends up on the board. */
export async function GET() {
  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value;
  const me = visitor ? publicId(visitor) : null;

  const [state, cooldown] = await Promise.all([
    snapshot(),
    me ? cooldownLeft(me) : Promise.resolve(0),
  ]);

  return NextResponse.json({
    ...state,
    nickname: me ? nicknameFor(me) : null,
    cooldown,
  });
}
