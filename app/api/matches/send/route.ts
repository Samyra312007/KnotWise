import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canWriteCustomer } from "@/lib/access/customers";
import type { Biodata } from "@/lib/types";
import { rankMatchesForOrg } from "@/lib/matching/org-rank";
import { requireActiveSubscription, canSendEmail } from "@/lib/billing/subscription";
import { enqueueIntroEmail } from "@/lib/jobs/email-jobs";
import { logAuditEvent } from "@/lib/audit";
import { canWriteCustomers } from "@/lib/auth/roles";
import { createReciprocalIntroPair } from "@/lib/matching/mutual";
import { isSameGotra, gotraConflictMessage } from "@/lib/trust/gotra";
import { notifyIntroPairSent } from "@/lib/push/triggers";

const schema = z.object({
  customerId: z.string().min(1),
  candidateId: z.string().min(1),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
  overrideSameGotra: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide all fields." } }, { status: 400 });
  }

  const subCheck = await requireActiveSubscription(session.orgId);
  if (!subCheck.ok) {
    return NextResponse.json({ error: { code: "SUBSCRIPTION", message: subCheck.reason } }, { status: 402 });
  }

  const canWrite = await canWriteCustomer(
    parsed.customerId,
    session.matchmakerId,
    session.orgId,
    session.role
  );
  if (!canWrite) return notFound("Customer not found.");

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, orgId: session.orgId },
    include: { clientAccount: true },
  });
  if (!customer) return notFound("Customer not found.");

  const candidate = await prisma.poolProfile.findFirst({
    where: { id: parsed.candidateId, orgId: session.orgId },
  });
  if (!candidate) return notFound("Candidate not found.");

  const clientBio = JSON.parse(customer.biodata) as Biodata;
  const candBio = JSON.parse(candidate.biodata) as Biodata;

  const orgConfig = await prisma.orgMatchingConfig.findUnique({ where: { orgId: session.orgId } });
  const blockSameGotra = orgConfig?.blockSameGotra ?? true;
  const sameGotra = isSameGotra(clientBio, candBio);

  if (sameGotra && blockSameGotra && !parsed.overrideSameGotra) {
    return NextResponse.json(
      {
        error: {
          code: "SAME_GOTRA",
          message: gotraConflictMessage(clientBio, candBio) ?? "Same gotra intro blocked.",
        },
        gotraWarning: gotraConflictMessage(clientBio, candBio),
        canOverride: true,
      },
      { status: 409 }
    );
  }

  const ranked = await rankMatchesForOrg(session.orgId, clientBio, [{ id: candidate.id, biodata: candBio }]);
  const m = ranked[0];

  const pair = await createReciprocalIntroPair({
    orgId: session.orgId,
    senderCustomerId: customer.id,
    targetPoolProfileId: candidate.id,
    score: m?.score ?? 0,
    bucket: m?.bucket ?? "low",
    breakdown: m?.breakdown ?? {},
    modelAdjusted: m?.modelAdjusted ?? false,
  });

  const suggestion = await prisma.matchSuggestion.upsert({
    where: {
      customerId_poolProfileId: {
        customerId: customer.id,
        poolProfileId: candidate.id,
      },
    },
    update: { status: "sent", introPairId: pair.introPairId ?? undefined },
    create: {
      customerId: customer.id,
      poolProfileId: candidate.id,
      score: m?.score ?? 0,
      bucket: m?.bucket ?? "low",
      explanation: "",
      breakdown: JSON.stringify(m?.breakdown ?? {}),
      status: "sent",
      introPairId: pair.introPairId,
      modelAdjusted: m?.modelAdjusted ?? false,
    },
  });

  const email = await prisma.emailLog.create({
    data: {
      matchSuggestionId: suggestion.id,
      matchmakerId: session.matchmakerId,
      subject: parsed.subject,
      body: parsed.body,
      deliveryStatus: "queued",
      recipientEmail: customer.clientAccount?.email ?? clientBio.email,
    },
  });

  const canEmail = await canSendEmail(session.orgId);
  if (canEmail && (customer.clientAccount?.email || clientBio.email)) {
    await enqueueIntroEmail({
      emailLogId: email.id,
      to: customer.clientAccount?.email ?? clientBio.email,
      subject: parsed.subject,
      body: parsed.body,
    });
  } else if (!canEmail) {
    await prisma.emailLog.update({
      where: { id: email.id },
      data: { deliveryStatus: "failed", errorMessage: "Monthly email limit reached." },
    });
  }

  let stageBumped = false;
  if (customer.stage === "Active") {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { stage: "Match Sent" },
    });
    stageBumped = true;
  }

  await logAuditEvent({
    orgId: session.orgId,
    actorId: session.matchmakerId,
    actorType: "matchmaker",
    action: "match.sent",
    entityType: "customer",
    entityId: customer.id,
    metadata: { candidateId: candidate.id, emailLogId: email.id },
  });

  void notifyIntroPairSent({
    primaryCustomerId: customer.id,
    primarySuggestionId: suggestion.id,
    primaryCandidateName: `${candBio.firstName} ${candBio.lastName}`,
    reciprocalCustomerId: candidate.linkedCustomerId,
    introPairId: pair.introPairId,
    reciprocalCandidateName: `${clientBio.firstName} ${clientBio.lastName}`,
  }).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    suggestionId: suggestion.id,
    emailId: email.id,
    stageBumped,
    deliveryStatus: email.deliveryStatus,
    gotraWarning: sameGotra ? gotraConflictMessage(clientBio, candBio) : undefined,
    gotraOverridden: sameGotra && parsed.overrideSameGotra ? true : undefined,
  });
}
