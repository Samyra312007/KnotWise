import { prisma } from "@/lib/db";
import type { MembershipRole } from "@/lib/auth/roles";
import { isOpsOrOwner } from "@/lib/auth/roles";

export async function getCustomerAccessFilter(
  matchmakerId: string,
  orgId: string,
  role: MembershipRole
) {
  if (isOpsOrOwner(role)) {
    return { orgId };
  }
  return {
    orgId,
    OR: [
      { assignments: { some: { matchmakerId } } },
      { collaborators: { some: { matchmakerId } } },
    ],
  };
}

export async function canAccessCustomer(
  customerId: string,
  matchmakerId: string,
  orgId: string,
  role: MembershipRole
): Promise<boolean> {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      ...(await getCustomerAccessFilter(matchmakerId, orgId, role)),
    },
    select: { id: true },
  });
  return !!customer;
}

export async function canWriteCustomer(
  customerId: string,
  matchmakerId: string,
  orgId: string,
  role: MembershipRole
): Promise<boolean> {
  if (role === "readonly") return false;
  if (isOpsOrOwner(role)) {
    return canAccessCustomer(customerId, matchmakerId, orgId, role);
  }
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      orgId,
      OR: [
        { assignments: { some: { matchmakerId, role: "primary" } } },
        { collaborators: { some: { matchmakerId, access: "write" } } },
      ],
    },
    select: { id: true },
  });
  return !!customer;
}

export async function getPrimaryMatchmakerId(customerId: string): Promise<string | null> {
  const assignment = await prisma.customerAssignment.findFirst({
    where: { customerId, role: "primary" },
    select: { matchmakerId: true },
  });
  return assignment?.matchmakerId ?? null;
}
