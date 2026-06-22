import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { redirect } from "next/navigation";

export interface SessionData {
  matchmakerId?: string;
  fullName?: string;
  username?: string;
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

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.matchmakerId) redirect("/login");
  return session as SessionData & { matchmakerId: string; fullName: string };
}
