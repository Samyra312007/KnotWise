import { describe, expect, it } from "vitest";
import { hashToken } from "@/lib/auth/token-hash";

describe("hashToken", () => {
  it("returns a stable sha256 hex digest", () => {
    const digest = hashToken("test-token-value");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("test-token-value")).toBe(digest);
  });

  it("produces different digests for different inputs", () => {
    expect(hashToken("alpha")).not.toBe(hashToken("beta"));
  });
});
