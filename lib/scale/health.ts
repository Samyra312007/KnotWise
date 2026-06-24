import { prisma } from "@/lib/db";
import { isRedisConfigured } from "@/lib/realtime/config";
import { isCdnEnabled, isSentryEnabled } from "@/lib/scale/config";

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function buildHealthReport() {
  const dbOk = await checkDatabaseHealth();
  const redisConfigured = isRedisConfigured();
  return {
    status: dbOk ? "ok" : "degraded",
    version: process.env.npm_package_version ?? "0.2.0",
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      database: dbOk,
      redisConfigured,
      sentryEnabled: isSentryEnabled(),
      cdnEnabled: isCdnEnabled(),
    },
    timestamp: new Date().toISOString(),
  };
}
