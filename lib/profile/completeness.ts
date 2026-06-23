import type { Biodata } from "@/lib/types";

export const ONBOARDING_MIN_COMPLETENESS = 80;

type FieldCheck = { weight: number; ok: (b: Biodata) => boolean };

const CHECKS: FieldCheck[] = [
  { weight: 5, ok: (b) => !!b.firstName.trim() },
  { weight: 5, ok: (b) => !!b.lastName.trim() },
  { weight: 5, ok: (b) => !!b.gender },
  { weight: 5, ok: (b) => !!b.dateOfBirth },
  { weight: 4, ok: (b) => b.heightCm >= 140 && b.heightCm <= 220 },
  { weight: 4, ok: (b) => !!b.maritalStatus },
  { weight: 4, ok: (b) => !!b.motherTongue },
  { weight: 5, ok: (b) => !!b.city.trim() && b.city.trim() !== "—" },
  { weight: 3, ok: (b) => !!b.country.trim() },
  { weight: 3, ok: (b) => !!b.openToRelocate },
  { weight: 5, ok: (b) => b.phone.replace(/\D/g, "").length >= 10 },
  { weight: 5, ok: (b) => !!b.email.trim() },
  { weight: 4, ok: (b) => !!b.educationLevel },
  { weight: 3, ok: (b) => !!b.degree.trim() },
  { weight: 3, ok: (b) => !!b.currentCompany.trim() },
  { weight: 3, ok: (b) => !!b.designation.trim() },
  { weight: 4, ok: (b) => b.annualIncomeINR > 0 },
  { weight: 5, ok: (b) => !!b.religion },
  { weight: 4, ok: (b) => !!b.caste },
  { weight: 4, ok: (b) => !!b.diet },
  { weight: 3, ok: (b) => !!b.smoking },
  { weight: 3, ok: (b) => !!b.drinking },
  { weight: 4, ok: (b) => !!b.wantKids },
  { weight: 5, ok: (b) => (b.bio?.trim().length ?? 0) >= 40 },
  { weight: 5, ok: (b) => !!b.photoUrl?.trim() },
  {
    weight: 5,
    ok: (b) =>
      (b.partnerPreferences.ageMin ?? 0) > 0 &&
      (b.partnerPreferences.ageMax ?? 0) >= (b.partnerPreferences.ageMin ?? 0),
  },
];

export function computeProfileCompleteness(biodata: Biodata): number {
  const total = CHECKS.reduce((s, c) => s + c.weight, 0);
  const earned = CHECKS.filter((c) => c.ok(biodata)).reduce((s, c) => s + c.weight, 0);
  return Math.round((earned / total) * 100);
}

export function isProfileComplete(biodata: Biodata): boolean {
  return computeProfileCompleteness(biodata) >= ONBOARDING_MIN_COMPLETENESS;
}
