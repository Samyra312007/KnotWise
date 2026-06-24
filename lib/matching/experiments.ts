export type ExperimentVariant = "control" | "treatment";

export const WEIGHTS_EXPERIMENT_KEY = "weights_v2";

export function resolveWeightPreset(input: {
  weightPreset: string;
  experimentVariant: string;
}): "v1" | "v2" {
  if (input.experimentVariant === "treatment") return "v2";
  if (input.weightPreset === "v2") return "v2";
  return "v1";
}

export function experimentConfig(variant: ExperimentVariant) {
  if (variant === "treatment") {
    return {
      variant,
      weightPreset: "v2" as const,
      description: "Matching engine v2 with relocation scoring and optional Kundli",
    };
  }
  return {
    variant,
    weightPreset: "v1" as const,
    description: "Baseline matching weights",
  };
}
