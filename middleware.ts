import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup/bureau",
  "/portal/login",
  "/portal/signup",
  "/portal/verify",
  "/portal/delegate/login",
  "/portal/delegate/verify",
  "/portal/delegate/accept",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/signup/bureau",
  "/api/client/auth/magic-link",
  "/api/client/auth/signup",
  "/api/client/auth/logout",
  "/api/family/delegate/auth/magic-link",
  "/api/family/delegate/auth/verify",
  "/api/family/delegates/accept",
  "/api/webhooks/resend",
  "/api/webhooks/stripe",
  "/api/webhooks/razorpay",
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
    if (
      !hasClientSession &&
      !req.cookies.has("knotwise_delegate_session") &&
      pathname !== "/portal/login" &&
      pathname !== "/portal/signup" &&
      pathname !== "/portal/verify" &&
      !pathname.startsWith("/portal/delegate/login") &&
      !pathname.startsWith("/portal/delegate/verify") &&
      !pathname.startsWith("/portal/delegate/accept")
    ) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/signup")) {
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
