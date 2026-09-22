import { NextResponse } from "next/server";
import { setChosenName, takeSlot } from "@/lib/store";
import { NAME_MAX, cleanName } from "@/lib/identity";
import { viewFor } from "@/lib/view";
import { visitor } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { me, seal } = await visitor();

  const body = await req.json().catch(() => null);
  const name = cleanName((body as { name?: unknown })?.name);
  if (!name) {
    return seal(
      NextResponse.json(
        { error: `이름은 1~${NAME_MAX}자로 적어 주세요.` },
        { status: 400 },
      ),
    );
  }

  if (!(await takeSlot(me))) {
    return seal(NextResponse.json({ error: "조금만 천천히." }, { status: 429 }));
  }

  await setChosenName(me, name);
  return seal(NextResponse.json(await viewFor(me)));
}
