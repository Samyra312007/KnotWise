import { z } from "zod";
import type { Biodata } from "@/lib/types";
import { isValidPhone, normalizePhone } from "@/lib/profile/phone";
import { sanitizeBiodataForSave } from "@/lib/onboarding/validate";

const partnerPreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(80).optional(),
    ageMax: z.number().int().min(18).max(80).optional(),
    heightMinCm: z.number().int().min(140).max(220).optional(),
    heightMaxCm: z.number().int().min(140).max(220).optional(),
    religions: z.array(z.string()).optional(),
    motherTongues: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    educationMin: z.string().optional(),
    acceptsManglik: z.enum(["Yes", "No", "Doesn't matter"]).optional(),
    acceptedMaritalStatuses: z.array(z.string()).optional(),
    openToOtherReligions: z.boolean().optional(),
    preferredDiets: z.array(z.string()).optional(),
  })
  .strict();

export const profilePatchSchema = z
  .object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    gender: z.enum(["male", "female"]).optional(),
    dateOfBirth: z.string().min(1).optional(),
    heightCm: z.number().int().min(140).max(220).optional(),
    motherTongue: z.string().min(1).optional(),
    maritalStatus: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    openToRelocate: z.enum(["Yes", "No", "Maybe"]).optional(),
    phone: z.string().optional(),
    educationLevel: z.string().min(1).optional(),
    undergradCollege: z.string().max(200).optional(),
    degree: z.string().max(200).optional(),
    currentCompany: z.string().max(200).optional(),
    designation: z.string().max(200).optional(),
    annualIncomeINR: z.number().int().min(0).optional(),
    fathersOccupation: z.string().max(200).optional(),
    mothersOccupation: z.string().max(200).optional(),
    siblings: z.number().int().min(0).max(20).optional(),
    familyType: z.enum(["Nuclear", "Joint"]).optional(),
    religion: z.string().min(1).optional(),
    caste: z.string().min(1).optional(),
    subCaste: z.string().max(200).optional(),
    gotra: z.string().max(200).optional(),
    manglik: z.enum(["Yes", "No", "Don't know", "Doesn't matter"]).optional(),
    diet: z.string().min(1).optional(),
    smoking: z.enum(["Never", "Occasionally", "Regularly"]).optional(),
    drinking: z.enum(["Never", "Occasionally", "Regularly"]).optional(),
    wantKids: z.enum(["Yes", "No", "Maybe"]).optional(),
    openToPets: z.enum(["Yes", "No", "Maybe"]).optional(),
    languagesKnown: z.array(z.string()).optional(),
    bio: z.string().max(2000).optional(),
    photoUrl: z.string().url().optional(),
    partnerPreferences: partnerPreferencesSchema.optional(),
  })
  .strict();

export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export function parseProfilePatch(body: unknown): ProfilePatch {
  const parsed = profilePatchSchema.parse(body);
  if (parsed.phone !== undefined && parsed.phone.trim() && !isValidPhone(parsed.phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }
  if (parsed.bio !== undefined && parsed.bio.trim().length > 0 && parsed.bio.trim().length < 40) {
    throw new Error("Bio must be at least 40 characters.");
  }
  const min = parsed.partnerPreferences?.ageMin;
  const max = parsed.partnerPreferences?.ageMax;
  if (min != null && max != null && max < min) {
    throw new Error("Partner age max must be greater than or equal to min.");
  }
  return parsed;
}

export function applyPatchToBiodata(biodata: Biodata, patch: ProfilePatch): Biodata {
  const merged = {
    ...biodata,
    ...patch,
    partnerPreferences: {
      ...biodata.partnerPreferences,
      ...(patch.partnerPreferences ?? {}),
    },
  } as Biodata;
  if (patch.languagesKnown) merged.languagesKnown = patch.languagesKnown;
  if (patch.phone?.trim()) merged.phone = normalizePhone(patch.phone);
  return sanitizeBiodataForSave(merged);
}
