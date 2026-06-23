import { prisma } from "@/lib/db";

export async function isBlockedEitherWay(customerA: string, customerB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: customerA, blockedId: customerB },
        { blockerId: customerB, blockedId: customerA },
      ],
    },
  });
  return !!block;
}

export async function blockCustomer(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("INVALID");

  const row = await prisma.block.upsert({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
    update: {},
    create: { blockerId, blockedId },
  });

  return row;
}

export async function isBlockedBy(blockerId: string, blockedId: string): Promise<boolean> {
  const row = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return !!row;
}
