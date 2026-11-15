import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "kivai_admin_session";
const TRAFEGO_HOST = "trafego.kivai.com.br";
const STREAMING_HOST = "streaming.kivai.com.br";

// These routes belong to the main Kivai application and must keep their
// existing destinations on the streaming host.
const STREAMING_RESERVED_PATHS = new Set([
  "admin", "ads.txt", "ajuda", "api", "aprovar", "blog", "cadastro",
  "conta", "contato", "creditos", "dashboard", "ferramentas", "login",
  "manifest.webmanifest", "metodologia", "paginas", "pdf", "planos",
  "premium", "privacidade", "recursos", "robots.txt", "seguranca",
  "servicos", "sobre", "sitemap.xml", "termos", "trafego", "sw.js",
  "opengraph-image", "twitter-image",
]);

export function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  const { pathname } = request.nextUrl;

  const isTrafficMetadata = pathname === "/robots.txt" || pathname === "/sitemap.xml";
  const isTrafficApi = pathname.startsWith("/api/trafego/");

  if (host === STREAMING_HOST) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/musica";
      return NextResponse.rewrite(url);
    }

    // Keep old shared-hub URLs working while exposing clean artist and album
    // slugs on the streaming domain.
    if (pathname === "/musica" || pathname.startsWith("/musica/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice("/musica".length) || "/";
      return NextResponse.redirect(url, 308);
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();
    if (
      segments.length > 0 &&
      segments.length <= 2 &&
      firstSegment &&
      !STREAMING_RESERVED_PATHS.has(firstSegment)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/musica${pathname}`;
      return NextResponse.rewrite(url);
    }
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
