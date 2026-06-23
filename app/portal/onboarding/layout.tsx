import { requireClientSession } from "@/lib/auth/session";

export default async function PortalOnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireClientSession();
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/12">
        <div className="mx-auto max-w-2xl px-6 h-14 flex items-center">
          <span className="font-display-tight text-[18px]">KnotWise</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );
}
