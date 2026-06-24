import { prisma } from "@/lib/db";
import { sendPushToCustomer } from "@/lib/push/send";

export async function notifyNewIntro(input: {
  customerId: string;
  suggestionId: string;
  candidateName: string;
}) {
  await sendPushToCustomer({
    customerId: input.customerId,
    category: "intro",
    title: "New intro from your matchmaker",
    body: `Review ${input.candidateName} and share your interest.`,
    payload: { type: "intro", suggestionId: input.suggestionId },
  });
}

export async function notifyMutualMatch(input: {
  customerId: string;
  mutualMatchId: string;
  counterpartName: string;
  conversationId?: string;
}) {
  await sendPushToCustomer({
    customerId: input.customerId,
    category: "intro",
    title: "It's a mutual match",
    body: `You and ${input.counterpartName} both accepted. Start chatting.`,
    payload: {
      type: "mutual",
      mutualMatchId: input.mutualMatchId,
      conversationId: input.conversationId,
    },
  });
}

export async function notifyC2cMessage(input: {
  recipientCustomerId: string;
  conversationId: string;
  preview: string;
  senderName: string;
}) {
  const preview = input.preview.length > 120 ? `${input.preview.slice(0, 117)}…` : input.preview;
  await sendPushToCustomer({
    customerId: input.recipientCustomerId,
    category: "message",
    title: `Message from ${input.senderName}`,
    body: preview,
    payload: {
      type: "message",
      conversationId: input.conversationId,
      preview,
    },
  });
}

export async function notifyDateReminder(input: {
  customerId: string;
  eventId: string;
  title: string;
  whenLabel: string;
}) {
  await sendPushToCustomer({
    customerId: input.customerId,
    category: "reminder",
    title: input.title,
    body: `Reminder: ${input.whenLabel}`,
    payload: { type: "reminder", eventId: input.eventId },
  });
}

export async function notifyScheduleProposal(input: {
  recipientCustomerId: string;
  eventId: string;
  proposerName: string;
  whenLabel: string;
}) {
  await sendPushToCustomer({
    customerId: input.recipientCustomerId,
    category: "reminder",
    title: "New date proposal",
    body: `${input.proposerName} proposed ${input.whenLabel}. Tap to respond.`,
    payload: { type: "schedule", eventId: input.eventId, action: "proposed" },
  });
}

export async function notifyScheduleAccepted(input: {
  recipientCustomerId: string;
  eventId: string;
  counterpartName: string;
  whenLabel: string;
  hasVideo: boolean;
}) {
  await sendPushToCustomer({
    customerId: input.recipientCustomerId,
    category: "reminder",
    title: "Date confirmed",
    body: `${input.counterpartName} confirmed ${input.whenLabel}${input.hasVideo ? " — video link ready" : ""}.`,
    payload: { type: "schedule", eventId: input.eventId, action: "accepted" },
  });
}

export async function notifyIntroPairSent(input: {
  primaryCustomerId: string;
  primarySuggestionId: string;
  primaryCandidateName: string;
  reciprocalCustomerId?: string | null;
  introPairId?: string | null;
  reciprocalCandidateName?: string;
}) {
  await notifyNewIntro({
    customerId: input.primaryCustomerId,
    suggestionId: input.primarySuggestionId,
    candidateName: input.primaryCandidateName,
  });

  if (!input.reciprocalCustomerId || !input.introPairId) return;

  const reciprocal = await prisma.matchSuggestion.findFirst({
    where: {
      customerId: input.reciprocalCustomerId,
      introPairId: input.introPairId,
    },
    select: { id: true },
  });
  if (!reciprocal) return;

  await notifyNewIntro({
    customerId: input.reciprocalCustomerId,
    suggestionId: reciprocal.id,
    candidateName: input.reciprocalCandidateName ?? "a new match",
  });
}
