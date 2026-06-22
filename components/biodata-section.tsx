"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ROMAN: string[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function Section({
  index,
  title,
  children,
  className,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-8 border-b border-ink/12", className)}>
      <div className="flex items-baseline gap-4 mb-6">
        <span
          aria-hidden
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute"
        >
          {ROMAN[index]}.
        </span>
        <h3 className="font-display-tight text-[22px] tracking-[-0.01em] text-ink leading-none">
          {title}
        </h3>
      </div>
      <dl className="grid grid-cols-[minmax(180px,220px)_1fr] gap-x-8 gap-y-3">
        {children}
      </dl>
    </section>
  );
}

export function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  if (!children || children === "—" || (typeof children === "string" && children.trim() === "")) return null;
  return (
    <>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute pt-1.5 self-start">
        {label}
      </dt>
      <dd className={cn("text-[14px] text-ink leading-relaxed", mono && "font-mono tabular-nums")}>
        {children}
      </dd>
    </>
  );
}
