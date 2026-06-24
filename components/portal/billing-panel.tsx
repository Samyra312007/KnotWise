"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PlanRow = {
  id: string;
  label: string;
  priceInr: number;
  discoveryAccess: boolean;
  extraIntroRequestsPerMonth: number;
  priorityVerification: boolean;
  profileBoost: boolean;
};

type BillingState = {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  gstin: string | null;
  introRequestsRemaining: number;
  introRequestsLimit: number;
  plans: PlanRow[];
};

type InvoiceRow = {
  id: string;
  amountInr: number;
  gstInr: number;
  status: string;
  issuedAt: string;
};

export default function PortalBillingPanel() {
  const params = useSearchParams();
  const [billing, setBilling] = React.useState<BillingState | null>(null);
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([]);
  const [gstin, setGstin] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [introNote, setIntroNote] = React.useState("");

  function reload() {
    fetch("/api/client/billing")
      .then((r) => r.json())
      .then((d) => {
        setBilling(d);
        if (d.gstin) setGstin(d.gstin);
      });
    fetch("/api/client/billing/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.items ?? []));
  }

  React.useEffect(() => {
    reload();
    if (params.get("upgraded")) {
      toast.success(`Upgraded to ${params.get("upgraded")}.`);
    }
  }, [params]);

  async function checkout(plan: "plus" | "premium") {
    setBusy(plan);
    const idempotencyKey = `${plan}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await fetch("/api/client/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, idempotencyKey, gstin: gstin || undefined }),
    });
    setBusy(null);
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error?.message ?? "Checkout failed.");
      return;
    }
    if (d.checkoutUrl) {
      if (d.dryRun) {
        window.location.href = d.checkoutUrl;
        return;
      }
      window.location.href = d.checkoutUrl;
      return;
    }
    reload();
    toast.success("Plan updated.");
  }

  async function cancelPlan() {
    const res = await fetch("/api/client/billing/cancel", { method: "POST" });
    if (!res.ok) {
      toast.error("Could not cancel plan.");
      return;
    }
    toast.success("Downgraded to Included.");
    reload();
  }

  async function requestIntro() {
    const res = await fetch("/api/client/intro-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: introNote }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error?.message ?? "Could not send request.");
      return;
    }
    toast.success("Intro request sent to your matchmaker.");
    setIntroNote("");
    reload();
  }

  if (!billing) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Premium plans</h1>
      <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
        Pay in INR via UPI or card. GST invoices are generated for each payment.
      </p>

      <div className="mt-8 border border-ink/12 px-4 py-3 text-[14px]">
        <p>
          Current plan: <strong className="capitalize">{billing.plan}</strong> ({billing.status})
        </p>
        {billing.currentPeriodEnd ? (
          <p className="mt-1 text-ink-mute">Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}</p>
        ) : null}
        {billing.introRequestsLimit > 0 ? (
          <p className="mt-1 text-ink-mute">
            Intro requests remaining this month: {billing.introRequestsRemaining} / {billing.introRequestsLimit}
          </p>
        ) : null}
      </div>

      <div className="mt-8 max-w-md">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">GSTIN (optional)</label>
        <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" className="mt-2" />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {billing.plans.map((plan) => (
          <article key={plan.id} className="border border-ink/12 p-5 flex flex-col">
            <h2 className="font-display-tight text-[20px]">{plan.label}</h2>
            <p className="mt-2 text-[22px] text-ink">
              {plan.priceInr === 0 ? "Free" : `₹${plan.priceInr}/mo`}
            </p>
            <ul className="mt-4 text-[13px] text-ink-warm space-y-2 flex-1">
              {plan.discoveryAccess ? <li>Discovery feed access</li> : null}
              {plan.extraIntroRequestsPerMonth > 0 ? (
                <li>{plan.extraIntroRequestsPerMonth} extra intro requests / month</li>
              ) : null}
              {plan.priorityVerification ? <li>Priority verification queue</li> : null}
              {plan.profileBoost ? <li>Profile boost in discovery</li> : null}
              {plan.priceInr === 0 ? <li>Included with bureau enrollment</li> : null}
            </ul>
            {plan.id !== "included" && billing.plan !== plan.id ? (
              <Button
                type="button"
                className="mt-6 w-full"
                variant={plan.id === "premium" ? "accent" : "primary"}
                loading={busy === plan.id}
                onClick={() => checkout(plan.id as "plus" | "premium")}
              >
                Choose {plan.label}
              </Button>
            ) : null}
            {billing.plan === plan.id && plan.id !== "included" ? (
              <Button type="button" variant="quiet" className="mt-6 w-full" onClick={() => void cancelPlan()}>
                Cancel plan
              </Button>
            ) : null}
          </article>
        ))}
      </div>

      {billing.introRequestsLimit > 0 ? (
        <div className="mt-12 border-t border-ink/12 pt-10">
          <h2 className="font-display-tight text-[20px] text-ink">Request an intro</h2>
          <p className="mt-2 text-[14px] text-ink-mute">Ask your matchmaker for another curated introduction.</p>
          <Input
            value={introNote}
            onChange={(e) => setIntroNote(e.target.value)}
            placeholder="Optional note for your matchmaker"
            className="mt-4 max-w-xl"
          />
          <Button type="button" className="mt-4" onClick={() => void requestIntro()}>
            Send request
          </Button>
        </div>
      ) : null}

      {invoices.length > 0 ? (
        <div className="mt-12 border-t border-ink/12 pt-10">
          <h2 className="font-display-tight text-[20px] text-ink">Invoices</h2>
          <ul className="mt-6 space-y-3">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex justify-between text-[14px] border border-ink/12 px-4 py-3">
                <span>
                  ₹{inv.amountInr} + ₹{inv.gstInr} GST · {inv.status}
                </span>
                <span className="text-ink-mute">{new Date(inv.issuedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
