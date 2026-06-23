import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  let thread = await prisma.thread.findUnique({ where: { customerId: session.customerId } });
  if (!thread) {
    thread = await prisma.thread.create({
      data: { customerId: session.customerId, orgId: customer.orgId },
    });
  }

  const messages = await prisma.threadMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { body } = (await req.json()) as { body?: string };
  if (!body?.trim()) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Write a message." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  let thread = await prisma.thread.findUnique({ where: { customerId: session.customerId } });
  if (!thread) {
    thread = await prisma.thread.create({
      data: { customerId: session.customerId, orgId: customer.orgId },
    });
  }

  const msg = await prisma.threadMessage.create({
    data: {
      threadId: thread.id,
      authorId: session.clientId,
      authorType: "client",
      body: body.trim(),
    },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      authorType: msg.authorType,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
