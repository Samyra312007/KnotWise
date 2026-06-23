"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Knot } from "@/components/ui/knot";
import { NotificationsBell, OpsNavLink } from "@/components/notifications-bell";

export interface Crumb {
  label: string;
  href?: string;
}

export interface HeaderRailProps {
  role?: string;
  crumbs?: Crumb[];
}

export function HeaderRail({ role, crumbs = [] }: HeaderRailProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out.");
      router.replace("/login");
    } catch {
      toast.error("Could not log out. Try again.");
    }
  }

  return (
    <header
      className={
        "sticky top-0 z-40 w-full border-b border-ink/12 " +
        (scrolled ? "bg-paper/92 backdrop-blur-[4px]" : "bg-paper")
      }
    >
      <div className="mx-auto flex h-14 items-center px-6 lg:px-12 max-w-[var(--container-bureau)]">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Knot size={18} />
          <span className="font-display-tight text-[18px] tracking-[-0.01em] text-ink leading-none">
            <span className="relative">
              K
              <span
                aria-hidden
                className="absolute -top-0.5 left-0 size-1 rounded-full bg-vermilion"
                style={{ marginLeft: "-2px" }}
              />
            </span>
            notWise
          </span>
        </Link>

        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-2 mx-auto text-[14px]"
          >
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden className="text-ink-mute/60">—</span>}
                {c.href && i < crumbs.length - 1 ? (
                  <Link href={c.href} className="text-ink-mute hover:text-ink-warm">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-6">
          <OpsNavLink role={role} />
          <Link
            href="/settings/billing"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink-warm hidden md:inline"
          >
            Billing
          </Link>
          <NotificationsBell />
          <button
            type="button"
            onClick={logout}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion transition-colors duration-[var(--duration-micro)] cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
