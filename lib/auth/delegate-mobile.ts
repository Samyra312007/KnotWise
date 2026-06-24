import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/mobile";
import type { DelegateSession } from "@/lib/auth/api";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createDelegateMobileToken(delegateId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.delegateAuthToken.create({
    data: {
      delegateId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function validateDelegateMobileToken(token: string): Promise<DelegateSession | null> {
  const record = await prisma.delegateAuthToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      delegate: {
        include: { customer: true },
      },
    },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  if (record.delegate.status !== "accepted") return null;

  return {
    userType: "delegate",
    delegateId: record.delegateId,
    customerId: record.delegate.customerId,
    delegateRole: record.delegate.role,
    email: record.delegate.email,
  };
}

export async function issueDelegateMobileSession(delegateId: string) {
  const delegate = await prisma.familyDelegate.findFirst({
    where: { id: delegateId, status: "accepted" },
    include: { customer: true },
  });
  if (!delegate) return null;

  const token = await createDelegateMobileToken(delegateId);
  return {
    token,
    delegate: {
      delegateId: delegate.id,
      customerId: delegate.customerId,
      email: delegate.email,
      role: delegate.role,
      clientFirstName: delegate.customer.firstName,
      clientStage: delegate.customer.stage,
    },
  };
}
