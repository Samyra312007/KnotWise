import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function Label({ className, ...rest }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.18em] leading-none text-ink-warm mb-2 inline-block",
        className
      )}
      {...rest}
    />
  );
});
