import { prisma } from "@/lib/db";
import { rankMatchesForOrg } from "@/lib/matching/org-rank";
import { buildIntroReveal } from "@/lib/matching/reveal";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
import type { Biodata } from "@/lib/types";
import {
  clientHasDiscoveryAccess,
  clientProfileBoost,
  getClientEntitlements,
} from "@/lib/billing/client-entitlements";
import {
  passesClientHardFilters,
  passesDiscoveryFilters,
  verifiedBoostScore,
  type DiscoveryFilters,
} from "@/lib/discovery/filters";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function getDiscoveryFeed(input: {
  customerId: string;
  orgId: string;
  filters: DiscoveryFilters;
  cursor?: string;
  limit?: number;
}) {
  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId: input.orgId } });
  if (config && !config.discoveryEnabled) {
    throw new Error("DISABLED");
  }

  const entitlements = await getClientEntitlements(input.customerId);
  if (!clientHasDiscoveryAccess(entitlements.plan, entitlements.status)) {
    throw new Error("PREMIUM_REQUIRED");
  }

  const boost = clientProfileBoost(entitlements.plan, entitlements.status);

  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new Error("NOT_FOUND");

  const clientBio = parseCustomerBiodata(customer);
  const oppositeGender = clientBio.gender === "male" ? "female" : "male";

  const [introduced, interests, blocks] = await Promise.all([
    prisma.matchSuggestion.findMany({
      where: { customerId: input.customerId },
      select: { poolProfileId: true },
    }),
    prisma.discoveryInterest.findMany({
      where: { customerId: input.customerId },
      select: { poolProfileId: true, status: true },
    }),
    prisma.block.findMany({
      where: {
        OR: [{ blockerId: input.customerId }, { blockedId: input.customerId }],
      },
      select: { blockerId: true, blockedId: true },
    }),
  ]);

  const excludedProfileIds = new Set(introduced.map((row) => row.poolProfileId));
  const interestByProfile = new Map(interests.map((row) => [row.poolProfileId, row.status]));
  const blockedCustomerIds = new Set<string>();
  for (const block of blocks) {
    blockedCustomerIds.add(block.blockerId);
    blockedCustomerIds.add(block.blockedId);
  }

  const profiles = await prisma.poolProfile.findMany({
    where: {
      orgId: input.orgId,
      gender: oppositeGender,
      id: excludedProfileIds.size > 0 ? { notIn: [...excludedProfileIds] } : undefined,
      NOT: { linkedCustomerId: input.customerId },
    },
    take: 500,
  });

  const pool = profiles
    .filter((profile) => {
      if (profile.linkedCustomerId && blockedCustomerIds.has(profile.linkedCustomerId)) {
        return false;
      }
      const biodata = JSON.parse(profile.biodata) as Biodata;
      if (!passesDiscoveryFilters(biodata, input.filters, profile.searchText)) return false;
      return passesClientHardFilters(clientBio, biodata, config?.blockSameGotra ?? true);
    })
    .map((profile) => ({
      id: profile.id,
      biodata: JSON.parse(profile.biodata) as Biodata,
      photoUrl: profile.photoUrl,
      verifiedAt: profile.verifiedAt,
    }));

  const ranked = await rankMatchesForOrg(
    input.orgId,
    clientBio,
    pool.map((entry) => ({ id: entry.id, biodata: entry.biodata })),
    input.customerId
  );

  const rankedMap = new Map(ranked.map((row) => [row.id, row]));
  const ordered = pool
    .map((entry) => {
      const match = rankedMap.get(entry.id);
      if (!match) return null;
      return {
        profile: entry,
        score: verifiedBoostScore(match.score, entry.verifiedAt) + boost,
        bucket: match.bucket,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => b.score - a.score);

  const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  let startIndex = 0;
  if (input.cursor) {
    const cursorIndex = ordered.findIndex((row) => row.profile.id === input.cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const slice = ordered.slice(startIndex, startIndex + limit);
  const nextCursor = slice.length === limit ? slice[slice.length - 1]?.profile.id : undefined;

  return {
    items: slice.map((row) => ({
      poolProfileId: row.profile.id,
      score: row.score,
      bucket: row.bucket,
      verified: !!row.profile.verifiedAt,
      interestStatus: interestByProfile.get(row.profile.id) ?? null,
      candidate: buildIntroReveal({
        biodata: row.profile.biodata,
        photoUrl: row.profile.photoUrl,
        score: row.score,
        bucket: row.bucket,
        revealLevel: "limited",
      }),
    })),
    nextCursor,
  };
}
