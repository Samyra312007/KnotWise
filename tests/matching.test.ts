import { describe, it, expect } from "vitest";
import { rankMatches, bucketFor } from "@/lib/matching";
import { passesHardFilters } from "@/lib/matching/hard-filters";
import * as s from "@/lib/matching/scoring";
import { maleStrategy } from "@/lib/matching/male-strategy";
import { femaleStrategy } from "@/lib/matching/female-strategy";
import { FEMALE_CLIENT, MALE_CLIENT, makeBiodata } from "./fixtures";

describe("dimension scorers", () => {
  it("religion: same religion = 1.0", () => {
    expect(s.scoreReligion(MALE_CLIENT, makeBiodata({ religion: "Hindu" }))).toBe(1);
  });

  it("religion: different + not open = 0", () => {
    expect(
      s.scoreReligion(MALE_CLIENT, makeBiodata({ religion: "Christian" }))
    ).toBe(0);
  });

  it("religion: different + open to other = 0.6", () => {
    const openClient = makeBiodata({
      ...MALE_CLIENT,
      partnerPreferences: {
        ...MALE_CLIENT.partnerPreferences,
        openToOtherReligions: true,
      },
    });
    expect(s.scoreReligion(openClient, makeBiodata({ religion: "Christian" }))).toBe(
      0.6
    );
  });

  it("motherTongue: same = 1.0, shared language = 0.7, neither = 0.4", () => {
    expect(s.scoreMotherTongue(MALE_CLIENT, makeBiodata({ motherTongue: "Tamil" }))).toBe(1);
    expect(
      s.scoreMotherTongue(
        MALE_CLIENT,
        makeBiodata({ motherTongue: "Hindi", languagesKnown: ["Hindi", "English"] })
      )
    ).toBe(0.7);
    expect(
      s.scoreMotherTongue(
        MALE_CLIENT,
        makeBiodata({ motherTongue: "Bengali", languagesKnown: ["Bengali"] })
      )
    ).toBe(0.4);
  });

  it("wantKids: aligned vs Maybe vs opposite", () => {
    expect(s.scoreWantKids(MALE_CLIENT, makeBiodata({ wantKids: "Yes" }))).toBe(1);
    expect(s.scoreWantKids(MALE_CLIENT, makeBiodata({ wantKids: "Maybe" }))).toBe(0.5);
    expect(s.scoreWantKids(MALE_CLIENT, makeBiodata({ wantKids: "No" }))).toBe(0);
  });

  it("diet: same; adjacent veg/eggetarian; vegetarian client + non-veg candidate = 0", () => {
    expect(s.scoreDiet(MALE_CLIENT, makeBiodata({ diet: "Vegetarian" }))).toBe(1);
    expect(s.scoreDiet(MALE_CLIENT, makeBiodata({ diet: "Eggetarian" }))).toBe(0.5);
    expect(s.scoreDiet(MALE_CLIENT, makeBiodata({ diet: "Non-vegetarian" }))).toBe(0);
  });

  it("age (male): -3 (candidate younger) ~ 1.0; +1 candidate older = 0", () => {
    const youngerByThree = makeBiodata({
      gender: "female",
      dateOfBirth: makeBiodata({
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 29)).toISOString(),
      }).dateOfBirth,
    });
    expect(s.scoreAgeMale(MALE_CLIENT, youngerByThree)).toBe(1);
    const older = makeBiodata({
      dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 35)).toISOString(),
    });
    expect(s.scoreAgeMale(MALE_CLIENT, older)).toBe(0);
  });
});

describe("hard filters", () => {
  it("rejects same gender", () => {
    const res = passesHardFilters(
      MALE_CLIENT,
      makeBiodata({ gender: "male" })
    );
    expect(res.pass).toBe(false);
    expect(res.reason).toBe("same-gender");
  });

  it("rejects when religion locked and candidate differs", () => {
    const res = passesHardFilters(
      MALE_CLIENT,
      makeBiodata({ gender: "female", religion: "Christian" })
    );
    expect(res.pass).toBe(false);
  });

  it("passes opposite gender + matching religion + acceptable status", () => {
    const res = passesHardFilters(
      MALE_CLIENT,
      makeBiodata({ gender: "female", religion: "Hindu" })
    );
    expect(res.pass).toBe(true);
  });
});

describe("male strategy: aligned candidate scores >= 75", () => {
  it("younger + same religion + aligned kids => high potential", () => {
    const aligned = makeBiodata({
      gender: "female",
      dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 29)).toISOString(),
      heightCm: 164,
      motherTongue: "Tamil",
      religion: "Hindu",
      caste: "Iyer",
      diet: "Vegetarian",
      wantKids: "Yes",
      annualIncomeINR: 1_500_000,
      city: "Bangalore",
      manglik: "No",
    });
    const { total } = maleStrategy.score(MALE_CLIENT, aligned);
    expect(total).toBeGreaterThanOrEqual(75);
  });
});

describe("female strategy: aligned candidate scores >= 75", () => {
  it("higher education + similar income + same city => high potential", () => {
    const aligned = makeBiodata({
      gender: "male",
      dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 30)).toISOString(),
      heightCm: 178,
      motherTongue: FEMALE_CLIENT.motherTongue,
      religion: FEMALE_CLIENT.religion,
      caste: FEMALE_CLIENT.caste,
      diet: FEMALE_CLIENT.diet,
      wantKids: "Yes",
      educationLevel: "PhD",
      annualIncomeINR: 2_200_000,
      city: FEMALE_CLIENT.city,
      manglik: "No",
    });
    const { total } = femaleStrategy.score(FEMALE_CLIENT, aligned);
    expect(total).toBeGreaterThanOrEqual(75);
  });
});

describe("rankMatches", () => {
  it("excludes same-gender candidates entirely", () => {
    const pool = [
      { id: "a", biodata: makeBiodata({ gender: "male", firstName: "A" }) },
      { id: "b", biodata: makeBiodata({ gender: "female", firstName: "B", religion: "Hindu" }) },
    ];
    const ranked = rankMatches(MALE_CLIENT, pool);
    expect(ranked.map((r) => r.id)).toEqual(["b"]);
  });

  it("returns sorted by score descending", () => {
    const pool = [
      {
        id: "low",
        biodata: makeBiodata({
          gender: "female",
          religion: "Hindu",
          wantKids: "No",
          diet: "Non-vegetarian",
        }),
      },
      {
        id: "high",
        biodata: makeBiodata({
          gender: "female",
          religion: "Hindu",
          motherTongue: "Tamil",
          diet: "Vegetarian",
          wantKids: "Yes",
          dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 29)).toISOString(),
        }),
      },
    ];
    const ranked = rankMatches(MALE_CLIENT, pool);
    expect(ranked[0].id).toBe("high");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});

describe("bucket boundaries", () => {
  it("75 = high; 74 = medium; 54 = low", () => {
    expect(bucketFor(75)).toBe("high");
    expect(bucketFor(74)).toBe("medium");
    expect(bucketFor(54)).toBe("low");
  });
});
