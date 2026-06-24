import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession, notFound } from "@/lib/auth/api";
import { getClientConsent, updateClientConsent } from "@/lib/compliance/consent";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const consent = await getClientConsent(session.clientId);
  if (!consent) return notFound();

  return NextResponse.json({
    tosAcceptedAt: consent.tosAcceptedAt?.toISOString() ?? null,
    privacyAcceptedAt: consent.privacyAcceptedAt?.toISOString() ?? null,
    marketingEmailOptIn: consent.marketingEmailOptIn,
    analyticsOptIn: consent.analyticsOptIn,
  });
}

const patchSchema = z.object({
  marketingEmailOptIn: z.boolean().optional(),
  analyticsOptIn: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid consent update." } }, { status: 400 });
  }

  const updated = await updateClientConsent(session.clientId, parsed);
  if (!updated) return notFound();

  return NextResponse.json({
    ok: true,
    marketingEmailOptIn: updated.marketingEmailOptIn,
    analyticsOptIn: updated.analyticsOptIn,
  });
}
