import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import { customerUpdateFromBiodata } from "@/lib/profile/biodata";
import { computeProfileCompleteness, isProfileComplete } from "@/lib/profile/completeness";
import { isValidPhone } from "@/lib/profile/phone";
import { ONBOARDING_STEP_COUNT } from "@/lib/profile/options";
import { logAuditEvent } from "@/lib/audit";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";
import { syncCrmLeadStage } from "@/lib/crm/leads";

export async function finalizeOnboarding(clientId: string, biodata: Biodata) {
  if (!isProfileComplete(biodata)) {
    return { ok: false as const, reason: "Profile is not complete enough yet." };
  }

  const account = await prisma.clientAccount.findUnique({
    where: { id: clientId },
    include: { customer: true },
  });
  if (!account) {
    return { ok: false as const, reason: "Account not found." };
  }

  const now = new Date();
  const phoneValid = isValidPhone(biodata.phone);

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: account.customerId },
      data: {
        ...customerUpdateFromBiodata(biodata),
        stage: account.customer.stage === "Onboarding" ? "Active" : account.customer.stage,
        verifiedAt: account.customer.verifiedAt,
      },
    });

    await tx.clientAccount.update({
      where: { id: clientId },
      data: {
        onboardingCompletedAt: now,
        onboardingStep: ONBOARDING_STEP_COUNT - 1,
        phone: phoneValid ? biodata.phone : account.phone,
      },
    });

    const existingCase = await tx.verificationCase.findFirst({
      where: {
        orgId: account.customer.orgId,
        entityType: "customer",
        entityId: account.customerId,
      },
    });

    if (!existingCase) {
      await tx.verificationCase.create({
        data: {
          orgId: account.customer.orgId,
          entityType: "customer",
          entityId: account.customerId,
          status: "pending",
          checklist: JSON.stringify({
            phone: phoneValid,
            email: true,
            idDoc: false,
            photo: !!biodata.photoUrl,
          }),
        },
      });
    }
  });

  await logAuditEvent({
    orgId: account.customer.orgId,
    actorId: clientId,
    actorType: "client",
    action: "onboarding.completed",
    entityType: "customer",
    entityId: account.customerId,
    metadata: { completeness: isProfileComplete(biodata) },
  });

  trackAnalyticsEventAsync({
    orgId: account.customer.orgId,
    eventName: ANALYTICS_EVENTS.ONBOARDING_COMPLETED,
    customerId: account.customerId,
    properties: { completeness: computeProfileCompleteness(biodata) },
  });
  void syncCrmLeadStage(account.customerId).catch(() => undefined);

  return { ok: true as const };
}
