import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiDelegateSession } from "@/lib/auth/api";
import { submitIntroFeedback } from "@/lib/matching/mutual";
import { ageFromDOB } from "@/lib/types";
import { delegateCanActOnIntro } from "@/lib/family/permissions";

const schema = z.object({
  decision: z.enum(["accept", "decline"]).optional(),
  status: z.enum(["accepted", "declined"]).optional(),
  reason: z.string().max(500).optional(),
});

function normalizeDecision(body: z.infer<typeof schema>): "accept" | "decline" | null {
  if (body.decision) return body.decision;
  if (body.status === "accepted") return "accept";
  if (body.status === "declined") return "decline";
  return null;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiDelegateSession();
  if (session instanceof NextResponse) return session;

  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid feedback." } }, { status: 400 });
  }

  const decision = normalizeDecision(parsed);
  if (!decision) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid feedback." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: { clientAccount: true },
  });
  if (!customer?.clientAccount) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const clientAge = ageFromDOB(customer.dateOfBirth);
  if (
    !delegateCanActOnIntro(session.delegateRole, clientAge, customer.clientAccount.delegateApproverOptIn)
  ) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Your delegate role cannot approve or decline intros." } },
      { status: 403 }
    );
  }

  try {
    const result = await submitIntroFeedback({
      suggestionId: id,
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: customer.clientAccount.id,
      decision,
      reason: parsed.reason,
      actorType: "delegate",
      actorId: session.delegateId,
    });

    const status =
      result.status === "mutual" ? "mutual" : result.status === "accepted" ? "accepted" : "declined";

    return NextResponse.json({
      ok: true,
      status,
      mutualMatchId: "mutualMatchId" in result ? result.mutualMatchId : undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Intro not found." } }, { status: 404 });
    }
    throw err;
  }
}
