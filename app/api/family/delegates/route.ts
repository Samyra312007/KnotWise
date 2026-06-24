import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { inviteFamilyDelegate } from "@/lib/family/delegates";
import type { DelegateRole } from "@/lib/family/constants";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["observer", "approver"]),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid invite." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const delegate = await inviteFamilyDelegate({
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      email: parsed.email,
      role: parsed.role as DelegateRole,
    });

    return NextResponse.json({
      ok: true,
      delegate: {
        id: delegate.id,
        email: delegate.email,
        role: delegate.role,
        status: delegate.status,
        invitedAt: delegate.invitedAt.toISOString(),
      },
    });
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    const map: Record<string, { code: string; message: string; status: number }> = {
      MAX_DELEGATES: { code: "MAX_DELEGATES", message: "You can invite up to 3 family delegates.", status: 409 },
      ALREADY_INVITED: { code: "ALREADY_INVITED", message: "That email is already invited.", status: 409 },
      SELF_INVITE: { code: "SELF_INVITE", message: "You cannot invite your own email.", status: 400 },
      APPROVER_NOT_ALLOWED: {
        code: "APPROVER_NOT_ALLOWED",
        message: "Approver role requires opt-in for clients 35 and older.",
        status: 403,
      },
    };
    const hit = map[err.message];
    if (hit) {
      return NextResponse.json({ error: { code: hit.code, message: hit.message } }, { status: hit.status });
    }
    throw err;
  }
}

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { listClientDelegates } = await import("@/lib/family/delegates");
  const { MAX_DELEGATES_PER_CLIENT } = await import("@/lib/family/constants");
  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    select: { delegateApproverOptIn: true },
  });

  const delegates = await listClientDelegates(session.customerId);

  return NextResponse.json({
    delegates: delegates.map((d) => ({
      ...d,
      invitedAt: d.invitedAt.toISOString(),
      acceptedAt: d.acceptedAt?.toISOString() ?? null,
    })),
    maxDelegates: MAX_DELEGATES_PER_CLIENT,
    delegateApproverOptIn: account?.delegateApproverOptIn ?? false,
  });
}
