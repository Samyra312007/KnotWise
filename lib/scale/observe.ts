import { NextResponse } from "next/server";
import { recordRequestMetric } from "@/lib/scale/metrics";

export function observeResponse(path: string, started: number, response: NextResponse) {
  recordRequestMetric(path, Date.now() - started, response.status);
  return response;
}
