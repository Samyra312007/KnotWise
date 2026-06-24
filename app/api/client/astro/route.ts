import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
import { upsertAstroProfile, getAstroProfile } from "@/lib/astro/profiles";

const schema = z.object({
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  birthPlace: z.string().min(2).max(120),
  consent: z.literal(true),
});

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const profile = await getAstroProfile("customer", session.customerId);
  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  const biodata = customer ? parseCustomerBiodata(customer) : null;

  return NextResponse.json({
    hasProfile: !!profile?.kundliJson,
    birthTime: profile?.birthTime ?? biodata?.birthTime ?? null,
    birthPlace: profile?.birthPlace ?? biodata?.birthPlace ?? null,
    consentAt: profile?.consentAt?.toISOString() ?? null,
    fetchedAt: profile?.fetchedAt?.toISOString() ?? null,
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid astro details." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const biodata = parseCustomerBiodata(customer);
  biodata.birthTime = parsed.birthTime;
  biodata.birthPlace = parsed.birthPlace;
  biodata.kundliConsent = true;

  try {
    const astro = await upsertAstroProfile({
      entityType: "customer",
      entityId: session.customerId,
      birthTime: parsed.birthTime,
      birthPlace: parsed.birthPlace,
      consent: parsed.consent,
      biodata,
    });

    await prisma.customer.update({
      where: { id: session.customerId },
      data: { biodata: JSON.stringify(biodata) },
    });

    return NextResponse.json({
      ok: true,
      fetchedAt: astro.fetchedAt?.toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_CONFIGURED") {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Kundli service is not configured." } },
        { status: 503 }
      );
    }
    throw err;
  }
}
