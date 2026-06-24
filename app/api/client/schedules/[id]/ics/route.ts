import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { getScheduleForCustomer, resolveEndsAt } from "@/lib/scheduling/events";
import { buildIcsEvent } from "@/lib/scheduling/ics";
import { portalUrl } from "@/lib/push/deep-links";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const event = await getScheduleForCustomer(id, session.customerId);
  if (!event || event.status !== "accepted") {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const startsAt = new Date(event.startsAt);
  const endsAt = resolveEndsAt(startsAt, event.endsAt ? new Date(event.endsAt) : null);
  const ics = buildIcsEvent({
    uid: event.id,
    title: event.title,
    description: event.videoLink ? `Join video: ${event.videoLink}` : undefined,
    location: event.location ?? undefined,
    startsAt,
    endsAt,
    url: portalUrl(`/reminders/${event.id}`),
  });

  return new NextResponse(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="knotwise-${event.id}.ics"`,
    },
  });
}
