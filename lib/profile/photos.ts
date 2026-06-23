import { prisma } from "@/lib/db";
import { MAX_PROFILE_PHOTOS } from "@/lib/profile/fields";

export async function countCustomerPhotos(customerId: string): Promise<number> {
  return prisma.asset.count({
    where: { entityType: "customer", entityId: customerId, kind: "photo" },
  });
}

export async function listCustomerPhotos(customerId: string) {
  return prisma.asset.findMany({
    where: { entityType: "customer", entityId: customerId, kind: "photo" },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, createdAt: true },
  });
}

export async function canAddCustomerPhoto(customerId: string): Promise<boolean> {
  const count = await countCustomerPhotos(customerId);
  return count < MAX_PROFILE_PHOTOS;
}

export async function deleteCustomerPhoto(customerId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, entityType: "customer", entityId: customerId, kind: "photo" },
  });
  if (!asset) throw new Error("Photo not found.");

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { photoUrl: true, biodata: true },
  });
  if (!customer) throw new Error("Customer not found.");

  await prisma.asset.delete({ where: { id: assetId } });

  if (customer.photoUrl === asset.url) {
    const remaining = await listCustomerPhotos(customerId);
    const nextUrl = remaining[0]?.url ?? null;
    const biodata = JSON.parse(customer.biodata) as Record<string, unknown>;
    biodata.photoUrl = nextUrl ?? undefined;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        photoUrl: nextUrl,
        biodata: JSON.stringify(biodata),
      },
    });
  }

  return { deletedId: assetId };
}
