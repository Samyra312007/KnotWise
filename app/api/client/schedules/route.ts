import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession, notFound } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { listSchedulesForCustomer, proposeSchedule } from "@/lib/scheduling/events";

const proposeSchema = z.object({
  mutualMatchId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  mode: z.enum(["in_person", "video", "phone"]),
  title: z.string().max(120).optional(),
  location: z.string().max(200).optional(),
});

export async function GET(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const mutualMatchId = url.searchParams.get("mutualMatchId") ?? undefined;

  const items = await listSchedulesForCustomer(session.customerId, mutualMatchId);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = proposeSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid schedule details." } },
      { status: 400 }
    );
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { orgId: true },
    });
    if (!customer) return notFound();

    const event = await proposeSchedule({
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      mutualMatchId: parsed.mutualMatchId,
      startsAt: new Date(parsed.startsAt),
      endsAt: parsed.endsAt ? new Date(parsed.endsAt) : undefined,
      mode: parsed.mode,
      title: parsed.title,
      location: parsed.location,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed." } }, { status: 403 });
      }
      if (err.message === "INVALID_INPUT") {
        return NextResponse.json(
          { error: { code: "INVALID_INPUT", message: "Schedule at least one hour ahead; in-person needs a location." } },
          { status: 400 }
        );
      }
    }
    throw err;
  }
}
