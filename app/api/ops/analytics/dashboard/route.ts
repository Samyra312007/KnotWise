import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { computeMatchmakerDashboard } from "@/lib/analytics/dashboard";

export async function GET(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? "7")));

  const dashboard = await computeMatchmakerDashboard(session.orgId, days);
  return NextResponse.json(dashboard);
}
