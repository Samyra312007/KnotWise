"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [sub, setSub] = React.useState<{
    status: string;
    seatCount: number;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/billing/checkout")
      .then((r) => r.json())
      .then((d) => setSub(d.subscription));
  }, []);

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error?.message ?? "Billing unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function portal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error?.message ?? "Portal unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 max-w-lg">
      <h1 className="font-display text-display-m text-ink">Billing</h1>
      {sub && (
        <dl className="mt-8 space-y-4 text-[14px]">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Status</dt>
            <dd>{sub.status}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Seats</dt>
            <dd>{sub.seatCount}</dd>
          </div>
        </dl>
      )}
      <div className="mt-10 flex gap-4">
        <Button variant="accent" onClick={checkout} loading={loading}>
          Subscribe
        </Button>
        <Button variant="quiet" onClick={portal} loading={loading}>
          Manage billing
        </Button>
      </div>
    </section>
  );
}
