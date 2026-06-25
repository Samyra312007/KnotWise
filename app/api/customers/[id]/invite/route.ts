import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canWriteCustomer } from "@/lib/access/customers";
import { magicLinkEmail } from "@/lib/email/templates";
import { emailDryRun } from "@/lib/email/resend";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { hashToken } from "@/lib/auth/token-hash";
import { canWriteCustomers } from "@/lib/auth/roles";
import { portalUrl } from "@/lib/portal/url";
import type { Biodata } from "@/lib/types";

const schema = z.object({ email: z.string().email().optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();
  const { id } = await ctx.params;

  const canWrite = await canWriteCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!canWrite) return notFound("Not found.");

  const customer = await prisma.customer.findFirst({ where: { id, orgId: session.orgId } });
  if (!customer) return notFound("Not found.");

  let body: { email?: string } = {};
  try {
    body = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid email." } }, { status: 400 });
  }

  const biodata = JSON.parse(customer.biodata) as Biodata;
  const email = (body.email ?? biodata.email).toLowerCase();

  const account = await prisma.clientAccount.upsert({
    where: { customerId: id },
    create: { customerId: id, email },
    update: { email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.magicLinkToken.create({
    data: {
      clientId: account.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const link = portalUrl(`/verify?token=${token}`);
  const tpl = magicLinkEmail(link, biodata.firstName);
  await enqueueMagicLinkEmail({ to: email, ...tpl });

  if (emailDryRun()) {
    console.log(`[email] Portal invite for ${email}: ${link}`);
  }

  return NextResponse.json({ ok: true, email });
}
