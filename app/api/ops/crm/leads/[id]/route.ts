import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOps, notFound } from "@/lib/auth/api";
import { updateCrmLead } from "@/lib/crm/leads";

const patchSchema = z.object({
  stage: z.enum(["lead", "qualified", "paying", "lost"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  notes: z.string().max(2000).optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  markContacted: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid update." } }, { status: 400 });
  }

  const lead = await updateCrmLead(session.orgId, id, {
    stage: parsed.stage,
    priority: parsed.priority,
    notes: parsed.notes,
    nextFollowUpAt:
      parsed.nextFollowUpAt === undefined
        ? undefined
        : parsed.nextFollowUpAt
          ? new Date(parsed.nextFollowUpAt)
          : null,
    assigneeId: parsed.assigneeId,
    lastContactAt: parsed.markContacted ? new Date() : undefined,
  });

  if (!lead) return notFound();

  return NextResponse.json({ ok: true, lead });
}
