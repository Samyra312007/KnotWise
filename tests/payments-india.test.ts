import { describe, expect, it, afterEach } from "vitest";
import {
  CLIENT_PLANS,
  gstFromBase,
  planFeatures,
  isPaidPlan,
} from "@/lib/billing/client-plans";
import {
  clientHasDiscoveryAccess,
  clientHasPriorityVerification,
  clientProfileBoost,
} from "@/lib/billing/client-entitlements";
import { isRazorpayDryRun } from "@/lib/billing/razorpay-config";

describe("client premium plans", () => {
  it("defines three tiers with INR pricing", () => {
    expect(CLIENT_PLANS.included.priceInr).toBe(0);
    expect(CLIENT_PLANS.plus.priceInr).toBe(499);
    expect(CLIENT_PLANS.premium.priceInr).toBe(999);
  });

  it("gates discovery to premium only", () => {
    expect(clientHasDiscoveryAccess("included", "active")).toBe(false);
    expect(clientHasDiscoveryAccess("plus", "active")).toBe(false);
    expect(clientHasDiscoveryAccess("premium", "active")).toBe(true);
    expect(clientHasDiscoveryAccess("premium", "past_due")).toBe(false);
  });

  it("grants plus verification priority and intro requests", () => {
    expect(clientHasPriorityVerification("plus", "active")).toBe(true);
    expect(planFeatures("plus").extraIntroRequestsPerMonth).toBe(2);
    expect(clientProfileBoost("plus", "active")).toBe(0);
    expect(clientProfileBoost("premium", "active")).toBe(5);
  });

  it("computes GST at 18%", () => {
    expect(gstFromBase(499)).toBe(90);
  });

  it("identifies paid plans", () => {
    expect(isPaidPlan("plus")).toBe(true);
    expect(isPaidPlan("included")).toBe(false);
  });
});

describe("razorpay config", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to dry run", () => {
    delete process.env.RAZORPAY_DRY_RUN;
    expect(isRazorpayDryRun()).toBe(true);
  });
});
