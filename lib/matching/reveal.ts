import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { cdnMediaUrl } from "@/lib/scale/cdn";

export type RevealLevel = "limited" | "full";

export type IntroReveal = {
  revealLevel: RevealLevel;
  firstName: string;
  lastName?: string;
  age: number;
  city: string;
  country: string;
  photoUrl?: string;
  bioHeadline?: string;
  score: number;
  bucket: string;
  designation?: string;
  currentCompany?: string;
  educationLevel?: string;
  religion?: string;
  caste?: string;
  subCaste?: string;
  gotra?: string;
  manglik?: string;
  motherTongue?: string;
  heightCm?: number;
  maritalStatus?: string;
  diet?: string;
  email?: string;
  phone?: string;
  annualIncomeINR?: number;
  partnerPreferences?: Biodata["partnerPreferences"];
};

export function bioHeadline(bio?: string): string | undefined {
  if (!bio?.trim()) return undefined;
  const trimmed = bio.trim();
  const lines = trimmed.split(/\n+/).slice(0, 2);
  const joined = lines.join(" ");
  return joined.length > 160 ? `${joined.slice(0, 157)}…` : joined;
}

export function buildIntroReveal(input: {
  biodata: Biodata;
  photoUrl?: string | null;
  score: number;
  bucket: string;
  revealLevel: RevealLevel;
}): IntroReveal {
  const { biodata, photoUrl, score, bucket, revealLevel } = input;
  const base: IntroReveal = {
    revealLevel,
    firstName: biodata.firstName,
    age: ageFromDOB(biodata.dateOfBirth),
    city: biodata.city,
    country: biodata.country,
    photoUrl: cdnMediaUrl(photoUrl ?? biodata.photoUrl) ?? undefined,
    bioHeadline: bioHeadline(biodata.bio),
    score,
    bucket,
  };

  if (revealLevel === "limited") return base;

  return {
    ...base,
    lastName: biodata.lastName,
    designation: biodata.designation,
    currentCompany: biodata.currentCompany,
    educationLevel: biodata.educationLevel,
    religion: biodata.religion,
    caste: biodata.caste,
    subCaste: biodata.subCaste,
    gotra: biodata.gotra,
    manglik: biodata.manglik,
    motherTongue: biodata.motherTongue,
    heightCm: biodata.heightCm,
    maritalStatus: biodata.maritalStatus,
    diet: biodata.diet,
    email: biodata.email,
    phone: biodata.phone,
    annualIncomeINR: biodata.annualIncomeINR,
    partnerPreferences: biodata.partnerPreferences,
  };
}

export function revealLevelForSuggestion(status: string, hasMutual: boolean): RevealLevel {
  if (hasMutual || status === "mutual") return "full";
  return "limited";
}
