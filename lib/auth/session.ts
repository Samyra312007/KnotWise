import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { redirect } from "next/navigation";
import type { MembershipRole } from "./roles";

export interface SessionData {
  userType?: "matchmaker" | "client" | "delegate";
  matchmakerId?: string;
  clientId?: string;
  customerId?: string;
  delegateId?: string;
  delegateRole?: string;
  orgId?: string;
  role?: MembershipRole;
  fullName?: string;
  username?: string;
  email?: string;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "fallback_dev_secret_at_least_32_characters_long_yes_indeed",
  cookieName: "knotwise_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export const clientSessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "fallback_dev_secret_at_least_32_characters_long_yes_indeed",
  cookieName: "knotwise_client_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export const delegateSessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "fallback_dev_secret_at_least_32_characters_long_yes_indeed",
  cookieName: "knotwise_delegate_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getClientSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, clientSessionOptions);
}

export async function getDelegateSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, delegateSessionOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.matchmakerId || session.userType !== "matchmaker") redirect("/login");
  return session as SessionData & {
    matchmakerId: string;
    orgId: string;
    role: MembershipRole;
    fullName: string;
  };
}

export async function requireClientSession() {
  const session = await getClientSession();
  if (!session.clientId || session.userType !== "client") redirect("/portal/login");
  return session as SessionData & {
    clientId: string;
    customerId: string;
    email: string;
  };
}

export async function requireDelegateSession() {
  const session = await getDelegateSession();
  if (!session.delegateId || !session.customerId || session.userType !== "delegate") {
    redirect("/portal/delegate/login");
  }
  return session as SessionData & {
    delegateId: string;
    customerId: string;
    delegateRole: string;
    email: string;
  };
}
