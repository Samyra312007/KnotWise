"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "quiet";
type Size = "default" | "compact";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:brightness-110 active:brightness-95 disabled:opacity-40",
  accent:
    "bg-vermilion text-paper hover:brightness-110 active:brightness-95 disabled:opacity-40",
  quiet:
    "bg-transparent text-ink border border-ink/24 hover:border-ink/40 hover:bg-paper-deep/60 disabled:opacity-40",
};

const sizeClass: Record<Size, string> = {
  default: "h-11 px-6 text-[14px]",
  compact: "h-9 px-4 text-[13px]",
};

const SPINNER = ["/", "—", "\\", "|"];

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "default", className, children, loading, disabled, ...rest },
    ref
  ) {
    const [frame, setFrame] = React.useState(0);
    React.useEffect(() => {
      if (!loading) return;
      const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 120);
      return () => clearInterval(id);
    }, [loading]);

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-[2px] font-sans font-medium tracking-[-0.005em]",
          "transition-[background,border-color,filter] duration-[var(--duration-micro)]",
          "select-none whitespace-nowrap leading-none",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="font-mono">{SPINNER[frame]}</span>
        ) : (
          children
        )}
      </button>
    );
  }
);
