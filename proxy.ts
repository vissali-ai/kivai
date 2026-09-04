import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "kivai_admin_session";
const TRAFEGO_HOST = "trafego.kivai.com.br";

export function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  const { pathname } = request.nextUrl;
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  const isTrafficMetadata = pathname === "/robots.txt" || pathname === "/sitemap.xml";
  const isTrafficApi = pathname.startsWith("/api/trafego/");

  if (isVercelPreview && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/trafego";
    return NextResponse.rewrite(url);
  }

  if (host === TRAFEGO_HOST && pathname !== "/trafego" && !isTrafficApi && !isTrafficMetadata) {
    const url = request.nextUrl.clone();
    url.pathname = "/trafego";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin")) {
    if (!request.cookies.has(ADMIN_COOKIE)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
