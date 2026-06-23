import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { listProfileRevisions } from "@/lib/profile/revisions";
import { deserializeFieldValue } from "@/lib/profile/fields";

export async function GET(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const rows = await listProfileRevisions(session.customerId, status ?? undefined);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      fieldPath: r.fieldPath,
      oldValue: deserializeFieldValue(r.oldValue),
      newValue: deserializeFieldValue(r.newValue),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
    })),
  });
}
