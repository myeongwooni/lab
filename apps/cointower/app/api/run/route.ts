import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { recordRun, rollRun, takeSlot } from "@/lib/store";
import { viewFor } from "@/lib/view";
import { visitor } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function POST() {
  const { me, seal } = await visitor();

  if (!(await takeSlot(me))) {
    return seal(NextResponse.json({ error: "조금만 천천히." }, { status: 429 }));
  }

  const run = rollRun(() => randomInt(2));
  const { isRecord } = await recordRun(me, run, Date.now());

  return seal(
    NextResponse.json({ ...(await viewFor(me)), run, isRecord }),
  );
}
