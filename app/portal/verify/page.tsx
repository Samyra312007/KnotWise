import { Suspense } from "react";
import PortalVerifyClient from "./verify-client";

export default function PortalVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <p className="text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">Signing you in…</p>
        </div>
      }
    >
      <PortalVerifyClient />
    </Suspense>
  );
}
