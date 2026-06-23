import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const f = createUploadthing();

export const ourFileRouter = {
  profilePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ entityType: z.string(), entityId: z.string() }))
    .middleware(async ({ input, req }) => {
      const session = await getSession();
      if (!session.matchmakerId || !session.orgId) throw new UploadThingError("Unauthorized");
      return {
        orgId: session.orgId,
        entityType: input.entityType,
        entityId: input.entityId,
        uploadedBy: session.matchmakerId,
      };
    }).onUploadComplete(async ({ metadata, file }) => {
    await prisma.asset.create({
      data: {
        orgId: metadata.orgId,
        entityType: metadata.entityType,
        entityId: metadata.entityId,
        url: file.url,
        key: file.key,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: metadata.uploadedBy,
      },
    });

    if (metadata.entityType === "customer") {
      await prisma.customer.update({
        where: { id: metadata.entityId },
        data: { photoUrl: file.url },
      });
    } else if (metadata.entityType === "pool_profile") {
      await prisma.poolProfile.update({
        where: { id: metadata.entityId },
        data: { photoUrl: file.url },
      });
    }

    return { url: file.url };
  }),
  verificationDoc: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  }).middleware(async () => {
    const session = await getSession();
    if (!session.matchmakerId || !session.orgId) throw new UploadThingError("Unauthorized");
    return { orgId: session.orgId, uploadedBy: session.matchmakerId };
  }).onUploadComplete(async ({ metadata, file }) => {
    return { url: file.url, orgId: metadata.orgId };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
