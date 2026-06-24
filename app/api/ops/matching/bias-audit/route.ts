import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { runBiasAudit } from "@/lib/matching/bias-audit";

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const report = await runBiasAudit(session.orgId);
  return NextResponse.json(report);
}
