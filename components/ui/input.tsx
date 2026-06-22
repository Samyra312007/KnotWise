"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full rounded-[2px] border bg-paper-quiet px-[14px] py-3",
          "font-sans text-[14px] text-ink placeholder:text-ink-mute placeholder:italic",
          "outline-none transition-[border-color] duration-[var(--duration-micro)]",
          invalid
            ? "border-error/80 border-b-[2px]"
            : "border-ink/24 focus:border-ink/48",
          className
        )}
        {...rest}
      />
    );
  }
);
