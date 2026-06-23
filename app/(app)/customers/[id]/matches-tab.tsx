"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { SendMatchModal } from "@/components/send-match-modal";
import { CandidateDrawer } from "@/components/candidate-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoredCandidate, Gender } from "@/lib/types";

type Bucket = "high" | "medium" | "all" | "shortlisted";

interface MatchesResponse {
  items: ScoredCandidate[];
  counts: { high: number; medium: number; all: number; shortlisted?: number };
  customer: { firstName: string; stage: string };
}

const BUCKET_LABELS: Record<Bucket, string> = {
  high: "High Potential",
  medium: "Worth Considering",
  all: "All",
  shortlisted: "Shortlisted",
};

export function MatchesTab({
  customerId,
  customerFirstName,
  clientGender = "male",
}: {
  customerId: string;
  customerFirstName: string;
  clientGender?: Gender;
}) {
  const [bucket, setBucket] = React.useState<Bucket>("high");
  const [data, setData] = React.useState<MatchesResponse | null>(null);
  const [error, setError] = React.useState(false);
  const [sending, setSending] = React.useState<ScoredCandidate | null>(null);
  const [viewProfile, setViewProfile] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [shortlisting, setShortlisting] = React.useState(false);

  const fetchMatches = React.useCallback(
    async (b: Bucket) => {
      setData(null);
      setError(false);
      try {
        const view = b === "shortlisted" ? "&view=shortlisted" : "";
        const bucketParam = b === "shortlisted" ? "high" : b;
        const res = await fetch(
          `/api/customers/${customerId}/matches?bucket=${bucketParam}&limit=12${view}`
        );
        if (!res.ok) throw new Error("load_failed");
        const json: MatchesResponse = await res.json();
        setData(json);
      } catch {
        setError(true);
      }
    },
    [customerId]
  );

  React.useEffect(() => {
    fetchMatches(bucket);
  }, [bucket, fetchMatches]);

  function markSent(sentAt: string, candidateId: string) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.candidate.id === candidateId
                ? { ...it, alreadySent: true, sentAt }
                : it
            ),
          }
        : prev
    );
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkShortlist(limit?: number, ids?: string[]) {
    setShortlisting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/shortlist/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bucket: bucket === "shortlisted" ? "high" : bucket,
          limit: limit ?? 5,
          candidateIds: ids,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Shortlist saved.");
      setSelected(new Set());
      if (bucket === "shortlisted") fetchMatches("shortlisted");
    } catch {
      toast.error("Could not shortlist.");
    } finally {
      setShortlisting(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6 flex-wrap">
        <div className="flex items-baseline gap-8 border-b border-ink/12 flex-1 flex-wrap">
          {(["high", "medium", "all", "shortlisted"] as Bucket[]).map((b) => {
            const active = bucket === b;
            return (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className={cn(
                  "relative pb-3 font-mono text-[11px] uppercase tracking-[0.18em] cursor-pointer",
                  active ? "text-ink" : "text-ink-mute hover:text-ink-warm"
                )}
              >
                {BUCKET_LABELS[b]}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -bottom-px left-[-8px] right-[-8px] h-[2px] bg-vermilion",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="quiet"
            size="compact"
            loading={shortlisting}
            onClick={() => bulkShortlist(5)}
          >
            Shortlist top 5
          </Button>
          {selected.size > 0 && (
            <Button
              variant="accent"
              size="compact"
              loading={shortlisting}
              onClick={() => bulkShortlist(undefined, Array.from(selected))}
            >
              Shortlist selected ({selected.size})
            </Button>
          )}
        </div>
        {data && (
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute w-full md:w-auto">
            {data.items.length} shown
            {bucket !== "shortlisted" && data.counts[bucket] !== undefined
              ? ` of ${data.counts[bucket]}`
              : ""}
          </div>
        )}
      </div>

      <div className="mt-8">
        {error ? (
          <EmptyState
            eyebrow="Could not load"
            title="The matches did not load."
            body="Try again in a moment."
          />
        ) : !data ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[120px_1fr_180px] gap-10 py-8 border-t border-ink/12"
              >
                <div className="skeleton w-full max-w-[120px] aspect-[3/4]" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="skeleton size-24 rounded-full" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          bucket === "high" ? (
            <EmptyState
              eyebrow="No high potential matches today"
              title={`Nobody crosses 75 for ${customerFirstName} right now.`}
              body="Try Worth Considering or All for a wider view."
            />
          ) : (
            <EmptyState
              eyebrow="No candidates"
              title={`No candidates fit ${BUCKET_LABELS[bucket].toLowerCase()}.`}
            />
          )
        ) : (
          <div>
            {data.items.map((match, i) => (
              <MatchCard
                key={match.candidate.id}
                match={match}
                clientGender={clientGender}
                onSend={(m) => setSending(m)}
                onViewProfile={(m) => setViewProfile(m.candidate.id)}
                index={i}
                selectable={bucket !== "shortlisted"}
                selected={selected.has(match.candidate.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
            <div className="hairline" />
          </div>
        )}
      </div>

      <SendMatchModal
        open={!!sending}
        onClose={() => setSending(null)}
        customerId={customerId}
        customerFirstName={customerFirstName}
        candidate={sending}
        onSent={markSent}
      />

      <CandidateDrawer
        candidateId={viewProfile}
        open={!!viewProfile}
        onClose={() => setViewProfile(null)}
      />
    </div>
  );
}
