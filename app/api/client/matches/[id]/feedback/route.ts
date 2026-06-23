import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { createNotification } from "@/lib/notifications";
import { getPrimaryMatchmakerId } from "@/lib/access/customers";

const schema = z.object({
  status: z.enum(["accepted", "declined"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid feedback." } }, { status: 400 });
  }

  const suggestion = await prisma.matchSuggestion.findFirst({
    where: { id, customerId: session.customerId, status: "sent" },
    include: { customer: true, poolProfile: true },
  });

  if (!suggestion) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Match not found." } }, { status: 404 });
  }

  await prisma.matchSuggestion.update({
    where: { id },
    data: {
      status: parsed.status,
      feedbackReason: parsed.reason,
      feedbackAt: new Date(),
    },
  });

  if (parsed.status === "accepted" && suggestion.customer.stage === "Match Sent") {
    await prisma.customer.update({
      where: { id: session.customerId },
      data: { stage: "In Conversation" },
    });
  }

  const mmId = await getPrimaryMatchmakerId(session.customerId);
  if (mmId) {
    const cand = JSON.parse(suggestion.poolProfile.biodata) as { firstName: string; lastName: string };
    await createNotification(mmId, "match_feedback", {
      customerId: session.customerId,
      suggestionId: id,
      status: parsed.status,
      candidateName: `${cand.firstName} ${cand.lastName}`,
      reason: parsed.reason,
    });
  }

  return NextResponse.json({ ok: true, status: parsed.status });
}
