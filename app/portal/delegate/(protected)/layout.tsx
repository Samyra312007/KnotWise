import { requireDelegateSession } from "@/lib/auth/session";
import Link from "next/link";
import DelegateDashboard from "@/components/portal/delegate-dashboard";

export default async function DelegateProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireDelegateSession();

  return (
    <>
      <header className="border-b border-ink/12">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <span className="font-display-tight text-[18px]">KnotWise Delegate</span>
          <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.18em]">
            <Link href="/portal/delegate">Matches</Link>
            <form action="/api/family/delegate/auth/logout" method="POST">
              <button type="submit" className="text-ink-mute hover:text-vermilion">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </>
  );
}
