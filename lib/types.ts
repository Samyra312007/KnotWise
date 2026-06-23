export type Gender = "male" | "female";

export type Trinary = "Yes" | "No" | "Maybe";

export type Diet =
  | "Vegetarian"
  | "Eggetarian"
  | "Non-vegetarian"
  | "Vegan"
  | "Jain";

export type Frequency = "Never" | "Occasionally" | "Regularly";

export type MaritalStatus =
  | "Never Married"
  | "Divorced"
  | "Widowed"
  | "Separated";

export type EducationLevel =
  | "High School"
  | "Bachelor's"
  | "Master's"
  | "PhD"
  | "Professional";

export type Stage =
  | "Onboarding"
  | "Active"
  | "Match Sent"
  | "In Conversation"
  | "Paused"
  | "Closed - Engaged"
  | "Closed - Dropped";

export const STAGES: Stage[] = [
  "Onboarding",
  "Active",
  "Match Sent",
  "In Conversation",
  "Paused",
  "Closed - Engaged",
  "Closed - Dropped",
];

export interface PartnerPreferences {
  ageMin?: number;
  ageMax?: number;
  heightMinCm?: number;
  heightMaxCm?: number;
  religions?: string[];
  motherTongues?: string[];
  cities?: string[];
  educationMin?: EducationLevel;
  acceptsManglik?: "Yes" | "No" | "Doesn't matter";
  acceptedMaritalStatuses?: MaritalStatus[];
  openToOtherReligions?: boolean;
  preferredDiets?: Diet[];
}

export interface Biodata {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm: number;
  motherTongue: string;
  maritalStatus: MaritalStatus;

  country: string;
  city: string;
  openToRelocate: Trinary;

  email: string;
  phone: string;

  educationLevel: EducationLevel;
  undergradCollege: string;
  degree: string;
  currentCompany: string;
  designation: string;
  annualIncomeINR: number;

  fathersOccupation?: string;
  mothersOccupation?: string;
  siblings: number;
  familyType: "Nuclear" | "Joint";

  religion: string;
  caste: string;
  subCaste?: string;
  gotra?: string;
  manglik: "Yes" | "No" | "Don't know" | "Doesn't matter";

  diet: Diet;
  smoking: Frequency;
  drinking: Frequency;
  wantKids: Trinary;
  openToPets: Trinary;
  languagesKnown: string[];

  bio?: string;

  partnerPreferences: PartnerPreferences;

  photoUrl?: string;
}

export interface ScoredCandidate {
  candidate: Biodata & { id: string };
  score: number;
  bucket: "high" | "medium" | "low";
  explanation: string;
  breakdown: Record<string, number>;
  alreadySent: boolean;
  sentAt?: string;
  lastEmail?: { subject: string; body: string; deliveryStatus: string };
  modelAdjusted?: boolean;
  shortlisted?: boolean;
}

export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  city: string;
  maritalStatus: MaritalStatus;
  stage: Stage;
  photoUrl?: string;
  lastActivityAt: string;
}

export function ageFromDOB(dob: string | Date): number {
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
