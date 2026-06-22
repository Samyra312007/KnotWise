"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";
import { Knot } from "./knot";

interface StageStyle {
  bg: string;
  text: string;
  adornment?: "knot" | "dot-marigold";
}

const STAGE_STYLES: Record<Stage, StageStyle> = {
  Onboarding: { bg: "bg-paper-quiet", text: "text-ink-warm" },
  Active: { bg: "bg-moss/18", text: "text-moss" },
  "Match Sent": { bg: "bg-paper-quiet", text: "text-ink", adornment: "knot" },
  "In Conversation": { bg: "bg-indigo/16", text: "text-indigo" },
  Paused: { bg: "bg-dust/24", text: "text-ink-warm" },
  "Closed - Engaged": { bg: "bg-marigold/24", text: "text-ink", adornment: "dot-marigold" },
  "Closed - Dropped": { bg: "bg-transparent border border-ink/24", text: "text-ink-mute" },
};

export interface StagePillProps {
  stage: Stage;
  className?: string;
  as?: "span" | "button";
  onClick?: () => void;
}

export function StagePill({ stage, className, as = "span", onClick }: StagePillProps) {
  const s = STAGE_STYLES[stage];
  const Component = as as keyof React.JSX.IntrinsicElements;
  const isButton = as === "button";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-7 px-3 rounded-full",
        "font-mono text-[11px] font-medium uppercase tracking-[0.18em] leading-none",
        s.bg,
        s.text,
        isButton && "cursor-pointer hover:brightness-95",
        className
      )}
    >
      {s.adornment === "knot" && <Knot size={12} />}
      {s.adornment === "dot-marigold" && (
        <span className="size-1.5 rounded-full bg-marigold" />
      )}
      {stage}
    </Component>
  );
}
