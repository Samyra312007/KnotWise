import { describe, expect, it } from "vitest";
import { isSameGotra, normalizeGotra } from "@/lib/trust/gotra";
import { containsBlockedContent, sanitizeOrRejectMessage } from "@/lib/trust/content-filter";
import { passesHardFilters } from "@/lib/matching/hard-filters";
import { makeBiodata } from "./fixtures";

describe("gotra rules", () => {
  it("normalizes gotra strings", () => {
    expect(normalizeGotra(" Bharadwaja ")).toBe("bharadwaja");
  });

  it("detects same gotra", () => {
    const a = makeBiodata({ gotra: "Bharadwaja" });
    const b = makeBiodata({ gender: "female", gotra: "bharadwaja" });
    expect(isSameGotra(a, b)).toBe(true);
  });

  it("hard-filters same gotra when enabled", () => {
    const a = makeBiodata({ gotra: "Kashyapa" });
    const b = makeBiodata({ gender: "female", gotra: "Kashyapa" });
    expect(passesHardFilters(a, b, { blockSameGotra: true }).pass).toBe(false);
    expect(passesHardFilters(a, b, { blockSameGotra: false }).pass).toBe(true);
  });
});

describe("content filter", () => {
  it("blocks profanity", () => {
    expect(containsBlockedContent("what the fuck")).toBe(true);
    expect(sanitizeOrRejectMessage("hello there").ok).toBe(true);
  });

  it("rejects empty messages", () => {
    expect(sanitizeOrRejectMessage("   ").ok).toBe(false);
  });
});
