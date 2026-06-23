import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createMobileToken } from "@/lib/auth/mobile";
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
    include: { memberships: { take: 1 } },
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
  const token = await createMobileToken(matchmaker.id);

  return NextResponse.json({
    ok: true,
    token,
    matchmaker: {
      id: matchmaker.id,
      fullName: matchmaker.fullName,
      orgId: membership.orgId,
      role: membership.role as MembershipRole,
    },
  });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { validateMobileToken } = await import("@/lib/auth/mobile");
  const session = await validateMobileToken(auth.slice(7));
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid token." } }, { status: 401 });
  }
  return NextResponse.json({ ok: true, matchmaker: session });
}
