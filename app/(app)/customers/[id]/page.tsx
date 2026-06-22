import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import type { Biodata, Stage } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { CustomerDetail } from "./customer-detail";

export default async function CustomerDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
    include: {
      notes: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { matchmaker: { select: { fullName: true } } },
      },
    },
  });

  if (!customer) notFound();

  const biodata = JSON.parse(customer.biodata) as Biodata;
  const age = ageFromDOB(customer.dateOfBirth);

  return (
    <CustomerDetail
      id={customer.id}
      stage={customer.stage as Stage}
      age={age}
      biodata={biodata}
      photoUrl={customer.photoUrl ?? undefined}
      matchmakerName={session.fullName}
      marginalia={customer.notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        date: format(n.createdAt, "d MMM, HH:mm"),
        matchmakerName: n.matchmaker.fullName,
      }))}
    />
  );
}
