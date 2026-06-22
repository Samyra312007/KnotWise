import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ageFromDOB, type CustomerListItem, type MaritalStatus, type Stage } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { matchmakerId: session.matchmakerId },
    orderBy: { updatedAt: "desc" },
    include: {
      notes: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      suggestions: {
        select: { createdAt: true, emails: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const items: CustomerListItem[] = customers.map((c) => {
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

  return NextResponse.json({ items });
}
