import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/mobile";
import {
  issueClientMobileSession,
  revokeClientMobileToken,
  validateClientMobileToken,
} from "@/lib/auth/client-mobile";

const exchangeSchema = z.object({
  magicToken: z.string().min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = exchangeSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide magicToken." } }, { status: 400 });
  }

  const record = await prisma.magicLinkToken.findFirst({
    where: {
      tokenHash: hashToken(parsed.magicToken),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { client: { include: { customer: true } } },
  });

  if (!record) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Link expired or already used." } },
      { status: 401 }
    );
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  await prisma.clientAccount.update({
    where: { id: record.clientId },
    data: { emailVerifiedAt: new Date(), lastLoginAt: new Date() },
  });

  const session = await issueClientMobileSession(record.clientId);
  if (!session) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Account not found." } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...session });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  const session = await validateClientMobileToken(auth.slice(7));
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid token." } }, { status: 401 });
  }

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: { customer: true },
  });
  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Account not found." } }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    needsOnboarding: !account.onboardingCompletedAt,
    client: {
      clientId: account.id,
      customerId: account.customerId,
      email: account.email,
      firstName: account.customer.firstName,
      stage: account.customer.stage,
    },
  });
}

export async function DELETE(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  await revokeClientMobileToken(auth.slice(7));
  return NextResponse.json({ ok: true });
}
