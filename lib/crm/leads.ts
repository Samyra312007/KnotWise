import { prisma } from "@/lib/db";

export type CrmLeadStage = "lead" | "qualified" | "paying" | "lost";
export type CrmLeadPriority = "low" | "normal" | "high";

export async function ensureCrmLead(input: {
  orgId: string;
  customerId: string;
  source?: string;
}) {
  return prisma.crmLead.upsert({
    where: { customerId: input.customerId },
    create: {
      orgId: input.orgId,
      customerId: input.customerId,
      stage: "lead",
      source: input.source ?? "signup",
    },
    update: {},
  });
}

export async function syncCrmLeadStage(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { clientAccount: true, clientBilling: true, crmLead: true },
  });
  if (!customer?.crmLead) return null;

  let stage: CrmLeadStage = "lead";
  if (
    customer.clientBilling &&
    customer.clientBilling.plan !== "included" &&
    customer.clientBilling.status === "active"
  ) {
    stage = "paying";
  } else if (customer.clientAccount?.onboardingCompletedAt) {
    stage = "qualified";
  }

  if (customer.crmLead.stage === "lost") return customer.crmLead;

  return prisma.crmLead.update({
    where: { customerId },
    data: { stage },
  });
}

export async function listCrmLeads(orgId: string, stage?: string) {
  const rows = await prisma.crmLead.findMany({
    where: {
      orgId,
      ...(stage ? { stage } : {}),
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          stage: true,
          clientAccount: { select: { email: true, onboardingCompletedAt: true } },
        },
      },
      assignee: { select: { id: true, fullName: true } },
    },
    orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
    stage: row.stage,
    priority: row.priority,
    source: row.source,
    notes: row.notes,
    lastContactAt: row.lastContactAt?.toISOString() ?? null,
    nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null,
    assignee: row.assignee,
    customer: {
      id: row.customer.id,
      firstName: row.customer.firstName,
      lastName: row.customer.lastName,
      city: row.customer.city,
      stage: row.customer.stage,
      email: row.customer.clientAccount?.email ?? null,
      onboardingCompleted: !!row.customer.clientAccount?.onboardingCompletedAt,
    },
  }));
}

export async function updateCrmLead(
  orgId: string,
  leadId: string,
  input: {
    stage?: CrmLeadStage;
    priority?: CrmLeadPriority;
    notes?: string;
    lastContactAt?: Date;
    nextFollowUpAt?: Date | null;
    assigneeId?: string | null;
  }
) {
  const existing = await prisma.crmLead.findFirst({
    where: { id: leadId, orgId },
  });
  if (!existing) return null;

  return prisma.crmLead.update({
    where: { id: leadId },
    data: {
      ...(input.stage != null ? { stage: input.stage } : {}),
      ...(input.priority != null ? { priority: input.priority } : {}),
      ...(input.notes != null ? { notes: input.notes } : {}),
      ...(input.lastContactAt != null ? { lastContactAt: input.lastContactAt } : {}),
      ...(input.nextFollowUpAt !== undefined ? { nextFollowUpAt: input.nextFollowUpAt } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
  });
}
