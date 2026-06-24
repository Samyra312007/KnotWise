import { buildIntroReveal, type RevealLevel } from "@/lib/matching/reveal";
import type { Biodata } from "@/lib/types";

export function revealLevelForDelegate(
  status: string,
  mutualMatch: { contactSharedAt: Date | null } | null | undefined
): RevealLevel {
  if (!mutualMatch || status !== "mutual") return "limited";
  if (!mutualMatch.contactSharedAt) return "limited";
  return "full";
}

export function buildDelegateIntroReveal(input: {
  biodata: Biodata;
  photoUrl?: string | null;
  score: number;
  bucket: string;
  status: string;
  mutualMatch: { contactSharedAt: Date | null } | null | undefined;
}) {
  const revealLevel = revealLevelForDelegate(input.status, input.mutualMatch);
  return buildIntroReveal({
    biodata: input.biodata,
    photoUrl: input.photoUrl,
    score: input.score,
    bucket: input.bucket,
    revealLevel,
  });
}
