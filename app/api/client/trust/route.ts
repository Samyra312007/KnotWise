import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { getCustomerTrustStatus } from "@/lib/trust/tier-sync";
import { refreshCustomerVerificationTier } from "@/lib/trust/tier-sync";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const status = await getCustomerTrustStatus(session.customerId);
  if (!status) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  return NextResponse.json(status);
}

const idDocSchema = z.object({
  kind: z.enum(["aadhaar", "pan", "passport"]),
  fileUrl: z.string().url(),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = idDocSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid document submission." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  let verificationCase = await prisma.verificationCase.findFirst({
    where: {
      orgId: customer.orgId,
      entityType: "customer",
      entityId: session.customerId,
      status: { in: ["pending", "in_review"] },
    },
  });

  if (!verificationCase) {
    verificationCase = await prisma.verificationCase.create({
      data: {
        orgId: customer.orgId,
        entityType: "customer",
        entityId: session.customerId,
        checklist: JSON.stringify({ phone: false, email: true, idDoc: false, photo: false }),
      },
    });
  }

  await prisma.verificationDocument.create({
    data: {
      caseId: verificationCase.id,
      kind: parsed.kind,
      fileUrl: parsed.fileUrl,
      uploadedBy: session.clientId,
    },
  });

  const checklist = JSON.parse(verificationCase.checklist) as Record<string, boolean>;
  checklist.idDoc = true;
  await prisma.verificationCase.update({
    where: { id: verificationCase.id },
    data: { checklist: JSON.stringify(checklist), status: "pending" },
  });

  const tier = await refreshCustomerVerificationTier(session.customerId);

  return NextResponse.json({ ok: true, caseId: verificationCase.id, tier });
}
