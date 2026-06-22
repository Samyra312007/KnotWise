import type { Biodata } from "@/lib/types";

export const EXPLAIN_SYSTEM_PROMPT = `You are a senior matchmaker writing a single sentence (max 30 words) of explanation for a proposed match.

Rules:
- Exactly one sentence, neutral and respectful tone.
- Cite the 2 strongest dimensions from the provided breakdown.
- Mention concrete attributes the dimensions point to (e.g., "both vegetarian Tamil speakers in Bangalore tech, aligned on wanting kids").
- No marketing words. No emojis. No exclamation marks.
- Refer to people by first name only.
- Do not output anything except the sentence itself.`;

export const EXPLAIN_FEWSHOT = [
  {
    role: "user" as const,
    content: `Client: Rohan, 32, male, Hindu Iyer, Vegetarian, Tamil, Bangalore, Software Engineer.
Candidate: Priya, 29, female, Hindu Iyer, Vegetarian, Tamil, Bangalore, Product Manager.
Breakdown: { religion: 1.0, motherTongue: 1.0, diet: 1.0, wantKids: 1.0, ageDelta: 1.0, caste: 1.0 }
Top dimensions: religion, motherTongue`,
  },
  {
    role: "assistant" as const,
    content:
      "Both vegetarian Tamil-speaking Hindu Iyers in Bangalore tech, three years younger, and aligned on wanting kids.",
  },
];

export const EMAIL_SYSTEM_PROMPT = `You are a senior matchmaker drafting an introduction email FROM you TO the client. The email proposes one candidate.

Rules:
- 100-160 words total.
- Warm, calm, respectful Indian-English register. No marketing words.
- Address the client by first name only.
- Mention 3-5 specific attributes of the candidate that would matter to the client.
- Close with a single sentence offering to set up a call if interested.
- Sign off as "Your matchmaker" only.
- Output strictly as JSON: { "subject": string, "body": string }. No markdown fences. No commentary.`;

export interface ProfileSummary {
  firstName: string;
  lastName: string;
  age: number;
  city: string;
  religion: string;
  caste: string;
  motherTongue: string;
  diet: string;
  designation: string;
  company: string;
  education: string;
  college: string;
  annualIncomeINR: number;
  wantKids: string;
  openToRelocate: string;
  bio?: string;
}

export function summarizeForPrompt(b: Biodata, age: number): ProfileSummary {
  return {
    firstName: b.firstName,
    lastName: b.lastName,
    age,
    city: b.city,
    religion: b.religion,
    caste: b.caste,
    motherTongue: b.motherTongue,
    diet: b.diet,
    designation: b.designation,
    company: b.currentCompany,
    education: b.educationLevel,
    college: b.undergradCollege,
    annualIncomeINR: b.annualIncomeINR,
    wantKids: b.wantKids,
    openToRelocate: b.openToRelocate,
    bio: b.bio,
  };
}
