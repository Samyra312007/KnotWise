import { describe, expect, it } from "vitest";
import { cdnMediaUrl } from "@/lib/scale/cdn";
import { PUBLIC_RATE_LIMIT, AUTH_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/lib/scale/config";
import { checkRateLimitSync, rateLimitKeyForRequest } from "@/lib/scale/rate-limit";
import { computeRouteStats, recordRequestMetric } from "@/lib/scale/metrics";
import { buildOpenApiSpec } from "@/lib/scale/openapi";

describe("scale config", () => {
  it("uses public and auth rate limits from API contract", () => {
    expect(PUBLIC_RATE_LIMIT).toBe(100);
    expect(AUTH_RATE_LIMIT).toBe(1000);
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });
});

describe("rate limiting", () => {
  it("blocks after limit is exceeded", () => {
    const key = "test:ip:1";
    const limit = 5;
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimitSync(key, limit, 60_000).ok).toBe(true);
    }
    expect(checkRateLimitSync(key, limit, 60_000).ok).toBe(false);
  });

  it("builds distinct keys for auth vs public", () => {
    const publicKey = rateLimitKeyForRequest({
      ip: "1.2.3.4",
      pathname: "/api/client/discover",
      authenticated: false,
    });
    const authKey = rateLimitKeyForRequest({
      ip: "1.2.3.4",
      pathname: "/api/client/discover",
      authenticated: true,
      actorId: "client_abc",
    });
    expect(publicKey.limit).toBe(PUBLIC_RATE_LIMIT);
    expect(authKey.limit).toBe(AUTH_RATE_LIMIT);
    expect(publicKey.key).not.toBe(authKey.key);
  });
});

describe("cdn helper", () => {
  it("rewrites uploadthing hosts when CDN configured", () => {
    const prev = process.env.MEDIA_CDN_URL;
    process.env.MEDIA_CDN_URL = "https://cdn.knotwise.in";
    expect(cdnMediaUrl("https://utfs.io/f/abc.jpg")).toBe("https://cdn.knotwise.in/f/abc.jpg");
    expect(cdnMediaUrl("https://randomuser.me/api/portraits/women/1.jpg")).toBe(
      "https://randomuser.me/api/portraits/women/1.jpg"
    );
    process.env.MEDIA_CDN_URL = prev;
  });
});

describe("metrics", () => {
  it("computes p95 for recorded samples", () => {
    for (let i = 1; i <= 100; i++) {
      recordRequestMetric("/api/client/discover", i, 200);
    }
    const stats = computeRouteStats("/api/client/discover");
    expect(stats.count).toBeGreaterThanOrEqual(100);
    expect(stats.p95Ms).toBeGreaterThanOrEqual(95);
  });
});

describe("openapi", () => {
  it("exports core client routes", () => {
    const spec = buildOpenApiSpec();
    expect(spec.paths["/api/health"]).toBeTruthy();
    expect(spec.paths["/api/client/data-export"]).toBeTruthy();
    expect(spec.paths["/api/ops/scale"]).toBeTruthy();
  });
});
