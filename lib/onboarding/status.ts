import type { ClientAccount, Customer } from "@prisma/client";
import type { Biodata } from "@/lib/types";
import { computeProfileCompleteness, ONBOARDING_MIN_COMPLETENESS } from "@/lib/profile/completeness";

export function needsOnboarding(
  account: Pick<ClientAccount, "onboardingCompletedAt">,
  _biodata: Biodata
): boolean {
  return !account.onboardingCompletedAt;
}

export function onboardingProgress(
  account: Pick<ClientAccount, "onboardingStep" | "onboardingCompletedAt">,
  biodata: Biodata
) {
  return {
    step: account.onboardingCompletedAt ? null : account.onboardingStep,
    completeness: computeProfileCompleteness(biodata),
    minCompleteness: ONBOARDING_MIN_COMPLETENESS,
    completed: !!account.onboardingCompletedAt,
  };
}

export function parseCustomerBiodata(customer: Customer): Biodata {
  return JSON.parse(customer.biodata) as Biodata;
}
