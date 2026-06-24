import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { ageFromDOB } from "@/lib/types";
import { APPROVER_AGE_CUTOFF } from "@/lib/family/constants";

const schema = z.object({
  delegateApproverOptIn: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid settings." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { dateOfBirth: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const clientAge = ageFromDOB(customer.dateOfBirth);
  if (parsed.delegateApproverOptIn && clientAge < APPROVER_AGE_CUTOFF) {
    return NextResponse.json({
      ok: true,
      delegateApproverOptIn: false,
      note: "Opt-in only applies to clients aged 35 and older.",
    });
  }

  const account = await prisma.clientAccount.update({
    where: { id: session.clientId },
    data: { delegateApproverOptIn: parsed.delegateApproverOptIn },
    select: { delegateApproverOptIn: true },
  });

  return NextResponse.json({ ok: true, delegateApproverOptIn: account.delegateApproverOptIn });
}
