import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import { rankMatches as baseRankMatches, type RankedMatch } from "./index";
import { applyMlRerank } from "./ml-rerank";

export type PoolEntry = { id: string; biodata: Biodata };

export async function rankMatchesForOrg(
  orgId: string,
  client: Biodata,
  pool: PoolEntry[]
): Promise<RankedMatch[]> {
  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId } });
  let customWeights: Partial<import("./types").Weights> | undefined;
  if (config?.weightsJson) {
    const parsed = JSON.parse(config.weightsJson) as { male?: Partial<import("./types").Weights>; female?: Partial<import("./types").Weights> };
    customWeights = client.gender === "male" ? parsed.male : parsed.female;
  }
  let ranked = baseRankMatches(client, pool, customWeights);
  if (config?.mlEnabled) {
    ranked = await applyMlRerank(orgId, ranked, client);
  }
  return ranked;
}

export async function getVerifiedPool(orgId: string, gender: string): Promise<PoolEntry[]> {
  const profiles = await prisma.poolProfile.findMany({
    where: {
      orgId,
      gender: gender === "male" ? "female" : "male",
      verifiedAt: { not: null },
    },
  });
  return profiles.map((p) => ({
    id: p.id,
    biodata: JSON.parse(p.biodata) as Biodata,
  }));
}
