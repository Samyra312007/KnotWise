import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { passesHardFilters } from "@/lib/matching/hard-filters";

export type DiscoveryFilters = {
  city?: string;
  ageMin?: number;
  ageMax?: number;
  religion?: string;
  q?: string;
};

export function passesDiscoveryFilters(
  biodata: Biodata,
  filters: DiscoveryFilters,
  searchText: string | null | undefined
): boolean {
  if (filters.city && biodata.city.toLowerCase() !== filters.city.toLowerCase()) {
    return false;
  }

  const age = ageFromDOB(biodata.dateOfBirth);
  if (filters.ageMin != null && age < filters.ageMin) return false;
  if (filters.ageMax != null && age > filters.ageMax) return false;

  if (filters.religion && biodata.religion.toLowerCase() !== filters.religion.toLowerCase()) {
    return false;
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    const haystack = (searchText ?? `${biodata.firstName} ${biodata.lastName} ${biodata.city} ${biodata.religion}`).toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

export function passesClientHardFilters(
  clientBio: Biodata,
  candidateBio: Biodata,
  blockSameGotra: boolean
): boolean {
  return passesHardFilters(clientBio, candidateBio, { blockSameGotra }).pass;
}

export function verifiedBoostScore(score: number, verifiedAt: Date | null): number {
  return score + (verifiedAt ? 5 : 0);
}
