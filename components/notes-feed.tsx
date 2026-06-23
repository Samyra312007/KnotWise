"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";

interface NoteItem {
  id: string;
  body: string;
  createdAt: string;
  matchmakerName: string;
}

interface SentItem {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  candidateName: string;
  deliveryStatus?: string;
  status?: string;
}

export function NotesFeed({
  customerId,
  matchmakerName,
}: {
  customerId: string;
  matchmakerName: string;
}) {
  const [notes, setNotes] = React.useState<NoteItem[] | null>(null);
  const [sent, setSent] = React.useState<SentItem[] | null>(null);
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [clock, setClock] = React.useState(() => new Date());
  const [viewingSent, setViewingSent] = React.useState<SentItem | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/customers/${customerId}/notes`).then((r) => r.json()),
      fetch(`/api/customers/${customerId}/sent`).then((r) => r.json()),
    ])
      .then(([n, s]) => {
        if (!alive) return;
        setNotes(n.notes ?? []);
        setSent(s.items ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setNotes([]);
        setSent([]);
      });
    return () => {
      alive = false;
    };
  }, [customerId]);

  async function submit() {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = await res.json();
      setNotes((prev) => [data.note, ...(prev ?? [])]);
      setBody("");
      toast.success("Entry added.");
    } catch {
      toast.error("Could not save note. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr] gap-12">
      <section>
        <div className="flex items-baseline justify-between gap-6 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            New entry
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            {format(clock, "d MMM, HH:mm")} — {matchmakerName}
          </div>
        </div>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write what was said, decided, or noticed."
          rows={4}
        />
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="hairline flex-1" />
          <Button
            onClick={submit}
            variant="primary"
            loading={submitting}
            disabled={!body.trim()}
          >
            Add note
          </Button>
        </div>
      </section>

      <section>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Entries — newest first
        </div>

        {notes === null ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[200px_1fr] gap-8 py-6 border-t border-ink/12">
                <div className="skeleton h-4 w-32" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            eyebrow="No entries yet"
            title="Nothing has been written down."
            body="Add the first entry after your next call."
          />
        ) : (
          <div>
            {notes.map((n) => (
              <div
                key={n.id}
                className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-8 py-6 border-t border-ink/12"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                  <div>{format(new Date(n.createdAt), "d MMM, HH:mm")}</div>
                  <div className="mt-1 normal-case tracking-normal text-[12px] text-ink-warm font-sans">
                    {n.matchmakerName}
                  </div>
                </div>
                <div className="text-body-l text-ink leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </div>
              </div>
            ))}
            <div className="hairline" />
          </div>
        )}
      </section>

      <section>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Matches sent
        </div>
        {sent === null ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        ) : sent.length === 0 ? (
          <div className="text-[14px] text-ink-mute py-4 border-t border-ink/12">
            No matches sent yet.
          </div>
        ) : (
          <div>
            {sent.map((s) => (
              <button
                key={s.id}
                onClick={() => setViewingSent(s)}
                className="w-full grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-8 py-6 border-t border-ink/12 text-left hover:bg-paper-deep/40 cursor-pointer transition-colors duration-[var(--duration-micro)]"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                  {format(new Date(s.sentAt), "d MMM, HH:mm")}
                </div>
                <div>
                  <div className="font-display-tight text-[18px] tracking-[-0.01em] text-ink leading-none">
                    {s.candidateName}
                  </div>
                  <div className="text-[13px] text-ink-warm mt-2 line-clamp-1">
                    {s.subject}
                  </div>
                  {s.deliveryStatus && (
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mt-1">
                      {s.deliveryStatus}
                      {s.status && s.status !== "sent" ? ` · ${s.status}` : ""}
                    </div>
                  )}
                </div>
              </button>
            ))}
            <div className="hairline" />
          </div>
        )}
      </section>

      {viewingSent && (
        <Dialog open onClose={() => setViewingSent(null)}>
          <DialogTitle>{viewingSent.subject}</DialogTitle>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            Sent {format(new Date(viewingSent.sentAt), "d MMM yyyy, HH:mm")} — to {viewingSent.candidateName}
          </div>
          <div className="mt-8 text-body-l text-ink whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
            {viewingSent.body}
          </div>
          <div className="mt-10 flex justify-start">
            <Button variant="quiet" onClick={() => setViewingSent(null)}>
              Close
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
