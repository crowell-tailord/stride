import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "stride-secret-key-change-in-production-2026-fallback"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/favicon.ico", "/robots.txt"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const withRobotsHeaders = (response: NextResponse) => {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };

  // Allow static files and internal Next.js assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return withRobotsHeaders(NextResponse.next());
  }

  const token = request.cookies.get("stride_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return withRobotsHeaders(NextResponse.redirect(loginUrl));
  }

  try {
    await jwtVerify(token, SECRET_KEY);
    return withRobotsHeaders(NextResponse.next());
  } catch {
    const loginUrl = new URL("/login", request.url);
    return withRobotsHeaders(NextResponse.redirect(loginUrl));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
