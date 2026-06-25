import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createEmptyBiodata } from "@/lib/profile/biodata";
import { assignDefaultMatchmaker, resolveDefaultOrgId } from "@/lib/onboarding/assign";
import { magicLinkEmail } from "@/lib/email/templates";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { hashToken } from "@/lib/auth/token-hash";
import { logAuditEvent } from "@/lib/audit";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";
import { ensureCrmLead } from "@/lib/crm/leads";
import { recordSignupConsent } from "@/lib/compliance/consent";
import { validateSignupAge } from "@/lib/compliance/config";
import { portalUrl } from "@/lib/portal/url";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().min(1),
  acceptTos: z.literal(true),
  acceptPrivacy: z.literal(true),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Check all fields and try again." } },
      { status: 400 }
    );
  }

  const email = parsed.email.toLowerCase();
  const dob = new Date(parsed.dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Enter a valid date of birth." } },
      { status: 400 }
    );
  }

  const ageError = validateSignupAge(dob);
  if (ageError) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: ageError } }, { status: 400 });
  }

  const existing = await prisma.clientAccount.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists. Sign in instead." } },
      { status: 409 }
    );
  }

  const orgId = await resolveDefaultOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Registration is not open yet." } },
      { status: 503 }
    );
  }

  const biodata = createEmptyBiodata({
    email,
    firstName: parsed.firstName.trim(),
    lastName: parsed.lastName.trim(),
    gender: parsed.gender,
    dateOfBirth: dob.toISOString(),
  });

  const customer = await prisma.customer.create({
    data: {
      orgId,
      firstName: biodata.firstName,
      lastName: biodata.lastName,
      gender: biodata.gender,
      dateOfBirth: dob,
      city: "—",
      country: biodata.country,
      maritalStatus: biodata.maritalStatus,
      stage: "Onboarding",
      biodata: JSON.stringify(biodata),
    },
  });

  await assignDefaultMatchmaker(orgId, customer.id);

  const account = await prisma.clientAccount.create({
    data: {
      customerId: customer.id,
      email,
      onboardingStep: 0,
      notifyEmail: parsed.marketingOptIn ?? false,
    },
  });

  await recordSignupConsent({
    clientId: account.id,
    marketingEmailOptIn: parsed.marketingOptIn ?? false,
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.magicLinkToken.create({
    data: {
      clientId: account.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const link = portalUrl(`/verify?token=${token}`);
  const tpl = magicLinkEmail(link, biodata.firstName);
  await enqueueMagicLinkEmail({ to: email, ...tpl });

  await logAuditEvent({
    orgId,
    actorId: account.id,
    actorType: "client",
    action: "client.signup",
    entityType: "customer",
    entityId: customer.id,
  });

  await ensureCrmLead({ orgId, customerId: customer.id, source: "signup" });
  trackAnalyticsEventAsync({
    orgId,
    eventName: ANALYTICS_EVENTS.SIGNUP_COMPLETED,
    customerId: customer.id,
  });

  return NextResponse.json({
    ok: true,
    message: "Check your email to verify and continue setting up your profile.",
  });
}
