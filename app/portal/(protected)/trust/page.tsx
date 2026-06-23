"use client";

import * as React from "react";
import { TrustVerificationPanel } from "@/components/portal/trust-verification-panel";

export default function PortalTrustPage() {
  const [customerId, setCustomerId] = React.useState("");

  React.useEffect(() => {
    fetch("/api/client/profile")
      .then((r) => r.json())
      .then((d) => setCustomerId(d.customerId ?? ""));
  }, []);

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Trust & verification</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Verify your phone and submit ID documents to earn trust badges on your profile.
      </p>
      <div className="mt-10">
        {customerId ? <TrustVerificationPanel customerId={customerId} /> : <p className="text-ink-mute italic">Loading…</p>}
      </div>
    </section>
  );
}
