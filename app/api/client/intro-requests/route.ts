import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { submitClientIntroRequest } from "@/lib/billing/intro-requests";

const schema = z.object({
  note: z.string().max(500).optional(),
});

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const items = await prisma.clientIntroRequest.findMany({
    where: { customerId: session.customerId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      note: row.note,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid request." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const request = await submitClientIntroRequest({
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      note: parsed.note,
    });
    return NextResponse.json({
      ok: true,
      request: {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "LIMIT_REACHED") {
      return NextResponse.json(
        { error: { code: "LIMIT_REACHED", message: "No intro requests left this month." } },
        { status: 429 }
      );
    }
    throw err;
  }
}
