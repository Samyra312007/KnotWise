import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  checkRateLimitSync,
  clientIpFromHeaders,
  rateLimitKeyForRequest,
} from "@/lib/scale/rate-limit";
import { newRequestId } from "@/lib/scale/logger";

const PUBLIC_PATHS = [
  "/login",
  "/signup/bureau",
  "/portal/login",
  "/portal/signup",
  "/portal/verify",
  "/portal/delegate/login",
  "/portal/delegate/verify",
  "/portal/delegate/accept",
  "/legal",
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
  "/api/health",
  "/api/openapi",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function applyRateLimit(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/api/")) return null;
  if (req.nextUrl.pathname === "/api/health" || req.nextUrl.pathname === "/api/openapi") return null;

  const ip = clientIpFromHeaders(req.headers);
  const authenticated =
    req.cookies.has("knotwise_session") ||
    req.cookies.has("knotwise_client_session") ||
    req.cookies.has("knotwise_delegate_session") ||
    Boolean(req.headers.get("authorization")?.startsWith("Bearer "));
  const actorId =
    req.cookies.get("knotwise_client_session")?.value ??
    req.cookies.get("knotwise_session")?.value ??
    req.headers.get("authorization")?.slice(7, 24);

  const { key, limit } = rateLimitKeyForRequest({
    ip,
    pathname: req.nextUrl.pathname,
    authenticated,
    actorId: actorId ?? undefined,
  });
  const result = checkRateLimitSync(key, limit);
  if (result.ok) return null;

  return NextResponse.json(
    { error: { code: "RATE_LIMIT", message: "Too many requests. Try again later." } },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
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

  const requestId = req.headers.get("x-request-id") ?? newRequestId();
  const rateLimited = applyRateLimit(req);
  if (rateLimited) {
    rateLimited.headers.set("x-request-id", requestId);
    return rateLimited;
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (isPublic(pathname)) {
    return response;
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
    return response;
  }

  if (pathname.startsWith("/signup")) {
    return response;
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
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
