import { prisma } from "@/lib/db";

export type PlanLimits = {
  seats: number;
  customers: number;
  aiCallsPerMonth: number;
  emailsPerMonth: number;
};

const PLANS: Record<string, PlanLimits> = {
  trialing: { seats: 2, customers: 10, aiCallsPerMonth: 500, emailsPerMonth: 100 },
  active: { seats: 10, customers: 200, aiCallsPerMonth: 5000, emailsPerMonth: 3000 },
  past_due: { seats: 2, customers: 10, aiCallsPerMonth: 0, emailsPerMonth: 0 },
  canceled: { seats: 0, customers: 0, aiCallsPerMonth: 0, emailsPerMonth: 0 },
};

export async function getOrgSubscriptionStatus(orgId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { orgId } });
  if (!sub) return "trialing";
  return sub.status;
}

export async function getOrgLimits(orgId: string): Promise<PlanLimits> {
  const status = await getOrgSubscriptionStatus(orgId);
  return PLANS[status] ?? PLANS.trialing;
}

export async function requireActiveSubscription(orgId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const status = await getOrgSubscriptionStatus(orgId);
  if (status === "canceled") {
    return { ok: false, reason: "Subscription canceled. Renew billing to continue." };
  }
  if (status === "past_due") {
    const sub = await prisma.subscription.findUnique({ where: { orgId } });
    if (sub) {
      const graceEnd = new Date(sub.currentPeriodEnd);
      graceEnd.setDate(graceEnd.getDate() + 7);
      if (Date.now() > graceEnd.getTime()) {
        return { ok: false, reason: "Subscription past due. Update billing to continue." };
      }
    }
  }
  return { ok: true };
}

export async function canSendEmail(orgId: string): Promise<boolean> {
  const limits = await getOrgLimits(orgId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const count = await prisma.emailLog.count({
    where: {
      matchSuggestion: { customer: { orgId } },
      sentAt: { gte: monthStart },
      deliveryStatus: { in: ["sent", "delivered", "queued"] },
    },
  });
  return count < limits.emailsPerMonth;
}
