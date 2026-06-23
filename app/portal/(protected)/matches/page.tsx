"use client";

import * as React from "react";
import Link from "next/link";
import type { IntroReveal } from "@/lib/matching/reveal";

type MatchItem = {
  id: string;
  status: string;
  revealLevel: "limited" | "full";
  score: number;
  bucket: string;
  mutualMatchId?: string;
  conversationId?: string;
  candidate: IntroReveal;
};

function statusLabel(status: string): string {
  switch (status) {
    case "sent":
      return "New intro";
    case "viewed":
      return "Awaiting your response";
    case "accepted":
      return "Interested — awaiting them";
    case "declined":
      return "Declined";
    case "mutual":
      return "Mutual match";
    default:
      return status;
  }
}

export default function PortalMatchesPage() {
  const [items, setItems] = React.useState<MatchItem[]>([]);

  React.useEffect(() => {
    fetch("/api/client/matches")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Introduced matches</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Contact details unlock only after you both accept.
      </p>
      <div className="mt-10 space-y-8">
        {items.length === 0 ? (
          <p className="text-ink-mute italic">No matches introduced yet.</p>
        ) : (
          items.map((m) => (
            <article key={m.id} className="border-t border-ink/12 pt-8">
              <div className="flex gap-4 items-start">
                {m.candidate.photoUrl ? (
                  <img
                    src={m.candidate.photoUrl}
                    alt=""
                    className="size-20 object-cover border border-ink/12 shrink-0"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display-tight text-[22px] text-ink">
                      {m.candidate.firstName}
                      {m.revealLevel === "full" && m.candidate.lastName ? ` ${m.candidate.lastName}` : ""}
                      {m.revealLevel === "limited" ? ", " + m.candidate.age : ""}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute shrink-0">
                      {statusLabel(m.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] text-ink-warm">
                    {m.candidate.city} · {m.bucket} compatibility
                  </p>
                  {m.candidate.bioHeadline ? (
                    <p className="mt-3 text-body-l italic text-ink-warm">{m.candidate.bioHeadline}</p>
                  ) : null}
                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/portal/matches/${m.id}`}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion"
                    >
                      View intro →
                    </Link>
                    {m.status === "mutual" && m.conversationId ? (
                      <Link
                        href={`/portal/chat/${m.conversationId}`}
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute"
                      >
                        Open chat
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
