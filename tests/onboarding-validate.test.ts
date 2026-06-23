import { describe, expect, it } from "vitest";
import { createEmptyBiodata } from "@/lib/profile/biodata";
import { validateOnboardingStep, sanitizeBiodataForSave } from "@/lib/onboarding/validate";
import { isValidPhone, normalizePhone } from "@/lib/profile/phone";

function fullBiodata() {
  const b = createEmptyBiodata({
    email: "test@example.com",
    firstName: "Aanya",
    lastName: "Sharma",
    gender: "female",
    dateOfBirth: "1995-06-15T00:00:00.000Z",
  });
  Object.assign(b, {
    motherTongue: "Hindi",
    city: "Bangalore",
    phone: "9876543210",
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
  return b;
}

describe("onboarding validation", () => {
  it("rejects invalid phone on step 2", () => {
    const b = fullBiodata();
    b.phone = "123";
    expect(validateOnboardingStep(2, b)).toMatch(/valid/);
  });

  it("passes all steps for complete biodata", () => {
    const b = fullBiodata();
    for (let s = 0; s < 7; s++) {
      expect(validateOnboardingStep(s, b)).toBeNull();
    }
  });

  it("normalizes indian phone on save", () => {
    const b = fullBiodata();
    b.phone = "9876543210";
    const saved = sanitizeBiodataForSave(b);
    expect(saved.phone).toBe("+919876543210");
    expect(isValidPhone(saved.phone)).toBe(true);
    expect(normalizePhone("9876543210")).toBe("+919876543210");
  });
});
