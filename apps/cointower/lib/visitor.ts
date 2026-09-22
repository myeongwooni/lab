import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { VISITOR_COOKIE, newVisitorId, publicId } from "./identity";

/** Identify the visitor for a write, minting the cookie when this is their
 *  first one. `seal` attaches it to whichever response the route returns,
 *  including an error, so a rejected first attempt still leaves them with
 *  the identity their next one will use. */
export async function visitor() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const value = existing ?? newVisitorId();

  return {
    me: publicId(value),
    seal<T extends NextResponse>(res: T): T {
      if (!existing) {
        res.cookies.set(VISITOR_COOKIE, value, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });
      }
      return res;
    },
  };
}
