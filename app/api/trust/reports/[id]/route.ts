import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOps, notFound } from "@/lib/auth/api";
import { resolveReport } from "@/lib/trust/reports";

const schema = z.object({
  status: z.enum(["resolved", "dismissed"]),
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
    await resolveReport({
      reportId: id,
      orgId: session.orgId,
      reviewerId: session.matchmakerId,
      status: parsed.status,
    });
    return NextResponse.json({ ok: true, status: parsed.status });
  } catch {
    return notFound("Report not found.");
  }
}
