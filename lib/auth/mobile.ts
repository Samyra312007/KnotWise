import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { MatchmakerSession } from "@/lib/auth/api";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMobileToken(matchmakerId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.mobileAuthToken.create({
    data: {
      matchmakerId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function validateMobileToken(token: string): Promise<MatchmakerSession | null> {
  const record = await prisma.mobileAuthToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      matchmaker: {
        include: { memberships: { take: 1 } },
      },
    },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  const membership = record.matchmaker.memberships[0];
  if (!membership) return null;
  return {
    userType: "matchmaker",
    matchmakerId: record.matchmakerId,
    orgId: membership.orgId,
    role: membership.role as MatchmakerSession["role"],
    fullName: record.matchmaker.fullName,
    username: record.matchmaker.username,
  };
}
