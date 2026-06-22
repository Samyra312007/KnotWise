import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { complete, aiEnabled } from "./client";
import { EXPLAIN_FEWSHOT, EXPLAIN_SYSTEM_PROMPT, summarizeForPrompt } from "./prompts";
import { explainMatchFallback } from "./fallback";

const DIMENSION_LABEL: Record<string, string> = {
  religion: "religion",
  motherTongue: "mother tongue",
  caste: "community",
  diet: "diet",
  wantKids: "wantKids",
  relocate: "city/relocation",
  pets: "pets",
  education: "education",
  incomeBracket: "income",
  ageDelta: "age",
  heightDelta: "height",
  manglik: "manglik",
};

export interface ExplainInput {
  client: Biodata;
  candidate: Biodata;
  breakdown: Record<string, number>;
  contributions: Record<string, number>;
}

function topDims(contributions: Record<string, number>, n = 2): string[] {
  return Object.entries(contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => DIMENSION_LABEL[k] ?? k);
}

export async function explainMatch(input: ExplainInput): Promise<string> {
  const fallback = () =>
    explainMatchFallback(
      input.client,
      input.candidate,
      input.breakdown,
      input.contributions
    );

  if (!aiEnabled()) return fallback();

  const clientS = summarizeForPrompt(input.client, ageFromDOB(input.client.dateOfBirth));
  const candS = summarizeForPrompt(input.candidate, ageFromDOB(input.candidate.dateOfBirth));
  const tops = topDims(input.contributions, 2);

  const userMsg =
    `Client: ${clientS.firstName}, ${clientS.age}, ${input.client.gender}, ${clientS.religion} ${clientS.caste}, ${clientS.diet}, ${clientS.motherTongue}, ${clientS.city}, ${clientS.designation}.
Candidate: ${candS.firstName}, ${candS.age}, ${input.candidate.gender}, ${candS.religion} ${candS.caste}, ${candS.diet}, ${candS.motherTongue}, ${candS.city}, ${candS.designation}.
Breakdown: ${JSON.stringify(input.breakdown)}
Top dimensions: ${tops.join(", ")}`;

  const out = await complete([
    { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
    ...EXPLAIN_FEWSHOT,
    { role: "user", content: userMsg },
  ]);

  if (!out) return fallback();

  return out.replace(/^"|"$/g, "").trim();
}

export async function explainMatchesBatch(inputs: ExplainInput[]): Promise<string[]> {
  const results: string[] = new Array(inputs.length).fill("");
  const batchSize = 5;

  for (let i = 0; i < inputs.length; i += batchSize) {
    const slice = inputs.slice(i, i + batchSize);
    const out = await Promise.all(slice.map((s) => explainMatch(s)));
    out.forEach((r, j) => (results[i + j] = r));
  }
  return results;
}
