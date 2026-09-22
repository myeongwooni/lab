import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VISITOR_COOKIE, publicId } from "@/lib/identity";
import { viewFor } from "@/lib/view";

export const dynamic = "force-dynamic";

/** Reading state never mints an identity — the first run or rename does. */
export async function GET() {
  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value;
  return NextResponse.json(await viewFor(visitor ? publicId(visitor) : null));
}
