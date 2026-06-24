import { prisma } from "@/lib/db";
import type { VerificationTier } from "@/lib/trust/tiers";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";

export async function refreshCustomerVerificationTier(customerId: string): Promise<VerificationTier> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { clientAccount: true },
  });
  if (!customer) return "unverified";

  const openCase = await prisma.verificationCase.findFirst({
    where: {
      entityType: "customer",
      entityId: customerId,
      status: { in: ["pending", "in_review"] },
    },
  });

  const verifiedCase = await prisma.verificationCase.findFirst({
    where: {
      entityType: "customer",
      entityId: customerId,
      status: "verified",
    },
  });

  let tier: VerificationTier = "unverified";

  if (customer.photoVerifiedAt && customer.phoneVerifiedAt && verifiedCase) {
    tier = "premium";
  } else if (customer.phoneVerifiedAt && verifiedCase) {
    tier = "verified";
  } else if (openCase || verifiedCase) {
    tier = "pending";
  } else if (customer.phoneVerifiedAt) {
    tier = "pending";
  }

  if (customer.verificationTier !== tier) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { verificationTier: tier },
    });
    if (tier === "verified" || tier === "premium") {
      trackAnalyticsEventAsync({
        orgId: customer.orgId,
        eventName: ANALYTICS_EVENTS.VERIFICATION_TIER_UP,
        customerId,
        properties: { tier },
      });
    }
  }

  return tier;
}

export async function getCustomerTrustStatus(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      verificationTier: true,
      phoneVerifiedAt: true,
      photoVerifiedAt: true,
      verifiedAt: true,
    },
  });
  if (!customer) return null;

  const idCase = await prisma.verificationCase.findFirst({
    where: { entityType: "customer", entityId: customerId },
    orderBy: { submittedAt: "desc" },
    include: { documents: true },
  });

  return {
    tier: customer.verificationTier as VerificationTier,
    phoneVerifiedAt: customer.phoneVerifiedAt?.toISOString() ?? null,
    photoVerifiedAt: customer.photoVerifiedAt?.toISOString() ?? null,
    profileVerifiedAt: customer.verifiedAt?.toISOString() ?? null,
    idVerification: idCase
      ? {
          caseId: idCase.id,
          status: idCase.status,
          documents: idCase.documents.map((d) => ({ id: d.id, kind: d.kind, fileUrl: d.fileUrl })),
        }
      : null,
  };
}
