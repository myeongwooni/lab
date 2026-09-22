import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  BREAK_ODDS,
  COOLDOWN_SEC,
  countFlip,
  cooldownLeft,
  cutChain,
  extendChain,
  networkAllows,
  recordBreak,
  snapshot,
  startCooldown,
} from "@/lib/store";
import {
  VISITOR_COOKIE,
  clientIp,
  ipHash,
  newVisitorId,
  nicknameFor,
  publicId,
} from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const visitor = existing ?? newVisitorId();
  const me = publicId(visitor);
  const nickname = nicknameFor(me);

  const setCookie = (res: NextResponse) => {
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

  if (!(await networkAllows(ipHash(clientIp(req.headers))))) {
    return setCookie(
      NextResponse.json({ error: "너무 빨라요. 잠깐만." }, { status: 429 }),
    );
  }

  if (!(await startCooldown(me, COOLDOWN_SEC))) {
    return setCookie(
      NextResponse.json(
        { error: "아직 차례가 아니에요.", cooldown: await cooldownLeft(me) },
        { status: 429 },
      ),
    );
  }

  await countFlip();
  const tails = randomInt(BREAK_ODDS) === 0;

  if (!tails) {
    const chain = await extendChain();
    const state = await snapshot();
    return setCookie(
      NextResponse.json({
        ...state,
        chain,
        outcome: "heads",
        nickname,
        cooldown: COOLDOWN_SEC,
      }),
    );
  }

  const broken = await cutChain();
  if (broken > 0) {
    await recordBreak({ len: broken, n: nickname, t: Date.now() });
  }
  const state = await snapshot();
  return setCookie(
    NextResponse.json({
      ...state,
      outcome: "tails",
      broke: broken,
      nickname,
      cooldown: COOLDOWN_SEC,
    }),
  );
}
