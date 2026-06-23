import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, requireApiClientSession, notFound, forbidden } from "@/lib/auth/api";
import { canAccessCustomer } from "@/lib/access/customers";

const postSchema = z.object({ body: z.string().min(1).max(4000) });

async function ensureThread(customerId: string, orgId: string) {
  let thread = await prisma.thread.findUnique({ where: { customerId } });
  if (!thread) {
    thread = await prisma.thread.create({ data: { customerId, orgId } });
  }
  return thread;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await ctx.params;

  const matchmakerSession = await requireApiSession();
  if (!(matchmakerSession instanceof NextResponse)) {
    const allowed = await canAccessCustomer(
      customerId,
      matchmakerSession.matchmakerId,
      matchmakerSession.orgId,
      matchmakerSession.role
    );
    if (!allowed) return notFound("Not found.");

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, orgId: matchmakerSession.orgId },
    });
    if (!customer) return notFound("Not found.");

    const thread = await ensureThread(customerId, customer.orgId);
    const messages = await prisma.threadMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prisma.threadParticipant.upsert({
      where: {
        threadId_userId_userType: {
          threadId: thread.id,
          userId: matchmakerSession.matchmakerId,
          userType: "matchmaker",
        },
      },
      create: {
        threadId: thread.id,
        userId: matchmakerSession.matchmakerId,
        userType: "matchmaker",
        lastReadAt: new Date(),
      },
      update: { lastReadAt: new Date() },
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

  const clientSession = await requireApiClientSession();
  if (clientSession instanceof NextResponse) return clientSession;
  if (clientSession.customerId !== customerId) return forbidden();

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return notFound("Not found.");

  const thread = await ensureThread(customerId, customer.orgId);
  const messages = await prisma.threadMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.threadParticipant.upsert({
    where: {
      threadId_userId_userType: {
        threadId: thread.id,
        userId: clientSession.clientId,
        userType: "client",
      },
    },
    create: {
      threadId: thread.id,
      userId: clientSession.clientId,
      userType: "client",
      lastReadAt: new Date(),
    },
    update: { lastReadAt: new Date() },
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

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await ctx.params;
  let parsed;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Write a message." } }, { status: 400 });
  }

  const matchmakerSession = await requireApiSession();
  if (!(matchmakerSession instanceof NextResponse)) {
    const allowed = await canAccessCustomer(
      customerId,
      matchmakerSession.matchmakerId,
      matchmakerSession.orgId,
      matchmakerSession.role
    );
    if (!allowed) return notFound("Not found.");

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, orgId: matchmakerSession.orgId },
    });
    if (!customer) return notFound("Not found.");

    const thread = await ensureThread(customerId, customer.orgId);
    const msg = await prisma.threadMessage.create({
      data: {
        threadId: thread.id,
        authorId: matchmakerSession.matchmakerId,
        authorType: "matchmaker",
        body: parsed.body,
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

  const clientSession = await requireApiClientSession();
  if (clientSession instanceof NextResponse) return clientSession;
  if (clientSession.customerId !== customerId) return forbidden();

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return notFound("Not found.");

  const thread = await ensureThread(customerId, customer.orgId);
  const msg = await prisma.threadMessage.create({
    data: {
      threadId: thread.id,
      authorId: clientSession.clientId,
      authorType: "client",
      body: parsed.body,
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
