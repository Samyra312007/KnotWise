import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { id } = await ctx.params;

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const notes = await prisma.note.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    include: { matchmaker: { select: { fullName: true } } },
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      matchmakerName: n.matchmaker.fullName,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Write something first." } }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      customerId: id,
      matchmakerId: session.matchmakerId,
      body: parsed.body,
    },
    include: { matchmaker: { select: { fullName: true } } },
  });

  return NextResponse.json({
    note: {
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      matchmakerName: note.matchmaker.fullName,
    },
  });
}
