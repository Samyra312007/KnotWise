import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { trainOrgMatchingModel } from "@/lib/matching/ml-train";
import { computeBiasAudit } from "@/lib/matching/ml-rerank";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const result = await trainOrgMatchingModel(session.orgId);
  return NextResponse.json(result);
}

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const bias = await computeBiasAudit(session.orgId);
  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId: session.orgId } });
  return NextResponse.json({ bias, mlEnabled: config?.mlEnabled ?? false });
}

export async function PATCH(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const { mlEnabled } = (await req.json()) as { mlEnabled?: boolean };
  await prisma.orgMatchingConfig.upsert({
    where: { orgId: session.orgId },
    create: {
      orgId: session.orgId,
      weightsJson: "{}",
      mlEnabled: mlEnabled ?? false,
    },
    update: { mlEnabled: mlEnabled ?? false },
  });

  return NextResponse.json({ ok: true, mlEnabled });
}
