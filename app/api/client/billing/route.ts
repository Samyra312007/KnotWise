import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { CLIENT_PLANS } from "@/lib/billing/client-plans";
import { getClientEntitlements } from "@/lib/billing/client-entitlements";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const ent = await getClientEntitlements(session.customerId);

  return NextResponse.json({
    plan: ent.plan,
    status: ent.status,
    provider: ent.provider,
    currentPeriodEnd: ent.currentPeriodEnd,
    gstin: ent.gstin,
    introRequestsUsed: ent.introRequestsUsed,
    introRequestsLimit: ent.introRequestsLimit,
    introRequestsRemaining: ent.introRequestsRemaining,
    plans: Object.entries(CLIENT_PLANS).map(([id, plan]) => ({
      id,
      label: plan.label,
      priceInr: plan.priceInr,
      discoveryAccess: plan.discoveryAccess,
      extraIntroRequestsPerMonth: plan.extraIntroRequestsPerMonth,
      priorityVerification: plan.priorityVerification,
      profileBoost: plan.profileBoost,
    })),
  });
}
