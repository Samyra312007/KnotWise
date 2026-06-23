import { requireClientSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { needsOnboarding, parseCustomerBiodata } from "@/lib/onboarding/status";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PortalProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientSession();

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: { customer: true },
  });

  if (account && needsOnboarding(account, parseCustomerBiodata(account.customer))) {
    redirect("/portal/onboarding");
  }

  return (
    <>
      <header className="border-b border-ink/12">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <span className="font-display-tight text-[18px]">KnotWise Portal</span>
          <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.18em]">
            <Link href="/portal">Home</Link>
            <Link href="/portal/matches">Matches</Link>
            <Link href="/portal/chat">Chat</Link>
            <Link href="/portal/messages">Matchmaker</Link>
            <Link href="/portal/profile">Profile</Link>
            <form action="/api/client/auth/logout" method="POST">
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
