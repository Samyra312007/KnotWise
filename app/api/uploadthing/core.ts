import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { getSession, getClientSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseCustomerBiodata } from "@/lib/onboarding/status";

const f = createUploadthing();

export const ourFileRouter = {
  profilePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ entityType: z.string(), entityId: z.string() }))
    .middleware(async ({ input }) => {
      const session = await getSession();
      if (!session.matchmakerId || !session.orgId) throw new UploadThingError("Unauthorized");
      return {
        orgId: session.orgId,
        entityType: input.entityType,
        entityId: input.entityId,
        uploadedBy: session.matchmakerId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.asset.create({
        data: {
          orgId: metadata.orgId,
          entityType: metadata.entityType,
          entityId: metadata.entityId,
          kind: "photo",
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

  clientProfilePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        customerId: z.string().min(1),
        purpose: z.enum(["onboarding", "gallery"]).default("gallery"),
      })
    )
    .middleware(async ({ input }) => {
      const session = await getClientSession();
      if (!session.clientId || !session.customerId || session.userType !== "client") {
        throw new UploadThingError("Unauthorized");
      }
      if (input.customerId !== session.customerId) {
        throw new UploadThingError("Forbidden");
      }
      const customer = await prisma.customer.findUnique({
        where: { id: session.customerId },
        select: { orgId: true },
      });
      if (!customer) throw new UploadThingError("Not found");

      if (input.purpose === "gallery") {
        const { canAddCustomerPhoto } = await import("@/lib/profile/photos");
        const allowed = await canAddCustomerPhoto(session.customerId);
        if (!allowed) throw new UploadThingError("Photo album is full (max 6).");
      }

      return {
        orgId: customer.orgId,
        customerId: session.customerId,
        clientId: session.clientId,
        purpose: input.purpose,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const customer = await prisma.customer.findUnique({
        where: { id: metadata.customerId },
      });
      if (!customer) return { url: file.url };

      if (metadata.purpose === "gallery") {
        await prisma.asset.create({
          data: {
            orgId: metadata.orgId,
            entityType: "customer",
            entityId: metadata.customerId,
            kind: "photo",
            url: file.url,
            key: file.key,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedBy: metadata.clientId,
          },
        });

        if (!customer.photoUrl) {
          const biodata = parseCustomerBiodata(customer);
          biodata.photoUrl = file.url;
          await prisma.customer.update({
            where: { id: metadata.customerId },
            data: {
              photoUrl: file.url,
              biodata: JSON.stringify(biodata),
            },
          });
        }

        return { url: file.url };
      }

      const biodata = parseCustomerBiodata(customer);
      biodata.photoUrl = file.url;

      await prisma.$transaction([
        prisma.asset.create({
          data: {
            orgId: metadata.orgId,
            entityType: "customer",
            entityId: metadata.customerId,
            kind: "photo",
            url: file.url,
            key: file.key,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedBy: metadata.clientId,
          },
        }),
        prisma.customer.update({
          where: { id: metadata.customerId },
          data: {
            photoUrl: file.url,
            biodata: JSON.stringify(biodata),
          },
        }),
      ]);

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
