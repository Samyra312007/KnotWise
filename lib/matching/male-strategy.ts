import type { Biodata } from "@/lib/types";
import type { Strategy, StrategyResult, Weights } from "./types";
import * as s from "./scoring";

export const maleWeights: Weights = {
  wantKids: 18,
  religion: 14,
  motherTongue: 12,
  ageDelta: 10,
  heightDelta: 8,
  incomeBracket: 8,
  diet: 8,
  caste: 7,
  relocate: 5,
  education: 4,
  pets: 3,
  manglik: 3,
};

export const maleStrategy: Strategy = {
  weights: maleWeights,
  score(client: Biodata, candidate: Biodata): StrategyResult {
    const breakdown = {
      wantKids: s.scoreWantKids(client, candidate),
      religion: s.scoreReligion(client, candidate),
      motherTongue: s.scoreMotherTongue(client, candidate),
      ageDelta: s.scoreAgeMale(client, candidate),
      heightDelta: s.scoreHeightMale(client, candidate),
      incomeBracket: s.scoreIncomeMale(client, candidate),
      diet: s.scoreDiet(client, candidate),
      caste: s.scoreCaste(client, candidate),
      relocate: s.scoreRelocate(client, candidate),
      education: s.scoreEducation(client, candidate),
      pets: s.scorePets(client, candidate),
      manglik: s.scoreManglik(client, candidate),
    };

    const contributions = {} as Record<keyof typeof breakdown, number>;
    let total = 0;
    (Object.keys(breakdown) as Array<keyof typeof breakdown>).forEach((k) => {
      const weight = maleWeights[k];
      const sub = breakdown[k];
      const contribution = weight * sub;
      contributions[k] = contribution;
      total += contribution;
    });

    return { total: Math.round(total), breakdown, contributions };
  },
};
