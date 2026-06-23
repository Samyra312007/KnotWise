import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/auth/session";
import { computeProfileCompleteness } from "@/lib/profile/completeness";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
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

  const biodata = parseCustomerBiodata(account.customer);
  const completeness = computeProfileCompleteness(biodata);
  const verificationPending = !account.customer.verifiedAt;

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
      {verificationPending && (
        <p className="mt-6 text-[14px] text-ink-warm italic">
          Your profile is under verification. You will be notified when it is approved.
        </p>
      )}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Profile completeness: {completeness}%
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/portal/matches"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-vermilion"
        >
          View introduced matches →
        </Link>
        <Link
          href="/portal/profile"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute"
        >
          View your profile →
        </Link>
      </div>
    </section>
  );
}
