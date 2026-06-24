import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { notifyC2cMessage } from "@/lib/push/triggers";
import { dispatchC2cEvent, serializeC2cMessageEvent } from "@/lib/realtime/dispatch";
import { isBlockedEitherWay } from "@/lib/c2c/blocks";
import { sanitizeOrRejectMessage } from "@/lib/trust/content-filter";
import { MAX_C2C_MESSAGE_LENGTH } from "@/lib/c2c/conversations";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";

export async function listConversationMessages(input: {
  conversationId: string;
  customerId: string;
  cursor?: string;
  limit?: number;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      mutualMatch: {
        OR: [{ clientAId: input.customerId }, { clientBId: input.customerId }],
      },
    },
    include: { mutualMatch: true },
  });
  if (!conversation) throw new Error("NOT_FOUND");

  const take = Math.min(input.limit ?? 50, 100);
  const cursorMessage = input.cursor
    ? await prisma.c2cMessage.findFirst({
        where: { id: input.cursor, conversationId: input.conversationId },
      })
    : null;

  const messages = await prisma.c2cMessage.findMany({
    where: {
      conversationId: input.conversationId,
      ...(cursorMessage ? { createdAt: { lt: cursorMessage.createdAt } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const ordered = messages.reverse();
  const nextCursor = messages.length === take ? messages[0]?.id : undefined;

  await prisma.c2cMessage.updateMany({
    where: {
      conversationId: input.conversationId,
      senderId: { not: input.customerId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return {
    messages: ordered,
    nextCursor,
    counterpartId:
      conversation.mutualMatch.clientAId === input.customerId
        ? conversation.mutualMatch.clientBId
        : conversation.mutualMatch.clientAId,
  };
}

export async function sendConversationMessage(input: {
  conversationId: string;
  customerId: string;
  orgId: string;
  clientId: string;
  body: string;
}) {
  const text = input.body.trim();
  if (!text) throw new Error("EMPTY");
  if (text.length > MAX_C2C_MESSAGE_LENGTH) throw new Error("TOO_LONG");

  const filtered = sanitizeOrRejectMessage(text);
  if (!filtered.ok) throw new Error("CONTENT_BLOCKED");
  const messageBody = filtered.text;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      mutualMatch: {
        OR: [{ clientAId: input.customerId }, { clientBId: input.customerId }],
        status: "active",
      },
    },
    include: { mutualMatch: true },
  });
  if (!conversation) throw new Error("NOT_FOUND");

  const counterpartId =
    conversation.mutualMatch.clientAId === input.customerId
      ? conversation.mutualMatch.clientBId
      : conversation.mutualMatch.clientAId;

  if (await isBlockedEitherWay(input.customerId, counterpartId)) {
    throw new Error("BLOCKED");
  }

  const message = await prisma.c2cMessage.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.customerId,
      body: messageBody,
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "c2c.message_sent",
    entityType: "conversation",
    entityId: input.conversationId,
    metadata: { messageId: message.id, recipientId: counterpartId },
  });

  trackAnalyticsEventAsync({
    orgId: input.orgId,
    eventName: ANALYTICS_EVENTS.C2C_MESSAGE_SENT,
    customerId: input.customerId,
    entityType: "conversation",
    entityId: input.conversationId,
  });

  await dispatchC2cEvent(
    serializeC2cMessageEvent({
      conversationId: input.conversationId,
      message,
    })
  );

  const sender = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { firstName: true, lastName: true },
  });
  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Someone";

  void notifyC2cMessage({
    recipientCustomerId: counterpartId,
    conversationId: input.conversationId,
    preview: messageBody,
    senderName,
  }).catch(() => undefined);

  return message;
}
