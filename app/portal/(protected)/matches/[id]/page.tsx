"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IntroReveal } from "@/lib/matching/reveal";

type MatchDetail = {
  id: string;
  status: string;
  revealLevel: "limited" | "full";
  score: number;
  bucket: string;
  mutualMatchId?: string;
  candidate: IntroReveal;
};

function Field({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">{label}</dt>
      <dd className="text-[14px] text-ink mt-1">{value}</dd>
    </div>
  );
}

export default function PortalMatchDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mutualParam = searchParams.get("mutual");
  const [detail, setDetail] = React.useState<MatchDetail | null>(null);
  const [fullReveal, setFullReveal] = React.useState<IntroReveal | null>(null);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return fetch(`/api/client/matches/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error.message);
        setDetail(d);
      });
  }, [params.id]);

  React.useEffect(() => {
    load().catch(() => toast.error("Could not load intro."));
    fetch("/api/client/preference-signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ suggestionId: params.id, signalType: "open" }),
    }).catch(() => undefined);
  }, [load, params.id]);

  React.useEffect(() => {
    const mutualId = mutualParam ?? detail?.mutualMatchId;
    if (!mutualId) {
      setFullReveal(null);
      return;
    }
    fetch(`/api/client/mutual/${mutualId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.candidate) setFullReveal(d.candidate);
        if (d.conversationId) setConversationId(d.conversationId);
      })
      .catch(() => undefined);
  }, [mutualParam, detail?.mutualMatchId]);

  async function respond(decision: "accept" | "decline") {
    setBusy(true);
    try {
      const res = await fetch(`/api/client/matches/${params.id}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not save response.");
        return;
      }
      if (data.status === "mutual") {
        toast.success("It's a mutual match! Contact details unlocked.");
      } else if (data.status === "accepted") {
        toast.success("Marked as interested. We'll notify you when they respond.");
      } else {
        toast.success("Intro declined.");
      }
      await load();
      if (data.mutualMatchId) {
        const mutualRes = await fetch(`/api/client/mutual/${data.mutualMatchId}`);
        const mutualData = await mutualRes.json();
        if (mutualData.candidate) setFullReveal(mutualData.candidate);
        if (mutualData.conversationId) setConversationId(mutualData.conversationId);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <p className="text-ink-mute italic">Loading…</p>;

  const reveal = fullReveal ?? detail.candidate;
  const canRespond = detail.status === "sent" || detail.status === "viewed";
  const isMutual = detail.status === "mutual" || !!fullReveal;

  return (
    <section>
      <Link href="/portal/matches" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
        ← All intros
      </Link>

      <div className="mt-8 flex gap-6 items-start">
        {reveal.photoUrl ? (
          <img src={reveal.photoUrl} alt="" className="size-32 object-cover border border-ink/12 shrink-0" />
        ) : null}
        <div>
          <h1 className="font-display text-display-m text-ink">
            {reveal.firstName}
            {reveal.lastName ? ` ${reveal.lastName}` : ""}
          </h1>
          <p className="mt-2 text-[14px] text-ink-warm">
            {reveal.age} · {reveal.city} · {detail.bucket} match ({detail.score})
          </p>
          {!isMutual ? (
            <p className="mt-3 text-[13px] text-ink-mute">
              Limited preview — accept to signal interest. Contact details unlock on mutual match.
            </p>
          ) : (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-vermilion">
              Mutual match — full profile unlocked
            </p>
          )}
        </div>
      </div>

      {reveal.bioHeadline ? (
        <p className="mt-8 text-body-l italic text-ink-warm">{reveal.bioHeadline}</p>
      ) : null}

      {isMutual ? (
        <dl className="mt-10 grid grid-cols-2 gap-4">
          <Field label="Company" value={reveal.currentCompany} />
          <Field label="Role" value={reveal.designation} />
          <Field label="Education" value={reveal.educationLevel} />
          <Field label="Religion" value={reveal.religion} />
          <Field label="Community" value={reveal.caste} />
          <Field label="Gotra" value={reveal.gotra} />
          <Field label="Email" value={reveal.email} />
          <Field label="Phone" value={reveal.phone} />
        </dl>
      ) : (
        <dl className="mt-10 grid grid-cols-2 gap-4">
          <Field label="City" value={reveal.city} />
          <Field label="Country" value={reveal.country} />
        </dl>
      )}

      {isMutual && conversationId ? (
        <div className="mt-8">
          <Link
            href={`/portal/chat/${conversationId}`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion border border-vermilion/40 px-4 py-2 inline-block"
          >
            Open chat
          </Link>
        </div>
      ) : null}

      {canRespond ? (
        <div className="mt-12 border-t border-ink/12 pt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-4">
            Your response
          </h2>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional note to your matchmaker"
            className="min-h-[80px] mb-4"
          />
          <div className="flex gap-3">
            <Button variant="accent" size="compact" disabled={busy} onClick={() => respond("accept")}>
              Accept intro
            </Button>
            <Button variant="quiet" size="compact" disabled={busy} onClick={() => respond("decline")}>
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      {detail.status === "accepted" ? (
        <p className="mt-12 text-[14px] text-ink-mute italic">
          You accepted this intro. Waiting for the other person to respond.
        </p>
      ) : null}
    </section>
  );
}
