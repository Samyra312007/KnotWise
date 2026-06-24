import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { buildHealthReport } from "@/lib/scale/health";
import { listEmailSuppressions } from "@/lib/scale/email-suppression";
import { computeScaleSummary } from "@/lib/scale/metrics";
import { isCdnEnabled, isSentryEnabled } from "@/lib/scale/config";
import { isRedisConfigured } from "@/lib/realtime/config";

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const [health, suppressions] = await Promise.all([buildHealthReport(), listEmailSuppressions(25)]);

  return NextResponse.json({
    health,
    metrics: computeScaleSummary(),
    infrastructure: {
      redisConfigured: isRedisConfigured(),
      sentryEnabled: isSentryEnabled(),
      cdnEnabled: isCdnEnabled(),
      mediaCdnUrl: process.env.MEDIA_CDN_URL ?? null,
    },
    emailSuppressions: suppressions.map((row) => ({
      email: row.email.replace(/^(.)(.+)(@.*)$/, "$1***$3"),
      reason: row.reason,
      suppressedAt: row.suppressedAt.toISOString(),
    })),
  });
}
