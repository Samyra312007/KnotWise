import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { MembershipRole } from "@/lib/auth/roles";

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Provide a username and password." } },
      { status: 400 }
    );
  }

  const matchmaker = await prisma.matchmaker.findUnique({
    where: { username: parsed.username },
    include: { memberships: { take: 1, include: { org: true } } },
  });

  if (!matchmaker || matchmaker.memberships.length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Those credentials did not match." } },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(parsed.password, matchmaker.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Those credentials did not match." } },
      { status: 401 }
    );
  }

  const membership = matchmaker.memberships[0];
  const session = await getSession();
  session.userType = "matchmaker";
  session.matchmakerId = matchmaker.id;
  session.fullName = matchmaker.fullName;
  session.username = matchmaker.username;
  session.orgId = membership.orgId;
  session.role = membership.role as MembershipRole;
  await session.save();

  return NextResponse.json({
    ok: true,
    matchmaker: {
      id: matchmaker.id,
      fullName: matchmaker.fullName,
      orgId: membership.orgId,
      role: membership.role,
    },
  });
}
