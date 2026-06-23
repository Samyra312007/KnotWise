import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import { customerUpdateFromBiodata } from "@/lib/profile/biodata";
import {
  deserializeFieldValue,
  flattenProfilePatch,
  getBiodataFieldValue,
  isSensitiveFieldPath,
  serializeFieldValue,
  setBiodataFieldValue,
} from "@/lib/profile/fields";
import { applyPatchToBiodata, type ProfilePatch } from "@/lib/profile/validate-edit";
import { sanitizeBiodataForSave } from "@/lib/onboarding/validate";
import { logAuditEvent } from "@/lib/audit";

export type ApplyProfilePatchResult = {
  applied: string[];
  pending: Array<{ fieldPath: string; revisionId: string }>;
};

function valuesEqual(a: unknown, b: unknown): boolean {
  return serializeFieldValue(a) === serializeFieldValue(b);
}

export async function applyProfilePatch(
  customerId: string,
  orgId: string,
  actorId: string,
  patch: ProfilePatch
): Promise<ApplyProfilePatchResult> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, orgId },
  });
  if (!customer) throw new Error("Customer not found.");

  const current = JSON.parse(customer.biodata) as Biodata;
  const entries = flattenProfilePatch(patch as Record<string, unknown>);
  const instantPaths: string[] = [];
  const pending: ApplyProfilePatchResult["pending"] = [];

  for (const { path, value } of entries) {
    const oldValue = getBiodataFieldValue(current as unknown as Record<string, unknown>, path);
    if (valuesEqual(oldValue, value)) continue;

    if (isSensitiveFieldPath(path)) {
      await prisma.profileRevision.updateMany({
        where: { customerId, fieldPath: path, status: "pending" },
        data: { status: "superseded", resolvedAt: new Date() },
      });

      const revision = await prisma.profileRevision.create({
        data: {
          customerId,
          fieldPath: path,
          oldValue: serializeFieldValue(oldValue),
          newValue: serializeFieldValue(value),
        },
      });
      pending.push({ fieldPath: path, revisionId: revision.id });
    } else {
      instantPaths.push(path);
    }
  }

  if (instantPaths.length === 0 && pending.length === 0) {
    return { applied: [], pending: [] };
  }

  let next = current;
  if (instantPaths.length > 0) {
    const instantPatch: ProfilePatch = {};
    for (const { path, value } of entries) {
      if (!instantPaths.includes(path)) continue;
      if (path.startsWith("partnerPreferences.")) {
        const key = path.replace("partnerPreferences.", "") as keyof Biodata["partnerPreferences"];
        instantPatch.partnerPreferences = {
          ...(instantPatch.partnerPreferences ?? {}),
          [key]: value,
        };
      } else {
        (instantPatch as Record<string, unknown>)[path] = value;
      }
    }
    next = applyPatchToBiodata(current, instantPatch);

    await prisma.customer.update({
      where: { id: customerId },
      data: customerUpdateFromBiodata(next),
    });
  }

  if (instantPaths.length > 0) {
    await logAuditEvent({
      orgId,
      actorId,
      actorType: "client",
      action: "profile.updated",
      entityType: "customer",
      entityId: customerId,
      metadata: { fields: instantPaths },
    });
  }

  if (pending.length > 0) {
    await logAuditEvent({
      orgId,
      actorId,
      actorType: "client",
      action: "profile.revision_requested",
      entityType: "customer",
      entityId: customerId,
      metadata: { fields: pending.map((p) => p.fieldPath) },
    });
  }

  return { applied: instantPaths, pending };
}

export async function listProfileRevisions(customerId: string, status?: string) {
  return prisma.profileRevision.findMany({
    where: {
      customerId,
      ...(status ? { status } : { status: { in: ["pending", "approved", "rejected"] } }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listPendingRevisionsForOrg(orgId: string) {
  return prisma.profileRevision.findMany({
    where: {
      status: "pending",
      customer: { orgId },
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, city: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function reviewProfileRevision(input: {
  revisionId: string;
  orgId: string;
  reviewerId: string;
  decision: "approved" | "rejected";
}) {
  const revision = await prisma.profileRevision.findFirst({
    where: {
      id: input.revisionId,
      status: "pending",
      customer: { orgId: input.orgId },
    },
    include: { customer: true },
  });
  if (!revision) throw new Error("Revision not found.");

  const now = new Date();
  if (input.decision === "rejected") {
    await prisma.profileRevision.update({
      where: { id: revision.id },
      data: {
        status: "rejected",
        reviewedBy: input.reviewerId,
        resolvedAt: now,
      },
    });
    await logAuditEvent({
      orgId: input.orgId,
      actorId: input.reviewerId,
      actorType: "matchmaker",
      action: "profile.revision_rejected",
      entityType: "profile_revision",
      entityId: revision.id,
      metadata: { customerId: revision.customerId, fieldPath: revision.fieldPath },
    });
    return { status: "rejected" as const };
  }

  const biodata = JSON.parse(revision.customer.biodata) as Biodata;
  const value = deserializeFieldValue(revision.newValue);
  const record = structuredClone(biodata) as unknown as Record<string, unknown>;
  setBiodataFieldValue(record, revision.fieldPath, value);
  const merged = sanitizeBiodataForSave(record as unknown as Biodata);

  await prisma.$transaction([
    prisma.profileRevision.update({
      where: { id: revision.id },
      data: {
        status: "approved",
        reviewedBy: input.reviewerId,
        resolvedAt: now,
      },
    }),
    prisma.customer.update({
      where: { id: revision.customerId },
      data: customerUpdateFromBiodata(merged),
    }),
  ]);

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.reviewerId,
    actorType: "matchmaker",
    action: "profile.revision_approved",
    entityType: "profile_revision",
    entityId: revision.id,
    metadata: { customerId: revision.customerId, fieldPath: revision.fieldPath },
  });

  return { status: "approved" as const };
}

export async function requestPrimaryPhotoRevision(customerId: string, orgId: string, actorId: string, url: string) {
  return applyProfilePatch(customerId, orgId, actorId, { photoUrl: url });
}

export function mergePendingIntoProfileView(biodata: Biodata, pendingRevisions: Array<{ fieldPath: string; newValue: string }>): Biodata {
  const view = { ...biodata, partnerPreferences: { ...biodata.partnerPreferences } };
  const record = view as unknown as Record<string, unknown>;
  for (const rev of pendingRevisions) {
    if (rev.fieldPath.startsWith("partnerPreferences.")) continue;
    setBiodataFieldValue(record, rev.fieldPath, deserializeFieldValue(rev.newValue));
  }
  return view;
}
