"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/lib/uploadthing";
import { tierBadge, type VerificationTier } from "@/lib/trust/tiers";

type TrustStatus = {
  tier: VerificationTier;
  phoneVerifiedAt: string | null;
  photoVerifiedAt: string | null;
  profileVerifiedAt: string | null;
  idVerification: {
    caseId: string;
    status: string;
    documents: Array<{ id: string; kind: string; fileUrl: string }>;
  } | null;
};

export function TrustVerificationPanel({ customerId }: { customerId: string }) {
  const [status, setStatus] = React.useState<TrustStatus | null>(null);
  const [phone, setPhone] = React.useState("");
  const [attemptId, setAttemptId] = React.useState("");
  const [code, setCode] = React.useState("");
  const [idKind, setIdKind] = React.useState<"aadhaar" | "pan" | "passport">("aadhaar");
  const [busy, setBusy] = React.useState(false);

  const reload = React.useCallback(() => {
    return fetch("/api/client/trust")
      .then((r) => r.json())
      .then((d) => setStatus(d));
  }, []);

  React.useEffect(() => {
    reload().catch(() => toast.error("Could not load verification status."));
  }, [reload]);

  async function sendOtp() {
    setBusy(true);
    try {
      const res = await fetch("/api/trust/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "sms", target: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not send OTP.");
        return;
      }
      setAttemptId(data.attemptId);
      if (data.dryRunCode) toast.message(`Dev OTP: ${data.dryRunCode}`);
      else toast.success("OTP sent.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    try {
      const res = await fetch("/api/trust/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Verification failed.");
        return;
      }
      toast.success("Phone verified.");
      setCode("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function submitIdDoc(fileUrl: string) {
    const res = await fetch("/api/client/trust", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: idKind, fileUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "Could not submit document.");
      return;
    }
    toast.success("ID document submitted for review.");
    await reload();
  }

  if (!status) return <p className="text-ink-mute italic">Loading…</p>;

  const badge = tierBadge(status.tier);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Verification tier</p>
        <p
          className={`mt-2 font-display-tight text-[22px] ${
            badge.tone === "gold"
              ? "text-amber-700"
              : badge.tone === "green"
                ? "text-emerald-700"
                : badge.tone === "amber"
                  ? "text-amber-600"
                  : "text-ink-mute"
          }`}
        >
          {badge.label}
        </p>
      </div>

      <section className="border-t border-ink/12 pt-8 space-y-4 max-w-md">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">Phone OTP</h2>
        {status.phoneVerifiedAt ? (
          <p className="text-[14px] text-emerald-700">Phone verified</p>
        ) : (
          <>
            <div>
              <Label>Mobile number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
            </div>
            <Button variant="quiet" disabled={busy || !phone.trim()} onClick={sendOtp}>
              Send OTP
            </Button>
            {attemptId ? (
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Verification code</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
                </div>
                <Button variant="accent" disabled={busy || code.length < 4} onClick={verifyOtp}>
                  Verify phone
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="border-t border-ink/12 pt-8 space-y-4 max-w-md">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">ID verification</h2>
        <div>
          <Label>Document type</Label>
          <select
            value={idKind}
            onChange={(e) => setIdKind(e.target.value as "aadhaar" | "pan" | "passport")}
            className="mt-1 h-11 w-full rounded-[2px] border border-ink/24 bg-paper-quiet px-[14px] text-[14px] text-ink"
          >
            <option value="aadhaar">Aadhaar (masked)</option>
            <option value="pan">PAN</option>
            <option value="passport">Passport</option>
          </select>
        </div>
        <UploadButton
          endpoint="clientIdDoc"
          input={{ customerId }}
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url;
            if (url) submitIdDoc(url);
          }}
          onUploadError={() => {
            toast.error("Upload failed.");
          }}
          appearance={{
            button:
              "h-11 px-4 font-mono text-[10px] uppercase tracking-[0.18em] bg-paper-quiet border border-ink/24 text-ink cursor-pointer",
          }}
          content={{ button: "Upload ID document" }}
        />
        {status.idVerification ? (
          <p className="text-[13px] text-ink-mute">
            Case status: {status.idVerification.status} · {status.idVerification.documents.length} document(s)
          </p>
        ) : null}
      </section>
    </div>
  );
}
