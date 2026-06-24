import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiDelegateSession } from "@/lib/auth/api";
import { ageFromDOB } from "@/lib/types";
import { delegateCanActOnIntro } from "@/lib/family/permissions";
import { computeProfileCompleteness } from "@/lib/profile/completeness";
import { parseCustomerBiodata } from "@/lib/onboarding/status";

export async function GET() {
  const session = await requireApiDelegateSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: { clientAccount: true },
  });
  if (!customer?.clientAccount) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const biodata = parseCustomerBiodata(customer);
  const clientAge = ageFromDOB(customer.dateOfBirth);
  const canApprove = delegateCanActOnIntro(
    session.delegateRole,
    clientAge,
    customer.clientAccount.delegateApproverOptIn
  );

  return NextResponse.json({
    delegate: {
      id: session.delegateId,
      email: session.email,
      role: session.delegateRole,
      canApprove,
    },
    client: {
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      stage: customer.stage,
      age: clientAge,
      completeness: computeProfileCompleteness(biodata),
    },
  });
}
