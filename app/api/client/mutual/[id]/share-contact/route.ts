import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession, notFound } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { shareContactWithConsent } from "@/lib/compliance/contact-share";

const schema = z.object({
  consent: z.literal(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Consent is required to share contact details." } },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) return notFound();

  try {
    const result = await shareContactWithConsent({
      mutualMatchId: id,
      customerId: session.customerId,
      clientId: session.clientId,
      orgId: customer.orgId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
      }
      if (err.message === "ALREADY_SHARED") {
        return NextResponse.json({ error: { code: "INVALID_STATE", message: "Contact already shared." } }, { status: 400 });
      }
    }
    throw err;
  }
}
