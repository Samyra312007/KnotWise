import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { computeFunnel } from "@/lib/analytics/funnel";

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const steps = await computeFunnel(session.orgId);
  return NextResponse.json({ steps });
}
