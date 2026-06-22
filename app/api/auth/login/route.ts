import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

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
  });

  if (!matchmaker) {
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

  const session = await getSession();
  session.matchmakerId = matchmaker.id;
  session.fullName = matchmaker.fullName;
  session.username = matchmaker.username;
  await session.save();

  return NextResponse.json({
    ok: true,
    matchmaker: { id: matchmaker.id, fullName: matchmaker.fullName },
  });
}
