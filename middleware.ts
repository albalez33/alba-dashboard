import { NextRequest, NextResponse } from "next/server";
import { sessionToken, AUTH_COOKIE } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api/cron|api/login|login|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await sessionToken())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
