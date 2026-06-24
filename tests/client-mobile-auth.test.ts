import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { hashToken } from "@/lib/auth/mobile";

describe("client mobile auth", () => {
  it("hashes tokens consistently", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("def"));
  });
});

describe("client mobile token issue", () => {
  it("exports issue helpers", async () => {
    const mod = await import("@/lib/auth/client-mobile");
    expect(typeof mod.createClientMobileToken).toBe("function");
    expect(typeof mod.validateClientMobileToken).toBe("function");
    expect(typeof mod.issueClientMobileSession).toBe("function");
  });
});
