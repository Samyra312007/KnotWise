import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import { rankMatches as baseRankMatches, type PoolEntry, type RankedMatch } from "./index";
import { applyMlRerank } from "./ml-rerank";
import { resolveWeightPreset } from "./experiments";
import { getPreferenceWeightAdjustments } from "./preference-learning";
import { rankMatchesV2 } from "./v2/rank";
import { getAstroProfile } from "@/lib/astro/profiles";

export async function rankMatchesForOrg(
  orgId: string,
  client: Biodata,
  pool: PoolEntry[],
  customerId?: string
): Promise<RankedMatch[]> {
  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId } });
  const preset = resolveWeightPreset({
    weightPreset: config?.weightPreset ?? "v1",
    experimentVariant: config?.experimentVariant ?? "control",
  });

  let customWeights: Partial<import("./types").Weights> | undefined;
  if (config?.weightsJson) {
    const parsed = JSON.parse(config.weightsJson) as {
      male?: Partial<import("./types").Weights>;
      female?: Partial<import("./types").Weights>;
    };
    customWeights = client.gender === "male" ? parsed.male : parsed.female;
  }

  const filterOptions = { blockSameGotra: config?.blockSameGotra ?? true };
  const kundliEnabled = config?.kundliEnabled ?? false;
  const resolvedCustomerId = customerId ?? (await findCustomerIdByBiodata(orgId, client));
  const preferenceAdjustments = resolvedCustomerId
    ? await getPreferenceWeightAdjustments(resolvedCustomerId)
    : {};

  let ranked: RankedMatch[];

  if (preset === "v2") {
    const clientAstro = resolvedCustomerId
      ? await getAstroProfile("customer", resolvedCustomerId)
      : null;
    const poolIds = pool.map((p) => p.id);
    const poolAstros = kundliEnabled
      ? await prisma.astroProfile.findMany({
          where: { entityType: "pool_profile", entityId: { in: poolIds } },
        })
      : [];
    const poolKundliJson = new Map(poolAstros.map((a) => [a.entityId, a.kundliJson]));

    ranked = rankMatchesV2(client, pool, {
      customWeights,
      filterOptions,
      kundliEnabled,
      clientKundliJson: clientAstro?.kundliJson,
      poolKundliJson,
      preferenceAdjustments,
    });
  } else {
    ranked = baseRankMatches(client, pool, customWeights, filterOptions);
  }

  if (config?.mlEnabled) {
    ranked = await applyMlRerank(orgId, ranked, client);
  }
  return ranked;
}

async function findCustomerIdByBiodata(orgId: string, client: Biodata): Promise<string | null> {
  const row = await prisma.customer.findFirst({
    where: {
      orgId,
      firstName: client.firstName,
      lastName: client.lastName,
      gender: client.gender,
    },
    select: { id: true },
  });
  return row?.id ?? null;
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
