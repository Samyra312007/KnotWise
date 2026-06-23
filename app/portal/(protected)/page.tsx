import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/auth/session";
import Link from "next/link";

export default async function PortalHomePage() {
  const session = await requireClientSession();

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: {
      customer: {
        include: {
          assignments: {
            where: { role: "primary" },
            include: { matchmaker: { select: { fullName: true } } },
            take: 1,
          },
        },
      },
    },
  });

  if (!account) return null;

  return (
    <section>
      <h1 className="font-display text-display-l text-ink">
        Hello, {account.customer.firstName}.
      </h1>
      <p className="mt-4 text-body-l text-ink-warm">
        Your journey stage: <strong>{account.customer.stage}</strong>
      </p>
      <p className="mt-2 text-[14px] text-ink-mute">
        Your matchmaker: {account.customer.assignments[0]?.matchmaker.fullName ?? "Assigned soon"}
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/portal/matches"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-vermilion"
        >
          View introduced matches →
        </Link>
      </div>
    </section>
  );
}
