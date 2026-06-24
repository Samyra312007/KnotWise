import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { ClientSession } from "@/lib/auth/api";
import { hashToken } from "@/lib/auth/mobile";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createClientMobileToken(clientId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.clientMobileAuthToken.create({
    data: {
      clientId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function validateClientMobileToken(token: string): Promise<ClientSession | null> {
  const record = await prisma.clientMobileAuthToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { client: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;

  return {
    userType: "client",
    clientId: record.clientId,
    customerId: record.client.customerId,
    email: record.client.email,
  };
}

export async function revokeClientMobileToken(token: string) {
  await prisma.clientMobileAuthToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function issueClientMobileSession(clientId: string) {
  const account = await prisma.clientAccount.findUnique({
    where: { id: clientId },
    include: { customer: true },
  });
  if (!account) return null;

  const token = await createClientMobileToken(clientId);
  const needsOnboarding = !account.onboardingCompletedAt;

  return {
    token,
    needsOnboarding,
    client: {
      clientId: account.id,
      customerId: account.customerId,
      email: account.email,
      firstName: account.customer.firstName,
      stage: account.customer.stage,
    },
  };
}
