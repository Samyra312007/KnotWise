import { prisma } from "@/lib/db";

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.emailSuppression.findUnique({ where: { email: normalized } });
  return Boolean(row);
}

export async function suppressEmail(input: {
  email: string;
  reason: string;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const normalized = input.email.trim().toLowerCase();
  await prisma.emailSuppression.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      reason: input.reason,
      source: input.source,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
    update: {
      reason: input.reason,
      source: input.source,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      suppressedAt: new Date(),
    },
  });

  await prisma.clientAccount.updateMany({
    where: { email: normalized },
    data: { notifyEmail: false },
  });
}

export async function listEmailSuppressions(limit = 50) {
  return prisma.emailSuppression.findMany({
    orderBy: { suppressedAt: "desc" },
    take: limit,
  });
}
