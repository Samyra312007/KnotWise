import { describe, expect, it } from "vitest";
import { normalizeIntroDecision } from "@/lib/matching/feedback";

describe("normalizeIntroDecision", () => {
  it("prefers explicit decision", () => {
    expect(normalizeIntroDecision({ decision: "accept" })).toBe("accept");
    expect(normalizeIntroDecision({ decision: "decline", status: "accepted" })).toBe("decline");
  });

  it("maps legacy status field", () => {
    expect(normalizeIntroDecision({ status: "accepted" })).toBe("accept");
    expect(normalizeIntroDecision({ status: "declined" })).toBe("decline");
  });

  it("returns null when neither is set", () => {
    expect(normalizeIntroDecision({})).toBeNull();
  });
});
