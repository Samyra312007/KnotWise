import { requireSession } from "@/lib/auth/session";
import { HeaderRail } from "@/components/header-rail";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <HeaderRail matchmakerName={session.fullName} />
      <main className="mx-auto px-6 lg:px-12 max-w-[var(--container-bureau)]">
        {children}
      </main>
    </div>
  );
}
