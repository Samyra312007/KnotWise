import { prisma } from "@/lib/db";

export async function recordSignupConsent(input: {
  clientId: string;
  marketingEmailOptIn: boolean;
}) {
  const now = new Date();
  return prisma.clientConsent.create({
    data: {
      clientId: input.clientId,
      tosAcceptedAt: now,
      privacyAcceptedAt: now,
      biodataProcessingAt: now,
      marketingEmailOptIn: input.marketingEmailOptIn,
      marketingOptInAt: input.marketingEmailOptIn ? now : null,
    },
  });
}

export async function getClientConsent(clientId: string) {
  return prisma.clientConsent.findUnique({ where: { clientId } });
}

export async function updateClientConsent(
  clientId: string,
  input: {
    marketingEmailOptIn?: boolean;
    analyticsOptIn?: boolean;
  }
) {
  const now = new Date();
  const existing = await prisma.clientConsent.findUnique({ where: { clientId } });
  if (!existing) return null;

  const updated = await prisma.clientConsent.update({
    where: { clientId },
    data: {
      ...(input.marketingEmailOptIn != null
        ? {
            marketingEmailOptIn: input.marketingEmailOptIn,
            marketingOptInAt: input.marketingEmailOptIn ? now : null,
          }
        : {}),
      ...(input.analyticsOptIn != null
        ? {
            analyticsOptIn: input.analyticsOptIn,
            analyticsOptInAt: input.analyticsOptIn ? now : null,
          }
        : {}),
    },
  });

  if (input.marketingEmailOptIn != null) {
    await prisma.clientAccount.update({
      where: { id: clientId },
      data: { notifyEmail: input.marketingEmailOptIn },
    });
  }

  return updated;
}

export async function recordContactShareConsent(clientId: string) {
  const consent = await prisma.clientConsent.findUnique({ where: { clientId } });
  if (!consent) return null;
  return prisma.clientConsent.update({
    where: { clientId },
    data: { biodataProcessingAt: consent.biodataProcessingAt ?? new Date() },
  });
}
