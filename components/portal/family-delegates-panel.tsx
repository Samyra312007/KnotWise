"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DelegateRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  acceptedAt: string | null;
};

export default function FamilyDelegatesPanel() {
  const [delegates, setDelegates] = React.useState<DelegateRow[]>([]);
  const [maxDelegates, setMaxDelegates] = React.useState(3);
  const [optIn, setOptIn] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"observer" | "approver">("observer");
  const [loading, setLoading] = React.useState(false);

  function reload() {
    fetch("/api/family/delegates")
      .then((r) => r.json())
      .then((d) => {
        setDelegates(d.delegates ?? []);
        setMaxDelegates(d.maxDelegates ?? 3);
        setOptIn(d.delegateApproverOptIn ?? false);
      });
  }

  React.useEffect(() => {
    reload();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/family/delegates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error?.message ?? "Could not send invite.");
      return;
    }
    toast.success("Invite sent.");
    setEmail("");
    reload();
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/family/delegates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove delegate.");
      return;
    }
    toast.success("Delegate removed.");
    reload();
  }

  async function toggleOptIn(next: boolean) {
    const res = await fetch("/api/family/delegates/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ delegateApproverOptIn: next }),
    });
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error?.message ?? "Could not update setting.");
      return;
    }
    setOptIn(d.delegateApproverOptIn);
    if (d.note) toast.message(d.note);
    else toast.success(next ? "Approver opt-in enabled." : "Approver opt-in disabled.");
  }

  return (
    <section className="mt-12 border-t border-ink/12 pt-12">
      <h2 className="font-display-tight text-[22px] text-ink">Family delegates</h2>
      <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
        Invite a parent or guardian to view intros. Approvers can accept or decline on your behalf (logged in audit).
      </p>

      <label className="mt-6 flex items-center gap-3 text-[14px] text-ink-warm cursor-pointer">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => toggleOptIn(e.target.checked)}
          className="size-4 accent-vermilion"
        />
        Allow family approver for clients aged 35+
      </label>

      {delegates.length < maxDelegates ? (
        <form onSubmit={invite} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
          <Input
            type="email"
            placeholder="Delegate email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "observer" | "approver")}
            className="border border-ink/20 bg-paper px-3 py-2 text-[14px]"
          >
            <option value="observer">Observer</option>
            <option value="approver">Approver</option>
          </select>
          <Button type="submit" disabled={loading}>
            Invite
          </Button>
        </form>
      ) : (
        <p className="mt-8 text-ink-mute italic text-[14px]">Maximum {maxDelegates} delegates reached.</p>
      )}

      <ul className="mt-8 space-y-4">
        {delegates.length === 0 ? (
          <li className="text-ink-mute italic text-[14px]">No delegates yet.</li>
        ) : (
          delegates.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-4 border border-ink/12 px-4 py-3">
              <div>
                <p className="text-[14px] text-ink">{d.email}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mt-1">
                  {d.role} · {d.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revoke(d.id)}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion hover:underline"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
