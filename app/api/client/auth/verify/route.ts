import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/mobile";
import { needsOnboarding, parseCustomerBiodata } from "@/lib/onboarding/status";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid token." } }, { status: 400 });
  }

  const record = await prisma.magicLinkToken.findFirst({
    where: { tokenHash: hashToken(parsed.token), usedAt: null, expiresAt: { gt: new Date() } },
    include: { client: { include: { customer: true } } },
  });

  if (!record) {
    return NextResponse.json({ error: { code: "INVALID_TOKEN", message: "Link expired or already used." } }, { status: 401 });
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  await prisma.clientAccount.update({
    where: { id: record.clientId },
    data: { emailVerifiedAt: new Date(), lastLoginAt: new Date() },
  });

  const session = await getClientSession();
  session.userType = "client";
  session.clientId = record.clientId;
  session.customerId = record.client.customerId;
  session.email = record.client.email;
  await session.save();

  const biodata = parseCustomerBiodata(record.client.customer);
  const redirect = needsOnboarding(record.client, biodata) ? "/portal/onboarding" : "/portal";

  return NextResponse.json({ ok: true, redirect });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Missing token." } }, { status: 400 });
  }
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
  );
}
