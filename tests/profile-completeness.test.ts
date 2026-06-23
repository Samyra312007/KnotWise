import { describe, expect, it } from "vitest";
import { createEmptyBiodata } from "@/lib/profile/biodata";
import { computeProfileCompleteness, isProfileComplete } from "@/lib/profile/completeness";

describe("profile completeness", () => {
  it("starts low for empty signup biodata", () => {
    const b = createEmptyBiodata({
      email: "a@test.com",
      firstName: "Aanya",
      lastName: "Sharma",
      gender: "female",
      dateOfBirth: "1995-06-15T00:00:00.000Z",
    });
    expect(computeProfileCompleteness(b)).toBeLessThan(80);
    expect(isProfileComplete(b)).toBe(false);
  });

  it("reaches complete when required fields are filled", () => {
    const b = createEmptyBiodata({
      email: "a@test.com",
      firstName: "Aanya",
      lastName: "Sharma",
      gender: "female",
      dateOfBirth: "1995-06-15T00:00:00.000Z",
    });
    Object.assign(b, {
      motherTongue: "Hindi",
      city: "Bangalore",
      phone: "+91 9876543210",
      degree: "B.Tech",
      currentCompany: "Google",
      designation: "Engineer",
      annualIncomeINR: 2500000,
      religion: "Hindu",
      caste: "Brahmin",
      bio: "Family-oriented professional looking for a kind, curious partner to build a life with.",
      photoUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    });
    b.partnerPreferences.ageMin = 28;
    b.partnerPreferences.ageMax = 36;
    expect(isProfileComplete(b)).toBe(true);
  });
});
