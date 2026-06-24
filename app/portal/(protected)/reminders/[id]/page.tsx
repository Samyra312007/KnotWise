"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type EventDetail = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  location: string | null;
  status: string;
  videoLink: string | null;
  mine: boolean;
  counterpart: { firstName: string; lastName: string };
};

export default function PortalReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = React.useState<string | null>(null);
  const [event, setEvent] = React.useState<EventDetail | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    params.then(({ id }) => setEventId(id));
  }, [params]);

  React.useEffect(() => {
    if (!eventId) return;
    fetch(`/api/client/schedules/${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error.message);
        setEvent(d.event);
      })
      .catch(() => toast.error("Could not load event."));
  }, [eventId]);

  async function respond(action: "accept" | "decline" | "cancel") {
    if (!eventId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/client/schedules/${eventId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not update.");
        return;
      }
      setEvent(data.event);
      toast.success("Updated.");
    } finally {
      setBusy(false);
    }
  }

  if (!event) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <section>
      <Link href="/portal/schedule" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
        ← All dates
      </Link>
      <h1 className="mt-6 font-display text-display-m text-ink">{event.title}</h1>
      <p className="mt-2 text-[14px] text-ink-warm">
        with {event.counterpart.firstName} {event.counterpart.lastName}
      </p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
        {format(new Date(event.startsAt), "EEE d MMM yyyy · HH:mm")} · {event.status}
      </p>
      {event.location ? <p className="mt-2 text-[14px] text-ink-mute">{event.location}</p> : null}

      {event.status === "accepted" && event.videoLink ? (
        <a
          href={event.videoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion"
        >
          Join video call →
        </a>
      ) : null}

      {event.status === "accepted" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/api/client/schedules/${event.id}/ics`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion"
          >
            Add to calendar
          </a>
          <Button variant="quiet" size="compact" disabled={busy} onClick={() => respond("cancel")}>
            Cancel date
          </Button>
        </div>
      ) : null}

      {event.status === "proposed" && !event.mine ? (
        <div className="mt-8 flex gap-2">
          <Button variant="accent" disabled={busy} onClick={() => respond("accept")}>
            Accept
          </Button>
          <Button variant="quiet" disabled={busy} onClick={() => respond("decline")}>
            Decline
          </Button>
        </div>
      ) : null}

      {event.status === "proposed" && event.mine ? (
        <Button className="mt-8" variant="quiet" disabled={busy} onClick={() => respond("cancel")}>
          Withdraw proposal
        </Button>
      ) : null}
    </section>
  );
}
