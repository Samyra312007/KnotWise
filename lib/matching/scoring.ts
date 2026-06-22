import type { Biodata, EducationLevel, Trinary } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";

export function scoreReligion(client: Biodata, candidate: Biodata): number {
  if (client.religion === candidate.religion) return 1.0;
  if (client.partnerPreferences.openToOtherReligions) return 0.6;
  return 0;
}

export function scoreMotherTongue(client: Biodata, candidate: Biodata): number {
  if (client.motherTongue === candidate.motherTongue) return 1.0;
  const shared = client.languagesKnown.some((l) =>
    candidate.languagesKnown.includes(l)
  );
  if (shared) return 0.7;
  return 0.4;
}

export function scoreCaste(client: Biodata, candidate: Biodata): number {
  if (client.caste === candidate.caste) return 1.0;
  if (client.religion === candidate.religion) return 0.7;
  return 0.4;
}

const VEG_LIKE = new Set(["Vegetarian", "Vegan", "Jain"]);
const ADJACENT_VEG = new Set(["Eggetarian"]);

export function scoreDiet(client: Biodata, candidate: Biodata): number {
  const c = client.diet;
  const k = candidate.diet;
  if (c === k) return 1.0;
  if (VEG_LIKE.has(c) && VEG_LIKE.has(k)) return 0.9;
  if (
    (VEG_LIKE.has(c) && ADJACENT_VEG.has(k)) ||
    (ADJACENT_VEG.has(c) && VEG_LIKE.has(k))
  )
    return 0.5;
  if (VEG_LIKE.has(c) && k === "Non-vegetarian") return 0;
  if (c === "Non-vegetarian" && VEG_LIKE.has(k)) return 0.5;
  return 0.7;
}

function trinaryAlignment(a: Trinary, b: Trinary): number {
  if (a === b) return 1.0;
  if (a === "Maybe" || b === "Maybe") return 0.5;
  return 0;
}

export function scoreWantKids(client: Biodata, candidate: Biodata): number {
  return trinaryAlignment(client.wantKids, candidate.wantKids);
}

export function scoreRelocate(client: Biodata, candidate: Biodata): number {
  if (client.city === candidate.city) return 1.0;
  if (client.openToRelocate === "Yes" || candidate.openToRelocate === "Yes")
    return 1.0;
  if (client.openToRelocate === "Maybe" && candidate.openToRelocate === "Maybe")
    return 0.4;
  if (client.openToRelocate === "No" && candidate.openToRelocate === "No") return 0;
  return 0.6;
}

export function scorePets(client: Biodata, candidate: Biodata): number {
  if (client.openToPets === candidate.openToPets) return 1.0;
  if (client.openToPets === "Maybe" || candidate.openToPets === "Maybe") return 0.6;
  return 0;
}

const EDU_RANK: Record<EducationLevel, number> = {
  "High School": 0,
  "Bachelor's": 1,
  "Master's": 2,
  PhD: 3,
  Professional: 3,
};

export function scoreEducation(client: Biodata, candidate: Biodata): number {
  const diff = Math.abs(
    EDU_RANK[client.educationLevel] - EDU_RANK[candidate.educationLevel]
  );
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.8;
  if (diff === 2) return 0.5;
  return 0.3;
}

export function scoreEducationFemalePreference(
  client: Biodata,
  candidate: Biodata
): number {
  const c = EDU_RANK[client.educationLevel];
  const k = EDU_RANK[candidate.educationLevel];
  if (k === c || k === c + 1) return 1.0;
  if (k === c - 1) return 0.7;
  if (Math.abs(k - c) === 2) return 0.5;
  return 0.3;
}

export function scoreManglik(client: Biodata, candidate: Biodata): number {
  const c = client.manglik;
  const k = candidate.manglik;
  if (c === "Doesn't matter" || k === "Doesn't matter") return 1.0;
  if (c === k) return 1.0;
  if ((c === "Yes" && k === "Yes") || (c === "No" && k === "No")) return 1.0;
  if (c === "Don't know" || k === "Don't know") return 0.7;
  return 0.3;
}

export function scoreIncomeMale(client: Biodata, candidate: Biodata): number {
  const c = client.annualIncomeINR;
  const k = candidate.annualIncomeINR;
  if (c <= 0) return 0.5;
  const ratio = k / c;
  if (ratio <= 1.0 && ratio >= 0.4) return 1.0;
  if (ratio < 0.4) return Math.max(0.4, ratio + 0.3);
  if (ratio <= 1.5) return 0.7;
  if (ratio <= 2.0) return 0.5;
  return 0.3;
}

export function scoreIncomeFemale(client: Biodata, candidate: Biodata): number {
  const c = client.annualIncomeINR;
  const k = candidate.annualIncomeINR;
  if (c <= 0) return 0.5;
  const ratio = k / c;
  if (ratio >= 0.8 && ratio <= 2.5) return 1.0;
  if (ratio >= 0.5 && ratio < 0.8) return 0.7;
  if (ratio > 2.5 && ratio <= 4) return 0.7;
  if (ratio < 0.5) return 0.3;
  return 0.5;
}

export function scoreAgeMale(client: Biodata, candidate: Biodata): number {
  const cAge = ageFromDOB(client.dateOfBirth);
  const kAge = ageFromDOB(candidate.dateOfBirth);
  const delta = cAge - kAge;
  if (delta < 0) return 0;
  if (delta >= 2 && delta <= 4) return 1.0;
  if (delta >= 1 && delta <= 5) return 0.85;
  if (delta >= 0 && delta <= 6) return 0.7;
  if (delta <= 8) return 0.5;
  return 0.3;
}

export function scoreAgeFemale(client: Biodata, candidate: Biodata): number {
  const cAge = ageFromDOB(client.dateOfBirth);
  const kAge = ageFromDOB(candidate.dateOfBirth);
  const delta = kAge - cAge;
  if (delta < -2 || delta > 6) return 0.3;
  if (delta >= 0 && delta <= 5) return 1.0;
  if (delta === -1 || delta === -2) return 0.7;
  return 0.7;
}

export function scoreHeightMale(client: Biodata, candidate: Biodata): number {
  const delta = client.heightCm - candidate.heightCm;
  if (delta < 0) return 0;
  if (delta >= 5 && delta <= 20) return 1.0;
  if (delta >= 2 && delta <= 25) return 0.8;
  return 0.5;
}

export function scoreHeightFemale(client: Biodata, candidate: Biodata): number {
  const delta = candidate.heightCm - client.heightCm;
  if (delta >= 5 && delta <= 25) return 1.0;
  if (delta >= 0 && delta < 5) return 0.7;
  if (delta < 0 && delta > -8) return 0.5;
  return 0.4;
}
