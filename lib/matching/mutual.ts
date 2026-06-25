import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getPrimaryMatchmakerId } from "@/lib/access/customers";
import { ensureCustomerPoolProfile, orderedClientPair } from "@/lib/matching/pool-mirror";
import { createConversationForMutual } from "@/lib/c2c/conversations";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";
import type { Biodata } from "@/lib/types";

export type IntroDecision = "accept" | "decline";

export async function findCounterpartSuggestion(suggestion: {
  id: string;
  customerId: string;
  introPairId: string | null;
  poolProfile: { linkedCustomerId: string | null };
}) {
  if (suggestion.introPairId) {
    return prisma.matchSuggestion.findFirst({
      where: {
        introPairId: suggestion.introPairId,
        id: { not: suggestion.id },
      },
      include: { poolProfile: true, customer: true },
    });
  }

  const otherCustomerId = suggestion.poolProfile.linkedCustomerId;
  if (!otherCustomerId) return null;

  const senderMirror = await prisma.poolProfile.findFirst({
    where: { linkedCustomerId: suggestion.customerId },
  });
  if (!senderMirror) return null;

  return prisma.matchSuggestion.findFirst({
    where: {
      customerId: otherCustomerId,
      poolProfileId: senderMirror.id,
    },
    include: { poolProfile: true, customer: true },
  });
}

export async function markSuggestionViewed(suggestionId: string, customerId: string) {
  const suggestion = await prisma.matchSuggestion.findFirst({
    where: { id: suggestionId, customerId },
  });
  if (!suggestion) return null;
  if (suggestion.status !== "sent") return suggestion;
  if (suggestion.viewedAt) return suggestion;

  const updated = await prisma.matchSuggestion.update({
    where: { id: suggestionId },
    data: { status: "viewed", viewedAt: new Date() },
  });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { orgId: true },
  });
  if (customer) {
    trackAnalyticsEventAsync({
      orgId: customer.orgId,
      eventName: ANALYTICS_EVENTS.INTRO_VIEWED,
      customerId,
      entityType: "match_suggestion",
      entityId: suggestionId,
    });
  }

  return updated;
}

export async function submitIntroFeedback(input: {
  suggestionId: string;
  customerId: string;
  orgId: string;
  clientId: string;
  decision: IntroDecision;
  reason?: string;
  actorType?: "client" | "delegate";
  actorId?: string;
}) {
  const suggestion = await prisma.matchSuggestion.findFirst({
    where: {
      id: input.suggestionId,
      customerId: input.customerId,
      status: { in: ["sent", "viewed"] },
    },
    include: { customer: true, poolProfile: true, mutualMatch: true },
  });

  if (!suggestion) throw new Error("NOT_FOUND");

  const now = new Date();
  const nextStatus = input.decision === "accept" ? "accepted" : "declined";

  await prisma.matchSuggestion.update({
    where: { id: suggestion.id },
    data: {
      status: nextStatus,
      feedbackReason: input.reason,
      feedbackAt: now,
      viewedAt: suggestion.viewedAt ?? now,
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.actorId ?? input.clientId,
    actorType: input.actorType ?? "client",
    action: input.decision === "accept" ? "intro.accepted" : "intro.declined",
    entityType: "match_suggestion",
    entityId: suggestion.id,
    metadata: { reason: input.reason },
  });

  const mmId = await getPrimaryMatchmakerId(input.customerId);
  if (mmId) {
    const cand = JSON.parse(suggestion.poolProfile.biodata) as { firstName: string; lastName: string };
    await createNotification(mmId, "match_feedback", {
      customerId: input.customerId,
      suggestionId: suggestion.id,
      status: nextStatus,
      candidateName: `${cand.firstName} ${cand.lastName}`,
      reason: input.reason,
    });
  }

  if (input.decision === "decline") {
    trackAnalyticsEventAsync({
      orgId: input.orgId,
      eventName: ANALYTICS_EVENTS.INTRO_DECLINED,
      customerId: input.customerId,
      entityType: "match_suggestion",
      entityId: suggestion.id,
      properties: { reason: input.reason },
    });
    return { status: "declined" as const };
  }

  trackAnalyticsEventAsync({
    orgId: input.orgId,
    eventName: ANALYTICS_EVENTS.INTRO_ACCEPTED,
    customerId: input.customerId,
    entityType: "match_suggestion",
    entityId: suggestion.id,
  });

  const counterpart = await findCounterpartSuggestion(suggestion);
  if (!counterpart || counterpart.status !== "accepted") {
    return { status: "accepted" as const };
  }

  const mutual = await createMutualMatch({
    suggestionA: suggestion,
    suggestionB: counterpart,
    orgId: input.orgId,
    actorId: input.clientId,
  });

  return {
    status: "mutual" as const,
    mutualMatchId: mutual.id,
  };
}

async function createMutualMatch(input: {
  suggestionA: { id: string; customerId: string; introPairId: string | null };
  suggestionB: { id: string; customerId: string };
  orgId: string;
  actorId: string;
}) {
  const existing = await prisma.mutualMatch.findUnique({
    where: { matchSuggestionId: input.suggestionA.id },
  });
  if (existing) return existing;

  const [clientAId, clientBId] = orderedClientPair(input.suggestionA.customerId, input.suggestionB.customerId);

  const mutual = await prisma.$transaction(async (tx) => {
    const row = await tx.mutualMatch.create({
      data: {
        matchSuggestionId: input.suggestionA.id,
        introPairId: input.suggestionA.introPairId,
        clientAId,
        clientBId,
        status: "active",
      },
    });

    await tx.matchSuggestion.updateMany({
      where: { id: { in: [input.suggestionA.id, input.suggestionB.id] } },
      data: { status: "mutual" },
    });

    await tx.customer.updateMany({
      where: {
        id: { in: [input.suggestionA.customerId, input.suggestionB.customerId] },
        stage: { in: ["Active", "Match Sent", "In Conversation"] },
      },
      data: { stage: "In Conversation" },
    });

    return row;
  });

  await createConversationForMutual(mutual.id);

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.actorId,
    actorType: "client",
    action: "intro.mutual",
    entityType: "mutual_match",
    entityId: mutual.id,
    metadata: {
      clientAId,
      clientBId,
      suggestionIds: [input.suggestionA.id, input.suggestionB.id],
    },
  });

  trackAnalyticsEventAsync({
    orgId: input.orgId,
    eventName: ANALYTICS_EVENTS.MUTUAL_CREATED,
    customerId: clientAId,
    entityType: "mutual_match",
    entityId: mutual.id,
  });
  trackAnalyticsEventAsync({
    orgId: input.orgId,
    eventName: ANALYTICS_EVENTS.MUTUAL_CREATED,
    customerId: clientBId,
    entityType: "mutual_match",
    entityId: mutual.id,
  });

  return mutual;
}

export async function createReciprocalIntroPair(input: {
  orgId: string;
  senderCustomerId: string;
  targetPoolProfileId: string;
  score: number;
  bucket: string;
  breakdown: Record<string, number>;
  modelAdjusted: boolean;
  introPairId?: string;
}) {
  const target = await prisma.poolProfile.findFirst({
    where: { id: input.targetPoolProfileId, orgId: input.orgId },
  });
  if (!target?.linkedCustomerId) {
    return { introPairId: null as string | null, reciprocalCreated: false };
  }

  const introPairId = input.introPairId ?? randomUUID();
  const senderMirror = await ensureCustomerPoolProfile(input.senderCustomerId);
  const otherCustomerId = target.linkedCustomerId;

  const reverseRanked = await import("@/lib/matching/org-rank").then((m) =>
    m.rankMatchesForOrg(input.orgId, JSON.parse(target.biodata) as Biodata, [
      { id: senderMirror.id, biodata: JSON.parse(senderMirror.biodata) as Biodata },
    ])
  );
  const reverse = reverseRanked[0];

  await prisma.matchSuggestion.upsert({
    where: {
      customerId_poolProfileId: {
        customerId: otherCustomerId,
        poolProfileId: senderMirror.id,
      },
    },
    update: { status: "sent", introPairId },
    create: {
      customerId: otherCustomerId,
      poolProfileId: senderMirror.id,
      score: reverse?.score ?? input.score,
      bucket: reverse?.bucket ?? input.bucket,
      explanation: "",
      breakdown: JSON.stringify(reverse?.breakdown ?? {}),
      status: "sent",
      introPairId,
      modelAdjusted: reverse?.modelAdjusted ?? input.modelAdjusted,
    },
  });

  return { introPairId, reciprocalCreated: true };
}

export async function getMutualMatchForClient(mutualMatchId: string, customerId: string) {
  const mutual = await prisma.mutualMatch.findFirst({
    where: {
      id: mutualMatchId,
      OR: [{ clientAId: customerId }, { clientBId: customerId }],
    },
    include: {
      matchSuggestion: { include: { poolProfile: true } },
      clientA: true,
      clientB: true,
    },
  });
  if (!mutual) return null;

  const counterpartCustomerId = mutual.clientAId === customerId ? mutual.clientBId : mutual.clientAId;
  const counterpart = mutual.clientAId === customerId ? mutual.clientB : mutual.clientA;

  return {
    mutual,
    counterpartCustomerId,
    counterpart,
  };
}
