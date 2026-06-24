"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PortalAstroPage() {
  const [birthTime, setBirthTime] = React.useState("");
  const [birthPlace, setBirthPlace] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [status, setStatus] = React.useState<{ hasProfile: boolean; fetchedAt: string | null } | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/client/astro")
      .then((r) => r.json())
      .then((d) => {
        setStatus({ hasProfile: d.hasProfile, fetchedAt: d.fetchedAt });
        if (d.birthTime) setBirthTime(d.birthTime);
        if (d.birthPlace) setBirthPlace(d.birthPlace);
        if (d.consentAt) setConsent(true);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("Consent is required to share birth details for Kundli.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/client/astro", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ birthTime, birthPlace, consent: true }),
    });
    setBusy(false);
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error?.message ?? "Could not save.");
      return;
    }
    toast.success("Kundli profile saved.");
    setStatus({ hasProfile: true, fetchedAt: d.fetchedAt });
  }

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Kundli & birth details</h1>
      <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
        Optional horoscope matching when your bureau enables it. Birth time and place are sent to our astrology
        partner only with your consent.
      </p>

      {status?.hasProfile ? (
        <p className="mt-6 text-[14px] text-ink-warm">
          Kundli on file{status.fetchedAt ? ` · updated ${new Date(status.fetchedAt).toLocaleDateString()}` : ""}.
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-10 max-w-md space-y-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Birth time (24h)</label>
          <Input
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            placeholder="14:30"
            pattern="\d{2}:\d{2}"
            required
            className="mt-2"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Birth place</label>
          <Input
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="Chennai, Tamil Nadu"
            required
            className="mt-2"
          />
        </div>
        <label className="flex items-start gap-3 text-[14px] text-ink-warm cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-vermilion" />
          I consent to sharing my birth time and place with KnotWise&apos;s Kundli partner for match compatibility scoring.
        </label>
        <Button type="submit" loading={busy}>
          Save Kundli profile
        </Button>
      </form>
    </section>
  );
}
