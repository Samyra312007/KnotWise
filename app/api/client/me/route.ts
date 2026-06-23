import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import type { Biodata, Stage } from "@/lib/types";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

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

  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Account not found." } }, { status: 404 });
  }

  const biodata = JSON.parse(account.customer.biodata) as Biodata;

  return NextResponse.json({
    customer: {
      id: account.customer.id,
      stage: account.customer.stage as Stage,
      firstName: biodata.firstName,
      lastName: biodata.lastName,
      city: biodata.city,
      photoUrl: account.customer.photoUrl,
      matchmakerName: account.customer.assignments[0]?.matchmaker.fullName ?? "Your matchmaker",
    },
    email: account.email,
  });
}
