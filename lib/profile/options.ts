import type { Diet, EducationLevel, Frequency, Gender, MaritalStatus, Trinary } from "@/lib/types";

export const PROFILE_CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Kochi",
  "Lucknow",
  "Chandigarh",
];

export const MOTHER_TONGUES = [
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Odia",
];

export const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Parsi", "Buddhist"];

export const CASTES_BY_RELIGION: Record<string, string[]> = {
  Hindu: ["Brahmin", "Iyer", "Iyengar", "Reddy", "Maratha", "Kayastha", "Agarwal", "Rajput", "Nair", "Khatri"],
  Muslim: ["Sunni", "Shia"],
  Christian: ["Catholic", "Protestant", "Syrian"],
  Sikh: ["Jat", "Khatri", "Arora"],
  Jain: ["Digambar", "Shvetambar"],
  Parsi: ["Parsi"],
  Buddhist: ["Buddhist"],
};

export const EDUCATION_LEVELS: EducationLevel[] = [
  "High School",
  "Bachelor's",
  "Master's",
  "PhD",
  "Professional",
];

export const DIETS: Diet[] = ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "Jain"];

export const MARITAL_STATUSES: MaritalStatus[] = [
  "Never Married",
  "Divorced",
  "Widowed",
  "Separated",
];

export const FREQUENCIES: Frequency[] = ["Never", "Occasionally", "Regularly"];

export const TRINARY: Trinary[] = ["Yes", "No", "Maybe"];

export const GENDERS: Gender[] = ["male", "female"];

export const MANGLIK = ["Yes", "No", "Don't know", "Doesn't matter"] as const;

export const FAMILY_TYPES = ["Nuclear", "Joint"] as const;

export const ONBOARDING_STEP_LABELS = [
  "About you",
  "Location",
  "Contact",
  "Education & career",
  "Background",
  "Lifestyle",
  "Partner preferences",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_LABELS.length;
