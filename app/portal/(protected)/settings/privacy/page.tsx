"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DELETION_GRACE_DAYS } from "@/lib/compliance/config";

type ConsentState = {
  marketingEmailOptIn: boolean;
  analyticsOptIn: boolean;
};

type DeletionState = {
  scheduled: boolean;
  scheduledFor?: string;
  status?: string;
};

export default function PortalPrivacySettingsPage() {
  const [consent, setConsent] = React.useState<ConsentState | null>(null);
  const [deletion, setDeletion] = React.useState<DeletionState>({ scheduled: false });
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return Promise.all([
      fetch("/api/client/consent").then((r) => r.json()),
      fetch("/api/client/delete-account").then((r) => r.json()),
    ]).then(([consentData, deletionData]) => {
      if (consentData.marketingEmailOptIn != null) {
        setConsent({
          marketingEmailOptIn: consentData.marketingEmailOptIn,
          analyticsOptIn: consentData.analyticsOptIn,
        });
      }
      setDeletion(deletionData);
    });
  }, []);

  React.useEffect(() => {
    load().catch(() => toast.error("Could not load privacy settings."));
  }, [load]);

  async function saveConsent(patch: Partial<ConsentState>) {
    if (!consent) return;
    setBusy(true);
    try {
      const res = await fetch("/api/client/consent", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not save.");
        return;
      }
      setConsent({ marketingEmailOptIn: data.marketingEmailOptIn, analyticsOptIn: data.analyticsOptIn });
      toast.success("Preferences saved.");
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    setBusy(true);
    try {
      const res = await fetch("/api/client/data-export");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Export failed.");
        return;
      }
      const blob = new Blob([JSON.stringify(data.bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knotwise-export-${data.requestId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleDeletion() {
    setBusy(true);
    try {
      const res = await fetch("/api/client/delete-account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not schedule deletion.");
        return;
      }
      toast.success(`Deletion scheduled. You have ${DELETION_GRACE_DAYS} days to cancel.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      const res = await fetch("/api/client/delete-account", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not cancel deletion.");
        return;
      }
      toast.success("Deletion cancelled.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Privacy & data</h1>
      <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
        Manage consents, download your data, or request account deletion under the DPDP Act.
      </p>

      <div className="mt-6 flex gap-4 text-[13px]">
        <Link href="/legal/privacy" className="text-vermilion hover:underline">
          Privacy policy
        </Link>
        <Link href="/legal/terms" className="text-vermilion hover:underline">
          Terms of service
        </Link>
      </div>

      {consent ? (
        <div className="mt-10 space-y-4 max-w-lg">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Consents</h2>
          <label className="flex items-start gap-3 text-[14px]">
            <input
              type="checkbox"
              checked={consent.marketingEmailOptIn}
              disabled={busy}
              onChange={(e) => saveConsent({ marketingEmailOptIn: e.target.checked })}
            />
            <span>Marketing and product update emails (separate from transactional messages)</span>
          </label>
          <label className="flex items-start gap-3 text-[14px]">
            <input
              type="checkbox"
              checked={consent.analyticsOptIn}
              disabled={busy}
              onChange={(e) => saveConsent({ analyticsOptIn: e.target.checked })}
            />
            <span>Help improve matching with anonymised product analytics</span>
          </label>
        </div>
      ) : null}

      <div className="mt-12 max-w-lg space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Data export</h2>
        <p className="text-[14px] text-ink-warm">
          Download a JSON copy of your profile, intros, messages, and billing records. Exports are available
          immediately and retained for 72 hours.
        </p>
        <Button variant="accent" disabled={busy} onClick={exportData}>
          Download my data
        </Button>
      </div>

      <div className="mt-12 max-w-lg space-y-4 border-t border-ink/12 pt-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Delete account</h2>
        {deletion.scheduled ? (
          <>
            <p className="text-[14px] text-ink-warm">
              Deletion scheduled for{" "}
              {deletion.scheduledFor ? new Date(deletion.scheduledFor).toLocaleDateString() : "soon"}. Your matchmaker
              has been notified. You can cancel before then.
            </p>
            <Button variant="quiet" disabled={busy} onClick={cancelDeletion}>
              Cancel deletion
            </Button>
          </>
        ) : (
          <>
            <p className="text-[14px] text-ink-warm">
              Permanently anonymize your profile after a {DELETION_GRACE_DAYS}-day grace period. Messages you sent will
              be redacted; photos will be removed.
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason for leaving"
              className="min-h-[80px]"
            />
            <Button variant="quiet" disabled={busy} onClick={scheduleDeletion}>
              Request account deletion
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
