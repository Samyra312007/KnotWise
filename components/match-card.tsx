"use client";

import * as React from "react";
import { format } from "date-fns";
import { CompatibilitySigil } from "@/components/ui/compatibility-sigil";
import { Button } from "@/components/ui/button";
import { ageFromDOB, type ScoredCandidate } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const DIMENSION_LABEL: Record<string, string> = {
  religion: "Religion",
  motherTongue: "Mother tongue",
  caste: "Community",
  diet: "Diet",
  wantKids: "Want kids",
  relocate: "City",
  pets: "Pets",
  education: "Education",
  incomeBracket: "Income",
  ageDelta: "Age",
  heightDelta: "Height",
  manglik: "Manglik",
};

const WEIGHT_MALE: Record<string, number> = {
  wantKids: 18, religion: 14, motherTongue: 12, ageDelta: 10, heightDelta: 8,
  incomeBracket: 8, diet: 8, caste: 7, relocate: 5, education: 4, pets: 3, manglik: 3,
};
const WEIGHT_FEMALE: Record<string, number> = {
  wantKids: 16, religion: 14, motherTongue: 12, education: 12, incomeBracket: 10,
  ageDelta: 9, relocate: 8, diet: 6, caste: 5, heightDelta: 4, pets: 2, manglik: 2,
};

export interface MatchCardProps {
  match: ScoredCandidate;
  clientGender: "male" | "female";
  onSend: (m: ScoredCandidate) => void;
  onViewProfile: (m: ScoredCandidate) => void;
  index?: number;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function MatchCard({
  match,
  clientGender,
  onSend,
  onViewProfile,
  index = 0,
  selectable,
  selected,
  onToggleSelect,
}: MatchCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const weights = clientGender === "male" ? WEIGHT_MALE : WEIGHT_FEMALE;
  const age = ageFromDOB(match.candidate.dateOfBirth);

  return (
    <article
      className="grid grid-cols-1 md:grid-cols-[120px_1fr_180px] gap-6 md:gap-10 py-8 border-t border-ink/12 anim-reveal"
      style={{ animationDelay: `${Math.min(index, 11) * 80}ms` }}
    >
      <div>
        {match.candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.candidate.photoUrl}
            alt=""
            className="w-full max-w-[120px] aspect-[3/4] object-cover border-r border-ink/24"
          />
        ) : (
          <div className="w-full max-w-[120px] aspect-[3/4] bg-paper-quiet border-r border-ink/24" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-display-tight text-[22px] tracking-[-0.01em] text-ink leading-snug">
          {match.candidate.firstName} {match.candidate.lastName}
          <span className="text-ink-mute text-[14px] font-sans font-normal ml-3">
            <span className="font-mono tabular-nums">{age}</span>
            <span aria-hidden className="mx-2">—</span>
            {match.candidate.city}
            <span aria-hidden className="mx-2">—</span>
            {match.candidate.designation} at {match.candidate.currentCompany}
          </span>
        </h3>

        <p className="mt-3 text-body-l italic text-ink-warm leading-relaxed line-clamp-2">
          {match.explanation}
        </p>
        {match.modelAdjusted && (
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-indigo">
            Rank adjusted by learnings
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion cursor-pointer"
        >
          {expanded ? "Hide breakdown" : "Why this score?"}
        </button>

        {expanded && (
          <div className="mt-4 grid grid-cols-[1fr_60px_60px_60px] gap-x-4 gap-y-1.5 text-[13px] anim-reveal-quiet">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Dimension</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute text-right">Weight</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute text-right">Score</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute text-right">Contribution</div>
            {Object.entries(match.breakdown)
              .sort((a, b) => (b[1] * (weights[b[0]] ?? 0)) - (a[1] * (weights[a[0]] ?? 0)))
              .map(([dim, sub]) => {
                const w = weights[dim] ?? 0;
                const contrib = sub * w;
                return (
                  <React.Fragment key={dim}>
                    <div className="text-ink">{DIMENSION_LABEL[dim] ?? dim}</div>
                    <div className="font-mono tabular-nums text-ink-mute text-right">{w}</div>
                    <div className="font-mono tabular-nums text-ink-mute text-right">{sub.toFixed(2)}</div>
                    <div className="font-mono tabular-nums text-ink text-right">{contrib.toFixed(1)}</div>
                  </React.Fragment>
                );
              })}
          </div>
        )}
      </div>

      <div className="flex flex-row md:flex-col items-center md:items-end gap-6">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(match.candidate.id)}
            className="size-4 accent-vermilion"
            aria-label={`Select ${match.candidate.firstName}`}
          />
        )}
        <CompatibilitySigil score={match.score} size="lg" />
        <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[150px]">
          {match.alreadySent ? (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute text-center md:text-right">
                Already sent
                {match.sentAt ? ` — ${format(new Date(match.sentAt), "d MMM")}` : ""}
              </div>
              <Button variant="quiet" size="compact" onClick={() => onSend(match)}>
                Re-open email
              </Button>
            </>
          ) : (
            <>
              <Button variant="quiet" size="compact" onClick={() => onViewProfile(match)}>
                View profile
              </Button>
              <Button variant="accent" size="compact" onClick={() => onSend(match)}>
                Send match
              </Button>
            </>
          )}
          <div className="font-mono tabular-nums text-[11px] text-ink-mute text-center md:text-right">
            ₹ {formatINR(match.candidate.annualIncomeINR)} / yr
          </div>
        </div>
      </div>
    </article>
  );
}
