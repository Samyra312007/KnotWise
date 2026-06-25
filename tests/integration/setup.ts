import { vi } from "vitest";

const cookieJar = new Map<string, string>();

export function resetIntegrationCookies() {
  cookieJar.clear();
}

export function getIntegrationCookie(name: string) {
  return cookieJar.get(name);
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
  })),
  headers: vi.fn(async () => new Headers()),
}));

process.env.SESSION_SECRET ??= "integration_test_session_secret_32_chars";
process.env.EMAIL_DRY_RUN ??= "true";
process.env.RAZORPAY_DRY_RUN ??= "true";
process.env.OTP_DRY_RUN ??= "true";
process.env.VIDEO_DRY_RUN ??= "true";
process.env.KUNDLI_DRY_RUN ??= "true";
