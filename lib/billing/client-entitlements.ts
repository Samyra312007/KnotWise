import { prisma } from "@/lib/db";
import {
  CLIENT_PLANS,
  currentBillingPeriod,
  gstFromBase,
  planFeatures,
  type ClientPlanId,
} from "./client-plans";
export async function ensureClientBilling(customerId: string) {
  return prisma.clientBilling.upsert({
    where: { customerId },
    create: { customerId, plan: "included", status: "active", provider: "none" },
    update: {},
  });
}

export async function getClientEntitlements(customerId: string) {
  const billing = await ensureClientBilling(customerId);
  const period = currentBillingPeriod();
  let introRequestsUsed = billing.introRequestsUsed;
  if (billing.introRequestsPeriod !== period) {
    introRequestsUsed = 0;
  }

  const activePlan =
    billing.status === "active" || billing.status === "trialing"
      ? (billing.plan as ClientPlanId)
      : "included";
  const features = planFeatures(activePlan);

  return {
    billing,
    plan: activePlan,
    features,
    introRequestsUsed,
    introRequestsLimit: features.extraIntroRequestsPerMonth,
    introRequestsRemaining: Math.max(0, features.extraIntroRequestsPerMonth - introRequestsUsed),
    currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
    gstin: billing.gstin,
    provider: billing.provider,
    status: billing.status,
  };
}

export function clientHasDiscoveryAccess(plan: string, status: string): boolean {
  if (status !== "active" && status !== "trialing") return false;
  return planFeatures(plan).discoveryAccess;
}

export function clientHasPriorityVerification(plan: string, status: string): boolean {
  if (status !== "active" && status !== "trialing") return false;
  return planFeatures(plan).priorityVerification;
}

export function clientProfileBoost(plan: string, status: string): number {
  if (status !== "active" && status !== "trialing") return 0;
  return planFeatures(plan).profileBoost ? 5 : 0;
}

export async function canUseIntroRequest(customerId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const ent = await getClientEntitlements(customerId);
  if (ent.introRequestsRemaining <= 0) {
    return { ok: false, reason: "No intro requests left this month. Upgrade to Plus or Premium." };
  }
  return { ok: true };
}

export async function recordIntroRequestUsage(customerId: string) {
  const period = currentBillingPeriod();
  const billing = await ensureClientBilling(customerId);
  const used = billing.introRequestsPeriod === period ? billing.introRequestsUsed + 1 : 1;
  await prisma.clientBilling.update({
    where: { customerId },
    data: { introRequestsPeriod: period, introRequestsUsed: used },
  });
}

export async function activateClientPlan(input: {
  customerId: string;
  plan: ClientPlanId;
  provider: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  currentPeriodEnd: Date;
  gstin?: string;
}) {
  if (input.plan !== "included" && input.plan !== "plus" && input.plan !== "premium") {
    throw new Error("INVALID_PLAN");
  }

  const amountInr = CLIENT_PLANS[input.plan].priceInr;
  const billing = await prisma.clientBilling.upsert({
    where: { customerId: input.customerId },
    create: {
      customerId: input.customerId,
      plan: input.plan,
      status: "active",
      provider: input.provider,
      razorpayCustomerId: input.razorpayCustomerId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
      gstin: input.gstin,
      pastDueSince: null,
      introRequestsPeriod: currentBillingPeriod(),
      introRequestsUsed: 0,
    },
    update: {
      plan: input.plan,
      status: "active",
      provider: input.provider,
      razorpayCustomerId: input.razorpayCustomerId ?? undefined,
      razorpaySubscriptionId: input.razorpaySubscriptionId ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd,
      gstin: input.gstin ?? undefined,
      pastDueSince: null,
      introRequestsPeriod: currentBillingPeriod(),
      introRequestsUsed: 0,
    },
  });

  if (amountInr > 0) {
    const externalId = input.razorpaySubscriptionId ?? `inv_${Date.now()}`;
    const gstInr = gstFromBase(amountInr);
    await prisma.clientBillingInvoice.upsert({
      where: { provider_externalId: { provider: input.provider, externalId } },
      create: {
        customerId: input.customerId,
        provider: input.provider,
        externalId,
        amountInr,
        gstInr,
        status: "paid",
        issuedAt: new Date(),
      },
      update: { status: "paid", amountInr, gstInr },
    });
  }

  return billing;
}

export async function downgradeClientPlan(customerId: string, reason: string) {
  await prisma.clientBilling.update({
    where: { customerId },
    data: {
      plan: "included",
      status: "active",
      provider: "none",
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
      pastDueSince: null,
    },
  });
  return reason;
}

export async function markClientPastDue(customerId: string) {
  const billing = await ensureClientBilling(customerId);
  if (!billing.pastDueSince) {
    await prisma.clientBilling.update({
      where: { customerId },
      data: { status: "past_due", pastDueSince: new Date() },
    });
    return;
  }

  const graceEnd = new Date(billing.pastDueSince);
  graceEnd.setDate(graceEnd.getDate() + 3);
  if (Date.now() > graceEnd.getTime()) {
    await downgradeClientPlan(customerId, "payment_failed");
  }
}
