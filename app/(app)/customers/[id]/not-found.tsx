import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="py-32 flex flex-col items-center text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-3">
        404
      </div>
      <h1 className="font-display-tight text-display-m text-ink">
        This file is not in your bureau.
      </h1>
      <p className="text-body-l text-ink-warm mt-4 max-w-md">
        It may belong to another matchmaker, or it may have been closed.
      </p>
      <Link href="/dashboard" className="mt-8 inline-block">
        <Button variant="quiet">Back to my customers</Button>
      </Link>
    </section>
  );
}
