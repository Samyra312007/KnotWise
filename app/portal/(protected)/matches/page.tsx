"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type MatchItem = {
  id: string;
  status: string;
  score: number;
  feedbackReason?: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    city: string;
    designation: string;
    currentCompany: string;
    photoUrl?: string;
    about?: string;
  };
};

export default function PortalMatchesPage() {
  const [items, setItems] = React.useState<MatchItem[]>([]);

  React.useEffect(() => {
    fetch("/api/client/matches")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  async function feedback(id: string, status: "accepted" | "declined") {
    const res = await fetch(`/api/client/matches/${id}/feedback`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not save feedback.");
      return;
    }
    toast.success(status === "accepted" ? "Marked as interested." : "Declined.");
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Introduced matches</h1>
      <div className="mt-10 space-y-10">
        {items.length === 0 ? (
          <p className="text-ink-mute italic">No matches introduced yet.</p>
        ) : (
          items.map((m) => (
            <article key={m.id} className="border-t border-ink/12 pt-8">
              <h2 className="font-display-tight text-[22px] text-ink">
                {m.candidate.firstName} {m.candidate.lastName}
              </h2>
              <p className="mt-2 text-[14px] text-ink-warm">
                {m.candidate.designation} at {m.candidate.currentCompany} — {m.candidate.city}
              </p>
              {m.candidate.about && (
                <p className="mt-4 text-body-l italic text-ink-warm">{m.candidate.about}</p>
              )}
              <div className="mt-6 flex gap-3">
                {m.status === "sent" ? (
                  <>
                    <Button variant="accent" size="compact" onClick={() => feedback(m.id, "accepted")}>
                      Interested
                    </Button>
                    <Button variant="quiet" size="compact" onClick={() => feedback(m.id, "declined")}>
                      Decline
                    </Button>
                  </>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                    {m.status}
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
