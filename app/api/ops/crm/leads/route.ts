import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { listCrmLeads } from "@/lib/crm/leads";

export async function GET(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") ?? undefined;

  const items = await listCrmLeads(session.orgId, stage ?? undefined);
  return NextResponse.json({ items });
}
