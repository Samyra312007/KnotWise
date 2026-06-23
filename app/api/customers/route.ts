import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/api";
import { getCustomerAccessFilter } from "@/lib/access/customers";
import { ageFromDOB, type CustomerListItem, type MaritalStatus, type Stage } from "@/lib/types";

export async function GET(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const customers = await prisma.customer.findMany({
    where: await getCustomerAccessFilter(session.matchmakerId, session.orgId, session.role),
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
    include: {
      notes: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      suggestions: {
        select: { createdAt: true, emails: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      assignments: {
        where: { role: "primary" },
        include: { matchmaker: { select: { fullName: true } } },
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

  return NextResponse.json({ items, page, limit });
}
