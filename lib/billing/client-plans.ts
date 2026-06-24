export type ClientPlanId = "included" | "plus" | "premium";

export type ClientPlanFeatures = {
  label: string;
  priceInr: number;
  discoveryAccess: boolean;
  extraIntroRequestsPerMonth: number;
  priorityVerification: boolean;
  profileBoost: boolean;
};

export const CLIENT_PLANS: Record<ClientPlanId, ClientPlanFeatures> = {
  included: {
    label: "Included",
    priceInr: 0,
    discoveryAccess: false,
    extraIntroRequestsPerMonth: 0,
    priorityVerification: false,
    profileBoost: false,
  },
  plus: {
    label: "Plus",
    priceInr: 499,
    discoveryAccess: false,
    extraIntroRequestsPerMonth: 2,
    priorityVerification: true,
    profileBoost: false,
  },
  premium: {
    label: "Premium",
    priceInr: 999,
    discoveryAccess: true,
    extraIntroRequestsPerMonth: 2,
    priorityVerification: true,
    profileBoost: true,
  },
};

export const GST_RATE = 0.18;
export const REFUND_WINDOW_DAYS = 7;
export const DUNNING_GRACE_DAYS = 3;

export function isPaidPlan(plan: string): plan is Exclude<ClientPlanId, "included"> {
  return plan === "plus" || plan === "premium";
}

export function planFeatures(plan: string): ClientPlanFeatures {
  return CLIENT_PLANS[plan as ClientPlanId] ?? CLIENT_PLANS.included;
}

export function gstFromBase(amountInr: number): number {
  return Math.round(amountInr * GST_RATE);
}

export function currentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
