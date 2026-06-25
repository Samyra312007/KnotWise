import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { magicLinkEmail } from "@/lib/email/templates";
import { emailDryRun } from "@/lib/email/resend";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { hashToken } from "@/lib/auth/token-hash";
import { portalUrl } from "@/lib/portal/url";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide a valid email." } }, { status: 400 });
  }

  const account = await prisma.clientAccount.findUnique({
    where: { email: parsed.email.toLowerCase() },
    include: { customer: { select: { firstName: true } } },
  });

  if (!account) {
    return NextResponse.json({ ok: true, message: "If that email is registered, a link is on its way." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.magicLinkToken.create({
    data: {
      clientId: account.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const link = portalUrl(`/verify?token=${token}`);
  const tpl = magicLinkEmail(link, account.customer.firstName);
  await enqueueMagicLinkEmail({ to: account.email, ...tpl });

  if (emailDryRun()) {
    console.log(`[email] Magic link for ${account.email}: ${link}`);
  }

  return NextResponse.json({ ok: true, message: "If that email is registered, a link is on its way." });
}
