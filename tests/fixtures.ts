import type { Biodata } from "@/lib/types";

function dobForAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(0);
  d.setDate(15);
  return d.toISOString();
}

export function makeBiodata(overrides: Partial<Biodata> = {}): Biodata {
  return {
    firstName: "Test",
    lastName: "Person",
    gender: "male",
    dateOfBirth: dobForAge(30),
    heightCm: 175,
    motherTongue: "Tamil",
    maritalStatus: "Never Married",

    country: "India",
    city: "Bangalore",
    openToRelocate: "Maybe",

    email: "test@example.com",
    phone: "+91 98765 43210",

    educationLevel: "Master's",
    undergradCollege: "IIT Madras",
    degree: "M.S. CS",
    currentCompany: "Stripe",
    designation: "Engineer",
    annualIncomeINR: 2_500_000,

    fathersOccupation: "Retired Engineer",
    mothersOccupation: "Homemaker",
    siblings: 1,
    familyType: "Nuclear",

    religion: "Hindu",
    caste: "Iyer",
    manglik: "No",

    diet: "Vegetarian",
    smoking: "Never",
    drinking: "Never",
    wantKids: "Yes",
    openToPets: "Maybe",
    languagesKnown: ["Tamil", "English", "Hindi"],

    bio: "Test bio.",

    partnerPreferences: {
      ageMin: 25,
      ageMax: 33,
      heightMinCm: 150,
      heightMaxCm: 173,
      religions: ["Hindu"],
      educationMin: "Bachelor's",
      acceptsManglik: "Doesn't matter",
      acceptedMaritalStatuses: ["Never Married"],
      openToOtherReligions: false,
    },
    ...overrides,
  };
}

export const MALE_CLIENT = makeBiodata({
  firstName: "Rohan",
  gender: "male",
  dateOfBirth: dobForAge(32),
  heightCm: 178,
  annualIncomeINR: 3_000_000,
});

export const FEMALE_CLIENT = makeBiodata({
  firstName: "Aanya",
  gender: "female",
  dateOfBirth: dobForAge(28),
  heightCm: 162,
  annualIncomeINR: 1_800_000,
});
