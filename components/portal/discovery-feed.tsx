"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { Textarea } from "@/components/ui/textarea";

type DiscoverItem = {
  poolProfileId: string;
  score: number;
  bucket: string;
  verified: boolean;
  interestStatus: string | null;
  candidate: {
    firstName: string;
    age: number;
    city: string;
    photoUrl?: string;
    bioHeadline?: string;
    bucket: string;
  };
};

export function DiscoveryFeedPanel() {
  const [items, setItems] = React.useState<DiscoverItem[]>([]);
  const [cities, setCities] = React.useState<string[]>([]);
  const [religions, setReligions] = React.useState<string[]>([]);
  const [city, setCity] = React.useState("");
  const [religion, setReligionsFilter] = React.useState("");
  const [ageMin, setAgeMin] = React.useState("");
  const [ageMax, setAgeMax] = React.useState("");
  const [q, setQ] = React.useState("");
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [noteFor, setNoteFor] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const load = React.useCallback(
    (append = false) => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (religion) params.set("religion", religion);
      if (ageMin) params.set("ageMin", ageMin);
      if (ageMax) params.set("ageMax", ageMax);
      if (q.trim()) params.set("q", q.trim());
      if (append && cursor) params.set("cursor", cursor);

      return fetch(`/api/client/discover?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error.message);
          setCities(data.filters?.cities ?? []);
          setReligions(data.filters?.religions ?? []);
          setItems((prev) => (append ? [...prev, ...(data.items ?? [])] : data.items ?? []));
          setNextCursor(data.nextCursor);
          setCursor(data.nextCursor ?? null);
        });
    },
    [ageMax, ageMin, city, cursor, q, religion]
  );

  React.useEffect(() => {
    setCursor(null);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (religion) params.set("religion", religion);
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/client/discover?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error.message);
        setCities(data.filters?.cities ?? []);
        setReligions(data.filters?.religions ?? []);
        setItems(data.items ?? []);
        setNextCursor(data.nextCursor);
        setCursor(data.nextCursor ?? null);
      })
      .catch(() => toast.error("Discovery unavailable."));
  }, [city, religion, ageMin, ageMax, q]);

  async function expressInterest(poolProfileId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/client/discover/${poolProfileId}/interest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not express interest.");
        return;
      }
      toast.success("Your matchmaker has been notified of your interest.");
      setNoteFor(null);
      setNote("");
      setItems((prev) =>
        prev.map((item) =>
          item.poolProfileId === poolProfileId ? { ...item, interestStatus: "pending" } : item
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select value={city} onChange={(e) => setCity(e.target.value)} className="border border-ink/12 bg-white px-3 py-2 text-[14px]">
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={religion}
          onChange={(e) => setReligionsFilter(e.target.value)}
          className="border border-ink/12 bg-white px-3 py-2 text-[14px]"
        >
          <option value="">All religions</option>
          {religions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          value={ageMin}
          onChange={(e) => setAgeMin(e.target.value)}
          placeholder="Min age"
          className="border border-ink/12 bg-white px-3 py-2 text-[14px]"
        />
        <input
          value={ageMax}
          onChange={(e) => setAgeMax(e.target.value)}
          placeholder="Max age"
          className="border border-ink/12 bg-white px-3 py-2 text-[14px]"
        />
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, city, or keywords"
        className="mt-3 w-full border border-ink/12 bg-white px-3 py-2 text-[14px]"
      />

      <div className="mt-10 space-y-8">
        {items.length === 0 ? (
          <p className="text-ink-mute italic">No profiles match your filters.</p>
        ) : (
          items.map((item) => (
            <article key={item.poolProfileId} className="border-t border-ink/12 pt-8">
              <div className="flex gap-4">
                {item.candidate.photoUrl ? (
                  <RemoteImage src={item.candidate.photoUrl} alt="" width={80} height={80} className="size-20 object-cover border border-ink/12" />
                ) : null}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display-tight text-[22px] text-ink">
                      {item.candidate.firstName}, {item.candidate.age}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                      {item.bucket} · {item.score}
                      {item.verified ? " · verified" : ""}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] text-ink-warm">{item.candidate.city}</p>
                  {item.candidate.bioHeadline ? (
                    <p className="mt-3 text-[14px] italic text-ink-warm">{item.candidate.bioHeadline}</p>
                  ) : null}
                  <p className="mt-3 text-[13px] text-ink-mute">
                    Your matchmaker will be notified if you express interest. Contact details stay hidden until a formal
                    intro.
                  </p>
                  {item.interestStatus ? (
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
                      Interest {item.interestStatus}
                    </p>
                  ) : noteFor === item.poolProfileId ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note to your matchmaker"
                        className="min-h-[72px]"
                      />
                      <div className="flex gap-2">
                        <Button variant="accent" size="compact" disabled={busy} onClick={() => expressInterest(item.poolProfileId)}>
                          Send interest
                        </Button>
                        <Button variant="quiet" size="compact" onClick={() => setNoteFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="accent"
                      size="compact"
                      className="mt-4"
                      onClick={() => {
                        setNoteFor(item.poolProfileId);
                        setNote("");
                      }}
                    >
                      Interested
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {nextCursor ? (
        <Button
          variant="quiet"
          className="mt-10"
          onClick={() => load(true).catch(() => toast.error("Could not load more."))}
        >
          Load more
        </Button>
      ) : null}
    </div>
  );
}
