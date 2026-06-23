import type { Prisma } from "@prisma/client";
import type { Biodata, Gender } from "@/lib/types";

export function createEmptyBiodata(input: {
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
}): Biodata {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    email: input.email.toLowerCase(),
    phone: "",
    heightCm: input.gender === "male" ? 172 : 162,
    motherTongue: "",
    maritalStatus: "Never Married",
    country: "India",
    city: "",
    openToRelocate: "Maybe",
    educationLevel: "Bachelor's",
    undergradCollege: "",
    degree: "",
    currentCompany: "",
    designation: "",
    annualIncomeINR: 0,
    siblings: 0,
    familyType: "Nuclear",
    religion: "",
    caste: "",
    manglik: "Doesn't matter",
    diet: "Vegetarian",
    smoking: "Never",
    drinking: "Never",
    wantKids: "Maybe",
    openToPets: "Maybe",
    languagesKnown: [],
    bio: "",
    partnerPreferences: {
      ageMin: 24,
      ageMax: 35,
      openToOtherReligions: false,
      acceptedMaritalStatuses: ["Never Married"],
    },
  };
}

export function mergeBiodata(current: Biodata, patch: Partial<Biodata>): Biodata {
  const merged: Biodata = {
    ...current,
    ...patch,
    partnerPreferences: {
      ...current.partnerPreferences,
      ...(patch.partnerPreferences ?? {}),
    },
  };
  if (patch.languagesKnown) merged.languagesKnown = patch.languagesKnown;
  return merged;
}

export function customerUpdateFromBiodata(biodata: Biodata): Prisma.CustomerUpdateInput {
  return {
    firstName: biodata.firstName,
    lastName: biodata.lastName,
    gender: biodata.gender,
    dateOfBirth: new Date(biodata.dateOfBirth),
    city: biodata.city || "—",
    country: biodata.country,
    maritalStatus: biodata.maritalStatus,
    biodata: JSON.stringify(biodata),
    photoUrl: biodata.photoUrl ?? null,
  };
}
