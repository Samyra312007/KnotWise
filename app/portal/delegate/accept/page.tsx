import { Suspense } from "react";
import DelegateAcceptClient from "./accept-client";

export default function DelegateAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <p className="text-ink-mute font-mono text-[11px] uppercase tracking-[0.18em]">Loading…</p>
        </div>
      }
    >
      <DelegateAcceptClient />
    </Suspense>
  );
}
