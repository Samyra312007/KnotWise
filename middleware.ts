import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/portal/login",
  "/portal/verify",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/client/auth/magic-link",
  "/api/webhooks/resend",
  "/api/webhooks/stripe",
  "/api/inngest",
  "/api/uploadthing",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const hasMatchmakerSession = req.cookies.has("knotwise_session");
  const hasClientSession = req.cookies.has("knotwise_client_session");

  if (pathname.startsWith("/portal")) {
    if (!hasClientSession && pathname !== "/portal/login" && pathname !== "/portal/verify") {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/ops")
  ) {
    if (!hasMatchmakerSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
