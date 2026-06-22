import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { Biodata, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { id } = await ctx.params;

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
  });

  if (!customer) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "This file is not in your bureau." } },
      { status: 404 }
    );
  }

  const biodata = JSON.parse(customer.biodata) as Biodata;

  return NextResponse.json({
    customer: {
      id: customer.id,
      stage: customer.stage,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      photoUrl: customer.photoUrl,
      ...biodata,
    },
  });
}

const patchSchema = z.object({
  stage: z.enum(STAGES as [Stage, ...Stage[]]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid update." } }, { status: 400 });
  }

  const owner = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ ok: true, customer: { id: updated.id, stage: updated.stage } });
}
