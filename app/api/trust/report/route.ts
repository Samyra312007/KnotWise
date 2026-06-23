import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { createReport } from "@/lib/trust/reports";

const schema = z.object({
  targetType: z.enum(["customer", "conversation", "message"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid report." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const row = await createReport({
      reporterId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      reason: parsed.reason,
    });
    return NextResponse.json({ ok: true, reportId: row.id });
  } catch (err) {
    if (err instanceof Error && err.message === "EMPTY") {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Describe the issue." } }, { status: 400 });
    }
    throw err;
  }
}
