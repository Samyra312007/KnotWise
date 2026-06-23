import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound } from "@/lib/auth/api";
import { canAccessCustomer } from "@/lib/access/customers";
import type { Biodata } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const profile = await prisma.poolProfile.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!profile) return notFound("Profile not found.");

  const biodata = JSON.parse(profile.biodata) as Biodata;

  return NextResponse.json({
    profile: {
      id: profile.id,
      verifiedAt: profile.verifiedAt?.toISOString() ?? null,
      photoUrl: profile.photoUrl,
      ...biodata,
    },
  });
}
