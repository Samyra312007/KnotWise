import { describe, expect, it } from "vitest";
import { scoreKundliCompatibility, normalizeGunaScore } from "@/lib/astro/kundli";
import { scoreLocationV2, cityTier } from "@/lib/matching/v2/location";
import { activeV2Weights, weightsSum } from "@/lib/matching/v2/weights";
import { resolveWeightPreset } from "@/lib/matching/experiments";
import { scorePairV2 } from "@/lib/matching/v2/strategy";
import { passesHardFilters } from "@/lib/matching/hard-filters";
import { makeBiodata, MALE_CLIENT } from "./fixtures";

describe("matching v2 weights", () => {
  it("v2 weights sum to 100 with kundli", () => {
    expect(weightsSum(activeV2Weights("male", true))).toBe(100);
    expect(weightsSum(activeV2Weights("female", true))).toBe(100);
  });

  it("v2 weights sum to 100 without kundli redistribution", () => {
    expect(weightsSum(activeV2Weights("male", false))).toBe(100);
  });

  it("resolves experiment variant to v2 preset", () => {
    expect(resolveWeightPreset({ weightPreset: "v1", experimentVariant: "treatment" })).toBe("v2");
    expect(resolveWeightPreset({ weightPreset: "v1", experimentVariant: "control" })).toBe("v1");
  });
});

describe("location v2 scoring", () => {
  it("boosts same city", () => {
    const client = makeBiodata({ city: "Mumbai", openToRelocate: "No" });
    const candidate = makeBiodata({ city: "Mumbai" });
    expect(scoreLocationV2(client, candidate)).toBe(1);
  });

  it("expands cities when open to relocate", () => {
    const client = makeBiodata({ city: "Mumbai", openToRelocate: "Yes" });
    const candidate = makeBiodata({ city: "Delhi" });
    expect(scoreLocationV2(client, candidate)).toBeGreaterThan(0.5);
  });

  it("classifies city tiers", () => {
    expect(cityTier("Mumbai")).toBe("metro");
    expect(cityTier("Jaipur")).toBe("tier2");
  });
});

describe("kundli scoring", () => {
  it("normalizes guna scores", () => {
    expect(normalizeGunaScore({ gunaScore: 27, maxGuna: 36 })).toBeCloseTo(0.75, 2);
  });

  it("scores compatibility from cached json", () => {
    const a = JSON.stringify({ gunaScore: 30, maxGuna: 36 });
    const b = JSON.stringify({ gunaScore: 28, maxGuna: 36 });
    expect(scoreKundliCompatibility(a, b)).toBeGreaterThan(0.7);
  });
});

describe("same-gotra hard filter", () => {
  it("blocks same gotra when enabled", () => {
    const client = makeBiodata({ ...MALE_CLIENT, gotra: "Bharadwaj" });
    const candidate = makeBiodata({ gender: "female", gotra: "Bharadwaj" });
    expect(passesHardFilters(client, candidate, { blockSameGotra: true }).pass).toBe(false);
  });
});

describe("v2 pair scoring", () => {
  it("includes kundli dimension when enabled", () => {
    const client = MALE_CLIENT;
    const candidate = makeBiodata({ gender: "female" });
    const result = scorePairV2({
      client,
      candidate,
      weights: activeV2Weights("male", true),
      kundliEnabled: true,
      clientKundliJson: JSON.stringify({ gunaScore: 30, maxGuna: 36 }),
      candidateKundliJson: JSON.stringify({ gunaScore: 28, maxGuna: 36 }),
    });
    expect(result.breakdown.kundli).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
  });
});
