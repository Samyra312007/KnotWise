import { prisma } from "@/lib/db";
import { maleWeights, femaleWeights } from "./index";

const MIN_LABELS = 50;

export async function trainOrgMatchingModel(orgId: string) {
  const labeled = await prisma.matchSuggestion.findMany({
    where: {
      customer: { orgId },
      status: { in: ["accepted", "declined"] },
    },
    include: { customer: true },
  });
  if (labeled.length < MIN_LABELS) return { skipped: true, reason: "insufficient_labels" };

  let accepted = 0;
  for (const row of labeled) {
    if (row.status === "accepted") accepted += 1;
  }
  const acceptanceRate = accepted / labeled.length;

  const latest = await prisma.modelVersion.findFirst({
    where: { orgId },
    orderBy: { version: "desc" },
  });
  const version = (latest?.version ?? 0) + 1;

  await prisma.modelVersion.create({
    data: {
      orgId,
      version,
      metrics: JSON.stringify({ acceptanceRate, sampleSize: labeled.length }),
    },
  });

  const tunedMale = { ...maleWeights, wantKids: Math.min(22, maleWeights.wantKids + 1) };
  const tunedFemale = { ...femaleWeights, education: Math.min(16, femaleWeights.education + 1) };

  await prisma.orgMatchingConfig.upsert({
    where: { orgId },
    create: {
      orgId,
      weightsJson: JSON.stringify({ male: tunedMale, female: tunedFemale }),
      mlEnabled: true,
    },
    update: {
      weightsJson: JSON.stringify({ male: tunedMale, female: tunedFemale }),
      mlEnabled: true,
    },
  });

  return { trained: true, version, acceptanceRate };
}

export async function tuneOrgWeights(orgId: string) {
  return trainOrgMatchingModel(orgId);
}
