import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOps, notFound } from "@/lib/auth/api";
import { reviewProfileRevision } from "@/lib/profile/revisions";

const schema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid review." } }, { status: 400 });
  }

  try {
    const result = await reviewProfileRevision({
      revisionId: id,
      orgId: session.orgId,
      reviewerId: session.matchmakerId,
      decision: parsed.decision,
    });
    return NextResponse.json({ ok: true, status: result.status });
  } catch {
    return notFound("Revision not found.");
  }
}
