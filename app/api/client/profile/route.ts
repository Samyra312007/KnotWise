import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Describe the change." } }, { status: 400 });
  }

  const row = await prisma.profileChangeRequest.create({
    data: {
      customerId: session.customerId,
      body: parsed.body,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const biodata = JSON.parse(customer.biodata);

  return NextResponse.json({
    profile: biodata,
    photoUrl: customer.photoUrl,
    stage: customer.stage,
  });
}
