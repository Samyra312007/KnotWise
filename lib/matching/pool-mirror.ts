import { prisma } from "@/lib/db";

export async function ensureCustomerPoolProfile(customerId: string) {
  const existing = await prisma.poolProfile.findFirst({
    where: { linkedCustomerId: customerId },
  });
  if (existing) return existing;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found.");

  return prisma.poolProfile.create({
    data: {
      orgId: customer.orgId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      city: customer.city,
      country: customer.country,
      biodata: customer.biodata,
      photoUrl: customer.photoUrl,
      verifiedAt: customer.verifiedAt,
      linkedCustomerId: customer.id,
    },
  });
}

export async function syncCustomerPoolProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return null;

  const mirror = await prisma.poolProfile.findFirst({
    where: { linkedCustomerId: customerId },
  });
  if (!mirror) return ensureCustomerPoolProfile(customerId);

  return prisma.poolProfile.update({
    where: { id: mirror.id },
    data: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      city: customer.city,
      country: customer.country,
      biodata: customer.biodata,
      photoUrl: customer.photoUrl,
      verifiedAt: customer.verifiedAt,
    },
  });
}

export function orderedClientPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
