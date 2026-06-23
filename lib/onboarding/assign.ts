import { prisma } from "@/lib/db";

export async function assignDefaultMatchmaker(orgId: string, customerId: string): Promise<string | null> {
  const matchmakers = await prisma.membership.findMany({
    where: { orgId, role: { in: ["matchmaker", "owner"] } },
    include: {
      matchmaker: {
        include: {
          _count: { select: { assignments: true } },
        },
      },
    },
  });

  if (matchmakers.length === 0) return null;

  const sorted = [...matchmakers].sort(
    (a, b) => a.matchmaker._count.assignments - b.matchmaker._count.assignments
  );
  const chosen = sorted[0].matchmaker;

  await prisma.customerAssignment.create({
    data: {
      customerId,
      matchmakerId: chosen.id,
      role: "primary",
    },
  });

  return chosen.id;
}

export async function resolveDefaultOrgId(): Promise<string | null> {
  const slug = process.env.DEFAULT_ORG_SLUG ?? "tdc";
  const org = await prisma.organization.findUnique({ where: { slug } });
  return org?.id ?? null;
}
