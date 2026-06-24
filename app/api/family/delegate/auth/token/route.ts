import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiDelegateSession } from "@/lib/auth/api";
import { issueDelegateMobileSession } from "@/lib/auth/delegate-mobile";

const schema = z.object({ delegateId: z.string().optional() });

export async function POST(req: Request) {
  const session = await requireApiDelegateSession();
  if (session instanceof NextResponse) return session;

  let body: z.infer<typeof schema> = {};
  try {
    body = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid request." } }, { status: 400 });
  }

  const delegateId = body.delegateId ?? session.delegateId;
  if (delegateId !== session.delegateId) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed." } }, { status: 403 });
  }

  const issued = await issueDelegateMobileSession(delegateId);
  if (!issued) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Delegate not found." } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...issued });
}
