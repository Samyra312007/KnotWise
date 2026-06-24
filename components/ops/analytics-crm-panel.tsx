"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FunnelStep = {
  key: string;
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

type Dashboard = {
  periodDays: number;
  clientsByStage: Array<{ stage: string; count: number }>;
  introsSent: number;
  introsAccepted: number;
  mutualCount: number;
  acceptanceRate: number | null;
  mutualRate: number | null;
  avgHoursToMutual: number | null;
  recentEvents: Array<{ eventName: string; count: number }>;
};

type CrmLead = {
  id: string;
  stage: string;
  priority: string;
  notes: string | null;
  nextFollowUpAt: string | null;
  customer: {
    firstName: string;
    lastName: string;
    city: string;
    stage: string;
    email: string | null;
    onboardingCompleted: boolean;
  };
};

export function AnalyticsCrmPanel() {
  const [funnel, setFunnel] = React.useState<FunnelStep[]>([]);
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [leads, setLeads] = React.useState<CrmLead[]>([]);
  const [importCsv, setImportCsv] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return Promise.all([
      fetch("/api/ops/analytics/funnel").then((r) => r.json()),
      fetch("/api/ops/analytics/dashboard").then((r) => r.json()),
      fetch("/api/ops/crm/leads").then((r) => r.json()),
    ]).then(([funnelData, dashboardData, leadsData]) => {
      setFunnel(funnelData.steps ?? []);
      setDashboard(dashboardData);
      setLeads(leadsData.items ?? []);
    });
  }, []);

  React.useEffect(() => {
    load().catch(() => toast.error("Could not load analytics."));
  }, [load]);

  async function updateLead(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error("Could not update lead.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!importCsv.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ops/import/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv: importCsv }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Import failed.");
        return;
      }
      toast.success(`Imported ${data.imported} profiles (${data.skipped} skipped).`);
      setImportCsv("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-16 pb-20">
      <div>
        <Link href="/ops" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
          ← Ops queue
        </Link>
        <h1 className="mt-4 font-display text-display-m text-ink">Analytics & CRM</h1>
        <p className="mt-2 text-[14px] text-ink-mute max-w-2xl">
          Signup-to-engaged funnel, matchmaker performance, lead follow-ups, and CSV profile import/export.
        </p>
      </div>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Conversion funnel</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {funnel.map((step) => (
            <div key={step.key} className="border border-ink/12 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">{step.label}</p>
              <p className="mt-2 font-display-tight text-[28px] text-ink">{step.count}</p>
              {step.rateFromPrevious != null ? (
                <p className="mt-1 text-[12px] text-ink-warm">{step.rateFromPrevious}% of previous step</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {dashboard ? (
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            Matchmaker dashboard ({dashboard.periodDays}d)
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Intros sent" value={dashboard.introsSent} />
            <Metric label="Acceptance rate" value={dashboard.acceptanceRate != null ? `${dashboard.acceptanceRate}%` : "—"} />
            <Metric label="Mutual rate" value={dashboard.mutualRate != null ? `${dashboard.mutualRate}%` : "—"} />
            <Metric
              label="Avg hrs to mutual"
              value={dashboard.avgHoursToMutual != null ? String(dashboard.avgHoursToMutual) : "—"}
            />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.clientsByStage.map((row) => (
              <Metric key={row.stage} label={row.stage} value={row.count} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">CRM leads</h2>
          <a
            href="/api/ops/export/customers"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion hover:underline"
          >
            Export CSV
          </a>
        </div>
        <ul className="mt-6 space-y-3">
          {leads.length === 0 ? (
            <li className="text-[14px] text-ink-mute italic">No leads yet.</li>
          ) : (
            leads.map((lead) => (
              <li key={lead.id} className="border border-ink/12 p-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display-tight text-[18px] text-ink">
                    {lead.customer.firstName} {lead.customer.lastName}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-mute">
                    {lead.customer.city} · {lead.stage} · client {lead.customer.stage}
                    {lead.customer.email ? ` · ${lead.customer.email}` : ""}
                  </p>
                  {lead.notes ? <p className="mt-2 text-[13px] text-ink-warm">{lead.notes}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.stage === "lead" ? (
                    <Button
                      variant="quiet"
                      size="compact"
                      disabled={busy}
                      onClick={() => updateLead(lead.id, { stage: "qualified", markContacted: true })}
                    >
                      Mark qualified
                    </Button>
                  ) : null}
                  <Button
                    variant="quiet"
                    size="compact"
                    disabled={busy}
                    onClick={() => updateLead(lead.id, { markContacted: true })}
                  >
                    Log contact
                  </Button>
                  <Button
                    variant="quiet"
                    size="compact"
                    disabled={busy}
                    onClick={() => updateLead(lead.id, { stage: "lost" })}
                  >
                    Lost
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Import profiles (CSV)</h2>
        <p className="text-[13px] text-ink-mute">
          Header: firstName, lastName, gender, dateOfBirth, city, country, maritalStatus, email, phone, religion, caste,
          stage
        </p>
        <Textarea
          value={importCsv}
          onChange={(e) => setImportCsv(e.target.value)}
          className="min-h-[160px] font-mono text-[12px]"
          placeholder="firstName,lastName,gender,dateOfBirth,city..."
        />
        <Button variant="accent" disabled={busy || !importCsv.trim()} onClick={runImport}>
          Import CSV
        </Button>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-ink/12 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">{label}</p>
      <p className="mt-2 font-display-tight text-[24px] text-ink">{value}</p>
    </div>
  );
}
