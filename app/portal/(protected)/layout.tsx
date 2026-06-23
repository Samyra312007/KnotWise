import { requireClientSession } from "@/lib/auth/session";
import Link from "next/link";

export default async function PortalProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireClientSession();

  return (
    <>
      <header className="border-b border-ink/12">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <span className="font-display-tight text-[18px]">KnotWise Portal</span>
          <nav className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.18em]">
            <Link href="/portal">Home</Link>
            <Link href="/portal/matches">Matches</Link>
            <Link href="/portal/messages">Messages</Link>
            <Link href="/portal/profile">Profile</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </>
  );
}
