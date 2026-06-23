import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound } from "@/lib/auth/api";
import { canAccessCustomer } from "@/lib/access/customers";
import { draftIntroEmail } from "@/lib/ai/email";
import type { Biodata } from "@/lib/types";

const schema = z.object({
  customerId: z.string().min(1),
  candidateId: z.string().min(1),
  useExisting: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Missing customerId or candidateId." } }, { status: 400 });
  }

  const allowed = await canAccessCustomer(parsed.customerId, session.matchmakerId, session.orgId, session.role);
  if (!allowed) return notFound("Not found.");

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, orgId: session.orgId },
  });
  if (!customer) return notFound("Not found.");

  const candidate = await prisma.poolProfile.findFirst({
    where: { id: parsed.candidateId, orgId: session.orgId },
  });
  if (!candidate) return notFound("Candidate not found.");

  if (parsed.useExisting) {
    const existing = await prisma.matchSuggestion.findUnique({
      where: {
        customerId_poolProfileId: {
          customerId: parsed.customerId,
          poolProfileId: parsed.candidateId,
        },
      },
      include: { emails: { orderBy: { sentAt: "desc" }, take: 1 } },
    });
    if (existing?.emails[0]) {
      const email = existing.emails[0];
      return NextResponse.json({
        subject: email.subject,
        body: email.body,
        source: "existing" as const,
      });
    }
  }

  const clientBio = JSON.parse(customer.biodata) as Biodata;
  const candBio = JSON.parse(candidate.biodata) as Biodata;

  const drafted = await draftIntroEmail(clientBio, candBio);
  return NextResponse.json(drafted);
}
