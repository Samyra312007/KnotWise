import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import type { Biodata } from "@/lib/types";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const suggestions = await prisma.matchSuggestion.findMany({
    where: { customerId: session.customerId, status: { in: ["sent", "accepted", "declined"] } },
    include: { poolProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { stage: true },
  });

  const revealFull = customer?.stage === "In Conversation";

  return NextResponse.json({
    items: suggestions.map((s) => {
      const biodata = JSON.parse(s.poolProfile.biodata) as Biodata;
      return {
        id: s.id,
        status: s.status,
        score: s.score,
        feedbackReason: s.feedbackReason,
        feedbackAt: s.feedbackAt?.toISOString(),
        candidate: {
          id: s.poolProfileId,
          firstName: biodata.firstName,
          lastName: revealFull ? biodata.lastName : biodata.lastName.charAt(0) + ".",
          age: biodata.dateOfBirth,
          city: biodata.city,
          designation: biodata.designation,
          currentCompany: biodata.currentCompany,
          photoUrl: s.poolProfile.photoUrl,
          about: biodata.bio?.slice(0, 160),
          email: revealFull ? biodata.email : undefined,
          phone: revealFull ? biodata.phone : undefined,
        },
      };
    }),
  });
}
