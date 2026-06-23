import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { listPendingRevisionsForOrg } from "@/lib/profile/revisions";
import { deserializeFieldValue } from "@/lib/profile/fields";

export async function GET(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  if (status !== "pending") {
    return NextResponse.json({ items: [] });
  }

  const rows = await listPendingRevisionsForOrg(session.orgId);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      fieldPath: r.fieldPath,
      oldValue: deserializeFieldValue(r.oldValue),
      newValue: deserializeFieldValue(r.newValue),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      customer: r.customer,
    })),
  });
}
