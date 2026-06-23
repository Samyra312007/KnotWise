"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PortalVerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    fetch("/api/client/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then(() => router.replace("/portal"))
      .catch(() => setError(true));
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-warm italic">This link expired or was already used.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">Signing you in…</p>
    </div>
  );
}
