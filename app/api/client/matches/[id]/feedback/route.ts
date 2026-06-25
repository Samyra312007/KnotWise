import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { submitIntroFeedback } from "@/lib/matching/mutual";
import { normalizeIntroDecision } from "@/lib/matching/feedback";

const schema = z.object({
  decision: z.enum(["accept", "decline"]).optional(),
  status: z.enum(["accepted", "declined"]).optional(),
  reason: z.string().max(500).optional(),
});

async function handleFeedback(req: Request, id: string) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid feedback." } }, { status: 400 });
  }

  const decision = normalizeIntroDecision(parsed);
  if (!decision) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid feedback." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const result = await submitIntroFeedback({
      suggestionId: id,
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      decision,
      reason: parsed.reason,
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

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleFeedback(req, id);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleFeedback(req, id);
}
