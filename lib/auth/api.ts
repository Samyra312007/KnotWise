import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession, getClientSession, type SessionData } from "./session";
import type { MembershipRole } from "./roles";
import { isOpsOrOwner } from "./roles";

export type ApiError = { error: { code: string; message: string } };

export function unauthorized(message = "Sign in first."): NextResponse<ApiError> {
  return NextResponse.json({ error: { code: "UNAUTHORIZED", message } }, { status: 401 });
}

export function forbidden(message = "You do not have permission."): NextResponse<ApiError> {
  return NextResponse.json({ error: { code: "FORBIDDEN", message } }, { status: 403 });
}

export function notFound(message = "Not found."): NextResponse<ApiError> {
  return NextResponse.json({ error: { code: "NOT_FOUND", message } }, { status: 404 });
}

export type MatchmakerSession = SessionData & {
  matchmakerId: string;
  orgId: string;
  role: MembershipRole;
  fullName: string;
};

export async function requireApiSession(): Promise<MatchmakerSession | NextResponse<ApiError>> {
  const session = await getSession();
  if (!session.matchmakerId || !session.orgId || !session.role || session.userType !== "matchmaker") {
    return unauthorized();
  }
  return session as MatchmakerSession;
}

export async function requireApiRole(
  roles: MembershipRole[]
): Promise<MatchmakerSession | NextResponse<ApiError>> {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!roles.includes(session.role)) return forbidden();
  return session;
}

export async function requireApiOps(): Promise<MatchmakerSession | NextResponse<ApiError>> {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!isOpsOrOwner(session.role)) return forbidden();
  return session;
}

export type ClientSession = SessionData & {
  clientId: string;
  customerId: string;
  email: string;
};

export type DelegateSession = SessionData & {
  delegateId: string;
  customerId: string;
  delegateRole: string;
  email: string;
};

export async function requireApiClientSession(): Promise<ClientSession | NextResponse<ApiError>> {
  const headerStore = await headers();
  const auth = headerStore.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { validateClientMobileToken } = await import("@/lib/auth/client-mobile");
    const bearer = await validateClientMobileToken(auth.slice(7));
    if (bearer) return bearer;
  }

  const session = await getClientSession();
  if (!session.clientId || !session.customerId || session.userType !== "client") {
    return unauthorized("Client sign-in required.");
  }
  return session as ClientSession;
}

export async function requireApiDelegateSession(): Promise<DelegateSession | NextResponse<ApiError>> {
  const headerStore = await headers();
  const auth = headerStore.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { validateDelegateMobileToken } = await import("@/lib/auth/delegate-mobile");
    const bearer = await validateDelegateMobileToken(auth.slice(7));
    if (bearer) return bearer;
  }

  const { getDelegateSession } = await import("@/lib/auth/session");
  const session = await getDelegateSession();
  if (!session.delegateId || !session.customerId || session.userType !== "delegate") {
    return unauthorized("Delegate sign-in required.");
  }
  return session as DelegateSession;
}

export async function requireBearerSession(req: Request): Promise<MatchmakerSession | NextResponse<ApiError>> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const { validateMobileToken } = await import("@/lib/auth/mobile");
    const result = await validateMobileToken(token);
    if (result) return result;
  }
  return requireApiSession();
}
