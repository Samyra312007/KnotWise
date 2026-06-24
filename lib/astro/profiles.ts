import { prisma } from "@/lib/db";
import { fetchKundliFromProvider } from "@/lib/astro/kundli";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
import type { Biodata } from "@/lib/types";

export async function upsertAstroProfile(input: {
  entityType: "customer" | "pool_profile";
  entityId: string;
  birthTime: string;
  birthPlace: string;
  consent: boolean;
  biodata: Biodata;
}) {
  if (!input.consent) throw new Error("CONSENT_REQUIRED");
  if (!input.birthTime || !input.birthPlace) throw new Error("MISSING_BIRTH_DATA");

  const kundli = await fetchKundliFromProvider({
    dateOfBirth: input.biodata.dateOfBirth,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    gender: input.biodata.gender,
  });

  return prisma.astroProfile.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } },
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      consentAt: new Date(),
      kundliJson: JSON.stringify(kundli),
      fetchedAt: new Date(),
    },
    update: {
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      consentAt: new Date(),
      kundliJson: JSON.stringify(kundli),
      fetchedAt: new Date(),
    },
  });
}

export async function getAstroProfile(entityType: string, entityId: string) {
  return prisma.astroProfile.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}

export async function loadKundliScoresForPool(
  customerId: string,
  poolIds: string[],
  kundliEnabled: boolean
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (!kundliEnabled || poolIds.length === 0) return scores;

  const clientAstro = await getAstroProfile("customer", customerId);
  if (!clientAstro?.kundliJson) return scores;

  const poolAstros = await prisma.astroProfile.findMany({
    where: { entityType: "pool_profile", entityId: { in: poolIds } },
  });
  const poolMap = new Map(poolAstros.map((a) => [a.entityId, a.kundliJson]));

  const { scoreKundliCompatibility } = await import("@/lib/astro/kundli");
  for (const poolId of poolIds) {
    const candidateJson = poolMap.get(poolId) ?? null;
    scores.set(poolId, scoreKundliCompatibility(clientAstro.kundliJson, candidateJson));
  }

  return scores;
}

export async function syncCustomerAstroFromBiodata(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return null;
  const biodata = parseCustomerBiodata(customer);
  if (!biodata.kundliConsent || !biodata.birthTime || !biodata.birthPlace) return null;

  return upsertAstroProfile({
    entityType: "customer",
    entityId: customerId,
    birthTime: biodata.birthTime,
    birthPlace: biodata.birthPlace,
    consent: true,
    biodata,
  });
}
