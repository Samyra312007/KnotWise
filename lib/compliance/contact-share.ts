import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { getMutualMatchForClient } from "@/lib/matching/mutual";
import { buildIntroReveal } from "@/lib/matching/reveal";
import type { Biodata } from "@/lib/types";

export async function shareContactWithConsent(input: {
  mutualMatchId: string;
  customerId: string;
  clientId: string;
  orgId: string;
}) {
  const result = await getMutualMatchForClient(input.mutualMatchId, input.customerId);
  if (!result) throw new Error("NOT_FOUND");
  if (result.mutual.contactSharedAt) throw new Error("ALREADY_SHARED");

  const now = new Date();
  await prisma.mutualMatch.update({
    where: { id: result.mutual.id },
    data: { contactSharedAt: now },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "contact.shared",
    entityType: "mutual_match",
    entityId: result.mutual.id,
  });

  return { contactSharedAt: now.toISOString() };
}

export function mutualRevealLevel(mutual: { contactSharedAt: Date | null }): "limited" | "full" {
  return mutual.contactSharedAt ? "full" : "limited";
}

export function buildMutualCandidateReveal(input: {
  biodata: Biodata;
  photoUrl: string | null;
  score: number;
  bucket: string;
  contactSharedAt: Date | null;
}) {
  const revealLevel = input.contactSharedAt ? "full" : "limited";
  return buildIntroReveal({
    biodata: input.biodata,
    photoUrl: input.photoUrl,
    score: input.score,
    bucket: input.bucket,
    revealLevel,
  });
}
