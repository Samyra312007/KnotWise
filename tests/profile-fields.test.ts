import { describe, expect, it } from "vitest";
import {
  flattenProfilePatch,
  getBiodataFieldValue,
  isSensitiveFieldPath,
  serializeFieldValue,
  setBiodataFieldValue,
} from "@/lib/profile/fields";
import { parseProfilePatch } from "@/lib/profile/validate-edit";

describe("profile fields", () => {
  it("classifies sensitive paths", () => {
    expect(isSensitiveFieldPath("bio")).toBe(false);
    expect(isSensitiveFieldPath("religion")).toBe(true);
    expect(isSensitiveFieldPath("photoUrl")).toBe(true);
    expect(isSensitiveFieldPath("partnerPreferences.ageMin")).toBe(false);
  });

  it("reads and writes nested biodata paths", () => {
    const record: Record<string, unknown> = {
      bio: "Hello",
      partnerPreferences: { ageMin: 25, ageMax: 32 },
    };
    expect(getBiodataFieldValue(record, "bio")).toBe("Hello");
    expect(getBiodataFieldValue(record, "partnerPreferences.ageMin")).toBe(25);
    setBiodataFieldValue(record, "partnerPreferences.ageMax", 34);
    expect(getBiodataFieldValue(record, "partnerPreferences.ageMax")).toBe(34);
  });

  it("flattens partner preference patch entries", () => {
    const entries = flattenProfilePatch({
      bio: "Updated bio with enough characters for validation rules.",
      partnerPreferences: { ageMin: 26, ageMax: 33 },
    });
    expect(entries).toEqual(
      expect.arrayContaining([
        { path: "bio", value: "Updated bio with enough characters for validation rules." },
        { path: "partnerPreferences.ageMin", value: 26 },
        { path: "partnerPreferences.ageMax", value: 33 },
      ])
    );
  });

  it("serializes values consistently", () => {
    expect(serializeFieldValue("Hindu")).toBe(JSON.stringify("Hindu"));
    expect(serializeFieldValue(null)).toBe(JSON.stringify(null));
  });
});

describe("parseProfilePatch", () => {
  it("accepts instant field updates", () => {
    const patch = parseProfilePatch({
      bio: "This is my updated bio with more than forty characters included.",
      city: "Mumbai",
    });
    expect(patch.city).toBe("Mumbai");
  });

  it("rejects short bio", () => {
    expect(() => parseProfilePatch({ bio: "Too short" })).toThrow();
  });

  it("rejects invalid partner age range", () => {
    expect(() =>
      parseProfilePatch({
        partnerPreferences: { ageMin: 40, ageMax: 30 },
      })
    ).toThrow();
  });
});
