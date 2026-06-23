import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { deleteCustomerPhoto } from "@/lib/profile/photos";

export async function DELETE(_req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { assetId } = await ctx.params;

  try {
    await deleteCustomerPhoto(session.customerId, assetId);
  } catch {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Photo not found." } }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

const primarySchema = z.object({ url: z.string().url() });

export async function POST(req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { assetId } = await ctx.params;

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      entityType: "customer",
      entityId: session.customerId,
      kind: "photo",
    },
  });
  if (!asset) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Photo not found." } }, { status: 404 });
  }

  let parsed;
  try {
    parsed = primarySchema.parse(await req.json().catch(() => ({ url: asset.url })));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid request." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true, photoUrl: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  if (customer.photoUrl === parsed.url) {
    return NextResponse.json({ ok: true, pendingRevision: false });
  }

  const { applyProfilePatch } = await import("@/lib/profile/revisions");
  const result = await applyProfilePatch(session.customerId, customer.orgId, session.clientId, {
    photoUrl: parsed.url,
  });

  return NextResponse.json({
    ok: true,
    pendingRevision: result.pending.length > 0,
    revisionId: result.pending[0]?.revisionId,
  });
}
