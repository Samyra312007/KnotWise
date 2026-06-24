import { Suspense } from "react";
import DelegateVerifyClient from "./verify-client";

export default function DelegateVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <p className="text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">Loading…</p>
        </div>
      }
    >
      <DelegateVerifyClient />
    </Suspense>
  );
}
