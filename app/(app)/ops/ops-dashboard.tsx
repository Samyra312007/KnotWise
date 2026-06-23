"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ProfileRevisionItem = {
  id: string;
  fieldPath: string;
  oldValue: unknown;
  newValue: unknown;
  customer: { id: string; firstName: string; lastName: string; city: string };
};

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

type ReportItem = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: { id: string; firstName: string; lastName: string; city: string };
};

export function OpsDashboard({ role }: { role: string }) {
  const [verification, setVerification] = React.useState<
    Array<{ id: string; entityType: string; entityId: string; status: string; submittedAt: string }>
  >([]);
  const [revisions, setRevisions] = React.useState<ProfileRevisionItem[]>([]);
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [ml, setMl] = React.useState<{ mlEnabled: boolean; bias: Array<{ religion: string; acceptanceRate: number; total: number }> } | null>(null);

  React.useEffect(() => {
    fetch("/api/verification?status=pending")
      .then((r) => r.json())
      .then((d) => setVerification(d.items ?? []));
    fetch("/api/profile-revisions?status=pending")
      .then((r) => r.json())
      .then((d) => setRevisions(d.items ?? []));
    fetch("/api/trust/reports?status=open")
      .then((r) => r.json())
      .then((d) => setReports(d.items ?? []));
    fetch("/api/ml")
      .then((r) => r.json())
      .then(setMl);
  }, []);

  async function reviewVerification(id: string, status: "verified" | "rejected") {
    const res = await fetch(`/api/verification/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Review failed.");
      return;
    }
    toast.success(status === "verified" ? "Verified." : "Rejected.");
    setVerification((prev) => prev.filter((v) => v.id !== id));
  }

  async function reviewRevision(id: string, decision: "approved" | "rejected") {
    const res = await fetch(`/api/profile-revisions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (!res.ok) {
      toast.error("Review failed.");
      return;
    }
    toast.success(decision === "approved" ? "Change approved." : "Change rejected.");
    setRevisions((prev) => prev.filter((r) => r.id !== id));
  }

  async function reviewReport(id: string, status: "resolved" | "dismissed") {
    const res = await fetch(`/api/trust/reports/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Review failed.");
      return;
    }
    toast.success(status === "resolved" ? "Report resolved." : "Report dismissed.");
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function tuneModel() {
    const res = await fetch("/api/ml", { method: "POST" });
    const data = await res.json();
    toast.success(data.trained ? "Model tuned." : "Skipped — need more feedback data.");
  }

  return (
    <section className="py-16">
      <h1 className="font-display text-display-m text-ink">Ops desk</h1>
      <p className="mt-2 text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">{role} view</p>

      <div className="mt-12">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Verification queue
        </h2>
        {verification.length === 0 ? (
          <p className="text-ink-mute italic">Queue empty.</p>
        ) : (
          <ul className="space-y-4">
            {verification.map((v) => (
              <li key={v.id} className="flex items-center justify-between border-t border-ink/12 pt-4">
                <div>
                  <div className="text-ink">{v.entityType.replace("_", " ")}</div>
                  <div className="font-mono text-[10px] text-ink-mute">{v.entityId}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="accent" size="compact" onClick={() => reviewVerification(v.id, "verified")}>
                    Approve
                  </Button>
                  <Button variant="quiet" size="compact" onClick={() => reviewVerification(v.id, "rejected")}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-16">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Profile change queue
        </h2>
        {revisions.length === 0 ? (
          <p className="text-ink-mute italic">No pending profile edits.</p>
        ) : (
          <ul className="space-y-4">
            {revisions.map((r) => (
              <li key={r.id} className="border-t border-ink/12 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-ink">
                      {r.customer.firstName} {r.customer.lastName} · {r.customer.city}
                    </div>
                    <div className="font-mono text-[10px] text-ink-mute mt-1">{r.fieldPath}</div>
                    <div className="mt-2 text-[13px] text-ink-warm">
                      {formatValue(r.oldValue)} → {formatValue(r.newValue)}
                    </div>
                    {r.fieldPath === "photoUrl" && typeof r.newValue === "string" ? (
                      <img src={r.newValue} alt="" className="mt-3 size-20 object-cover border border-ink/12" />
                    ) : null}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="accent" size="compact" onClick={() => reviewRevision(r.id, "approved")}>
                      Approve
                    </Button>
                    <Button variant="quiet" size="compact" onClick={() => reviewRevision(r.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-16">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Trust reports (48h SLA)
        </h2>
        {reports.length === 0 ? (
          <p className="text-ink-mute italic">No open reports.</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="border-t border-ink/12 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-ink">
                      {r.reporter.firstName} {r.reporter.lastName} · {r.reporter.city}
                    </div>
                    <div className="font-mono text-[10px] text-ink-mute mt-1">
                      {r.targetType} · {r.targetId}
                    </div>
                    <p className="mt-2 text-[13px] text-ink-warm">{r.reason}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="accent" size="compact" onClick={() => reviewReport(r.id, "resolved")}>
                      Resolve
                    </Button>
                    <Button variant="quiet" size="compact" onClick={() => reviewReport(r.id, "dismissed")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-16">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-6">
          Matching learnings
        </h2>
        <Button variant="quiet" size="compact" onClick={tuneModel}>
          Run weight tuning
        </Button>
        {ml && (
          <div className="mt-6 text-[14px] text-ink-warm">
            ML re-rank: {ml.mlEnabled ? "on" : "off"}
            {ml.bias.length > 0 && (
              <ul className="mt-4 space-y-1">
                {ml.bias.map((b) => (
                  <li key={b.religion}>
                    {b.religion}: {(b.acceptanceRate * 100).toFixed(0)}% ({b.total} samples)
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-12">
        <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
          ← All customers
        </Link>
      </div>
    </section>
  );
}
