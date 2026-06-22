import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { complete, aiEnabled } from "./client";
import { EMAIL_SYSTEM_PROMPT, summarizeForPrompt } from "./prompts";
import { draftIntroEmailFallback } from "./fallback";

export interface DraftedEmail {
  subject: string;
  body: string;
  source: "llm" | "fallback";
}

function safeJSON(text: string): { subject?: string; body?: string } | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function draftIntroEmail(
  client: Biodata,
  candidate: Biodata
): Promise<DraftedEmail> {
  if (!aiEnabled()) {
    const fb = draftIntroEmailFallback(client, candidate);
    return { ...fb, source: "fallback" };
  }

  const clientS = summarizeForPrompt(client, ageFromDOB(client.dateOfBirth));
  const candS = summarizeForPrompt(candidate, ageFromDOB(candidate.dateOfBirth));

  const userMsg = `CLIENT:
${JSON.stringify(clientS, null, 2)}

CANDIDATE:
${JSON.stringify(candS, null, 2)}

Draft the introduction email from you (the matchmaker) to ${client.firstName}, proposing ${candidate.firstName}. Output the JSON only.`;

  const out = await complete(
    [
      { role: "system", content: EMAIL_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    { temperature: 0.5, maxTokens: 800, timeoutMs: 20_000, retry: false }
  );

  if (out) {
    const parsed = safeJSON(out);
    if (parsed?.subject && parsed?.body) {
      return { subject: parsed.subject, body: parsed.body, source: "llm" };
    }
  }

  const fb = draftIntroEmailFallback(client, candidate);
  return { ...fb, source: "fallback" };
}
