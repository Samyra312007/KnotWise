import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { getCustomerAccessFilter } from "@/lib/access/customers";
import { ageFromDOB, type CustomerListItem, type MaritalStatus, type Stage } from "@/lib/types";
import { greetingByHour } from "@/lib/utils";
import { Manifest } from "@/components/manifest";
import { isOpsOrOwner } from "@/lib/auth/roles";

import type { MembershipRole } from "@/lib/auth/roles";

async function getCustomers(
  matchmakerId: string,
  orgId: string,
  role: MembershipRole
): Promise<CustomerListItem[]> {
  const customers = await prisma.customer.findMany({
    where: await getCustomerAccessFilter(matchmakerId, orgId, role),
    orderBy: { updatedAt: "desc" },
    include: {
      notes: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      suggestions: {
        select: { emails: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return customers.map((c) => {
    const noteAt = c.notes[0]?.createdAt;
    const emailAt = c.suggestions[0]?.emails[0]?.sentAt;
    const lastActivity = [c.updatedAt, noteAt, emailAt]
      .filter(Boolean)
      .map((d) => new Date(d as Date).getTime())
      .reduce((a, b) => Math.max(a, b), 0);

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      age: ageFromDOB(c.dateOfBirth),
      city: c.city,
      maritalStatus: c.maritalStatus as MaritalStatus,
      stage: c.stage as Stage,
      photoUrl: c.photoUrl ?? undefined,
      lastActivityAt: new Date(lastActivity || c.updatedAt).toISOString(),
    };
  });
}

function pickContextLine(items: CustomerListItem[]): string {
  if (items.length === 0) return "Your bureau is quiet today.";
  const now = Date.now();
  const today = items.filter(
    (i) => now - new Date(i.lastActivityAt).getTime() < 24 * 3600 * 1000
  );
  if (today.length === 0) {
    return `${items.length} files, none touched since yesterday.`;
  }
  const recent = today[0];
  return `${recent.firstName} ${recent.lastName} was last in motion this afternoon.`;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const items = await getCustomers(session.matchmakerId, session.orgId, session.role);

  const now = new Date();
  const dateLabel = format(now, "EEEE, d LLLL yyyy").toUpperCase();
  const greeting = greetingByHour(now.getHours());
  const firstName = session.fullName.split(" ")[0];
  const opsView = isOpsOrOwner(session.role);

  return (
    <section className="py-16 md:py-24">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute anim-reveal">
        {dateLabel} — {items.length} {items.length === 1 ? "customer" : "customers"} under review
        {opsView ? " (ops view)" : ""}
      </div>

      <h1 className="font-display text-display-xl text-ink mt-3 anim-reveal anim-delay-1">
        {greeting}, {firstName}.
      </h1>

      <p className="text-body-l text-ink-warm mt-2 anim-reveal anim-delay-2 max-w-2xl">
        {pickContextLine(items)}
      </p>

      <div className="mt-12 anim-reveal anim-delay-3">
        <Manifest items={items} />
      </div>
    </section>
  );
}
