"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DelegateAcceptClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    fetch("/api/family/delegates/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error("bad");
        router.replace(d.redirect ?? "/portal/delegate");
      })
      .catch(() => setError(true));
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <p className="text-ink-warm italic text-center">This invite expired or was already used.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">Accepting invite…</p>
    </div>
  );
}
