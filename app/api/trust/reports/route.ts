import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { listOpenReports } from "@/lib/trust/reports";

export async function GET(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const status = new URL(req.url).searchParams.get("status") ?? "open";
  if (status !== "open") {
    return NextResponse.json({ items: [] });
  }

  const rows = await listOpenReports(session.orgId);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
    })),
  });
}
