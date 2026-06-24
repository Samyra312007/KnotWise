import { Suspense } from "react";
import PortalBillingPanel from "@/components/portal/billing-panel";

export default function PortalBillingPage() {
  return (
    <Suspense fallback={<p className="text-ink-mute italic">Loading…</p>}>
      <PortalBillingPanel />
    </Suspense>
  );
}
