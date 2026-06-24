import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession, notFound } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { getScheduleForCustomer, respondToSchedule } from "@/lib/scheduling/events";

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const event = await getScheduleForCustomer(id, session.customerId);
  if (!event) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  let parsed;
  try {
    parsed = actionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid action." } }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { orgId: true },
    });
    if (!customer) return notFound();

    const event = await respondToSchedule({
      eventId: id,
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      action: parsed.action,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
      }
      if (err.message === "FORBIDDEN") {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed." } }, { status: 403 });
      }
      if (err.message === "INVALID_STATE") {
        return NextResponse.json({ error: { code: "INVALID_INPUT", message: "This event cannot be updated." } }, { status: 400 });
      }
      if (err.message === "NOT_CONFIGURED") {
        return NextResponse.json(
          { error: { code: "NOT_CONFIGURED", message: "Video service is not configured." } },
          { status: 503 }
        );
      }
      if (err.message === "VIDEO_CREATE_FAILED") {
        return NextResponse.json(
          { error: { code: "VIDEO_CREATE_FAILED", message: "Could not create video room." } },
          { status: 502 }
        );
      }
    }
    throw err;
  }
}
