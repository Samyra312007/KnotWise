import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { expressDiscoveryInterest } from "@/lib/discovery/interest";

const bodySchema = z.object({
  note: z.string().max(500).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ poolProfileId: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { poolProfileId } = await ctx.params;

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid note." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const interest = await expressDiscoveryInterest({
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      poolProfileId,
      note: parsed.note,
    });

    return NextResponse.json({
      ok: true,
      interest: {
        id: interest.id,
        poolProfileId: interest.poolProfileId,
        status: interest.status,
        createdAt: interest.createdAt.toISOString(),
      },
    });
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (err.message === "DISABLED") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Discovery is not enabled for your bureau." } },
        { status: 403 }
      );
    }
    if (err.message === "PREMIUM_REQUIRED") {
      return NextResponse.json(
        { error: { code: "PREMIUM_REQUIRED", message: "Discovery requires a Premium plan." } },
        { status: 403 }
      );
    }
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Profile not found." } }, { status: 404 });
    }
    if (err.message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: { code: "RATE_LIMIT", message: "Daily interest limit reached. Try again tomorrow." } },
        { status: 429 }
      );
    }
    if (err.message === "ALREADY_INTRODUCED") {
      return NextResponse.json(
        { error: { code: "ALREADY_INTRODUCED", message: "This profile was already introduced to you." } },
        { status: 409 }
      );
    }
    if (err.message === "SELF") {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid profile." } }, { status: 400 });
    }
    throw err;
  }
}
