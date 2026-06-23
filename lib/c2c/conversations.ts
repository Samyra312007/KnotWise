import { prisma } from "@/lib/db";

export const MAX_C2C_MESSAGE_LENGTH = 4000;

export async function getConversationForCustomer(conversationId: string, customerId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      mutualMatch: {
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
        status: "active",
      },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });
}

export async function listConversationsForCustomer(customerId: string) {
  return prisma.conversation.findMany({
    where: {
      mutualMatch: {
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
        status: "active",
      },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function counterpartFromMutual(
  mutual: {
    clientAId: string;
    clientBId: string;
    clientA: { id: string; firstName: string; lastName: string; photoUrl: string | null };
    clientB: { id: string; firstName: string; lastName: string; photoUrl: string | null };
  },
  customerId: string
) {
  return mutual.clientAId === customerId ? mutual.clientB : mutual.clientA;
}

export async function createConversationForMutual(mutualMatchId: string) {
  const existing = await prisma.conversation.findUnique({ where: { mutualMatchId } });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { mutualMatchId },
  });
}

export async function findConversationByMutualMatch(mutualMatchId: string, customerId: string) {
  return prisma.conversation.findFirst({
    where: {
      mutualMatchId,
      mutualMatch: {
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
        status: "active",
      },
    },
  });
}
