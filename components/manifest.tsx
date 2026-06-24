"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNowStrict, format } from "date-fns";
import { Search } from "lucide-react";
import { StagePill } from "@/components/ui/stage-pill";
import { EmptyState } from "@/components/empty-state";
import type { CustomerListItem, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGE_FILTERS: Stage[] = ["Active", "Match Sent", "In Conversation", "Onboarding", "Paused"];

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-marigold/30 text-ink px-0.5 rounded-[1px]">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

function lastSeenLabel(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const oneDay = 24 * 3600 * 1000;
  if (diffMs < oneDay && new Date().toDateString() === date.toDateString()) return "today";
  if (diffMs < 7 * oneDay) return `${formatDistanceToNowStrict(date)} ago`;
  return format(date, "d MMM");
}

export function Manifest({ items }: { items: CustomerListItem[] }) {
  const [query, setQuery] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<Stage | null>(null);
  const [cityFilter, setCityFilter] = React.useState<string | "">("");

  const cities = React.useMemo(() => {
    return Array.from(new Set(items.map((i) => i.city))).sort();
  }, [items]);

  const filtered = items.filter((item) => {
    if (stageFilter && item.stage !== stageFilter) return false;
    if (cityFilter && item.city !== cityFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.firstName.toLowerCase().includes(q) ||
        item.lastName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isFiltered = !!query || !!stageFilter || !!cityFilter;

  return (
    <>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
        <div className="flex-1 min-w-0 max-w-[360px]">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-2 flex items-center gap-2">
            <Search size={14} className="opacity-60" />
            Search
          </label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="By name or city"
            className="h-11 w-full rounded-[2px] border border-ink/24 bg-paper-quiet px-[14px] py-3 text-[14px] text-ink placeholder:italic placeholder:text-ink-mute outline-none focus:border-ink/48 transition-[border-color] duration-[var(--duration-micro)]"
          />
        </div>

        <div className="hidden md:block w-px self-stretch bg-ink/12" />

        <div className="flex-1 min-w-0">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-2 block">
            Stage
          </label>
          <div className="flex flex-wrap gap-2">
            {STAGE_FILTERS.map((stage) => {
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(active ? null : stage)}
                  className={cn(
                    "h-7 px-3 rounded-full font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-[var(--duration-micro)] cursor-pointer",
                    active
                      ? "bg-ink text-paper"
                      : "border border-ink/24 text-ink-mute hover:border-ink/48 hover:text-ink-warm"
                  )}
                >
                  {stage}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:w-44">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-2 block">
            City
          </label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-11 w-full rounded-[2px] border border-ink/24 bg-paper-quiet px-[14px] text-[14px] text-ink outline-none focus:border-ink/48 transition-[border-color] duration-[var(--duration-micro)]"
          >
            <option value="">Any city</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStageFilter(null);
              setCityFilter("");
            }}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion cursor-pointer h-11 self-end"
          >
            Show all
          </button>
        )}
      </div>

      <div className="mt-8">
        {filtered.length === 0 ? (
          items.length === 0 ? (
            <EmptyState
              eyebrow="No customers assigned"
              title="Your bureau is quiet."
              body="Once ops assigns customers to you, they will appear here."
            />
          ) : (
            <EmptyState
              eyebrow="Nothing matches"
              title="No customers fit those filters."
              body="Try fewer constraints, or reset to show all."
            />
          )
        ) : (
          <>
            <div className="hairline-strong" />
            <div className="grid grid-cols-[1.6fr_56px_1.2fr_1fr_1.2fr_1fr] items-center gap-x-6 h-12 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
              <div>Name</div>
              <div>Age</div>
              <div>City</div>
              <div>Status</div>
              <div>Stage</div>
              <div className="text-right">Last seen</div>
            </div>

            <div role="table">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/customers/${item.id}`}
                  role="row"
                  className="grid grid-cols-[1.6fr_56px_1.2fr_1fr_1.2fr_1fr] items-center gap-x-6 h-16 px-1 border-t border-ink/12 hover:bg-paper-deep/60 transition-colors duration-[var(--duration-micro)] cursor-pointer"
                >
                  <div className="flex items-center gap-6 min-w-0">
                    <span className="min-w-0 truncate">
                      <span className="font-display-tight text-[22px] tracking-[-0.01em] text-ink">
                        {highlight(item.firstName, query)}
                      </span>{" "}
                      <span className="font-sans font-medium text-[15px] text-ink">
                        {highlight(item.lastName, query)}
                      </span>
                    </span>
                    {item.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="size-8 object-cover border border-ink/12"
                      />
                    )}
                  </div>
                  <div className="font-mono text-[14px] tabular-nums text-ink">{item.age}</div>
                  <div className="text-[14px] text-ink-warm truncate">
                    {highlight(item.city, query)}
                  </div>
                  <div className="text-[13px] text-ink-mute">{item.maritalStatus}</div>
                  <div>
                    <StagePill stage={item.stage} />
                  </div>
                  <div className="font-mono text-[12px] tabular-nums text-ink-mute text-right">
                    {lastSeenLabel(item.lastActivityAt)}
                  </div>
                </Link>
              ))}
              <div className="hairline" />
            </div>

            <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
              {isFiltered
                ? `Showing ${filtered.length} of ${items.length}`
                : `${items.length} ${items.length === 1 ? "customer" : "customers"}`}
            </div>
          </>
        )}
      </div>
    </>
  );
}
