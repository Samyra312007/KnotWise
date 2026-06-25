import { PrismaClient } from "@prisma/client";

export const integrationPrisma = new PrismaClient();

export async function isDatabaseAvailable() {
  try {
    await integrationPrisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectIntegrationDb() {
  await integrationPrisma.$disconnect();
}
