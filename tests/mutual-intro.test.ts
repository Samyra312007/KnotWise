import { describe, expect, it } from "vitest";
import { buildIntroReveal, bioHeadline, revealLevelForSuggestion } from "@/lib/matching/reveal";
import { orderedClientPair } from "@/lib/matching/pool-mirror";
import type { Biodata } from "@/lib/types";

const biodata: Biodata = {
  firstName: "Ananya",
  lastName: "Sharma",
  gender: "female",
  dateOfBirth: "1995-06-15",
  heightCm: 165,
  motherTongue: "Hindi",
  maritalStatus: "Never Married",
  country: "India",
  city: "Bangalore",
  openToRelocate: "Maybe",
  email: "ananya@example.com",
  phone: "9876543210",
  educationLevel: "Master's",
  undergradCollege: "IIT",
  degree: "MBA",
  currentCompany: "Acme",
  designation: "Product Manager",
  annualIncomeINR: 2400000,
  siblings: 1,
  familyType: "Nuclear",
  religion: "Hindu",
  caste: "Brahmin",
  gotra: "Bharadwaj",
  manglik: "No",
  diet: "Vegetarian",
  smoking: "Never",
  drinking: "Never",
  wantKids: "Yes",
  openToPets: "Maybe",
  languagesKnown: ["Hindi", "English"],
  bio: "Product leader who loves travel and classical music.\nWeekend chef and reader.",
  partnerPreferences: { ageMin: 28, ageMax: 35, openToOtherReligions: false },
  photoUrl: "https://example.com/a.jpg",
};

describe("intro reveal", () => {
  it("limits contact and employer fields", () => {
    const limited = buildIntroReveal({
      biodata,
      score: 82,
      bucket: "high",
      revealLevel: "limited",
    });
    expect(limited.firstName).toBe("Ananya");
    expect(limited.lastName).toBeUndefined();
    expect(limited.email).toBeUndefined();
    expect(limited.phone).toBeUndefined();
    expect(limited.currentCompany).toBeUndefined();
    expect(limited.gotra).toBeUndefined();
    expect(limited.bioHeadline).toContain("Product leader");
  });

  it("returns full biodata on mutual reveal", () => {
    const full = buildIntroReveal({
      biodata,
      score: 82,
      bucket: "high",
      revealLevel: "full",
    });
    expect(full.lastName).toBe("Sharma");
    expect(full.email).toBe("ananya@example.com");
    expect(full.phone).toBe("9876543210");
    expect(full.gotra).toBe("Bharadwaj");
  });

  it("derives reveal level from status", () => {
    expect(revealLevelForSuggestion("accepted", false)).toBe("limited");
    expect(revealLevelForSuggestion("mutual", true)).toBe("full");
  });

  it("builds two-line bio headline", () => {
    expect(bioHeadline(biodata.bio)).toContain("Weekend chef");
  });
});

describe("orderedClientPair", () => {
  it("orders ids consistently", () => {
    expect(orderedClientPair("b", "a")).toEqual(["a", "b"]);
    expect(orderedClientPair("a", "b")).toEqual(["a", "b"]);
  });
});
