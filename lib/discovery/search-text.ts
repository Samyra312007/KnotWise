import type { Biodata } from "@/lib/types";

export function buildPoolSearchText(biodata: Biodata): string {
  const parts = [
    biodata.firstName,
    biodata.lastName,
    biodata.city,
    biodata.country,
    biodata.religion,
    biodata.caste,
    biodata.motherTongue,
    biodata.designation,
    biodata.currentCompany,
    biodata.educationLevel,
    biodata.bio,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function matchesTextQuery(searchText: string | null | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = (searchText ?? "").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}
