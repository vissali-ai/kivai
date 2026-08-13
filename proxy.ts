import { NextRequest, NextResponse } from "next/server";
const ADMIN_COOKIE = "kivai_admin_session";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(ADMIN_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
