"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScheduleItem = {
  id: string;
  mutualMatchId: string;
  mine: boolean;
  startsAt: string;
  endsAt: string;
  mode: string;
  title: string;
  location: string | null;
  status: string;
  videoLink: string | null;
  counterpart: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
};

function modeLabel(mode: string) {
  if (mode === "video") return "Video call";
  if (mode === "phone") return "Phone call";
  return "In person";
}

function statusLabel(status: string) {
  if (status === "proposed") return "Awaiting response";
  if (status === "accepted") return "Confirmed";
  if (status === "declined") return "Declined";
  return "Cancelled";
}

export function SchedulePanel({
  mutualMatchId,
  compact = false,
}: {
  mutualMatchId?: string;
  compact?: boolean;
}) {
  const [items, setItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [startsAt, setStartsAt] = React.useState("");
  const [mode, setMode] = React.useState<"video" | "phone" | "in_person">("video");
  const [location, setLocation] = React.useState("");
  const [title, setTitle] = React.useState("");

  const load = React.useCallback(() => {
    const qs = mutualMatchId ? `?mutualMatchId=${encodeURIComponent(mutualMatchId)}` : "";
    return fetch(`/api/client/schedules${qs}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [mutualMatchId]);

  React.useEffect(() => {
    load().catch(() => toast.error("Could not load schedules."));
  }, [load]);

  async function propose(e: React.FormEvent) {
    e.preventDefault();
    if (!mutualMatchId || !startsAt) return;
    if (mode === "in_person" && !location.trim()) {
      toast.error("Add a location for in-person meetings.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/client/schedules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mutualMatchId,
          startsAt: new Date(startsAt).toISOString(),
          mode,
          title: title.trim() || undefined,
          location: mode === "in_person" ? location.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not propose date.");
        return;
      }
      toast.success("Date proposal sent.");
      setShowForm(false);
      setStartsAt("");
      setLocation("");
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline" | "cancel") {
    setBusy(true);
    try {
      const res = await fetch(`/api/client/schedules/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not update.");
        return;
      }
      toast.success(action === "accept" ? "Date confirmed." : action === "decline" ? "Proposal declined." : "Date cancelled.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const upcoming = items.filter((i) => i.status === "proposed" || i.status === "accepted");

  return (
    <div className={compact ? "mt-8 border-t border-ink/12 pt-6" : ""}>
      {!compact ? (
        <>
          <h1 className="font-display text-display-m text-ink">Dates & video calls</h1>
          <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
            Propose a meet, phone call, or video date with a mutual match. Reminders go out one hour before confirmed
            events.
          </p>
        </>
      ) : (
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Schedule</h2>
      )}

      {loading ? (
        <p className="mt-4 text-ink-mute italic text-[14px]">Loading…</p>
      ) : upcoming.length === 0 ? (
        <p className="mt-4 text-ink-mute italic text-[14px]">No upcoming dates yet.</p>
      ) : (
        <ul className={`space-y-4 ${compact ? "mt-4" : "mt-8"}`}>
          {upcoming.map((item) => (
            <li key={item.id} className="border border-ink/12 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display-tight text-[18px] text-ink">{item.title}</p>
                  <p className="mt-1 text-[14px] text-ink-warm">
                    with {item.counterpart.firstName} {item.counterpart.lastName}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                    {format(new Date(item.startsAt), "EEE d MMM · HH:mm")} · {modeLabel(item.mode)} ·{" "}
                    {statusLabel(item.status)}
                  </p>
                  {item.location ? <p className="mt-1 text-[13px] text-ink-mute">{item.location}</p> : null}
                </div>
              </div>

              {item.status === "accepted" && item.videoLink ? (
                <a
                  href={item.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion"
                >
                  Join video call →
                </a>
              ) : null}

              {item.status === "accepted" ? (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/client/schedules/${item.id}/ics`}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion"
                  >
                    Add to calendar
                  </a>
                  <Button variant="quiet" size="compact" disabled={busy} onClick={() => respond(item.id, "cancel")}>
                    Cancel
                  </Button>
                </div>
              ) : null}

              {item.status === "proposed" && !item.mine ? (
                <div className="flex gap-2">
                  <Button variant="accent" size="compact" disabled={busy} onClick={() => respond(item.id, "accept")}>
                    Accept
                  </Button>
                  <Button variant="quiet" size="compact" disabled={busy} onClick={() => respond(item.id, "decline")}>
                    Decline
                  </Button>
                </div>
              ) : null}

              {item.status === "proposed" && item.mine ? (
                <Button variant="quiet" size="compact" disabled={busy} onClick={() => respond(item.id, "cancel")}>
                  Withdraw
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {mutualMatchId ? (
        <div className={compact ? "mt-4" : "mt-10"}>
          {!showForm ? (
            <Button variant="quiet" size="compact" onClick={() => setShowForm(true)}>
              Propose a date
            </Button>
          ) : (
            <form onSubmit={propose} className="max-w-md space-y-4 border border-ink/12 p-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">When</label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Type</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                  className="mt-2 w-full border border-ink/12 bg-paper px-3 py-2 text-[14px]"
                >
                  <option value="video">Video call</option>
                  <option value="phone">Phone call</option>
                  <option value="in_person">In person</option>
                </select>
              </div>
              {mode === "in_person" ? (
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Café, city"
                    required
                    className="mt-2"
                  />
                </div>
              ) : null}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Title (optional)</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="accent" disabled={busy}>
                  Send proposal
                </Button>
                <Button type="button" variant="quiet" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
