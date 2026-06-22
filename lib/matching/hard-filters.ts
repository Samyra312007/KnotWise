import type { Biodata } from "@/lib/types";

export interface FilterResult {
  pass: boolean;
  reason?: string;
}

export function passesHardFilters(client: Biodata, candidate: Biodata): FilterResult {
  if (client.gender === candidate.gender) {
    return { pass: false, reason: "same-gender" };
  }

  const wantsSameReligion =
    !client.partnerPreferences.openToOtherReligions &&
    client.partnerPreferences.religions &&
    client.partnerPreferences.religions.length > 0 &&
    !client.partnerPreferences.religions.includes(candidate.religion);

  if (wantsSameReligion) {
    return { pass: false, reason: "religion-locked" };
  }

  const preferredDiets = client.partnerPreferences.preferredDiets;
  if (
    preferredDiets &&
    preferredDiets.length > 0 &&
    !preferredDiets.includes(candidate.diet)
  ) {
    return { pass: false, reason: "diet-incompatible" };
  }

  const acceptedMS = client.partnerPreferences.acceptedMaritalStatuses;
  if (
    acceptedMS &&
    acceptedMS.length > 0 &&
    !acceptedMS.includes(candidate.maritalStatus)
  ) {
    return { pass: false, reason: "marital-status-excluded" };
  }

  return { pass: true };
}
