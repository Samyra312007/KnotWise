import { describe, expect, it } from "vitest";
import {
  DELETION_GRACE_DAYS,
  EXPORT_RETENTION_HOURS,
  MIN_SIGNUP_AGE,
  deletionScheduledFor,
  exportExpiresAt,
  validateSignupAge,
} from "@/lib/compliance/config";
import { mutualRevealLevel } from "@/lib/compliance/contact-share";

describe("compliance config", () => {
  it("uses 30-day deletion grace", () => {
    expect(DELETION_GRACE_DAYS).toBe(30);
  });

  it("exports expire within 72 hours", () => {
    expect(EXPORT_RETENTION_HOURS).toBe(72);
    const start = new Date("2026-06-01T12:00:00.000Z");
    const expires = exportExpiresAt(start);
    expect(expires.getTime() - start.getTime()).toBe(72 * 60 * 60 * 1000);
  });

  it("schedules deletion grace from request date", () => {
    const start = new Date("2026-06-01T12:00:00.000Z");
    const scheduled = deletionScheduledFor(start);
    expect(scheduled.getTime() - start.getTime()).toBe(DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
  });

  it("enforces minimum signup age", () => {
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - (MIN_SIGNUP_AGE - 1));
    expect(validateSignupAge(tooYoung)).toBeTruthy();
    const ok = new Date();
    ok.setFullYear(ok.getFullYear() - 25);
    expect(validateSignupAge(ok)).toBeNull();
  });
});

describe("contact share reveal", () => {
  it("limits reveal until contact shared", () => {
    expect(mutualRevealLevel({ contactSharedAt: null })).toBe("limited");
    expect(mutualRevealLevel({ contactSharedAt: new Date() })).toBe("full");
  });
});
