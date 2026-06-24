"use client";

import * as React from "react";
import Link from "next/link";

type ScaleReport = {
  health: {
    status: string;
    uptimeSeconds: number;
    checks: {
      database: boolean;
      redisConfigured: boolean;
      sentryEnabled: boolean;
      cdnEnabled: boolean;
    };
  };
  metrics: {
    windowMinutes: number;
    totalRequests: number;
    p95Ms: number;
    routes: Array<{
      path: string;
      count: number;
      p50Ms: number;
      p95Ms: number;
      errorRate: number;
      sloMs?: number;
      sloMet: boolean | null;
    }>;
  };
  infrastructure: {
    redisConfigured: boolean;
    sentryEnabled: boolean;
    cdnEnabled: boolean;
    mediaCdnUrl: string | null;
  };
  emailSuppressions: Array<{ email: string; reason: string; suppressedAt: string }>;
};

export function OpsScalePanel() {
  const [report, setReport] = React.useState<ScaleReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/ops/scale")
      .then((r) => r.json())
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading scale report…</p>;
  if (!report) return <p className="text-sm text-destructive">Could not load scale report.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Production scale</h2>
        <p className="text-sm text-muted-foreground">
          Health checks, API SLOs, CDN, and email suppression status.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Health</p>
          <p className="text-xl font-semibold capitalize">{report.health.status}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Uptime</p>
          <p className="text-xl font-semibold">{Math.floor(report.health.uptimeSeconds / 60)}m</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">p95 (15m)</p>
          <p className="text-xl font-semibold">{report.metrics.p95Ms}ms</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Requests (15m)</p>
          <p className="text-xl font-semibold">{report.metrics.totalRequests}</p>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Infrastructure</h3>
        <ul className="text-sm space-y-1">
          <li>Database: {report.health.checks.database ? "ok" : "degraded"}</li>
          <li>Redis: {report.infrastructure.redisConfigured ? "configured" : "not configured"}</li>
          <li>Sentry: {report.infrastructure.sentryEnabled ? "enabled" : "disabled"}</li>
          <li>CDN: {report.infrastructure.cdnEnabled ? report.infrastructure.mediaCdnUrl : "passthrough"}</li>
        </ul>
        <Link href="/api/openapi" className="text-sm text-primary underline">
          OpenAPI spec
        </Link>
      </section>

      <section className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Route</th>
              <th className="text-left p-3">Count</th>
              <th className="text-left p-3">p95</th>
              <th className="text-left p-3">SLO</th>
            </tr>
          </thead>
          <tbody>
            {report.metrics.routes.map((route) => (
              <tr key={route.path} className="border-t">
                <td className="p-3 font-mono text-xs">{route.path}</td>
                <td className="p-3">{route.count}</td>
                <td className="p-3">{route.p95Ms}ms</td>
                <td className="p-3">
                  {route.sloMs ? (
                    <span className={route.sloMet ? "text-green-600" : "text-amber-600"}>
                      {route.sloMet ? "met" : "miss"} ({route.sloMs}ms)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Email suppressions</h3>
        {report.emailSuppressions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suppressed addresses.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {report.emailSuppressions.map((row) => (
              <li key={row.email + row.suppressedAt}>
                {row.email} · {row.reason} · {new Date(row.suppressedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
