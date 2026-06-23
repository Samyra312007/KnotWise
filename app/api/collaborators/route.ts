import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  customerId: z.string(),
  matchmakerId: z.string(),
  access: z.enum(["read", "write"]),
});

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid." } }, { status: 400 });
  }

  const member = await prisma.membership.findFirst({
    where: { orgId: session.orgId, matchmakerId: parsed.matchmakerId },
  });
  if (!member) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not in bureau." } }, { status: 404 });
  }

  await prisma.customerCollaborator.upsert({
    where: {
      customerId_matchmakerId: {
        customerId: parsed.customerId,
        matchmakerId: parsed.matchmakerId,
      },
    },
    create: {
      customerId: parsed.customerId,
      matchmakerId: parsed.matchmakerId,
      access: parsed.access,
    },
    update: { access: parsed.access },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const members = await prisma.membership.findMany({
    where: { orgId: session.orgId },
    include: { matchmaker: { select: { id: true, fullName: true, username: true } } },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      matchmakerId: m.matchmakerId,
      role: m.role,
      fullName: m.matchmaker.fullName,
      username: m.matchmaker.username,
    })),
  });
}
