import { describe, expect, it } from "vitest";
import { buildPoolSearchText, matchesTextQuery } from "@/lib/discovery/search-text";
import {
  passesDiscoveryFilters,
  passesClientHardFilters,
  verifiedBoostScore,
} from "@/lib/discovery/filters";
import { makeBiodata } from "./fixtures";

describe("discovery search text", () => {
  it("builds searchable text from biodata", () => {
    const bio = makeBiodata({ firstName: "Aanya", city: "Mumbai", religion: "Hindu" });
    const text = buildPoolSearchText(bio);
    expect(text).toContain("aanya");
    expect(text).toContain("mumbai");
  });

  it("matches query substrings", () => {
    expect(matchesTextQuery("hello mumbai world", "Mumbai")).toBe(true);
    expect(matchesTextQuery("hello world", "delhi")).toBe(false);
  });
});

describe("discovery filters", () => {
  it("filters by city and age", () => {
    const candidate = makeBiodata({ gender: "female", city: "Delhi", dateOfBirth: "1995-01-01" });
    expect(passesDiscoveryFilters(candidate, { city: "Delhi", ageMin: 25, ageMax: 35 }, null)).toBe(true);
    expect(passesDiscoveryFilters(candidate, { city: "Mumbai" }, null)).toBe(false);
  });

  it("applies hard filters for same gender", () => {
    const client = makeBiodata({ gender: "male" });
    const candidate = makeBiodata({ gender: "male" });
    expect(passesClientHardFilters(client, candidate, true)).toBe(false);
  });

  it("boosts verified profiles", () => {
    expect(verifiedBoostScore(80, new Date())).toBe(85);
    expect(verifiedBoostScore(80, null)).toBe(80);
  });
});
