import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/mobile";
import { logAuditEvent } from "@/lib/audit";
import { delegateInviteEmail } from "@/lib/email/templates";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { ageFromDOB } from "@/lib/types";
import {
  DELEGATE_ROLES,
  MAX_DELEGATES_PER_CLIENT,
  type DelegateRole,
} from "./constants";
import { canInviteApproverRole } from "./permissions";

function portalBase() {
  return process.env.CLIENT_PORTAL_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export async function countActiveDelegates(customerId: string) {
  return prisma.familyDelegate.count({
    where: { customerId, status: { in: ["invited", "accepted"] } },
  });
}

export async function inviteFamilyDelegate(input: {
  customerId: string;
  orgId: string;
  clientId: string;
  email: string;
  role: DelegateRole;
}) {
  if (!DELEGATE_ROLES.includes(input.role)) throw new Error("INVALID_ROLE");

  const email = input.email.trim().toLowerCase();
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    include: { clientAccount: true },
  });
  if (!customer?.clientAccount) throw new Error("NOT_FOUND");

  if (customer.clientAccount.email === email) throw new Error("SELF_INVITE");

  const clientAge = ageFromDOB(customer.dateOfBirth);
  if (
    input.role === "approver" &&
    !canInviteApproverRole(clientAge, customer.clientAccount.delegateApproverOptIn)
  ) {
    throw new Error("APPROVER_NOT_ALLOWED");
  }

  const active = await countActiveDelegates(input.customerId);
  if (active >= MAX_DELEGATES_PER_CLIENT) throw new Error("MAX_DELEGATES");

  const existing = await prisma.familyDelegate.findUnique({
    where: { customerId_email: { customerId: input.customerId, email } },
  });
  if (existing && existing.status !== "revoked") throw new Error("ALREADY_INVITED");

  const token = crypto.randomBytes(32).toString("hex");
  const delegate = await prisma.familyDelegate.upsert({
    where: { customerId_email: { customerId: input.customerId, email } },
    create: {
      customerId: input.customerId,
      email,
      role: input.role,
      status: "invited",
      inviteTokenHash: hashToken(token),
    },
    update: {
      role: input.role,
      status: "invited",
      invitedAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      inviteTokenHash: hashToken(token),
    },
  });

  const link = `${portalBase()}/portal/delegate/accept?token=${token}`;
  const tpl = delegateInviteEmail({
    link,
    clientFirstName: customer.firstName,
    role: input.role,
  });
  await enqueueMagicLinkEmail({ to: email, ...tpl });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "delegate.invited",
    entityType: "family_delegate",
    entityId: delegate.id,
    metadata: { email, role: input.role },
  });

  return delegate;
}

export async function acceptDelegateInvite(token: string) {
  const record = await prisma.familyDelegate.findFirst({
    where: { inviteTokenHash: hashToken(token), status: "invited" },
    include: { customer: { select: { orgId: true, firstName: true, lastName: true } } },
  });
  if (!record) throw new Error("INVALID_TOKEN");

  const updated = await prisma.familyDelegate.update({
    where: { id: record.id },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
      inviteTokenHash: null,
    },
    include: { customer: true },
  });

  await logAuditEvent({
    orgId: record.customer.orgId,
    actorId: record.id,
    actorType: "delegate",
    action: "delegate.accepted",
    entityType: "family_delegate",
    entityId: record.id,
    metadata: { email: record.email, role: record.role },
  });

  return updated;
}

export async function revokeFamilyDelegate(input: {
  delegateId: string;
  customerId: string;
  orgId: string;
  clientId: string;
}) {
  const delegate = await prisma.familyDelegate.findFirst({
    where: { id: input.delegateId, customerId: input.customerId, status: { in: ["invited", "accepted"] } },
  });
  if (!delegate) throw new Error("NOT_FOUND");

  await prisma.familyDelegate.update({
    where: { id: delegate.id },
    data: { status: "revoked", revokedAt: new Date(), inviteTokenHash: null },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "delegate.revoked",
    entityType: "family_delegate",
    entityId: delegate.id,
    metadata: { email: delegate.email },
  });
}

export async function listClientDelegates(customerId: string) {
  return prisma.familyDelegate.findMany({
    where: { customerId, status: { in: ["invited", "accepted"] } },
    orderBy: { invitedAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      invitedAt: true,
      acceptedAt: true,
    },
  });
}

export async function getAcceptedDelegate(delegateId: string) {
  return prisma.familyDelegate.findFirst({
    where: { id: delegateId, status: "accepted" },
    include: {
      customer: {
        include: { clientAccount: true },
      },
    },
  });
}

export async function sendDelegateMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  const delegates = await prisma.familyDelegate.findMany({
    where: { email: normalized, status: "accepted" },
    include: { customer: { select: { firstName: true } } },
    orderBy: { acceptedAt: "desc" },
  });

  if (delegates.length === 0) return { sent: false };

  for (const delegate of delegates) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.delegateMagicLinkToken.create({
      data: {
        delegateId: delegate.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const link = `${portalBase()}/portal/delegate/verify?token=${token}`;
    const tpl = delegateInviteEmail({
      link,
      clientFirstName: delegate.customer.firstName,
      role: delegate.role,
      subjectPrefix: "Sign in",
    });
    await enqueueMagicLinkEmail({ to: normalized, ...tpl });
  }

  return { sent: true, count: delegates.length };
}

export async function verifyDelegateMagicLink(token: string) {
  const record = await prisma.delegateMagicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      delegate: {
        include: { customer: true },
      },
    },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) throw new Error("INVALID_TOKEN");
  if (record.delegate.status !== "accepted") throw new Error("INVALID_TOKEN");

  await prisma.delegateMagicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.delegate;
}
