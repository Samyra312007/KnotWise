import { NextResponse } from "next/server";
import { buildHealthReport } from "@/lib/scale/health";
import { observeResponse } from "@/lib/scale/observe";

export async function GET() {
  const started = Date.now();
  const report = await buildHealthReport();
  const status = report.status === "ok" ? 200 : 503;
  return observeResponse("/api/health", started, NextResponse.json(report, { status }));
}
