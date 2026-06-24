import type { Weights } from "../types";

export const maleWeightsV2: Weights = {
  religion: 10,
  diet: 5,
  motherTongue: 12,
  ageDelta: 10,
  heightDelta: 5,
  education: 8,
  incomeBracket: 7,
  relocate: 10,
  wantKids: 7,
  pets: 3,
  kundli: 15,
  caste: 5,
  manglik: 3,
};

export const femaleWeightsV2: Weights = {
  religion: 10,
  diet: 5,
  motherTongue: 12,
  ageDelta: 9,
  heightDelta: 4,
  education: 10,
  incomeBracket: 8,
  relocate: 10,
  wantKids: 7,
  pets: 3,
  kundli: 15,
  caste: 4,
  manglik: 3,
};

export const maleWeightsV2NoKundli: Weights = {
  religion: 15,
  diet: 5,
  motherTongue: 12,
  ageDelta: 10,
  heightDelta: 5,
  education: 8,
  incomeBracket: 7,
  relocate: 15,
  wantKids: 7,
  pets: 3,
  caste: 8,
  manglik: 5,
  kundli: 0,
};

export const femaleWeightsV2NoKundli: Weights = {
  religion: 15,
  diet: 5,
  motherTongue: 12,
  ageDelta: 9,
  heightDelta: 4,
  education: 10,
  incomeBracket: 8,
  relocate: 15,
  wantKids: 7,
  pets: 3,
  caste: 7,
  manglik: 5,
  kundli: 0,
};

export function activeV2Weights(gender: "male" | "female", kundliEnabled: boolean): Weights {
  if (gender === "male") {
    return kundliEnabled ? maleWeightsV2 : maleWeightsV2NoKundli;
  }
  return kundliEnabled ? femaleWeightsV2 : femaleWeightsV2NoKundli;
}

export function weightsSum(weights: Weights): number {
  return Object.values(weights).reduce((sum, w) => sum + (w ?? 0), 0);
}
