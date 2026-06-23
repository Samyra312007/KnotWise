import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { dispatchC2cEvent, serializeC2cMessageEvent } from "@/lib/realtime/dispatch";
import { isBlockedEitherWay } from "@/lib/c2c/blocks";
import { sanitizeOrRejectMessage } from "@/lib/trust/content-filter";
import { MAX_C2C_MESSAGE_LENGTH } from "@/lib/c2c/conversations";

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

  await dispatchC2cEvent(
    serializeC2cMessageEvent({
      conversationId: input.conversationId,
      message,
    })
  );

  return message;
}
