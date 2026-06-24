import { API_SLO_P95_MS } from "@/lib/scale/config";
import { getRedisPublisher } from "@/lib/realtime/redis";

type Sample = { path: string; ms: number; status: number; at: number };

const MAX_SAMPLES = 10_000;
const samples: Sample[] = [];

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx] ?? 0;
}

export function recordRequestMetric(path: string, ms: number, status = 200) {
  samples.push({ path, ms, status, at: Date.now() });
  if (samples.length > MAX_SAMPLES) samples.shift();
  void persistMetricSample(path, ms, status).catch(() => undefined);
}

async function persistMetricSample(path: string, ms: number, status: number) {
  const redis = getRedisPublisher();
  if (!redis) return;
  if (redis.status !== "ready") await redis.connect().catch(() => undefined);
  const key = `metrics:${path}:${Math.floor(Date.now() / 60_000)}`;
  await redis.rpush(key, JSON.stringify({ ms, status }));
  await redis.expire(key, 3600);
}

function recentSamples(withinMs = 15 * 60_000): Sample[] {
  const cutoff = Date.now() - withinMs;
  return samples.filter((s) => s.at >= cutoff);
}

export function computeRouteStats(pathPrefix: string, withinMs = 15 * 60_000) {
  const rows = recentSamples(withinMs).filter((s) => s.path.startsWith(pathPrefix));
  const durations = rows.map((r) => r.ms);
  const errors = rows.filter((r) => r.status >= 500).length;
  return {
    path: pathPrefix,
    count: rows.length,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    errorRate: rows.length > 0 ? errors / rows.length : 0,
    sloMs: API_SLO_P95_MS[pathPrefix],
    sloMet: API_SLO_P95_MS[pathPrefix] ? percentile(durations, 0.95) <= API_SLO_P95_MS[pathPrefix] : null,
  };
}

export function computeScaleSummary(withinMs = 15 * 60_000) {
  const routes = Object.keys(API_SLO_P95_MS);
  const routeStats = routes.map((path) => computeRouteStats(path, withinMs));
  const all = recentSamples(withinMs);
  const allDurations = all.map((s) => s.ms);
  return {
    windowMinutes: withinMs / 60_000,
    totalRequests: all.length,
    p95Ms: percentile(allDurations, 0.95),
    routes: routeStats,
  };
}
