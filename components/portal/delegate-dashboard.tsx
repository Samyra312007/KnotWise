"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import type { IntroReveal } from "@/lib/matching/reveal";

type MatchItem = {
  id: string;
  status: string;
  revealLevel: "limited" | "full";
  candidate: IntroReveal;
};

type DelegateInfo = {
  role: string;
  canApprove: boolean;
};

type ClientInfo = {
  firstName: string;
  stage: string;
  completeness: number;
};

function statusLabel(status: string): string {
  switch (status) {
    case "sent":
      return "New intro";
    case "viewed":
      return "Awaiting response";
    case "accepted":
      return "Interested";
    case "declined":
      return "Declined";
    case "mutual":
      return "Mutual match";
    default:
      return status;
  }
}

export default function DelegateDashboard() {
  const [delegate, setDelegate] = React.useState<DelegateInfo | null>(null);
  const [client, setClient] = React.useState<ClientInfo | null>(null);
  const [items, setItems] = React.useState<MatchItem[]>([]);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function reload() {
    fetch("/api/family/delegate/me")
      .then((r) => r.json())
      .then((d) => {
        setDelegate(d.delegate);
        setClient(d.client);
      });
    fetch("/api/family/delegate/matches")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  React.useEffect(() => {
    reload();
  }, []);

  async function feedback(id: string, decision: "accept" | "decline") {
    setBusyId(id);
    const res = await fetch(`/api/family/delegate/matches/${id}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error?.message ?? "Could not submit.");
      return;
    }
    toast.success(decision === "accept" ? "Marked interested." : "Declined.");
    reload();
  }

  if (!client || !delegate) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <section>
      <div className="border border-vermilion/30 bg-vermilion/5 px-4 py-3 mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">Delegate view</p>
        <p className="mt-1 text-[14px] text-ink">
          Viewing as {delegate.role} for <strong>{client.firstName}</strong>
        </p>
        <p className="mt-1 text-[13px] text-ink-mute">
          Stage: {client.stage} · Profile {client.completeness}% complete
        </p>
      </div>

      <h1 className="font-display text-display-m text-ink">Introduced matches</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Contact details stay hidden until mutual match and the client shares contact.
      </p>

      <div className="mt-10 space-y-8">
        {items.length === 0 ? (
          <p className="text-ink-mute italic">No matches introduced yet.</p>
        ) : (
          items.map((m) => (
            <article key={m.id} className="border-t border-ink/12 pt-8">
              <div className="flex gap-4 items-start">
                {m.candidate.photoUrl ? (
                  <RemoteImage
                    src={m.candidate.photoUrl}
                    alt=""
                    width={80}
                    height={80}
                    className="size-20 object-cover border border-ink/12 shrink-0"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display-tight text-[22px] text-ink">
                      {m.candidate.firstName}
                      {m.revealLevel === "full" && m.candidate.lastName ? ` ${m.candidate.lastName}` : ""}
                      {m.revealLevel === "limited" ? `, ${m.candidate.age}` : ""}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute shrink-0">
                      {statusLabel(m.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] text-ink-warm">
                    {m.candidate.city} · {m.candidate.bucket} compatibility
                  </p>
                  {m.candidate.bioHeadline ? (
                    <p className="mt-3 text-body-l italic text-ink-warm">{m.candidate.bioHeadline}</p>
                  ) : null}

                  {delegate.canApprove && (m.status === "sent" || m.status === "viewed") ? (
                    <div className="mt-6 flex gap-3">
                      <Button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => feedback(m.id, "accept")}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="quiet"
                        disabled={busyId === m.id}
                        onClick={() => feedback(m.id, "decline")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
