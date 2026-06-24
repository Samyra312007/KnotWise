import type { Biodata } from "@/lib/types";
import { PROFILE_CITIES } from "@/lib/profile/options";

const METRO_CLUSTERS: Record<string, string[]> = {
  Mumbai: ["Mumbai", "Pune", "Navi Mumbai", "Thane"],
  Delhi: ["Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  Bangalore: ["Bangalore", "Mysore"],
  Hyderabad: ["Hyderabad", "Secunderabad"],
  Chennai: ["Chennai"],
  Kolkata: ["Kolkata"],
};

function expandedCities(city: string, openToRelocate: Biodata["openToRelocate"]): Set<string> {
  const set = new Set<string>([city]);
  if (openToRelocate === "No") return set;

  for (const cluster of Object.values(METRO_CLUSTERS)) {
    if (cluster.includes(city)) {
      cluster.forEach((c) => set.add(c));
    }
  }

  if (openToRelocate === "Yes") {
    PROFILE_CITIES.slice(0, 12).forEach((c) => set.add(c));
  }

  return set;
}

export function scoreLocationV2(client: Biodata, candidate: Biodata): number {
  if (client.city === candidate.city) return 1.0;

  const clientCities = expandedCities(client.city, client.openToRelocate);
  const candidateCities = expandedCities(candidate.city, candidate.openToRelocate);

  for (const c of clientCities) {
    if (candidateCities.has(c)) return 0.85;
  }

  if (client.country === candidate.country) return 0.5;
  return 0.2;
}

export function cityTier(city: string): "metro" | "tier2" {
  const metros = new Set(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"]);
  return metros.has(city) ? "metro" : "tier2";
}
