import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { delegateSessionOptions, type SessionData } from "./session";

export async function establishDelegateSession(delegate: {
  id: string;
  customerId: string;
  email: string;
  role: string;
}) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, delegateSessionOptions);
  session.userType = "delegate";
  session.delegateId = delegate.id;
  session.customerId = delegate.customerId;
  session.delegateRole = delegate.role;
  session.email = delegate.email;
  await session.save();
}

export async function clearDelegateSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, delegateSessionOptions);
  session.destroy();
}
