import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { board, personalBest } from "@/lib/store";
import { VISITOR_COOKIE, nicknameFor, publicId } from "@/lib/identity";

export const dynamic = "force-dynamic";

/** Reading state never mints an identity — the first run does. */
export async function GET() {
  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value;
  const me = visitor ? publicId(visitor) : null;

  const [state, best] = await Promise.all([
    board(),
    me ? personalBest(me) : Promise.resolve(0),
  ]);

  return NextResponse.json({
    ...state,
    top: state.top.map((e) => ({ ...e, name: nicknameFor(e.id) })),
    me,
    nickname: me ? nicknameFor(me) : null,
    best,
  });
}
