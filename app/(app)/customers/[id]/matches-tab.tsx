"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { SendMatchModal } from "@/components/send-match-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoredCandidate, Gender } from "@/lib/types";

type Bucket = "high" | "medium" | "all";

interface MatchesResponse {
  items: ScoredCandidate[];
  counts: { high: number; medium: number; all: number };
  customer: { firstName: string; stage: string };
}

const BUCKET_LABELS: Record<Bucket, string> = {
  high: "High Potential",
  medium: "Worth Considering",
  all: "All",
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

  const fetchMatches = React.useCallback(
    async (b: Bucket) => {
      setData(null);
      setError(false);
      try {
        const res = await fetch(`/api/customers/${customerId}/matches?bucket=${b}&limit=12`);
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

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6 flex-wrap">
        <div className="flex items-baseline gap-8 border-b border-ink/12 flex-1">
          {(["high", "medium", "all"] as Bucket[]).map((b) => {
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
        {data && (
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            {data.items.length} of {data.counts[bucket]}{" "}
            {bucket === "high" ? "in high potential" : bucket === "medium" ? "worth considering" : "ranked"}
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
                index={i}
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
    </div>
  );
}
