import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { isExpoPushToken } from "@/lib/push/expo";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const devices = await prisma.deviceToken.findMany({
    where: { clientId: session.clientId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, platform: true, token: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({
    devices: devices.map((device) => ({
      id: device.id,
      platform: device.platform,
      tokenPreview: `${device.token.slice(0, 18)}…`,
      updatedAt: device.updatedAt.toISOString(),
      createdAt: device.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = registerSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid device payload." } }, { status: 400 });
  }

  if (!isExpoPushToken(parsed.token) && parsed.platform !== "web") {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Token must be a valid Expo push token." } },
      { status: 400 }
    );
  }

  const device = await prisma.deviceToken.upsert({
    where: { token: parsed.token },
    update: { clientId: session.clientId, platform: parsed.platform },
    create: {
      clientId: session.clientId,
      platform: parsed.platform,
      token: parsed.token,
    },
  });

  return NextResponse.json({
    ok: true,
    device: {
      id: device.id,
      platform: device.platform,
      updatedAt: device.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Token required." } }, { status: 400 });
  }

  await prisma.deviceToken.deleteMany({
    where: { clientId: session.clientId, token: body.token },
  });

  return NextResponse.json({ ok: true });
}
