"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-h-24 w-full rounded-[2px] border bg-paper-quiet px-[14px] py-3",
          "font-sans text-[14px] text-ink placeholder:text-ink-mute placeholder:italic",
          "outline-none transition-[border-color] duration-[var(--duration-micro)] resize-y",
          invalid ? "border-error/80" : "border-ink/24 focus:border-ink/48",
          className
        )}
        {...rest}
      />
    );
  }
);
