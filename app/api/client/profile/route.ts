import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { parseCustomerBiodata } from "@/lib/onboarding/status";
import { listCustomerPhotos } from "@/lib/profile/photos";
import { listProfileRevisions } from "@/lib/profile/revisions";
import { parseProfilePatch } from "@/lib/profile/validate-edit";
import { applyProfilePatch } from "@/lib/profile/revisions";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const biodata = parseCustomerBiodata(customer);
  const photos = await listCustomerPhotos(session.customerId);
  const revisions = await listProfileRevisions(session.customerId);
  const pending = revisions.filter((r) => r.status === "pending");

  return NextResponse.json({
    customerId: session.customerId,
    profile: biodata,
    photoUrl: customer.photoUrl,
    photos,
    stage: customer.stage,
    pendingRevisions: pending.map((r) => ({
      id: r.id,
      fieldPath: r.fieldPath,
      oldValue: r.oldValue,
      newValue: r.newValue,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  let patch;
  try {
    patch = parseProfilePatch(await req.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid profile update.";
    return NextResponse.json({ error: { code: "INVALID_INPUT", message } }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "No fields to update." } }, { status: 400 });
  }

  const result = await applyProfilePatch(session.customerId, customer.orgId, session.clientId, patch);

  return NextResponse.json({
    ok: true,
    applied: result.applied,
    pending: result.pending,
    pendingRevision: result.pending.length > 0,
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Describe the change." } }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Describe the change." } }, { status: 400 });
  }

  const row = await prisma.profileChangeRequest.create({
    data: {
      customerId: session.customerId,
      body: text.slice(0, 2000),
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
