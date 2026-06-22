"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

export function Dropdown({ trigger, children, className, align = "left" }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center bg-transparent border-0 cursor-pointer p-0"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 min-w-[200px] bg-paper-deep border border-ink/16 py-2 anim-reveal",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<DropdownItemHandlerProps>, { __close: () => setOpen(false) }) : child
          )}
        </div>
      )}
    </div>
  );
}

interface DropdownItemHandlerProps {
  __close?: () => void;
}

export interface DropdownItemProps extends DropdownItemHandlerProps {
  onSelect?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function DropdownItem({ onSelect, children, className, __close }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        __close?.();
      }}
      className={cn(
        "w-full text-left px-4 py-2 text-[14px] text-ink hover:bg-paper-quiet/80",
        "transition-colors duration-[var(--duration-micro)] cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}
