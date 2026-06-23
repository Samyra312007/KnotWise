import { prisma } from "@/lib/db";

const orgId = process.argv[2];
if (!orgId) {
  console.error("Usage: npm run ml:tune -- <orgId>");
  process.exit(1);
}

import { trainOrgMatchingModel } from "../lib/matching/ml-train";

trainOrgMatchingModel(orgId)
  .then((r) => {
    console.log(r);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
