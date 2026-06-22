import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  eyebrow: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ eyebrow, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-3 py-24",
        className
      )}
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
        {eyebrow}
      </div>
      <div className="font-display-tight text-[22px] tracking-[-0.01em] text-ink">
        {title}
      </div>
      {body && <div className="text-[14px] text-ink-warm max-w-md">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
