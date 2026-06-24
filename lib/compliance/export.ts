import { prisma } from "@/lib/db";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
import { exportExpiresAt } from "./config";

export async function buildCustomerDataExport(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      clientAccount: { include: { consent: true } },
      clientBilling: true,
      suggestions: {
        select: {
          id: true,
          status: true,
          score: true,
          bucket: true,
          feedbackReason: true,
          feedbackAt: true,
          createdAt: true,
        },
      },
      mutualMatchesAsA: { select: { id: true, status: true, createdAt: true, clientBId: true } },
      mutualMatchesAsB: { select: { id: true, status: true, createdAt: true, clientAId: true } },
      c2cMessagesSent: {
        select: { id: true, body: true, conversationId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      discoveryInterests: {
        select: { id: true, poolProfileId: true, status: true, note: true, createdAt: true },
      },
      preferenceSignals: {
        select: { id: true, signalType: true, dwellMs: true, createdAt: true },
      },
      billingInvoices: {
        select: { id: true, amountInr: true, gstInr: true, status: true, issuedAt: true },
      },
      thread: {
        include: {
          messages: {
            select: { id: true, authorType: true, body: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!customer) throw new Error("NOT_FOUND");

  const schedules = await prisma.scheduledEvent.findMany({
    where: {
      mutualMatch: {
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
      },
    },
    select: {
      id: true,
      mode: true,
      title: true,
      startsAt: true,
      status: true,
      location: true,
      createdAt: true,
    },
    orderBy: { startsAt: "desc" },
  });

  const assets = await prisma.asset.findMany({
    where: { entityType: "customer", entityId: customerId },
    select: { id: true, kind: true, url: true, createdAt: true },
  });

  const biodata = parseCustomerBiodata(customer);

  return {
    exportedAt: new Date().toISOString(),
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth.toISOString(),
      city: customer.city,
      country: customer.country,
      stage: customer.stage,
      verificationTier: customer.verificationTier,
      createdAt: customer.createdAt.toISOString(),
    },
    profile: biodata,
    account: customer.clientAccount
      ? {
          email: customer.clientAccount.email,
          phone: customer.clientAccount.phone,
          emailVerifiedAt: customer.clientAccount.emailVerifiedAt?.toISOString() ?? null,
          onboardingCompletedAt: customer.clientAccount.onboardingCompletedAt?.toISOString() ?? null,
        }
      : null,
    consents: customer.clientAccount?.consent
      ? {
          tosAcceptedAt: customer.clientAccount.consent.tosAcceptedAt?.toISOString() ?? null,
          privacyAcceptedAt: customer.clientAccount.consent.privacyAcceptedAt?.toISOString() ?? null,
          marketingEmailOptIn: customer.clientAccount.consent.marketingEmailOptIn,
          analyticsOptIn: customer.clientAccount.consent.analyticsOptIn,
        }
      : null,
    billing: customer.clientBilling
      ? {
          plan: customer.clientBilling.plan,
          status: customer.clientBilling.status,
          currentPeriodEnd: customer.clientBilling.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
    invoices: customer.billingInvoices,
    intros: customer.suggestions,
    mutualMatches: [...customer.mutualMatchesAsA, ...customer.mutualMatchesAsB],
    c2cMessages: customer.c2cMessagesSent,
    matchmakerMessages: customer.thread?.messages ?? [],
    discoveryInterests: customer.discoveryInterests,
    preferenceSignals: customer.preferenceSignals,
    scheduledEvents: schedules.map((s) => ({
      ...s,
      startsAt: s.startsAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })),
    assets,
  };
}

export async function requestCustomerDataExport(customerId: string, clientId: string) {
  const bundle = await buildCustomerDataExport(customerId);
  const now = new Date();
  const row = await prisma.dataExportRequest.create({
    data: {
      customerId,
      clientId,
      status: "ready",
      bundleJson: JSON.stringify(bundle),
      readyAt: now,
      expiresAt: exportExpiresAt(now),
    },
  });
  return { requestId: row.id, bundle, expiresAt: row.expiresAt!.toISOString() };
}

export async function getLatestDataExport(customerId: string) {
  return prisma.dataExportRequest.findFirst({
    where: { customerId, status: "ready", expiresAt: { gt: new Date() } },
    orderBy: { requestedAt: "desc" },
  });
}
