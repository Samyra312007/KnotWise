import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { mergeBiodata, customerUpdateFromBiodata } from "@/lib/profile/biodata";
import { finalizeOnboarding } from "@/lib/onboarding/complete";
import { onboardingProgress, parseCustomerBiodata } from "@/lib/onboarding/status";
import {
  CASTES_BY_RELIGION,
  DIETS,
  EDUCATION_LEVELS,
  FAMILY_TYPES,
  FREQUENCIES,
  GENDERS,
  MANGLIK,
  MARITAL_STATUSES,
  MOTHER_TONGUES,
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_LABELS,
  PROFILE_CITIES,
  RELIGIONS,
  TRINARY,
} from "@/lib/profile/options";
import { sanitizeBiodataForSave, validateOnboardingStep } from "@/lib/onboarding/validate";
import type { Biodata } from "@/lib/types";
import { isValidPhone } from "@/lib/profile/phone";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";
import { computeProfileCompleteness } from "@/lib/profile/completeness";

const patchSchema = z.object({
  step: z.number().int().min(0).max(ONBOARDING_STEP_COUNT - 1).optional(),
  biodata: z.record(z.unknown()).optional(),
  complete: z.boolean().optional(),
});

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: { customer: true },
  });
  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const biodata = parseCustomerBiodata(account.customer);
  const progress = onboardingProgress(account, biodata);

  return NextResponse.json({
    customerId: account.customerId,
    biodata,
    progress,
    options: {
      cities: PROFILE_CITIES,
      motherTongues: MOTHER_TONGUES,
      religions: RELIGIONS,
      castesByReligion: CASTES_BY_RELIGION,
      educationLevels: EDUCATION_LEVELS,
      diets: DIETS,
      maritalStatuses: MARITAL_STATUSES,
      frequencies: FREQUENCIES,
      trinary: TRINARY,
      genders: GENDERS,
      manglik: MANGLIK,
      familyTypes: FAMILY_TYPES,
      stepLabels: ONBOARDING_STEP_LABELS,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid update." } }, { status: 400 });
  }

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: { customer: true },
  });
  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  if (account.onboardingCompletedAt && !parsed.complete) {
    return NextResponse.json(
      { error: { code: "ALREADY_COMPLETE", message: "Onboarding is already complete." } },
      { status: 400 }
    );
  }

  let biodata = parseCustomerBiodata(account.customer);

  if (parsed.biodata) {
    biodata = mergeBiodata(biodata, parsed.biodata as Partial<Biodata>);
    biodata = sanitizeBiodataForSave(biodata);
    biodata.email = account.email;
  }

  const currentStep = account.onboardingStep;
  if (parsed.biodata && parsed.step !== undefined && parsed.step > currentStep) {
    const err = validateOnboardingStep(currentStep, biodata);
    if (err) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: err } }, { status: 400 });
    }
  }

  if (parsed.complete) {
    for (let s = 0; s < ONBOARDING_STEP_COUNT; s++) {
      const err = validateOnboardingStep(s, biodata);
      if (err) {
        return NextResponse.json({ error: { code: "INCOMPLETE", message: err } }, { status: 400 });
      }
    }
  }

  const step =
    parsed.step !== undefined
      ? Math.min(parsed.step, ONBOARDING_STEP_COUNT - 1)
      : account.onboardingStep;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: account.customerId },
      data: customerUpdateFromBiodata(biodata),
    }),
    prisma.clientAccount.update({
      where: { id: account.id },
      data: {
        onboardingStep: step,
        phone: isValidPhone(biodata.phone) ? biodata.phone : account.phone,
      },
    }),
  ]);

  if (parsed.step !== undefined && step > currentStep) {
    trackAnalyticsEventAsync({
      orgId: account.customer.orgId,
      eventName: ANALYTICS_EVENTS.ONBOARDING_STEP,
      customerId: account.customerId,
      properties: { step, completeness: computeProfileCompleteness(biodata) },
    });
  }

  if (parsed.complete) {
    const result = await finalizeOnboarding(account.id, biodata);
    if (!result.ok) {
      return NextResponse.json(
        { error: { code: "INCOMPLETE", message: result.reason } },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.clientAccount.findUnique({
    where: { id: account.id },
    include: { customer: true },
  });
  if (!updated) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const finalBiodata = parseCustomerBiodata(updated.customer);
  return NextResponse.json({
    ok: true,
    progress: onboardingProgress(updated, finalBiodata),
    biodata: finalBiodata,
  });
}
