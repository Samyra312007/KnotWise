import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const DIMENSION_LABEL: Record<string, string> = {
  religion: "religion",
  motherTongue: "mother tongue",
  caste: "community",
  diet: "diet",
  wantKids: "alignment on wanting kids",
  relocate: "city compatibility",
  pets: "alignment on pets",
  education: "education",
  incomeBracket: "income bracket",
  ageDelta: "age",
  heightDelta: "height",
  manglik: "manglik status",
};

function top2(breakdown: Record<string, number>, contributions: Record<string, number>): string[] {
  return Object.entries(contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => DIMENSION_LABEL[k] ?? k);
}

export function explainMatchFallback(
  client: Biodata,
  candidate: Biodata,
  breakdown: Record<string, number>,
  contributions: Record<string, number>
): string {
  const [d1, d2] = top2(breakdown, contributions);
  const cAge = ageFromDOB(client.dateOfBirth);
  const kAge = ageFromDOB(candidate.dateOfBirth);
  const ageWord =
    kAge < cAge
      ? `${cAge - kAge} year${cAge - kAge === 1 ? "" : "s"} younger`
      : kAge > cAge
        ? `${kAge - cAge} year${kAge - cAge === 1 ? "" : "s"} older`
        : "the same age";
  const sameCity = client.city === candidate.city ? `in ${client.city}` : `in ${candidate.city}`;
  const dietPart =
    client.diet === candidate.diet ? `both ${client.diet.toLowerCase()}` : `${client.diet.toLowerCase()} and ${candidate.diet.toLowerCase()}`;
  return `Strong on ${d1} and ${d2}; ${dietPart}, ${sameCity}, and ${ageWord}.`;
}

export function draftIntroEmailFallback(
  client: Biodata,
  candidate: Biodata
): { subject: string; body: string } {
  const subject = `An introduction: ${candidate.firstName} ${candidate.lastName}`;
  const body = `Dear ${client.firstName},

I would like to introduce you to ${candidate.firstName} ${candidate.lastName}. ${candidate.firstName} is ${ageFromDOB(candidate.dateOfBirth)} and based in ${candidate.city}, working as a ${candidate.designation} at ${candidate.currentCompany}. ${candidate.firstName} studied at ${candidate.undergradCollege} and currently earns around ₹${formatINR(candidate.annualIncomeINR)} a year.

A few notes from the profile that I thought would resonate: ${candidate.firstName} is ${candidate.diet.toLowerCase()} like you, speaks ${candidate.motherTongue}, and is ${candidate.openToRelocate === "Yes" ? "open to relocating" : candidate.openToRelocate === "Maybe" ? "open to discussing relocation" : "settled in " + candidate.city}. ${candidate.bio ? `In ${candidate.firstName}'s own words: "${candidate.bio}"` : ""}

If you would like to take this forward, let me know and I will set up a call.

Warmly,
Your matchmaker`;
  return { subject, body };
}
